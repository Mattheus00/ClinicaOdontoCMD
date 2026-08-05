import * as THREE from 'three';

export type ToothKind = 'incisor' | 'canine' | 'premolar' | 'molar';

export function kindOf(tooth: string): ToothKind {
  const n = Number(tooth.slice(-1));
  if (n >= 6) return 'molar';
  if (n >= 4) return 'premolar';
  if (n === 3) return 'canine';
  return 'incisor';
}

const CROWN_PROFILES: Record<ToothKind, [number, number][]> = {
  incisor: [
    [0.09, 0],
    [0.11, 0.05],
    [0.125, 0.14],
    [0.13, 0.28],
    [0.125, 0.38],
    [0.11, 0.42],
    [0.001, 0.43],
  ],
  canine: [
    [0.095, 0],
    [0.115, 0.05],
    [0.125, 0.15],
    [0.115, 0.28],
    [0.08, 0.36],
    [0.03, 0.4],
    [0.001, 0.42],
  ],
  premolar: [
    [0.1, 0],
    [0.13, 0.05],
    [0.145, 0.14],
    [0.135, 0.24],
    [0.09, 0.3],
    [0.001, 0.32],
  ],
  molar: [
    [0.12, 0],
    [0.155, 0.05],
    [0.17, 0.14],
    [0.16, 0.22],
    [0.1, 0.28],
    [0.001, 0.3],
  ],
};

export const CROWN_HEIGHT: Record<ToothKind, number> = {
  incisor: 0.43,
  canine: 0.42,
  premolar: 0.32,
  molar: 0.3,
};

const CUSPS: Record<ToothKind, [number, number][]> = {
  incisor: [],
  canine: [],
  premolar: [
    [-0.065, 0],
    [0.065, 0],
  ],
  molar: [
    [-0.085, 0.075],
    [0.085, 0.075],
    [-0.085, -0.075],
    [0.085, -0.075],
  ],
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

function deformCrown(kind: ToothKind, x: number, y: number, z: number, height: number): [number, number, number] {
  const t = Math.min(Math.max(y / height, 0), 1);
  let nx = x;
  let nz = z;

  if (kind === 'premolar' || kind === 'molar') {
    const k = kind === 'molar' ? 0.16 : 0.1;
    const theta = Math.atan2(z, x);
    const square = 1 + k * Math.abs(Math.sin(2 * theta)) ** 1.5;
    nx *= square;
    nz *= square;
  }

  if (kind === 'incisor') {
    nx *= lerp(0.94, 1.1, smoothstep(t));
    nz *= lerp(0.5, 0.15, smoothstep(t));
  } else if (kind === 'canine') {
    nx *= lerp(0.94, 1.02, t);
    nz *= lerp(0.62, 0.32, t);
  }

  return [nx, y, nz];
}

const crownGeometryCache = new Map<ToothKind, THREE.LatheGeometry>();

export function getCrownGeometry(kind: ToothKind): THREE.LatheGeometry {
  let geometry = crownGeometryCache.get(kind);
  if (!geometry) {
    const points = CROWN_PROFILES[kind].map(([x, y]) => new THREE.Vector2(x, y));
    geometry = new THREE.LatheGeometry(points, 36);
    const height = CROWN_HEIGHT[kind];
    const position = geometry.attributes.position;
    const posterior = kind === 'premolar' || kind === 'molar';
    const cusps = CUSPS[kind];

    for (let i = 0; i < position.count; i += 1) {
      let [nx, ny, nz] = deformCrown(kind, position.getX(i), position.getY(i), position.getZ(i), height);
      const t = Math.min(Math.max(ny / height, 0), 1);

      if (posterior && t > 0.68) {
        const w = smoothstep((t - 0.68) / 0.32);
        let bump = 0;
        for (const [cx, cz] of cusps) {
          const d = Math.hypot(nx - cx, nz - cz);
          bump = Math.max(bump, Math.exp(-((d / 0.085) ** 2)));
        }
        const fissure = Math.exp(-((nz / 0.04) ** 2));
        ny += w * (bump * (kind === 'molar' ? 0.055 : 0.045) - fissure * 0.028);
      }

      position.setXYZ(i, nx, ny, nz);
    }
    position.needsUpdate = true;

    const cervical = new THREE.Color('#e8dcc8');
    const body = new THREE.Color('#faf6ee');
    const occlusal = new THREE.Color('#f0f4f6');
    const colors = new Float32Array(position.count * 3);
    const tmp = new THREE.Color();

    for (let i = 0; i < position.count; i += 1) {
      const y = position.getY(i);
      const t = Math.min(Math.max(y / height, 0), 1);
      tmp.copy(body);
      if (t < 0.28) tmp.lerp(cervical, (1 - t / 0.28) * 0.35);
      if (t > 0.75) tmp.lerp(occlusal, ((t - 0.75) / 0.25) * 0.25);
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    crownGeometryCache.set(kind, geometry);
  }
  return geometry;
}

export type RootSpec = { x: number; z: number; len: number; r: number };

export const ROOT_STUBS: Record<ToothKind, RootSpec[]> = {
  incisor: [{ x: 0, z: 0, len: 0.12, r: 0.035 }],
  canine: [{ x: 0, z: 0, len: 0.14, r: 0.038 }],
  premolar: [
    { x: -0.04, z: 0, len: 0.12, r: 0.032 },
    { x: 0.04, z: 0, len: 0.12, r: 0.032 },
  ],
  molar: [
    { x: -0.07, z: 0.04, len: 0.11, r: 0.034 },
    { x: 0.07, z: 0.04, len: 0.11, r: 0.034 },
    { x: 0, z: -0.06, len: 0.1, r: 0.032 },
  ],
};
