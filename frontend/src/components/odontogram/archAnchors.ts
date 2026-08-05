/**
 * Posicionamento da arcada em vista oclusal (odontograma clínico, câmera de cima).
 * Ajuste radiusX/Z, upperY/lowerY e spacingFactor para calibrar a arcada inteira.
 */
export type OcclusalArchParams = {
  radiusX: number;
  radiusZ: number;
  upperY: number;
  lowerY: number;
  /** < 1 aproxima dentes; > 1 afasta. */
  spacingFactor: number;
};

export const OCCLUSAL_ARCH: OcclusalArchParams = {
  radiusX: 1.72,
  radiusZ: 1.28,
  upperY: 0.2,
  lowerY: -0.2,
  spacingFactor: 0.94,
};

export const UPPER_FDI = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28',
] as const;

export const LOWER_FDI = [
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38',
] as const;

export type ArchPose = {
  x: number;
  y: number;
  z: number;
  rotY: number;
  fdi: string;
};

export function occlusalArchPose(
  index: number,
  total: number,
  isUpper: boolean,
  params: OcclusalArchParams = OCCLUSAL_ARCH,
): ArchPose {
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const span = 0.76 * params.spacingFactor;
  const start = 0.12 - (span - 0.76) / 2;
  const angle = Math.PI * (start + t * span);

  const x = Math.cos(angle) * params.radiusX;
  const z = -Math.sin(angle) * params.radiusZ;
  const y = isUpper ? params.upperY : params.lowerY;
  const rotY = Math.PI / 2 + angle;

  const fdiList = isUpper ? UPPER_FDI : LOWER_FDI;
  return { x, y, z, rotY, fdi: fdiList[index] ?? String(index) };
}

/** @deprecated Mantido para calibração do scan GLB. */
export type ArchAnchorParams = {
  radiusX: number;
  radiusZ: number;
  offsetY: number;
  rotationY: number;
  spacingFactor: number;
  offsetX: number;
  offsetZ: number;
};

export const DEFAULT_ARCH_PARAMS: ArchAnchorParams = {
  radiusX: 2.3,
  radiusZ: 1.95,
  offsetY: 1.05,
  rotationY: 0,
  spacingFactor: 1,
  offsetX: 0,
  offsetZ: 0,
};

export function archPose(
  index: number,
  total: number,
  params: ArchAnchorParams = DEFAULT_ARCH_PARAMS,
  isUpper = true,
) {
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const span = 0.76 * params.spacingFactor;
  const start = 0.12 - (span - 0.76) / 2;
  const angle = Math.PI * (start + t * span);
  const x = Math.cos(angle) * params.radiusX;
  const z = -Math.sin(angle) * params.radiusZ;
  const y = isUpper ? params.offsetY : -params.offsetY - 0.1;
  const rotY = Math.PI / 2 + angle;
  const cos = Math.cos(params.rotationY);
  const sin = Math.sin(params.rotationY);
  return {
    x: x * cos - z * sin + params.offsetX,
    y,
    z: x * sin + z * cos + params.offsetZ,
    rotY: rotY + params.rotationY,
    fdi: UPPER_FDI[index] ?? String(index),
  };
}

export type ToothAnchor = {
  fdi: string;
  position: [number, number, number];
  rotY: number;
};

export function getArchAnchorPositions(params: ArchAnchorParams = DEFAULT_ARCH_PARAMS): ToothAnchor[] {
  return UPPER_FDI.map((fdi, index) => {
    const pose = archPose(index, UPPER_FDI.length, params, true);
    return { fdi, position: [pose.x, pose.y, pose.z], rotY: pose.rotY };
  });
}
