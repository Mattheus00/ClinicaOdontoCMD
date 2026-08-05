import type { OdontogramStatus } from '../../../features/odontogram/odontogram.types';
import { getToothGeometry, scaleForVariant } from './toothGeometry';
import type { ArchSide, ToothLayoutPro, ToothSurface, ToothView } from './types';
import { ODO_COLORS, statusClass, statusFill, surfaceLabel } from './utils';

type Props = {
  layout: ToothLayoutPro;
  view: ToothView;
  arch: ArchSide;
  status: OdontogramStatus;
  selected: boolean;
  focused: boolean;
  hoveredSurface: ToothSurface | null;
  onSurfaceClick: (tooth: number, surface: ToothSurface) => void;
  onSurfaceHover: (tooth: string | null, surface: ToothSurface | null) => void;
};

const SURFACES: ToothSurface[] = ['V', 'L', 'M', 'D', 'O'];

export default function ToothSvg({
  layout,
  view,
  arch,
  status,
  selected,
  focused,
  hoveredSurface,
  onSurfaceClick,
  onSurfaceHover,
}: Props) {
  const fdi = Number(layout.fdi);
  const geo = getToothGeometry(layout.variant, layout.mesialSide === 'left');
  const scale = layout.scale * scaleForVariant(layout.variant) * (view === 'vestibular' ? 0.88 : 1);
  const absent = status === 'EXTRACTED' || status === 'MISSING';
  const implant = status === 'IMPLANT';

  const surfaceFill = (surface: ToothSurface) => {
    const isHover = hoveredSurface === surface;
    const state = selected || focused ? 'selected' : isHover ? 'hover' : 'normal';
    return statusFill(status, state);
  };

  if (view === 'vestibular') {
    return (
      <g
        id={`tooth-${fdi}-vestibular`}
        className={`odo-tooth odo-tooth-vestibular ${statusClass(status)} ${selected ? 'is-selected' : ''}`}
        data-tooth={fdi}
        transform={`translate(${layout.x} ${layout.y}) rotate(${layout.rotation}) scale(${scale})`}
      >
        {!absent && (
          <>
            {geo.vestibular.roots.map((root, i) => (
              <path
                key={i}
                d={root}
                className="odo-root"
                fill={ODO_COLORS.root}
                stroke={ODO_COLORS.rootStroke}
                strokeWidth={0.6}
              />
            ))}
            <path
              d={geo.vestibular.crown}
              className="odo-crown"
              fill={surfaceFill('V')}
              stroke={ODO_COLORS.enamelStroke}
              strokeWidth={0.9}
              onClick={() => onSurfaceClick(fdi, 'V')}
              onMouseEnter={() => onSurfaceHover(layout.fdi, 'V')}
              onMouseLeave={() => onSurfaceHover(null, null)}
              role="button"
              tabIndex={0}
              aria-label={`Dente ${fdi} vestibular`}
            />
          </>
        )}
        {absent && (
          <path
            d={geo.vestibular.outline}
            className="odo-tooth-absent"
            fill="none"
            stroke={ODO_COLORS.extracted}
            strokeWidth={1.2}
            strokeDasharray="4 3"
          />
        )}
        {implant && (
          <g className="odo-implant-mark">
            <rect x={-3} y={-6} width={6} height={28} rx={1.5} fill={ODO_COLORS.implant} opacity={0.85} />
            <line x1={-5} y1={0} x2={5} y2={0} stroke="#fff" strokeWidth={0.8} />
          </g>
        )}
        <text y={arch === 'upper' ? 34 : -28} textAnchor="middle" className="odo-tooth-label">
          {fdi}
        </text>
      </g>
    );
  }

  return (
    <g
      id={`tooth-${fdi}`}
      className={`odo-tooth odo-tooth-occlusal ${statusClass(status)} ${selected ? 'is-selected' : ''}`}
      data-tooth={fdi}
      transform={`translate(${layout.x} ${layout.y}) rotate(${layout.rotation}) scale(${scale})`}
    >
      {!absent && (
        <>
          <path d={geo.outline} className="odo-enamel-outline" fill={ODO_COLORS.enamel} stroke={ODO_COLORS.enamelStroke} strokeWidth={0.8} />
          {geo.fissures.map((f, i) => (
            <path key={i} d={f} className="odo-fissure" fill="none" stroke="#C9B8A8" strokeWidth={0.55} pointerEvents="none" />
          ))}
          {SURFACES.map((surface) => (
            <path
              key={surface}
              id={`surface-${fdi}-${surface}`}
              className={`odo-surface odo-surface-${surface.toLowerCase()} ${hoveredSurface === surface ? 'is-hovered' : ''}`}
              data-tooth={fdi}
              data-surface={surface}
              d={geo.surfaces[surface]}
              fill={surfaceFill(surface)}
              stroke={ODO_COLORS.enamelStroke}
              strokeWidth={0.45}
              onClick={() => onSurfaceClick(fdi, surface)}
              onMouseEnter={() => onSurfaceHover(layout.fdi, surface)}
              onMouseLeave={() => onSurfaceHover(null, null)}
              role="button"
              tabIndex={0}
              aria-label={`Dente ${fdi} superfície ${surfaceLabel(surface, arch)}`}
            />
          ))}
        </>
      )}
      {absent && (
        <path d={geo.outline} className="odo-tooth-absent" fill="none" stroke={ODO_COLORS.extracted} strokeWidth={1.2} strokeDasharray="4 3" />
      )}
      {implant && <circle r={6} className="odo-implant-cap" fill={ODO_COLORS.implant} stroke="#6D28D9" strokeWidth={0.8} />}
      <text y={22} textAnchor="middle" className="odo-tooth-label">
        {fdi}
      </text>
    </g>
  );
}
