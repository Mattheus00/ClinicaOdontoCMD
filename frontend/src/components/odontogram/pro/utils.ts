import { LOWER_ARCH_FDI, UPPER_ARCH_FDI } from '../../../features/odontogram/odontogram.constants';
import type { OdontogramStatus } from '../../../features/odontogram/odontogram.types';
import type { ArchSide, ToothLayoutPro, ToothSurface, ToothVariant } from './types';

export const SVG_VIEWBOX = '0 0 920 680';

export const ODO_COLORS = {
  normal: '#FFFFFF',
  enamel: '#FAFAF8',
  enamelStroke: '#B8A898',
  gingiva: '#E8929A',
  gingivaDark: '#D0707A',
  hover: '#D6F0FF',
  selected: '#FFE4E4',
  caries: '#EF4444',
  restored: '#3B82F6',
  implant: '#8B5CF6',
  extracted: '#9CA3AF',
  root: '#E8DDD0',
  rootStroke: '#C4B5A5',
} as const;

export function variantFromFdi(fdi: string): ToothVariant {
  const d = Number(fdi.slice(-1));
  if (d === 1) return 'central';
  if (d === 2) return 'lateral';
  if (d === 3) return 'canine';
  if (d === 4) return 'premolar1';
  if (d === 5) return 'premolar2';
  if (d === 6) return 'molar1';
  if (d === 7) return 'molar2';
  return 'molar3';
}

export function isUpperFdi(fdi: string): boolean {
  const q = Math.floor(Number(fdi) / 10);
  return q === 1 || q === 2;
}

export function mesialSide(fdi: string): 'left' | 'right' {
  const q = Math.floor(Number(fdi) / 10);
  return q === 1 || q === 4 ? 'right' : 'left';
}

export function statusFill(status: OdontogramStatus, state: 'normal' | 'hover' | 'selected'): string {
  if (state === 'hover') return ODO_COLORS.hover;
  if (state === 'selected') return ODO_COLORS.selected;
  switch (status) {
    case 'CARIES':
      return ODO_COLORS.caries;
    case 'RESTORED':
    case 'IN_TREATMENT':
      return ODO_COLORS.restored;
    case 'IMPLANT':
      return ODO_COLORS.implant;
    case 'EXTRACTED':
    case 'MISSING':
      return ODO_COLORS.extracted;
    case 'ROOT_CANAL':
      return '#FCA5A5';
    case 'CROWN':
      return '#FCD34D';
    case 'FRACTURE':
      return '#D6D3D1';
    case 'EXTRACTION_INDICATED':
      return '#FECACA';
    default:
      return ODO_COLORS.normal;
  }
}

export function statusClass(status: OdontogramStatus): string {
  return `odo-status-${status.toLowerCase()}`;
}

function layoutArch(
  teeth: readonly string[],
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angleStart: number,
  angleEnd: number,
  invertY: boolean,
): ToothLayoutPro[] {
  const n = teeth.length;
  return teeth.map((fdi, i) => {
    const t = n <= 1 ? 0.5 : i / (n - 1);
    const angle = angleStart + t * (angleEnd - angleStart);
    const ySign = invertY ? -1 : 1;
    const x = cx + Math.cos(angle) * rx;
    const y = cy + ySign * Math.sin(angle) * ry;
    const rotation = (angle * 180) / Math.PI + (invertY ? -90 : 90);
    const variant = variantFromFdi(fdi);
    const digit = Number(fdi.slice(-1));
    let scale = 1;
    if (variant === 'central') scale = 1.06;
    if (variant === 'lateral') scale = 0.94;
    if (variant.startsWith('molar')) scale = digit === 8 ? 0.92 : 1.04;
    return { fdi, x, y, rotation, variant, scale, mesialSide: mesialSide(fdi) };
  });
}

export function layoutOcclusalUpper(): ToothLayoutPro[] {
  return layoutArch(UPPER_ARCH_FDI, 460, 168, 300, 118, Math.PI * 1.03, Math.PI * -0.03, true);
}

export function layoutOcclusalLower(): ToothLayoutPro[] {
  return layoutArch(LOWER_ARCH_FDI, 460, 512, 300, 118, Math.PI * 0.03, Math.PI * 0.97, false);
}

export function layoutVestibularUpper(): ToothLayoutPro[] {
  return layoutArch(UPPER_ARCH_FDI, 460, 318, 300, 4, Math.PI * 1.03, Math.PI * -0.03, true).map((t) => ({
    ...t,
    rotation: 180,
    y: 318,
  }));
}

export function layoutVestibularLower(): ToothLayoutPro[] {
  return layoutArch(LOWER_ARCH_FDI, 460, 362, 300, 4, Math.PI * 0.03, Math.PI * 0.97, false).map((t) => ({
    ...t,
    rotation: 0,
    y: 362,
  }));
}

export function surfaceLabel(surface: ToothSurface, arch: ArchSide): string {
  if (surface === 'L') return arch === 'upper' ? 'Palatina' : 'Lingual';
  const map: Record<ToothSurface, string> = {
    V: 'Vestibular',
    L: 'Lingual',
    M: 'Mesial',
    D: 'Distal',
    O: 'Oclusal',
  };
  return map[surface];
}

export const UPPER_PALATE = `
  M 158 168
  C 158 88 290 52 460 52
  C 630 52 762 88 762 168
  C 730 228 620 268 460 278
  C 300 268 190 228 158 168
  Z
`;

export const LOWER_FLOOR = `
  M 178 512
  C 178 432 310 396 460 396
  C 610 396 742 432 742 512
  C 710 558 610 578 460 584
  C 310 578 210 558 178 512
  Z
`;
