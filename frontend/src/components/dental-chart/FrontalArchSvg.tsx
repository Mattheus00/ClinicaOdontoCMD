import { memo, useMemo, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { STATUS_META, STATUS_ORDER, archTeeth, toothName } from '../../features/tooth-procedures/constants';
import { displayStatus, isExtracted } from '../../features/tooth-procedures/state';
import type { Dentition, ToothState } from '../../features/tooth-procedures/types';
import {
  DEFAULT_VIEWBOX,
  cavityPath,
  gumPath,
  layoutArch,
  toothFocusViewBox,
  toothPath,
  type ToothLayout,
} from './archGeometry';

export type ToothPointerHandler = (tooth: string | null, anchor?: { x: number; y: number }) => void;

type Props = {
  dentition: Dentition;
  states: Map<string, ToothState>;
  selected: string[];
  mirrored: boolean;
  focusTooth: string | null;
  onToggle: (tooth: string) => void;
  onHover: ToothPointerHandler;
};

function FrontalArchSvgBase({ dentition, states, selected, mirrored, focusTooth, onToggle, onHover }: Props) {
  const { upper, lower } = useMemo(() => {
    const teeth = archTeeth(dentition);
    return { upper: layoutArch(teeth.upper, true, mirrored), lower: layoutArch(teeth.lower, false, mirrored) };
  }, [dentition, mirrored]);

  const shapes = useMemo(() => {
    const all = [...upper, ...lower];
    return new Map(all.map((t) => [t.tooth, toothPath(t.kind, t.width, t.height)]));
  }, [upper, lower]);

  const focusLayout = focusTooth ? [...upper, ...lower].find((t) => t.tooth === focusTooth) : undefined;
  const viewBox = focusLayout ? toothFocusViewBox(focusLayout) : DEFAULT_VIEWBOX;

  const anchorFrom = (element: Element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top };
  };

  const renderTooth = (layout: ToothLayout) => {
    const { tooth } = layout;
    const state = states.get(tooth);
    const status = displayStatus(state);
    const extracted = isExtracted(state);
    const order = selected.indexOf(tooth);
    const isSelected = order >= 0;
    const transform = layout.upper
      ? `translate(${layout.x} ${layout.gumY})`
      : `translate(${layout.x} ${layout.gumY}) scale(1 -1)`;
    const fill = isSelected ? 'url(#odg-grad-selected)' : `url(#odg-grad-${status})`;
    const label = `Dente ${tooth}, ${toothName(tooth)}. ${extracted ? 'Extraído' : STATUS_META[status].label}${isSelected ? '. Selecionado' : ''}`;

    const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onToggle(tooth);
      }
    };

    return (
      <g
        key={tooth}
        className={`odg-tooth${isSelected ? ' is-selected' : ''}${extracted ? ' is-extracted' : ''}`}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={label}
        data-tooth={tooth}
        onClick={() => onToggle(tooth)}
        onKeyDown={onKeyDown}
        onMouseMove={(event: MouseEvent<SVGGElement>) => onHover(tooth, { x: event.clientX, y: event.clientY - 12 })}
        onMouseLeave={() => onHover(null)}
        onFocus={(event: FocusEvent<SVGGElement>) => onHover(tooth, anchorFrom(event.currentTarget))}
        onBlur={() => onHover(null)}
      >
        <g transform={transform}>
          {extracted ? (
            <path className="odg-tooth-ghost" d={shapes.get(tooth)} />
          ) : (
            <>
              <path className="odg-tooth-shape" d={shapes.get(tooth)} fill={fill} />
              <ellipse
                className="odg-tooth-shine"
                cx={layout.width * 0.36}
                cy={layout.height * 0.5}
                rx={layout.width * 0.13}
                ry={layout.height * 0.26}
              />
            </>
          )}
        </g>
        {isSelected ? (
          <g className="odg-badge" aria-hidden="true">
            <circle cx={layout.cx} cy={(layout.edgeY + layout.gumY) / 2 + (layout.upper ? 8 : -8)} r={11} />
            <text x={layout.cx} y={(layout.edgeY + layout.gumY) / 2 + (layout.upper ? 8 : -8)} dy="0.35em">
              {order + 1}
            </text>
          </g>
        ) : null}
      </g>
    );
  };

  const renderLabel = (layout: ToothLayout) => {
    const isSelected = selected.includes(layout.tooth);
    const anchorY = layout.upper ? layout.gumY + layout.height * 0.3 : layout.gumY - layout.height * 0.3;
    const lineStartY = layout.upper ? layout.labelY + 10 : layout.labelY - 16;
    return (
      <g
        key={`label-${layout.tooth}`}
        className={`odg-label${isSelected ? ' is-selected' : ''}`}
        onClick={() => onToggle(layout.tooth)}
        onMouseMove={(event) => onHover(layout.tooth, { x: event.clientX, y: event.clientY - 12 })}
        onMouseLeave={() => onHover(null)}
        aria-hidden="true"
      >
        <line x1={layout.labelX} y1={lineStartY} x2={layout.cx} y2={anchorY} />
        <circle className="odg-label-dot" cx={layout.cx} cy={anchorY} r={2.4} />
        <rect x={layout.labelX - 15} y={layout.labelY - 13} width={30} height={20} rx={10} />
        <text x={layout.labelX} y={layout.labelY - 3} dy="0.35em">
          {layout.tooth}
        </text>
      </g>
    );
  };

  return (
    <svg
      className="odg-frontal"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label="Arcadas dentárias em vista frontal"
    >
      <defs>
        {STATUS_ORDER.map((status) => (
          <linearGradient key={status} id={`odg-grad-${status}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={status === 'HEALTHY' ? '#f1ece2' : STATUS_META[status].fill} />
            <stop offset="45%" stopColor={STATUS_META[status].light} />
            <stop offset="100%" stopColor={status === 'HEALTHY' ? '#f7f8fa' : STATUS_META[status].fill} />
          </linearGradient>
        ))}
        <linearGradient id="odg-grad-selected" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3f52d9" />
          <stop offset="50%" stopColor="#7d8df5" />
          <stop offset="100%" stopColor="#4f63e7" />
        </linearGradient>
        <linearGradient id="odg-gum-upper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e27f93" />
          <stop offset="70%" stopColor="#f2a1b1" />
          <stop offset="100%" stopColor="#f7b9c4" />
        </linearGradient>
        <linearGradient id="odg-gum-lower" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#e27f93" />
          <stop offset="70%" stopColor="#f2a1b1" />
          <stop offset="100%" stopColor="#f7b9c4" />
        </linearGradient>
        <radialGradient id="odg-cavity" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#6d2433" />
          <stop offset="100%" stopColor="#3a1019" />
        </radialGradient>
        <radialGradient id="odg-tongue" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#d77484" />
          <stop offset="100%" stopColor="#a84a5c" />
        </radialGradient>
        <clipPath id="odg-cavity-clip">
          <path d={cavityPath(upper, lower)} />
        </clipPath>
        <filter id="odg-soft-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#1f2a44" floodOpacity="0.18" />
        </filter>
        <filter id="odg-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <path className="odg-cavity" d={cavityPath(upper, lower)} fill="url(#odg-cavity)" />
      <g clipPath="url(#odg-cavity-clip)">
        <ellipse cx={500} cy={lower[0] ? lower[Math.floor(lower.length / 2)].edgeY + 40 : 380} rx={250} ry={60} fill="url(#odg-tongue)" />
      </g>

      <g filter="url(#odg-soft-shadow)">
        {upper.map(renderTooth)}
        {lower.map(renderTooth)}
      </g>

      <path className="odg-gum" d={gumPath(upper, true)} fill="url(#odg-gum-upper)" />
      <path className="odg-gum" d={gumPath(lower, false)} fill="url(#odg-gum-lower)" />

      <g className="odg-labels">
        {upper.map(renderLabel)}
        {lower.map(renderLabel)}
      </g>
    </svg>
  );
}

export const FrontalArchSvg = memo(FrontalArchSvgBase);
