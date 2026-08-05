import { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import {
  DEFAULT_ARCH_PARAMS,
  getArchAnchorPositions,
  type ArchAnchorParams,
  type ToothAnchor,
} from './archAnchors';
import './MaxillaCalibration.css';

type Props = {
  params: ArchAnchorParams;
  onChangeParams: (next: ArchAnchorParams) => void;
};

function AnchorSpheres({ anchors }: { anchors: ToothAnchor[] }) {
  return (
    <group>
      {anchors.map((anchor) => (
        <mesh key={anchor.fdi} position={anchor.position}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#ff00aa" depthTest={false} />
          <Html distanceFactor={10} position={[0, 0.18, 0]} center>
            <span className="maxilla-cal-fdi">{anchor.fdi}</span>
          </Html>
        </mesh>
      ))}
    </group>
  );
}

function CalibrationPanel({ params, onChangeParams, anchors }: Props & { anchors: ToothAnchor[] }) {
  const set = <K extends keyof ArchAnchorParams>(key: K, value: number) => {
    onChangeParams({ ...params, [key]: value });
  };

  const copyConfig = async () => {
    const payload = {
      params,
      anchors: anchors.map((a) => ({
        fdi: a.fdi,
        position: a.position,
        rotY: a.rotY,
      })),
    };
    const text = JSON.stringify(payload, null, 2);
    console.log('[MaxillaCalibration]', payload);
    try {
      await navigator.clipboard.writeText(text);
      window.alert('Configuração copiada para a área de transferência (e logada no console).');
    } catch {
      window.alert('Não foi possível copiar. Veja o JSON no console do navegador.');
    }
  };

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div className="maxilla-cal-panel" style={{ pointerEvents: 'auto' }}>
        <strong>Calibração das âncoras (maxila)</strong>
        <p>Alinhe as esferas magenta sobre cada dente do scan. Depois copie a configuração.</p>

        <label>
          Raio X
          <input
            type="range"
            min={1}
            max={6}
            step={0.01}
            value={params.radiusX}
            onChange={(e) => set('radiusX', Number(e.target.value))}
          />
          <input
            type="number"
            step={0.01}
            value={params.radiusX}
            onChange={(e) => set('radiusX', Number(e.target.value))}
          />
        </label>

        <label>
          Raio Z (profundidade)
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.01}
            value={params.radiusZ}
            onChange={(e) => set('radiusZ', Number(e.target.value))}
          />
          <input
            type="number"
            step={0.01}
            value={params.radiusZ}
            onChange={(e) => set('radiusZ', Number(e.target.value))}
          />
        </label>

        <label>
          Offset Y
          <input
            type="range"
            min={-2}
            max={4}
            step={0.01}
            value={params.offsetY}
            onChange={(e) => set('offsetY', Number(e.target.value))}
          />
          <input
            type="number"
            step={0.01}
            value={params.offsetY}
            onChange={(e) => set('offsetY', Number(e.target.value))}
          />
        </label>

        <label>
          Rotação Y (°)
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={(params.rotationY * 180) / Math.PI}
            onChange={(e) => set('rotationY', (Number(e.target.value) * Math.PI) / 180)}
          />
          <input
            type="number"
            step={1}
            value={Number(((params.rotationY * 180) / Math.PI).toFixed(1))}
            onChange={(e) => set('rotationY', (Number(e.target.value) * Math.PI) / 180)}
          />
        </label>

        <label>
          Espaçamento
          <input
            type="range"
            min={0.5}
            max={1.6}
            step={0.01}
            value={params.spacingFactor}
            onChange={(e) => set('spacingFactor', Number(e.target.value))}
          />
          <input
            type="number"
            step={0.01}
            value={params.spacingFactor}
            onChange={(e) => set('spacingFactor', Number(e.target.value))}
          />
        </label>

        <label>
          Offset X
          <input
            type="range"
            min={-2}
            max={2}
            step={0.01}
            value={params.offsetX}
            onChange={(e) => set('offsetX', Number(e.target.value))}
          />
          <input
            type="number"
            step={0.01}
            value={params.offsetX}
            onChange={(e) => set('offsetX', Number(e.target.value))}
          />
        </label>

        <label>
          Offset Z
          <input
            type="range"
            min={-2}
            max={2}
            step={0.01}
            value={params.offsetZ}
            onChange={(e) => set('offsetZ', Number(e.target.value))}
          />
          <input
            type="number"
            step={0.01}
            value={params.offsetZ}
            onChange={(e) => set('offsetZ', Number(e.target.value))}
          />
        </label>

        <div className="maxilla-cal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => onChangeParams(DEFAULT_ARCH_PARAMS)}>
            Resetar
          </button>
          <button type="button" className="btn btn-primary" onClick={copyConfig}>
            Copiar configuração
          </button>
        </div>
      </div>
    </Html>
  );
}

/** Esferas de âncora + painel de calibração (itens 1–3). */
export default function MaxillaCalibration({ params, onChangeParams }: Props) {
  const anchors = useMemo(() => getArchAnchorPositions(params), [params]);

  return (
    <>
      <AnchorSpheres anchors={anchors} />
      <CalibrationPanel params={params} onChangeParams={onChangeParams} anchors={anchors} />
    </>
  );
}

export function useArchCalibrationParams(initial: ArchAnchorParams = DEFAULT_ARCH_PARAMS) {
  return useState<ArchAnchorParams>(initial);
}
