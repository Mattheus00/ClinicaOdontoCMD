import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import type { ToothSelectEvent } from '../../features/odontogram/odontogram.types';
import LowerArch from './LowerArch';
import UpperArch from './UpperArch';

type Props = {
  statuses: Map<string, string>;
  selectedTeeth: Set<string>;
  focusedTooth: string | null;
  onSelectTooth: (event: ToothSelectEvent) => void;
  variant?: 'clinical' | 'dark';
};

export default function OdontogramScene({
  statuses,
  selectedTeeth,
  focusedTooth,
  onSelectTooth,
  variant = 'clinical',
}: Props) {
  const clinical = variant === 'clinical';

  return (
    <>
      <color attach="background" args={[clinical ? '#eef4f8' : '#0b0d10']} />
      <ambientLight intensity={clinical ? 0.75 : 0.35} />
      <directionalLight position={[2, 6, 2]} intensity={0.9} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-2, 4, -1]} intensity={0.35} color="#fff8f0" />
      <hemisphereLight args={['#ffffff', '#e8d0d4', 0.35]} />

      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.8} position={[0, 5, 0]} scale={[10, 10, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={0.5} position={[-4, 2, 2]} scale={[4, 4, 1]} color="#dbe9f7" />
      </Environment>

      <UpperArch
        statuses={statuses}
        selectedTeeth={selectedTeeth}
        focusedTooth={focusedTooth}
        onSelectTooth={onSelectTooth}
      />
      <LowerArch
        statuses={statuses}
        selectedTeeth={selectedTeeth}
        focusedTooth={focusedTooth}
        onSelectTooth={onSelectTooth}
      />

      <ContactShadows position={[0, -0.35, 0]} opacity={0.2} scale={6} blur={2.5} far={3} color="#000000" />

      <OrbitControls
        makeDefault
        enablePan
        minDistance={2.5}
        maxDistance={8}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />
    </>
  );
}
