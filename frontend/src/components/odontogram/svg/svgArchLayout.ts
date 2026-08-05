import { LOWER_ARCH_FDI, UPPER_ARCH_FDI } from '../../../features/odontogram/odontogram.constants';

export type ToothKind = 'incisor' | 'canine' | 'premolar' | 'molar';

export function kindOf(fdi: string): ToothKind {
  const n = Number(fdi.slice(-1));
  if (n >= 6) return 'molar';
  if (n >= 4) return 'premolar';
  if (n === 3) return 'canine';
  return 'incisor';
}

/** Dimensões base do dente em coordenadas locais (vista oclusal). */
export const TOOTH_SIZE: Record<ToothKind, { w: number; h: number }> = {
  incisor: { w: 22, h: 30 },
  canine: { w: 24, h: 34 },
  premolar: { w: 28, h: 30 },
  molar: { w: 36, h: 32 },
};

/**
 * Paths SVG por tipo (centrados em 0,0; +Y = vestibular / frente da arcada).
 * Cada dente é um path fechado clicável.
 */
export const TOOTH_PATHS: Record<ToothKind, string> = {
  incisor: `
    M -9 -14
    C -11 -6 -11 4 -9 13
    L 9 13
    C 11 4 11 -6 9 -14
    C 4 -16 0 -16 -4 -15
    Z
  `,
  canine: `
    M -10 -15
    C -11 -4 -9 6 -5 14
    L 5 14
    C 9 6 11 -4 10 -15
    C 5 -17 0 -17 -5 -16
    Z
  `,
  premolar: `
    M -13 -14
    C -15 -4 -14 6 -11 14
    L 11 14
    C 14 6 15 -4 13 -14
    C 8 -16 0 -16 -8 -15
    Z
  `,
  molar: `
    M -17 -15
    C -19 -3 -17 8 -14 15
    L 14 15
    C 17 8 19 -3 17 -15
    C 10 -17 0 -17 -10 -16
    Z
  `,
};

/** Sulcos oclusais (apenas traço, sem preenchimento). */
export const TOOTH_FISSURES: Partial<Record<ToothKind, string[]>> = {
  premolar: ['M -6 -14 C -4 -4 -4 4 -6 14', 'M 6 -14 C 4 -4 4 4 6 14'],
  molar: [
    'M -17 -2 L 17 -2',
    'M 0 -15 L 0 15',
    'M -10 -10 C -8 0 -8 8 -10 14',
    'M 10 -10 C 8 0 8 8 10 14',
  ],
};

export type ToothLayout = {
  fdi: string;
  x: number;
  y: number;
  rotation: number;
  kind: ToothKind;
  scale: number;
};

type ArchConfig = {
  cx: number;
  cy: number;
  radiusX: number;
  radiusY: number;
  angleStart: number;
  angleEnd: number;
};

function layoutArch(teeth: readonly string[], config: ArchConfig): ToothLayout[] {
  const n = teeth.length;
  return teeth.map((fdi, i) => {
    const t = n <= 1 ? 0.5 : i / (n - 1);
    const angle = config.angleStart + t * (config.angleEnd - config.angleStart);
    const x = config.cx + Math.cos(angle) * config.radiusX;
    const y = config.cy + Math.sin(angle) * config.radiusY;
    const rotation = (angle * 180) / Math.PI + 90;
    const kind = kindOf(fdi);
    const digit = Number(fdi.slice(-1));
    let scale = 1;
    if (kind === 'incisor') scale = digit === 1 ? 1.08 : 0.94;
    if (kind === 'molar') scale = 1.05;
    return { fdi, x, y, rotation, kind, scale };
  });
}

/** Arcada superior — vista oclusal, anterior para baixo. */
export function layoutUpperArch(): ToothLayout[] {
  return layoutArch(UPPER_ARCH_FDI, {
    cx: 400,
    cy: 195,
    radiusX: 268,
    radiusY: 108,
    angleStart: Math.PI * 1.02,
    angleEnd: Math.PI * -0.02,
  });
}

/** Arcada inferior — vista oclusal, anterior para cima (entre as arcadas). */
export function layoutLowerArch(): ToothLayout[] {
  const config = {
    cx: 400,
    cy: 505,
    radiusX: 248,
    radiusY: 100,
    angleStart: Math.PI * 0.02,
    angleEnd: Math.PI * 0.98,
  };
  const n = LOWER_ARCH_FDI.length;
  return LOWER_ARCH_FDI.map((fdi, i) => {
    const t = n <= 1 ? 0.5 : i / (n - 1);
    const angle = config.angleStart + t * (config.angleEnd - config.angleStart);
    const x = config.cx + Math.cos(angle) * config.radiusX;
    const y = config.cy - Math.sin(angle) * config.radiusY;
    const rotation = (angle * 180) / Math.PI - 90;
    const kind = kindOf(fdi);
    const digit = Number(fdi.slice(-1));
    let scale = 1;
    if (kind === 'incisor') scale = digit === 1 ? 1.08 : 0.94;
    if (kind === 'molar') scale = 1.05;
    return { fdi, x, y, rotation, kind, scale };
  });
}

/** Palato superior (ferradura preenchida). */
export const UPPER_PALATE_PATH = `
  M 132 195
  C 132 120 250 85 400 85
  C 550 85 668 120 668 195
  C 640 250 540 290 400 300
  C 260 290 160 250 132 195
  Z
`;

/** Gengiva inferior (anel fino, centro aberto). */
export const LOWER_GUM_PATH = `
  M 152 505
  C 152 430 270 395 400 395
  C 530 395 648 430 648 505
  C 620 545 520 565 400 570
  C 280 565 180 545 152 505
  Z
  M 220 505
  C 240 460 320 440 400 440
  C 480 440 560 460 580 505
  C 560 530 480 545 400 548
  C 320 545 240 530 220 505
  Z
`;

export const SVG_VIEWBOX = '0 0 800 620';
