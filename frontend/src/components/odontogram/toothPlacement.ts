/**
 * Ajustes finos por dente (FDI).
 * Edite position [x,y,z], rotation [rx,ry,rz] em radianos, scale [sx,sy,sz].
 */
export type ToothPlacementOverride = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
};

export const TOOTH_PLACEMENT: Partial<Record<string, ToothPlacementOverride>> = {
  // Incisivos centrais um pouco maiores
  '11': { scale: [1.1, 1, 1.02] },
  '21': { scale: [1.1, 1, 1.02] },
  '31': { scale: [1.1, 1, 1.02] },
  '41': { scale: [1.1, 1, 1.02] },
  // Laterais menores
  '12': { scale: [0.92, 0.95, 0.95] },
  '22': { scale: [0.92, 0.95, 0.95] },
  '32': { scale: [0.92, 0.95, 0.95] },
  '42': { scale: [0.92, 0.95, 0.95] },
  // Molares mais largos
  '16': { scale: [1.12, 1, 1.08] },
  '17': { scale: [1.1, 1, 1.06] },
  '18': { scale: [1.06, 1, 1.04] },
  '26': { scale: [1.12, 1, 1.08] },
  '27': { scale: [1.1, 1, 1.06] },
  '28': { scale: [1.06, 1, 1.04] },
  '36': { scale: [1.12, 1, 1.08] },
  '37': { scale: [1.1, 1, 1.06] },
  '38': { scale: [1.06, 1, 1.04] },
  '46': { scale: [1.12, 1, 1.08] },
  '47': { scale: [1.1, 1, 1.06] },
  '48': { scale: [1.06, 1, 1.04] },
};

export function applyPlacement(
  fdi: string,
  basePosition: [number, number, number],
  baseRotation: [number, number, number],
  baseScale: [number, number, number],
) {
  const o = TOOTH_PLACEMENT[fdi];
  return {
    position: [
      basePosition[0] + (o?.position?.[0] ?? 0),
      basePosition[1] + (o?.position?.[1] ?? 0),
      basePosition[2] + (o?.position?.[2] ?? 0),
    ] as [number, number, number],
    rotation: [
      baseRotation[0] + (o?.rotation?.[0] ?? 0),
      baseRotation[1] + (o?.rotation?.[1] ?? 0),
      baseRotation[2] + (o?.rotation?.[2] ?? 0),
    ] as [number, number, number],
    scale: [
      baseScale[0] * (o?.scale?.[0] ?? 1),
      baseScale[1] * (o?.scale?.[1] ?? 1),
      baseScale[2] * (o?.scale?.[2] ?? 1),
    ] as [number, number, number],
  };
}
