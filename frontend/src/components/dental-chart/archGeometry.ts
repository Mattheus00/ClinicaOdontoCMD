import { isDeciduous, toothKind, type ToothKind } from '../../features/tooth-procedures/constants';

export const VIEW_WIDTH = 1000;
export const VIEW_HEIGHT = 600;
const CENTER_X = VIEW_WIDTH / 2;
const GAP = 3;
const UPPER_EDGE_Y = 290;
const LOWER_EDGE_Y = 318;
const CURVE_RISE = 48;
const LABEL_SPREAD = 1.08;
export const UPPER_LABEL_Y = 34;
export const LOWER_LABEL_Y = 574;

type Size = { w: number; h: number };

const PERMANENT_UPPER: Record<number, Size> = {
  1: { w: 60, h: 114 }, 2: { w: 48, h: 98 }, 3: { w: 46, h: 114 }, 4: { w: 40, h: 94 },
  5: { w: 38, h: 88 }, 6: { w: 46, h: 82 }, 7: { w: 40, h: 72 }, 8: { w: 32, h: 62 },
};
const PERMANENT_LOWER: Record<number, Size> = {
  1: { w: 38, h: 96 }, 2: { w: 40, h: 98 }, 3: { w: 44, h: 110 }, 4: { w: 40, h: 92 },
  5: { w: 40, h: 86 }, 6: { w: 50, h: 78 }, 7: { w: 44, h: 70 }, 8: { w: 36, h: 60 },
};
const DECIDUOUS_UPPER: Record<number, Size> = {
  1: { w: 50, h: 90 }, 2: { w: 40, h: 80 }, 3: { w: 42, h: 90 }, 4: { w: 46, h: 72 }, 5: { w: 52, h: 66 },
};
const DECIDUOUS_LOWER: Record<number, Size> = {
  1: { w: 34, h: 76 }, 2: { w: 36, h: 78 }, 3: { w: 40, h: 86 }, 4: { w: 48, h: 68 }, 5: { w: 54, h: 62 },
};

export type ToothLayout = {
  tooth: string;
  kind: ToothKind;
  upper: boolean;
  x: number;
  width: number;
  height: number;
  cx: number;
  /** Biting edge (incisal/occlusal). */
  edgeY: number;
  /** Where the crown meets the gum. */
  gumY: number;
  labelX: number;
  labelY: number;
};

function sizeOf(tooth: string, upper: boolean): Size {
  const position = Number(tooth[1]);
  if (isDeciduous(tooth)) return (upper ? DECIDUOUS_UPPER : DECIDUOUS_LOWER)[position];
  return (upper ? PERMANENT_UPPER : PERMANENT_LOWER)[position];
}

export function layoutArch(teeth: string[], upper: boolean, mirrored: boolean): ToothLayout[] {
  const ordered = mirrored ? [...teeth].reverse() : teeth;
  const sizes = ordered.map((tooth) => sizeOf(tooth, upper));
  const total = sizes.reduce((sum, size) => sum + size.w, 0) + GAP * (ordered.length - 1);
  const half = total / 2;
  let x = CENTER_X - half;

  return ordered.map((tooth, index) => {
    const { w, h } = sizes[index];
    const cx = x + w / 2;
    const t = (cx - CENTER_X) / half;
    const rise = CURVE_RISE * t * t;
    const edgeY = upper ? UPPER_EDGE_Y - rise : LOWER_EDGE_Y + rise * 0.85;
    const layout: ToothLayout = {
      tooth,
      kind: toothKind(tooth),
      upper,
      x,
      width: w,
      height: h,
      cx,
      edgeY,
      gumY: upper ? edgeY - h : edgeY + h,
      labelX: CENTER_X + (cx - CENTER_X) * LABEL_SPREAD,
      labelY: upper ? UPPER_LABEL_Y : LOWER_LABEL_Y,
    };
    x += w + GAP;
    return layout;
  });
}

/** Crown outline in local coordinates: gum line at y=0, biting edge at y=h. */
export function toothPath(kind: ToothKind, w: number, h: number) {
  const neck = kind === 'molar' ? 0.8 : kind === 'premolar' ? 0.72 : kind === 'canine' ? 0.66 : 0.76;
  const nl = (w * (1 - neck)) / 2;
  const nr = w - nl;
  const bulge = h * 0.42;
  let d = `M ${nl} 0 L ${nr} 0 C ${nr + (w - nr) * 0.8} ${h * 0.12}, ${w} ${h * 0.26}, ${w} ${bulge}`;

  switch (kind) {
    case 'central':
    case 'lateral': {
      const r = w * 0.2;
      d += ` L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${r} ${h * 0.99} Q 0 ${h} 0 ${h - r}`;
      break;
    }
    case 'canine':
      d += ` L ${w} ${h * 0.72} Q ${w * 0.84} ${h * 0.9} ${w * 0.5} ${h} Q ${w * 0.16} ${h * 0.9} 0 ${h * 0.72}`;
      break;
    case 'premolar':
      d += ` L ${w} ${h * 0.8} Q ${w * 0.92} ${h} ${w * 0.66} ${h * 0.97} Q ${w * 0.5} ${h * 0.91} ${w * 0.34} ${h * 0.97} Q ${w * 0.08} ${h} 0 ${h * 0.8}`;
      break;
    case 'molar':
      d += ` L ${w} ${h * 0.82} Q ${w} ${h} ${w * 0.76} ${h * 0.98} Q ${w * 0.5} ${h * 0.9} ${w * 0.24} ${h * 0.98} Q 0 ${h} 0 ${h * 0.82}`;
      break;
  }

  d += ` L 0 ${bulge} C 0 ${h * 0.26}, ${nl * 0.2} ${h * 0.12}, ${nl} 0 Z`;
  return d;
}

type Point = [number, number];

function smoothThrough(points: Point[], move = true) {
  if (points.length === 0) return '';
  let d = move ? `M ${points[0][0]} ${points[0][1]}` : `L ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += ` Q ${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

/**
 * Gum band with a scalloped margin: it arches over each crown and dips
 * into a papilla between neighbours, covering the tooth necks.
 */
export function gumPath(layout: ToothLayout[], upper: boolean) {
  if (layout.length === 0) return '';
  const dir = upper ? 1 : -1;
  const first = layout[0];
  const last = layout[layout.length - 1];
  const band = 50;

  const outer: Point[] = [
    [first.x - 30, first.gumY + dir * 14],
    ...layout.map((t): Point => [t.cx, t.gumY - dir * band]),
    [last.x + last.width + 30, last.gumY + dir * 14],
  ];

  let d = smoothThrough(outer);
  const reversed = [...layout].reverse();
  const papilla = (a: ToothLayout, b: ToothLayout) =>
    (upper ? Math.max(a.gumY, b.gumY) : Math.min(a.gumY, b.gumY)) + dir * Math.min(a.height, b.height) * 0.2;

  d += ` L ${last.x + last.width + 2} ${last.gumY + dir * last.height * 0.16}`;
  reversed.forEach((tooth, index) => {
    const next = reversed[index + 1];
    const endX = next ? (tooth.x + next.x + next.width) / 2 : tooth.x - 2;
    const endY = next ? papilla(tooth, next) : tooth.gumY + dir * tooth.height * 0.16;
    const startY = index === 0 ? last.gumY + dir * last.height * 0.16 : papilla(reversed[index - 1], tooth);
    const apex = tooth.gumY + dir * 5;
    const control = 2 * apex - (startY + endY) / 2;
    d += ` Q ${tooth.cx} ${control} ${endX} ${endY}`;
  });
  d += ` L ${first.x - 30} ${first.gumY + dir * 14} Z`;
  return d;
}

/** Dark mouth interior between both gum margins. */
export function cavityPath(upper: ToothLayout[], lower: ToothLayout[]) {
  if (upper.length === 0 || lower.length === 0) return '';
  const top: Point[] = upper.map((t) => [t.cx, t.gumY + t.height * 0.25]);
  const bottom: Point[] = [...lower].reverse().map((t) => [t.cx, t.gumY - t.height * 0.25]);
  const left = Math.min(upper[0].x, lower[0].x) - 12;
  const right = Math.max(upper[upper.length - 1].x + upper[upper.length - 1].width, lower[lower.length - 1].x + lower[lower.length - 1].width) + 12;
  const midLeft = (top[0][1] + bottom[bottom.length - 1][1]) / 2;
  const midRight = (top[top.length - 1][1] + bottom[0][1]) / 2;
  return `${smoothThrough([[left, midLeft], ...top, [right, midRight]])} ${smoothThrough([...bottom, [left, midLeft]], false)} Z`;
}

export function toothFocusViewBox(tooth: ToothLayout) {
  const top = Math.min(tooth.gumY, tooth.edgeY) - 70;
  const height = tooth.height + 140;
  const width = Math.max(tooth.width + 160, height * 1.3);
  return `${tooth.cx - width / 2} ${top} ${width} ${height}`;
}

export const DEFAULT_VIEWBOX = `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`;
