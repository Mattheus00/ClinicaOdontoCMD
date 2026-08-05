import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { ODONTOGRAM_STATUS_LABELS } from '../../features/odontogram/odontogram.constants';
import type { ToothSelectEvent } from '../../features/odontogram/odontogram.types';
import { DEFAULT_ARCH_PARAMS, type ArchAnchorParams } from './archAnchors';
import MaxillaCalibration, { useArchCalibrationParams } from './MaxillaCalibration';
import MaxillaScan from './MaxillaScan';
import OdontogramScene from './OdontogramScene';
import { UPPER_FDI, LOWER_FDI } from './archAnchors';
import './Odontogram3D.css';

/** @deprecated Use ODONTOGRAM_STATUS_LABELS */
export const TOOTH_STATUS_LABELS = ODONTOGRAM_STATUS_LABELS;

type Props = {
  statuses: Map<string, string>;
  selectedTeeth: Set<string>;
  focusedTooth?: string | null;
  onSelectTooth: (event: ToothSelectEvent) => void;
  variant?: 'clinical' | 'dark';
  calibrationMode?: boolean;
};

function CalibrationScene({
  params,
  onChangeParams,
}: {
  params: ArchAnchorParams;
  onChangeParams: (next: ArchAnchorParams) => void;
}) {
  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[-4, 5, 3]} intensity={1.4} castShadow />
      <MaxillaScan cadToYUp />
      <MaxillaCalibration params={params} onChangeParams={onChangeParams} />
    </>
  );
}

export default function Odontogram3D({
  statuses,
  selectedTeeth,
  focusedTooth = null,
  onSelectTooth,
  variant = 'clinical',
  calibrationMode = false,
}: Props) {
  const [calParams, setCalParams] = useArchCalibrationParams(DEFAULT_ARCH_PARAMS);

  return (
    <div className="odo3d-shell">
      <div className="odo3d-hint">
        {calibrationMode
          ? 'Modo calibração: alinhe as esferas magenta aos dentes do scan.'
          : 'Vista oclusal clínica. Clique nos dentes para marcar. Arraste para rotacionar.'}
      </div>
      <div
        className={`odo3d-canvas-wrap odo3d-anatomy ${calibrationMode ? 'odo3d-calibration' : ''} ${variant === 'clinical' ? 'odo3d-clinical' : 'odo3d-dark'}`}
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true }}
          camera={{ position: [0, 5.2, 0.01], fov: 42, near: 0.1, far: 50 }}
        >
          <Suspense
            fallback={
              <Html center>
                <div className="odo3d-label">Carregando modelo...</div>
              </Html>
            }
          >
            {calibrationMode ? (
              <CalibrationScene params={calParams} onChangeParams={setCalParams} />
            ) : (
              <OdontogramScene
                statuses={statuses}
                selectedTeeth={selectedTeeth}
                focusedTooth={focusedTooth}
                onSelectTooth={onSelectTooth}
                variant={variant}
              />
            )}
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

export { UPPER_FDI as UPPER_TEETH, LOWER_FDI as LOWER_TEETH };
