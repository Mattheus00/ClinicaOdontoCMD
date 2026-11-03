import { useId, type KeyboardEvent } from 'react';
import { archTeeth, STATUS_META, STATUS_ORDER, toothKind, toothName, type ToothKind } from '../../features/tooth-procedures/constants';
import { displayStatus, isExtracted } from '../../features/tooth-procedures/state';
import type { Dentition, ToothState } from '../../features/tooth-procedures/types';
import type { ToothPointerHandler } from './FrontalArchSvg';

const OUTLINES: Record<ToothKind, string> = {
  central: 'M -17 -7 C -17 -16 17 -16 17 -7 C 16 1 10 11 0 12 C -10 11 -16 1 -17 -7 Z',
  lateral: 'M -14 -7 C -15 -17 14 -17 14 -7 C 13 2 7 12 0 13 C -8 11 -14 2 -14 -7 Z',
  canine: 'M 0 -20 C 9 -19 18 -8 16 3 C 14 14 5 21 0 23 C -8 17 -17 11 -16 0 C -16 -9 -8 -19 0 -20 Z',
  premolar: 'M 0 -22 C 11 -23 20 -15 18 -3 C 22 9 12 23 0 22 C -12 23 -21 10 -18 -3 C -20 -16 -10 -23 0 -22 Z',
  molar: 'M -17 -20 C -10 -26 -3 -22 0 -23 C 12 -26 22 -20 22 -9 C 27 0 22 11 21 15 C 16 25 5 23 0 23 C -12 27 -24 18 -22 9 C -28 -1 -23 -14 -17 -20 Z',
};

function archLayout(teeth: string[], upper: boolean, mirrored: boolean) {
  const list = mirrored ? [...teeth].reverse() : teeth;
  const cx = upper ? 260 : 740;
  const cy = upper ? 390 : 195;
  const dir = upper ? -1 : 1;
  return list.map((fdi, i) => {
    const angle = (i / (list.length - 1) - 0.5) * 3.15;
    return { fdi, angle, upper, x: cx + Math.sin(angle) * 143,
      y: cy + Math.cos(angle) * 225 * dir,
      lx: cx + Math.sin(angle) * 207, ly: cy + Math.cos(angle) * 284 * dir };
  });
}

export function AnatomicalArchSvg({ dentition, states, selected, mirrored, focusTooth, onToggle, onHover }: {
  dentition: Dentition;
  states: Map<string, ToothState>;
  selected: string[];
  mirrored: boolean;
  focusTooth: string | null;
  onToggle: (fdi: string) => void;
  onHover: ToothPointerHandler;
}) {
  const id = `arch-${useId().replace(/:/g, '')}`;
  const arches = archTeeth(dentition);
  const upper = archLayout(arches.upper, true, mirrored);
  const lower = archLayout(arches.lower, false, mirrored);
  const teeth = [...upper, ...lower];
  const focus = teeth.find((t) => t.fdi === focusTooth);
  const keyboard = (event: KeyboardEvent<SVGGElement>, fdi: string) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToggle(fdi); }
  };
  return <svg className="odg-anatomical" viewBox={focus ? `${focus.x - 80} ${focus.y - 90} 160 180` : '0 55 1000 520'}
    role="group" aria-label="Arcadas dentárias anatômicas em 2D" preserveAspectRatio="xMidYMid meet">
    <defs>
      {[...STATUS_ORDER, 'selected' as const].map((status) => <radialGradient key={status} id={`${id}-${status}`} cx="32%" cy="28%" r="80%">
        <stop offset="0" stopColor={status === 'selected' ? '#a9c5ff' : status === 'HEALTHY' ? '#fffef8' : STATUS_META[status].light} />
        <stop offset="0.65" stopColor={status === 'selected' ? '#5278e9' : status === 'HEALTHY' ? '#f5ebd9' : STATUS_META[status].fill} />
        <stop offset="1" stopColor={status === 'selected' ? '#3154c5' : status === 'HEALTHY' ? '#cebd9f' : STATUS_META[status].stroke} />
      </radialGradient>)}
      <linearGradient id={`${id}-gum`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#a9576a" /><stop offset="0.45" stopColor="#df9ca7" /><stop offset="1" stopColor="#b66578" />
      </linearGradient>
      <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#422432" floodOpacity="0.25" />
      </filter>
    </defs>
    {[upper, lower].map((arch, i) => <g key={i} filter={`url(#${id}-shadow)`}>
      <path d={`M ${arch.map((t) => `${t.x} ${t.y}`).join(' L ')}`} fill="none" stroke={`url(#${id}-gum)`} strokeWidth="70" strokeLinecap="round" strokeLinejoin="round" />
      {arch.map((t) => <ellipse key={t.fdi} cx={t.x} cy={t.y} rx="27" ry="31" fill={`url(#${id}-gum)`} />)}
    </g>)}
    {!focus && <g className="odg-arch-captions"><text x="260" y="470">SUPERIOR</text><text x="740" y="135">INFERIOR</text></g>}
    {teeth.filter((t) => !focus || t.fdi === focus.fdi).map((t) => {
      const state = states.get(t.fdi), status = displayStatus(state), kind = toothKind(t.fdi);
      const active = selected.includes(t.fdi), extracted = isExtracted(state);
      const posterior = kind === 'premolar' || kind === 'molar';
      return <g key={t.fdi} className={`odg-anatomical-tooth${active ? ' is-selected' : ''}`} role="button" tabIndex={0}
        aria-label={`Dente ${t.fdi}, ${toothName(t.fdi)}. ${extracted ? 'Extraído' : STATUS_META[status].label}`}
        aria-pressed={active} data-tooth={t.fdi} onClick={() => onToggle(t.fdi)} onKeyDown={(event) => keyboard(event, t.fdi)}
        onMouseMove={(event) => onHover(t.fdi, { x: event.clientX, y: event.clientY - 12 })} onMouseLeave={() => onHover(null)}
        onFocus={(event) => { const rect = event.currentTarget.getBoundingClientRect(); onHover(t.fdi, { x: rect.x + rect.width / 2, y: rect.y }); }} onBlur={() => onHover(null)}>
        <g transform={`translate(${t.x} ${t.y}) rotate(${t.angle * (t.upper ? -1 : 1) * 180 / Math.PI})`}>
          <path d={OUTLINES[kind]} className="odg-anatomical-crown" fill={extracted ? 'none' : `url(#${id}-${active ? 'selected' : status})`}
            stroke={active ? '#345bd1' : '#c4b89e'} strokeWidth="1.1" strokeDasharray={extracted ? '3 2' : undefined} filter={`url(#${id}-shadow)`} />
          {!extracted && <>
            <path d={posterior ? 'M -10 -13 Q -17 0 -9 13 M 10 -13 Q 17 0 10 13' : 'M -9 -6 Q 0 -12 9 -6'} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
            {posterior && <path d={kind === 'molar' ? 'M -14 0 Q -6 -5 0 0 Q 7 4 15 0 M 0 -15 Q -4 -7 0 0 Q 4 8 -1 16' : 'M -12 0 Q 0 -6 12 0'} fill="none" stroke={active ? '#3758b0' : '#b5a58d'} strokeWidth="1.4" opacity="0.65" />}
            {kind === 'canine' && <path d="M 0 -10 Q -7 0 0 12 Q 7 0 0 -10" fill="#fff" opacity="0.25" />}
          </>}
        </g>
        <g className="odg-anatomical-label" aria-hidden="true">
          <line x1={t.x} y1={t.y} x2={t.lx} y2={t.ly} stroke={active ? '#4f63e7' : '#8e9bad'} strokeWidth="0.8" opacity="0.65" />
          <circle cx={t.lx} cy={t.ly} r="13" fill={active ? '#4f63e7' : '#fff'} stroke={active ? '#3445c4' : '#d6dce6'} />
          <text x={t.lx} y={t.ly} dy="0.35em" fill={active ? '#fff' : '#506078'}>{t.fdi}</text>
        </g>
      </g>;
    })}
  </svg>;
}
