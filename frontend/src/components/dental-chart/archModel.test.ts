import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { Box3, BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LOWER_PERMANENT, UPPER_PERMANENT } from '../../features/tooth-procedures/constants';
import { fdiFromMeshName, prepareArchModel } from './archModel';

function fixture() {
  const root = new Group();
  root.position.set(12, 7, -3);
  root.scale.setScalar(100);
  const sourceMaterial = new MeshStandardMaterial({ color: '#ffffee' });
  [...UPPER_PERMANENT, ...LOWER_PERMANENT].forEach((fdi, i) => {
    const tooth = new Mesh(new BoxGeometry(0.8, 1, 0.5), sourceMaterial);
    tooth.name = `tooth_${fdi}`;
    tooth.position.set(i % 16 - 7.5, i < 16 ? 2 : -2, 0);
    root.add(tooth);
  });
  return { root, sourceMaterial };
}

describe('Contrato do GLB e isolamento dos materiais', () => {
  it('aceita apenas os 32 códigos permanentes FDI exatos', () => {
    expect(fdiFromMeshName('tooth_11')).toBe('11');
    expect(fdiFromMeshName('tooth_48')).toBe('48');
    for (const name of ['tooth_19', 'tooth_20', 'tooth_49', 'tooth_51', 'tooth_11.001', 'gingiva_11']) {
      expect(fdiFromMeshName(name)).toBeNull();
    }
  });
  it('rejeita um scan único e códigos duplicados em vez de exibir dentes sem seleção', () => {
    expect(() => prepareArchModel(new Group())).toThrow('Faltam meshes');
    const { root } = fixture();
    root.add(root.children[0].clone());
    expect(() => prepareArchModel(root)).toThrow('duplicado');
  });
  it('normaliza unidades e hierarquias sem alterar o cache ou compartilhar cores entre dentes', () => {
    const { root, sourceMaterial } = fixture();
    const model = prepareArchModel(root);
    const bounds = new Box3().setFromObject(model.root);
    expect(bounds.getSize(new Vector3()).x).toBeCloseTo(6);
    expect(bounds.getCenter(new Vector3()).length()).toBeLessThan(1e-6);
    expect(root.position.toArray()).toEqual([12, 7, -3]);
    const [a, b] = model.teeth;
    expect(a.mesh.material).not.toBe(sourceMaterial);
    expect(a.mesh.material).not.toBe(b.mesh.material);
    expect(a.anchor.distanceTo(new Box3().setFromObject(a.mesh).getCenter(new Vector3()))).toBeLessThan(1e-6);
    model.dispose();
  });
  it('carrega o GLB distribuído, com gengivas e geometria distinta por grupo anatômico', async () => {
    const bytes = await readFile(new URL('../../../public/models/arcada.glb', import.meta.url));
    const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const gltf = await new GLTFLoader().parseAsync(data, '');
    const model = prepareArchModel(gltf.scene);
    expect(model.teeth).toHaveLength(32);
    expect(model.root.getObjectByName('gingiva_upper')).toBeDefined();
    expect(model.root.getObjectByName('gingiva_lower')).toBeDefined();
    const dimensions = ['11', '13', '14', '16'].map((fdi) => {
      const geometry = model.teeth.find((tooth) => tooth.fdi === fdi)!.mesh.geometry;
      geometry.computeBoundingBox();
      expect(geometry.getAttribute('position').count).toBeGreaterThan(1000);
      return geometry.boundingBox!.getSize(new Vector3());
    });
    expect(dimensions[0].z).toBeLessThan(dimensions[3].z);
    expect(dimensions[1].y).toBeGreaterThan(dimensions[2].y);
    expect(dimensions[3].x).toBeGreaterThan(dimensions[2].x);
    model.dispose();
  });
});
