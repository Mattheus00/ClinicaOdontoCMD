import { LOWER_ARCH_FDI, UPPER_ARCH_FDI } from '../../../features/odontogram/odontogram.constants';
import { kindOf } from './svgArchLayout';

export const ODONTOGRAM_IMAGE = '/odontogram/modelo-odontologico.png';
export const IMAGE_WIDTH = 1402;
export const IMAGE_HEIGHT = 1122;

export type ImageHotspot = {
  fdi: string;
  /** Centro X em % da largura da imagem (0–100). */
  cx: number;
  /** Centro Y em % da altura da imagem (0–100). */
  cy: number;
  /** Largura do hotspot em %. */
  w: number;
  /** Altura do hotspot em %. */
  h: number;
  /** Rotação em graus. */
  rot: number;
};

type ToothCalib = { cx: number; cy: number; rot: number };

function sizeOf(fdi: string): { w: number; h: number } {
  const kind = kindOf(fdi);
  const digit = Number(fdi.slice(-1));
  if (kind === 'incisor') return { w: digit === 1 ? 4.8 : 4.2, h: 5.8 };
  if (kind === 'canine') return { w: 4.6, h: 6.2 };
  if (kind === 'premolar') return { w: 5.2, h: 5.6 };
  return { w: 6.2, h: 5.8 };
}

function toHotspot(fdi: string, calib: ToothCalib): ImageHotspot {
  const { w, h } = sizeOf(fdi);
  return { fdi, cx: calib.cx, cy: calib.cy, w, h, rot: calib.rot };
}

/**
 * Posições calibradas manualmente sobre a imagem modelo-odontologico.png.
 * Arcada superior (esquerda) e inferior (direita), vista oclusal no topo.
 */
const UPPER_CALIB: Record<string, ToothCalib> = {
  '18': { cx: 5.8, cy: 21.5, rot: -58 },
  '17': { cx: 8.2, cy: 17.2, rot: -42 },
  '16': { cx: 11.2, cy: 14.2, rot: -28 },
  '15': { cx: 14.4, cy: 12.2, rot: -14 },
  '14': { cx: 17.6, cy: 11.0, rot: -6 },
  '13': { cx: 20.8, cy: 10.4, rot: 2 },
  '12': { cx: 24.0, cy: 10.1, rot: 8 },
  '11': { cx: 27.2, cy: 10.4, rot: 12 },
  '21': { cx: 30.4, cy: 10.4, rot: -12 },
  '22': { cx: 33.6, cy: 10.1, rot: -8 },
  '23': { cx: 36.8, cy: 10.4, rot: -2 },
  '24': { cx: 40.0, cy: 11.0, rot: 6 },
  '25': { cx: 43.2, cy: 12.2, rot: 14 },
  '26': { cx: 46.2, cy: 14.2, rot: 28 },
  '27': { cx: 49.0, cy: 17.2, rot: 42 },
  '28': { cx: 51.4, cy: 21.5, rot: 58 },
};

const LOWER_CALIB: Record<string, ToothCalib> = {
  '48': { cx: 54.0, cy: 21.5, rot: 58 },
  '47': { cx: 56.4, cy: 17.2, rot: 42 },
  '46': { cx: 59.2, cy: 14.2, rot: 28 },
  '45': { cx: 62.2, cy: 12.2, rot: 14 },
  '44': { cx: 65.2, cy: 11.0, rot: 6 },
  '43': { cx: 68.2, cy: 10.4, rot: -2 },
  '42': { cx: 71.2, cy: 10.1, rot: -8 },
  '41': { cx: 74.2, cy: 10.4, rot: -12 },
  '31': { cx: 77.4, cy: 10.4, rot: 12 },
  '32': { cx: 80.4, cy: 10.1, rot: 8 },
  '33': { cx: 83.4, cy: 10.4, rot: 2 },
  '34': { cx: 86.4, cy: 11.0, rot: -6 },
  '35': { cx: 89.4, cy: 12.2, rot: -14 },
  '36': { cx: 92.2, cy: 14.2, rot: -28 },
  '37': { cx: 94.4, cy: 17.2, rot: -42 },
  '38': { cx: 96.2, cy: 21.5, rot: -58 },
};

export const UPPER_HOTSPOTS: ImageHotspot[] = UPPER_ARCH_FDI.map((fdi) =>
  toHotspot(fdi, UPPER_CALIB[fdi]),
);

export const LOWER_HOTSPOTS: ImageHotspot[] = LOWER_ARCH_FDI.map((fdi) =>
  toHotspot(fdi, LOWER_CALIB[fdi]),
);

export const ALL_HOTSPOTS: ImageHotspot[] = [...UPPER_HOTSPOTS, ...LOWER_HOTSPOTS];
