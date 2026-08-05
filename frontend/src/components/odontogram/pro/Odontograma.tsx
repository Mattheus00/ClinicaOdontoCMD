import type { OdontogramStatus } from '../../../features/odontogram/odontogram.types';
import ToothSvg from './ToothSvg';
import type { OdontogramClickPayload, OdontogramSvgProps } from './types';
import {
  LOWER_FLOOR,
  ODO_COLORS,
  SVG_VIEWBOX,
  UPPER_PALATE,
  layoutOcclusalLower,
  layoutOcclusalUpper,
  layoutVestibularLower,
  layoutVestibularUpper,
} from './utils';
import './odontograma.css';

type Props = Omit<OdontogramSvgProps, 'onSurfaceClick'> & {
  onSurfaceClick: (payload: OdontogramClickPayload) => void;
};

export default function OdontogramaSvg({
  statuses,
  selectedTeeth,
  focusedTooth,
  hovered,
  onSurfaceClick,
  onSurfaceHover,
}: Props) {
  const statusOf = (fdi: string) => (statuses.get(fdi) ?? 'HEALTHY') as OdontogramStatus;

  const renderRow = (
    layouts: ReturnType<typeof layoutOcclusalUpper>,
    view: 'occlusal' | 'vestibular',
    arch: 'upper' | 'lower',
  ) =>
    layouts.map((layout) => (
      <ToothSvg
        key={`${layout.fdi}-${view}`}
        layout={layout}
        view={view}
        arch={arch}
        status={statusOf(layout.fdi)}
        selected={selectedTeeth.has(layout.fdi)}
        focused={focusedTooth === layout.fdi}
        hoveredSurface={hovered?.tooth === layout.fdi ? hovered.surface : null}
        onSurfaceClick={(tooth, surface) => onSurfaceClick({ tooth, surface, status: statusOf(String(tooth)) })}
        onSurfaceHover={onSurfaceHover}
      />
    ));

  return (
    <div className="odo-pro-wrap">
      <svg viewBox={SVG_VIEWBOX} className="odo-pro-svg" role="img" aria-label="Odontograma clínico FDI">
        <defs>
          <linearGradient id="odo-palate-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F0A8B0" />
            <stop offset="100%" stopColor={ODO_COLORS.gingiva} />
          </linearGradient>
          <linearGradient id="odo-floor-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ODO_COLORS.gingiva} />
            <stop offset="100%" stopColor="#F0A8B0" />
          </linearGradient>
        </defs>

        <rect x={0} y={0} width={920} height={680} className="odo-pro-bg" />

        <text x={460} y={28} textAnchor="middle" className="odo-pro-section-title">
          Arcada Superior — Vista Oclusal
        </text>
        <path d={UPPER_PALATE} className="odo-palate" fill="url(#odo-palate-grad)" />
        <g className="odo-arch odo-arch-upper-occlusal">{renderRow(layoutOcclusalUpper(), 'occlusal', 'upper')}</g>

        <text x={460} y={298} textAnchor="middle" className="odo-pro-section-title">
          Vista Vestibular Superior
        </text>
        <line x1={60} y1={308} x2={860} y2={308} className="odo-section-line" />
        <g className="odo-arch odo-arch-upper-vestibular">{renderRow(layoutVestibularUpper(), 'vestibular', 'upper')}</g>

        <text x={460} y={348} textAnchor="middle" className="odo-pro-section-title">
          Vista Vestibular Inferior
        </text>
        <line x1={60} y1={358} x2={860} y2={358} className="odo-section-line" />
        <g className="odo-arch odo-arch-lower-vestibular">{renderRow(layoutVestibularLower(), 'vestibular', 'lower')}</g>

        <text x={460} y={388} textAnchor="middle" className="odo-pro-section-title">
          Arcada Inferior — Vista Oclusal
        </text>
        <path d={LOWER_FLOOR} className="odo-floor" fill="url(#odo-floor-grad)" />
        <g className="odo-arch odo-arch-lower-occlusal">{renderRow(layoutOcclusalLower(), 'occlusal', 'lower')}</g>

        <g className="odo-pro-legend-inline" transform="translate(24 648)">
          <text className="odo-legend-hint">Clique em uma superfície (V · L · M · D · O) para marcar</text>
        </g>
      </svg>
    </div>
  );
}
