import { FACE_LABEL, STATUS_META, isPatientRight, isUpper, toothName } from '../../features/tooth-procedures/constants';
import { displayStatus, isExtracted } from '../../features/tooth-procedures/state';
import type { ToothFace, ToothState } from '../../features/tooth-procedures/types';
import { FACE_SIDES, faceAt, facePolygons, type FaceSide } from './faceGeometry';

type Props = {
  tooth: string | null;
  selectedTeeth: string[];
  state: ToothState | undefined;
  selectedFaces: ToothFace[];
  readOnly: boolean;
  mirrored: boolean;
  onToggleFace: (face: ToothFace) => void;
  onActivateTooth: (tooth: string) => void;
};

const SIZE = 240;
const INSET = 78;
const POLYGONS = facePolygons(SIZE, INSET);

const LABEL_POSITION: Record<FaceSide, { x: number; y: number }> = {
  top: { x: SIZE / 2, y: INSET / 2 },
  bottom: { x: SIZE / 2, y: SIZE - INSET / 2 },
  left: { x: INSET / 2, y: SIZE / 2 },
  right: { x: SIZE - INSET / 2, y: SIZE / 2 },
  center: { x: SIZE / 2, y: SIZE / 2 },
};

export function ToothFacesView({
  tooth,
  selectedTeeth,
  state,
  selectedFaces,
  readOnly,
  mirrored,
  onToggleFace,
  onActivateTooth,
}: Props) {
  if (!tooth) {
    return (
      <div className="odg-faces-empty">
        <p>Selecione um dente no odontograma para ver e marcar as faces.</p>
      </div>
    );
  }

  const status = displayStatus(state);
  const extracted = isExtracted(state);
  const recorded = new Set(state?.faces ?? []);
  const drawnOnLeft = mirrored ? !isPatientRight(tooth) : isPatientRight(tooth);

  return (
    <div className="odg-faces">
      {selectedTeeth.length > 1 ? (
        <div className="odg-faces-switch" role="group" aria-label="Dente exibido">
          {selectedTeeth.map((value) => (
            <button
              key={value}
              type="button"
              className={value === tooth ? 'is-active' : ''}
              aria-pressed={value === tooth}
              onClick={() => onActivateTooth(value)}
            >
              {value}
            </button>
          ))}
        </div>
      ) : null}
      <div className="odg-faces-body">
        <svg viewBox={`-8 -8 ${SIZE + 16} ${SIZE + 16}`} className="odg-faces-svg" role="group" aria-label={`Faces do dente ${tooth}`}>
          {FACE_SIDES.map((side) => {
            const face = faceAt(tooth, side, drawnOnLeft);
            const isRecorded = !extracted && state && (recorded.size === 0 || recorded.has(face));
            const isPicked = selectedFaces.includes(face);
            return (
              <g
                key={side}
                className={`odg-face-option${isPicked ? ' is-picked' : ''}${readOnly ? ' is-readonly' : ''}`}
                role="button"
                tabIndex={readOnly ? -1 : 0}
                aria-pressed={isPicked}
                aria-disabled={readOnly}
                aria-label={`Face ${FACE_LABEL[face]}`}
                onClick={() => !readOnly && onToggleFace(face)}
                onKeyDown={(event) => {
                  if (!readOnly && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onToggleFace(face);
                  }
                }}
              >
                <polygon points={POLYGONS[side]} fill={isRecorded ? STATUS_META[status].fill : '#ffffff'} />
                <text x={LABEL_POSITION[side].x} y={LABEL_POSITION[side].y} dy="0.35em">
                  {FACE_LABEL[face]}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="odg-faces-info">
          <strong>Dente {tooth}</strong>
          <span>{toothName(tooth)}</span>
          <span className="odg-faces-status">
            <i style={{ background: STATUS_META[status].fill }} aria-hidden="true" />
            {extracted ? 'Extraído' : STATUS_META[status].label}
          </span>
          <small>
            {isUpper(tooth) ? 'Vestibular voltada para os lábios (topo).' : 'Vestibular voltada para os lábios (base).'}{' '}
            Mesial voltada para a linha média.
          </small>
          {!readOnly ? <small>Clique nas faces para marcá-las no registro.</small> : null}
        </div>
      </div>
    </div>
  );
}
