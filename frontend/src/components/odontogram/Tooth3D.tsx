import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import {
  isAbsentStatus,
  ODONTOGRAM_STATUS_LABELS,
  ODONTOGRAM_STATUS_TINT,
} from '../../features/odontogram/odontogram.constants';
import type { ToothSelectEvent } from '../../features/odontogram/odontogram.types';
import GingivaCollar from './GingivaCollar';
import { applyPlacement } from './toothPlacement';
import { CROWN_HEIGHT, getCrownGeometry, kindOf, ROOT_STUBS } from './toothGeometry';

type Props = {
  fdi: string;
  status: string;
  selected: boolean;
  focused: boolean;
  position: [number, number, number];
  rotY: number;
  onSelect: (event: ToothSelectEvent) => void;
};

export default function Tooth3D({ fdi, status, selected, focused, position, rotY, onSelect }: Props) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const kind = kindOf(fdi);
  const absent = isAbsentStatus(status as never) || status === 'EXTRACTED';
  const implant = status === 'IMPLANT';
  const extractionIndicated = status === 'EXTRACTION_INDICATED';
  const crownGeometry = getCrownGeometry(kind);
  const crownHeight = CROWN_HEIGHT[kind];
  const statusLabel = ODONTOGRAM_STATUS_LABELS[status as keyof typeof ODONTOGRAM_STATUS_LABELS] ?? status;

  const { position: pos, rotation, scale } = useMemo(
    () => applyPlacement(fdi, position, [0, rotY, 0], [1, 1, 1]),
    [fdi, position, rotY],
  );

  const tint = useMemo(() => {
    const key = status as keyof typeof ODONTOGRAM_STATUS_TINT;
    return new THREE.Color(ODONTOGRAM_STATUS_TINT[key] ?? ODONTOGRAM_STATUS_TINT.HEALTHY);
  }, [status]);

  useFrame(() => {
    if (!group.current) return;
    const s = selected || focused ? 1.08 : hovered ? 1.04 : 1;
    group.current.scale.lerp(new THREE.Vector3(s, s, s), 0.18);
  });

  const enamel = (
    <meshPhysicalMaterial
      color={selected ? '#b8daf0' : tint}
      vertexColors={!selected}
      roughness={0.18}
      metalness={0}
      clearcoat={0.8}
      clearcoatRoughness={0.25}
      emissive={selected ? '#4f9ad8' : hovered ? '#6a9ec4' : '#000000'}
      emissiveIntensity={selected ? 0.35 : hovered ? 0.12 : 0}
      transparent={absent}
      opacity={absent ? 0.15 : 1}
    />
  );

  return (
    <group
      ref={group}
      name={`tooth-${fdi}`}
      position={pos}
      rotation={rotation}
      scale={scale}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelect({
          tooth: fdi,
        });
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {!absent && !implant && (
        <mesh geometry={crownGeometry} castShadow receiveShadow>
          {enamel}
        </mesh>
      )}

      {!implant &&
        !absent &&
        ROOT_STUBS[kind].map((root, i) => (
          <mesh key={i} position={[root.x, -root.len / 2 - 0.01, root.z]} castShadow>
            <capsuleGeometry args={[root.r, root.len, 4, 8]} />
            <meshStandardMaterial color="#e6d5b8" roughness={0.55} />
          </mesh>
        ))}

      {!absent && <GingivaCollar kind={kind} />}

      {implant && (
        <>
          <mesh position={[0, -0.08, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.035, 0.12, 10]} />
            <meshStandardMaterial color="#aab3c0" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh geometry={crownGeometry} castShadow>
            {enamel}
          </mesh>
        </>
      )}

      {status === 'RESTORED' && !absent && (
        <mesh position={[0, crownHeight - 0.02, 0]}>
          <cylinderGeometry args={[0.055, 0.05, 0.03, 12]} />
          <meshStandardMaterial color="#b9c2cc" metalness={0.5} roughness={0.35} />
        </mesh>
      )}

      {status === 'CROWN' && !absent && (
        <mesh position={[0, crownHeight - 0.015, 0]}>
          <cylinderGeometry args={[0.11, 0.1, 0.05, 14]} />
          <meshStandardMaterial color="#d4af37" metalness={0.6} roughness={0.3} />
        </mesh>
      )}

      {status === 'CARIES' && !absent && (
        <mesh position={[0.07, crownHeight * 0.45, 0.07]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color="#7a4a20" roughness={0.75} />
        </mesh>
      )}

      {status === 'FRACTURE' && !absent && (
        <mesh position={[0.05, crownHeight * 0.5, 0.06]} rotation={[0.3, 0.2, 0.7]}>
          <boxGeometry args={[0.015, 0.22, 0.015]} />
          <meshStandardMaterial color="#4a3728" />
        </mesh>
      )}

      {status === 'IN_TREATMENT' && !absent && (
        <mesh position={[0, crownHeight * 0.55, 0.1]}>
          <boxGeometry args={[0.2, 0.025, 0.015]} />
          <meshStandardMaterial color="#4f9ad8" emissive="#4f9ad8" emissiveIntensity={0.3} />
        </mesh>
      )}

      {extractionIndicated && !absent && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <torusGeometry args={[0.13, 0.012, 8, 24]} />
          <meshBasicMaterial color="#e05252" transparent opacity={0.85} />
        </mesh>
      )}

      {absent && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <torusGeometry args={[0.09, 0.022, 8, 20]} />
          <meshStandardMaterial color="#c08080" transparent opacity={0.7} />
        </mesh>
      )}

      {(hovered || selected || focused) && (
        <Html distanceFactor={8} position={[0, crownHeight + 0.12, 0]} center>
          <div className="odo3d-tooltip" role="tooltip">
            <strong>{fdi}</strong>
            <span>{statusLabel}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
