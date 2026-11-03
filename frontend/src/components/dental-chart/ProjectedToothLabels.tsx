import { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { isUpper, STATUS_META, toothName } from '../../features/tooth-procedures/constants';
import { displayStatus, isExtracted } from '../../features/tooth-procedures/state';
import type { ToothState } from '../../features/tooth-procedures/types';
import type { ModelTooth } from './archModel';
import type { ToothPointerHandler } from './FrontalArchSvg';

const origin = () => [0, 0] as [number, number];

/** One Html overlay; update screen-space guides without 32 React renders per frame. */
export function ProjectedToothLabels({ teeth, states, selected, hovered, onToggle, onHover }: {
  teeth: ModelTooth[];
  states: Map<string, ToothState>;
  selected: string[];
  hovered: string | null;
  onToggle: (fdi: string) => void;
  onHover: ToothPointerHandler;
}) {
  const size = useThree((state) => state.size);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const lines = useRef(new Map<string, SVGPathElement>());
  const point = useRef(new Vector3());
  useFrame(({ camera, size: viewport }) => {
    const projected = teeth.map(({ fdi, anchor }) => {
      point.current.copy(anchor).project(camera);
      return { fdi, x: (point.current.x + 1) * viewport.width / 2,
        y: (1 - point.current.y) * viewport.height / 2, visible: point.current.z >= -1 && point.current.z <= 1 };
    });
    const rows = viewport.width < 660 ? 2 : 1;
    for (const upper of [true, false]) {
      const arch = projected.filter((p) => isUpper(p.fdi) === upper).sort((a, b) => a.x - b.x);
      for (let row = 0; row < rows; row++) {
        const lane = arch.filter((_, i) => i % rows === row);
        lane.forEach((p, i) => {
          const x = 22 + ((i + 0.5) / lane.length) * (viewport.width - 44);
          const y = upper ? 24 + row * 32 : viewport.height - 24 - row * 32;
          const button = buttons.current.get(p.fdi);
          const line = lines.current.get(p.fdi);
          if (button) {
            button.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
            button.style.visibility = p.visible ? 'visible' : 'hidden';
          }
          if (line) {
            line.setAttribute('d', `M ${p.x} ${p.y} L ${x} ${y + (upper ? 14 : -14)}`);
            line.style.visibility = p.visible ? 'visible' : 'hidden';
          }
        });
      }
    }
  });
  return <Html calculatePosition={origin} zIndexRange={[4, 4]} style={{ pointerEvents: 'none', width: size.width, height: size.height }}>
    <div className="odg-projected-labels" role="group" aria-label="Selecionar dentes pela numeração FDI">
      <svg width={size.width} height={size.height} aria-hidden="true">
        {teeth.map(({ fdi }) => <path key={fdi}
          ref={(el) => { if (el) lines.current.set(fdi, el); else lines.current.delete(fdi); }}
          className={selected.includes(fdi) || hovered === fdi ? 'is-selected' : ''} />)}
      </svg>
      {teeth.map(({ fdi }) => {
        const state = states.get(fdi);
        const status = displayStatus(state);
        return <button key={fdi}
          ref={(el) => { if (el) buttons.current.set(fdi, el); else buttons.current.delete(fdi); }}
          type="button" data-tooth={fdi}
          className={`odg-3d-badge${selected.includes(fdi) ? ' is-selected' : ''}${hovered === fdi ? ' is-hovered' : ''}`}
          style={{ borderBottomColor: STATUS_META[status].stroke }} aria-pressed={selected.includes(fdi)}
          aria-label={`Dente ${fdi}, ${toothName(fdi)}. ${isExtracted(state) ? 'Extraído' : STATUS_META[status].label}`}
          onClick={(event) => { event.stopPropagation(); onToggle(fdi); }}
          onPointerEnter={(event) => onHover(fdi, { x: event.clientX, y: event.clientY - 12 })}
          onPointerLeave={() => onHover(null)}
          onFocus={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            onHover(fdi, { x: rect.x + rect.width / 2, y: rect.y });
          }} onBlur={() => onHover(null)}>{fdi}</button>;
      })}
    </div>
  </Html>;
}
