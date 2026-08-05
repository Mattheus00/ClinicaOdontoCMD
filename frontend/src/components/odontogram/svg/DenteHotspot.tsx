import {
  ODONTOGRAM_STATUS_CHIP_CLASS,
  ODONTOGRAM_STATUS_ICONS,
  ODONTOGRAM_STATUS_LABELS,
  ODONTOGRAM_STATUS_TINT,
  isAbsentStatus,
} from '../../../features/odontogram/odontogram.constants';
import type { OdontogramStatus } from '../../../features/odontogram/odontogram.types';
import type { ImageHotspot } from './imageHotspots';

type Props = {
  hotspot: ImageHotspot;
  status: string;
  selected: boolean;
  focused: boolean;
  onSelect: (fdi: string) => void;
};

export default function DenteHotspot({ hotspot, status, selected, focused, onSelect }: Props) {
  const { fdi, cx, cy, w, h, rot } = hotspot;
  const statusKey = status as OdontogramStatus;
  const tint = ODONTOGRAM_STATUS_TINT[statusKey] ?? ODONTOGRAM_STATUS_TINT.HEALTHY;
  const absent = isAbsentStatus(statusKey) || status === 'EXTRACTED';
  const label = ODONTOGRAM_STATUS_LABELS[statusKey] ?? status;
  const icon = ODONTOGRAM_STATUS_ICONS[statusKey] ?? '';
  const marked = status !== 'HEALTHY';

  const crownRx = w / 2;
  const crownRy = h / 2;
  const hitRx = crownRx * 1.15;
  const hitRy = crownRy * 1.15;

  return (
    <g
      className={`dente-hotspot ${selected ? 'is-selected' : ''} ${focused ? 'is-focused' : ''} ${marked ? 'is-marked' : ''} ${ODONTOGRAM_STATUS_CHIP_CLASS[statusKey] ?? ''}`}
      transform={`translate(${cx} ${cy}) rotate(${rot})`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(fdi);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(fdi);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Dente ${fdi}, ${label}`}
      aria-pressed={selected}
    >
      <title>
        {fdi} — {label}
      </title>

      <ellipse cx={0} cy={0} rx={hitRx} ry={hitRy} className="dente-hotspot-hit" />

      {marked && (
        <ellipse
          cx={0}
          cy={0}
          rx={crownRx}
          ry={crownRy}
          fill={tint}
          opacity={absent ? 0.62 : 0.78}
          className="dente-hotspot-tint"
          pointerEvents="none"
        />
      )}

      {(selected || focused) && (
        <ellipse
          cx={0}
          cy={0}
          rx={crownRx + 3}
          ry={crownRy + 3}
          fill="none"
          stroke="#2b7ec7"
          strokeWidth={2.5}
          pointerEvents="none"
        />
      )}

      {marked && (
        <text y={1} textAnchor="middle" className="dente-hotspot-icon" pointerEvents="none" aria-hidden>
          {icon}
        </text>
      )}
    </g>
  );
}
