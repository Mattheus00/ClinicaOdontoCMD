import { isUpper } from '../../features/tooth-procedures/constants';
import type { ToothFace } from '../../features/tooth-procedures/types';

export type FaceSide = 'top' | 'bottom' | 'left' | 'right' | 'center';

/** Polygons of a five-face tooth diagram of size s with inner square inset i. */
export function facePolygons(s: number, i: number): Record<FaceSide, string> {
  return {
    top: `0,0 ${s},0 ${s - i},${i} ${i},${i}`,
    bottom: `0,${s} ${s},${s} ${s - i},${s - i} ${i},${s - i}`,
    left: `0,0 ${i},${i} ${i},${s - i} 0,${s}`,
    right: `${s},0 ${s - i},${i} ${s - i},${s - i} ${s},${s}`,
    center: `${i},${i} ${s - i},${i} ${s - i},${s - i} ${i},${s - i}`,
  };
}

/**
 * Which face sits on each side of the diagram. Vestibular faces the lips (outside of the chart),
 * mesial faces the midline, so it depends on which half of the chart the tooth is drawn.
 */
export function faceAt(tooth: string, side: FaceSide, drawnOnLeftHalf: boolean): ToothFace {
  if (side === 'center') return 'O';
  const upper = isUpper(tooth);
  if (side === 'top') return upper ? 'V' : 'L';
  if (side === 'bottom') return upper ? 'L' : 'V';
  const towardMidline = drawnOnLeftHalf ? 'right' : 'left';
  return side === towardMidline ? 'M' : 'D';
}

export const FACE_SIDES: FaceSide[] = ['top', 'right', 'bottom', 'left', 'center'];
