import { useMemo } from 'react';
import * as THREE from 'three';
import { OCCLUSAL_ARCH } from './archAnchors';

const GUM_COLOR = '#e8a0a8';

/** Colarinho cervical fino em torno de um dente — não bloqueia clique. */
export default function GingivaCollar({
  kind,
}: {
  kind: 'incisor' | 'canine' | 'premolar' | 'molar';
}) {
  const scale = useMemo(() => {
    if (kind === 'incisor') return [0.88, 0.55, 0.88] as const;
    if (kind === 'canine') return [0.95, 0.72, 0.95] as const;
    if (kind === 'premolar') return [1.02, 0.95, 1.02] as const;
    return [1.15, 1.05, 1.15] as const;
  }, [kind]);

  return (
    <mesh
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      scale={scale}
      raycast={() => null}
      renderOrder={-1}
    >
      <torusGeometry args={[0.1, 0.022, 8, 24]} />
      <meshStandardMaterial color={GUM_COLOR} roughness={0.55} metalness={0} />
    </mesh>
  );
}

/** Papila interdental pontual entre dois dentes. */
export function InterdentalPapilla({ x, z, y }: { x: number; z: number; y: number }) {
  return (
    <mesh position={[x, y, z]} scale={[0.06, 0.025, 0.05]} raycast={() => null} renderOrder={-1}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color={GUM_COLOR} roughness={0.5} />
    </mesh>
  );
}

/** Palato superior fino — preenche o interior da ferradura sem parede frontal. */
export function PalateSurface({ y = OCCLUSAL_ARCH.upperY - 0.04 }: { y?: number }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRx = OCCLUSAL_ARCH.radiusX * 0.82;
    const outerRz = OCCLUSAL_ARCH.radiusZ * 0.72;
    const innerRx = OCCLUSAL_ARCH.radiusX * 0.38;
    const innerRz = OCCLUSAL_ARCH.radiusZ * 0.3;

    shape.moveTo(-outerRx, 0);
    shape.absellipse(0, 0, outerRx, outerRz, Math.PI, 0, true, 0);
    shape.lineTo(innerRx, 0);

    const hole = new THREE.Path();
    hole.absellipse(0, 0, innerRx, innerRz, 0, Math.PI, false, 0);
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false, curveSegments: 32 });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, outerRz * 0.15);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} position={[0, y, 0]} receiveShadow raycast={() => null} renderOrder={-2}>
      <meshStandardMaterial color="#eba8b0" roughness={0.48} metalness={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Faixa gengival fina na arcada inferior (bucal), centro aberto para a língua. */
export function LowerGingivaBand({ y = OCCLUSAL_ARCH.lowerY - 0.03 }: { y?: number }) {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const steps = 48;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const angle = Math.PI * (0.1 + t * 0.8);
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * OCCLUSAL_ARCH.radiusX * 0.92,
          0,
          -Math.sin(angle) * OCCLUSAL_ARCH.radiusZ * 0.92,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 64, 0.055, 8, false);
  }, []);

  return (
    <mesh geometry={geometry} position={[0, y, 0]} receiveShadow raycast={() => null} renderOrder={-2}>
      <meshStandardMaterial color={GUM_COLOR} roughness={0.5} metalness={0} />
    </mesh>
  );
}

/** Faixa gengival fina na arcada superior (bucal), sem bloquear coroas. */
export function UpperGingivaBand({ y = OCCLUSAL_ARCH.upperY - 0.03 }: { y?: number }) {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const steps = 48;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const angle = Math.PI * (0.1 + t * 0.8);
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * OCCLUSAL_ARCH.radiusX * 0.92,
          0,
          -Math.sin(angle) * OCCLUSAL_ARCH.radiusZ * 0.88,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 64, 0.05, 8, false);
  }, []);

  return (
    <mesh geometry={geometry} position={[0, y, 0]} receiveShadow raycast={() => null} renderOrder={-2}>
      <meshStandardMaterial color={GUM_COLOR} roughness={0.5} metalness={0} />
    </mesh>
  );
}
