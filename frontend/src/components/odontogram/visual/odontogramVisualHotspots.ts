/** Coordenadas calibradas pelo usuário sobre odontograma-visual.png (1402×1122). */
export const ODONTOGRAM_VISUAL_IMAGE = '/odontogram/odontograma-visual.png';
export const ODONTOGRAM_VISUAL_WIDTH = 1402;
export const ODONTOGRAM_VISUAL_HEIGHT = 1122;

export type VisualHotspot = {
  fdi: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const DENTES: Array<{ id: number; x: number; y: number }> = [
  { id: 18, x: 126, y: 110 },
  { id: 17, x: 123, y: 145 },
  { id: 16, x: 126, y: 180 },
  { id: 15, x: 136, y: 215 },
  { id: 14, x: 153, y: 245 },
  { id: 13, x: 178, y: 272 },
  { id: 12, x: 212, y: 292 },
  { id: 11, x: 248, y: 302 },
  { id: 21, x: 282, y: 302 },
  { id: 22, x: 318, y: 292 },
  { id: 23, x: 350, y: 272 },
  { id: 24, x: 375, y: 245 },
  { id: 25, x: 392, y: 215 },
  { id: 26, x: 402, y: 180 },
  { id: 27, x: 402, y: 145 },
  { id: 28, x: 400, y: 110 },
  { id: 48, x: 550, y: 292 },
  { id: 47, x: 554, y: 255 },
  { id: 46, x: 568, y: 220 },
  { id: 45, x: 585, y: 185 },
  { id: 44, x: 605, y: 155 },
  { id: 43, x: 630, y: 128 },
  { id: 42, x: 660, y: 112 },
  { id: 41, x: 690, y: 103 },
  { id: 31, x: 720, y: 103 },
  { id: 32, x: 750, y: 112 },
  { id: 33, x: 778, y: 128 },
  { id: 34, x: 800, y: 155 },
  { id: 35, x: 820, y: 185 },
  { id: 36, x: 836, y: 220 },
  { id: 37, x: 846, y: 255 },
  { id: 38, x: 850, y: 292 },
];

function hotspotSize(id: number): { w: number; h: number } {
  const digit = id % 10;
  if (digit >= 6) return { w: 44, h: 48 };
  if (digit >= 4) return { w: 40, h: 44 };
  if (digit === 3) return { w: 38, h: 46 };
  return { w: 36, h: 42 };
}

export const ODONTOGRAM_VISUAL_HOTSPOTS: VisualHotspot[] = DENTES.map(({ id, x, y }) => {
  const { w, h } = hotspotSize(id);
  return { fdi: String(id), x, y, w, h };
});

/** Para o viewer.html embutido: [id, x, y, w, h] */
export const ODONTOGRAM_VISUAL_HOTSPOTS_RAW: Array<[number, number, number, number, number]> =
  ODONTOGRAM_VISUAL_HOTSPOTS.map((h) => [Number(h.fdi), h.x, h.y, h.w, h.h]);

export function hotspotStyle(hotspot: VisualHotspot) {
  return {
    left: `${(hotspot.x / ODONTOGRAM_VISUAL_WIDTH) * 100}%`,
    top: `${(hotspot.y / ODONTOGRAM_VISUAL_HEIGHT) * 100}%`,
    width: `${(hotspot.w / ODONTOGRAM_VISUAL_WIDTH) * 100}%`,
    height: `${(hotspot.h / ODONTOGRAM_VISUAL_HEIGHT) * 100}%`,
  } as const;
}
