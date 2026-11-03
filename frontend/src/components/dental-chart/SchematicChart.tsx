import { memo, type KeyboardEvent } from 'react';
import { STATUS_META, archTeeth, toothName } from '../../features/tooth-procedures/constants';
import { displayStatus, isExtracted } from '../../features/tooth-procedures/state';
import type { Dentition, ToothState } from '../../features/tooth-procedures/types';
import { FACE_SIDES, faceAt, facePolygons } from './faceGeometry';
import type { ToothPointerHandler } from './FrontalArchSvg';

type Props = {
  dentition: Dentition;
  states: Map<string, ToothState>;
  selected: string[];
  mirrored: boolean;
  onToggle: (tooth: string) => void;
  onHover: ToothPointerHandler;
};

const CELL = 44;
const INSET = 13;
const STEP = 56;
const WIDTH = 940;
const POLYGONS = facePolygons(CELL, INSET);

function SchematicChartBase({ dentition, states, selected, mirrored, onToggle, onHover }: Props) {
  const teeth = archTeeth(dentition);
  const rows = [
    { teeth: mirrored ? [...teeth.upper].reverse() : teeth.upper, y: 54, labelY: 30 },
    { teeth: mirrored ? [...teeth.lower].reverse() : teeth.lower, y: 176, labelY: 248 },
  ];

  return (
    <svg className="odg-schematic" viewBox={`0 0 ${WIDTH} 270`} role="group" aria-label="Odontograma esquemático">
      <line className="odg-schematic-axis" x1={WIDTH / 2} y1={40} x2={WIDTH / 2} y2={236} />
      <line className="odg-schematic-axis" x1={20} y1={143} x2={WIDTH - 20} y2={143} />
      {rows.map((row) => {
        const startX = WIDTH / 2 - (row.teeth.length * STEP) / 2 + (STEP - CELL) / 2;
        return row.teeth.map((tooth, index) => {
          const x = startX + index * STEP;
          const state = states.get(tooth);
          const status = displayStatus(state);
          const extracted = isExtracted(state);
          const isSelected = selected.includes(tooth);
          const onLeftHalf = index < row.teeth.length / 2;
          const meta = STATUS_META[status];
          const coloredFaces = state && state.faces.length > 0 ? new Set(state.faces) : null;
          const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onToggle(tooth);
            }
          };

          return (
            <g
              key={tooth}
              className={`odg-cell${isSelected ? ' is-selected' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`Dente ${tooth}, ${toothName(tooth)}. ${extracted ? 'Extraído' : meta.label}`}
              onClick={() => onToggle(tooth)}
              onKeyDown={onKeyDown}
              onMouseMove={(event) => onHover(tooth, { x: event.clientX, y: event.clientY - 12 })}
              onMouseLeave={() => onHover(null)}
              onFocus={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                onHover(tooth, { x: rect.left + rect.width / 2, y: rect.top });
              }}
              onBlur={() => onHover(null)}
            >
              <text className="odg-cell-number" x={x + CELL / 2} y={row.labelY} dy="0.35em">
                {tooth}
              </text>
              <g transform={`translate(${x} ${row.y})`}>
                {isSelected ? <rect className="odg-cell-halo" x={-4} y={-4} width={CELL + 8} height={CELL + 8} rx={6} /> : null}
                {FACE_SIDES.map((side) => {
                  const face = faceAt(tooth, side, onLeftHalf);
                  const painted = state && !extracted && (!coloredFaces || coloredFaces.has(face));
                  return (
                    <polygon
                      key={side}
                      className="odg-face"
                      points={POLYGONS[side]}
                      fill={painted ? meta.fill : '#ffffff'}
                    />
                  );
                })}
                {extracted ? (
                  <g className="odg-cell-extracted">
                    <line x1={2} y1={2} x2={CELL - 2} y2={CELL - 2} />
                    <line x1={CELL - 2} y1={2} x2={2} y2={CELL - 2} />
                  </g>
                ) : null}
              </g>
            </g>
          );
        });
      })}
    </svg>
  );
}

export const SchematicChart = memo(SchematicChartBase);
