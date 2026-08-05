import {
  ODONTOGRAM_STATUS_CHIP_CLASS,
  ODONTOGRAM_STATUS_ICONS,
  ODONTOGRAM_STATUS_LABELS,
  ODONTOGRAM_STATUS_TINT,
  isAbsentStatus,
} from '../../../features/odontogram/odontogram.constants';
import type { OdontogramStatus } from '../../../features/odontogram/odontogram.types';
import { TOOTH_FISSURES, TOOTH_PATHS, type ToothLayout } from './svgArchLayout';

type Props = {
  layout: ToothLayout;
  status: string;
  selected: boolean;
  focused: boolean;
  onSelect: (fdi: string) => void;
};

export default function DenteSvg({ layout, status, selected, focused, onSelect }: Props) {
  const { fdi, x, y, rotation, kind, scale } = layout;
  const path = TOOTH_PATHS[kind];
  const statusKey = status as OdontogramStatus;
  const fill = ODONTOGRAM_STATUS_TINT[statusKey] ?? ODONTOGRAM_STATUS_TINT.HEALTHY;
  const absent = isAbsentStatus(statusKey) || status === 'EXTRACTED';
  const label = ODONTOGRAM_STATUS_LABELS[statusKey] ?? status;
  const icon = ODONTOGRAM_STATUS_ICONS[statusKey] ?? '';

  return (
    <g
      className={`dente-svg ${selected ? 'is-selected' : ''} ${focused ? 'is-focused' : ''} ${ODONTOGRAM_STATUS_CHIP_CLASS[statusKey] ?? ''}`}
      transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}
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

      {/* Área de clique invisível um pouco maior */}
      <ellipse cx={0} cy={0} rx={kind === 'molar' ? 22 : 16} ry={kind === 'incisor' ? 18 : 20} fill="transparent" />

      <path
        d={path}
        className="dente-svg-crown"
        fill={absent ? '#e8eaed' : status === 'HEALTHY' ? 'url(#enamelGrad)' : fill}
        stroke={selected ? '#2b7ec7' : focused ? '#4f9ad8' : '#c8b8a8'}
        strokeWidth={selected ? 2.2 : 1.2}
        opacity={absent ? 0.55 : 1}
        vectorEffect="non-scaling-stroke"
      />

      {(TOOTH_FISSURES[kind] ?? []).map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#c4b4a4"
          strokeWidth={0.8}
          opacity={0.7}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      ))}

      {/* Número FDI */}
      <text
        y={4}
        textAnchor="middle"
        className="dente-svg-num"
        pointerEvents="none"
        aria-hidden
      >
        {fdi}
      </text>

      {/* Ícone de status (acessibilidade — não só cor) */}
      {status !== 'HEALTHY' && (
        <text y={-10} textAnchor="middle" className="dente-svg-icon" pointerEvents="none" aria-hidden>
          {icon}
        </text>
      )}
    </g>
  );
}
