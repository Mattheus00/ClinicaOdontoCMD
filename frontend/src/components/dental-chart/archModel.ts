import { Box3, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Vector3, type Object3D } from 'three';
import { LOWER_PERMANENT, UPPER_PERMANENT } from '../../features/tooth-procedures/constants';

/** Exact Blender object-name → FDI aliases. Standard tooth_11…tooth_48 need no entry. */
export const TOOTH_MESH_NAMES: Readonly<Record<string, string>> = {
  // 'Upper_Right_Central': '11',
};
const permanent = new Set([...UPPER_PERMANENT, ...LOWER_PERMANENT]);

export function fdiFromMeshName(name: string): string | null {
  const fdi = TOOTH_MESH_NAMES[name] ?? /^tooth_([1-4][1-8])$/.exec(name)?.[1];
  return fdi && permanent.has(fdi) ? fdi : null;
}
export type ModelTooth = { fdi: string; mesh: Mesh; anchor: Vector3 };

/** Keep the useGLTF cache immutable, retain imported transforms/textures, normalize units once. */
export function prepareArchModel(source: Object3D) {
  const scene = source.clone(true);
  const teeth = new Map<string, ModelTooth>();
  scene.updateMatrixWorld(true);
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const fdi = fdiFromMeshName(object.name);
    if (/^tooth_/i.test(object.name) && !fdi) throw new Error(`Nome FDI inválido: ${object.name}`);
    if (fdi) {
      if (teeth.has(fdi)) throw new Error(`Mesh duplicado para o dente ${fdi}`);
      if ('isSkinnedMesh' in object) throw new Error('Exporte a arcada como malhas estáticas.');
      teeth.set(fdi, { fdi, mesh: object, anchor: new Vector3() });
    }
  });
  const missing = [...permanent].filter((fdi) => !teeth.has(fdi));
  if (missing.length) throw new Error(`GLB incompleto. Faltam meshes: ${missing.join(', ')}`);
  const box = new Box3().setFromObject(scene);
  const size = box.getSize(new Vector3());
  const longest = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(longest) || longest <= 0) throw new Error('GLB sem geometria válida.');
  const scale = 6 / longest;
  const root = new Group();
  root.name = 'normalized_arch';
  root.add(scene);
  root.scale.setScalar(scale);
  root.position.copy(box.getCenter(new Vector3())).multiplyScalar(-scale);
  root.updateMatrixWorld(true);
  const materials: MeshPhysicalMaterial[] = [];
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const tooth = fdiFromMeshName(object.name);
    const originals = Array.isArray(object.material) ? object.material : [object.material];
    const mapped = originals.map((original) => {
      const base = original instanceof MeshStandardMaterial ? original : undefined;
      const material = new MeshPhysicalMaterial({
        color: base?.color ?? (tooth ? '#fff9ef' : '#c67b86'),
        map: base?.map ?? null,
        normalMap: base?.normalMap ?? null,
        aoMap: base?.aoMap ?? null,
        vertexColors: Boolean(object.geometry.getAttribute('color')),
        metalness: 0,
        roughness: tooth ? 0.29 : 0.78,
        clearcoat: tooth ? 0.3 : 0.025,
        clearcoatRoughness: tooth ? 0.3 : 0.8,
        ior: tooth ? 1.52 : 1.4,
        envMapIntensity: tooth ? 0.65 : 0.3,
      });
      if (base) material.normalScale.copy(base.normalScale);
      materials.push(material);
      return material;
    });
    object.material = Array.isArray(object.material) ? mapped : mapped[0];
    object.castShadow = true;
    object.receiveShadow = true;
    if (tooth) new Box3().setFromObject(object).getCenter(teeth.get(tooth)!.anchor);
  });
  return {
    root, teeth: [...teeth.values()], floor: new Box3().setFromObject(root).min.y - 0.05,
    // Geometries and textures still belong to useGLTF's shared cache.
    dispose: () => materials.forEach((material) => material.dispose()),
  };
}
