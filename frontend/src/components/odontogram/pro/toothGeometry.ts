import type { ToothGeometry, ToothVariant } from './types';

function flipMesial(paths: ToothGeometry['surfaces'], mesialLeft: boolean): ToothGeometry['surfaces'] {
  if (mesialLeft) return paths;
  return {
    V: paths.V,
    L: paths.L,
    O: paths.O,
    M: paths.D,
    D: paths.M,
  };
}

const CENTRAL_OCCLUSAL: ToothGeometry = {
  outline:
    'M -7 -13 C -9 -4 -9 4 -7 12 L 7 12 C 9 4 9 -4 7 -13 C 3 -14 -3 -14 -7 -13 Z',
  surfaces: {
    V: 'M -7 -13 C -4 -12 0 -12 4 -12 C 7 -12 7 -6 4 -2 L -4 -2 C -7 -6 -7 -12 Z',
    L: 'M -4 2 C -3 6 0 10 4 8 L 6 2 C 4 0 -4 0 -4 2 Z',
    O: 'M -4 -2 C -2 -3 2 -3 4 -2 L 4 2 C 2 3 -2 3 -4 2 Z',
    M: 'M -7 -13 L -4 -2 L -4 2 L -7 12 L -9 4 Z',
    D: 'M 7 -13 L 4 -2 L 4 2 L 7 12 L 9 4 Z',
  },
  fissures: ['M -5 -2 L 5 -2'],
  vestibular: {
    crown: 'M -8 -10 C -9 -2 -8 6 -6 10 L 6 10 C 8 6 9 -2 8 -10 C 4 -11 -4 -11 -8 -10 Z',
    roots: ['M -3 10 L -4 26 C -2 28 0 28 2 26 L 1 10 Z'],
    outline: 'M -8 -10 C -9 -2 -8 6 -6 10 L 6 10 C 8 6 9 -2 8 -10 C 4 -11 -4 -11 -8 -10 Z M -3 10 L -4 26 C -2 28 0 28 2 26 L 1 10 Z',
  },
};

const LATERAL_OCCLUSAL: ToothGeometry = {
  outline: 'M -6 -14 C -8 -5 -8 5 -6 13 L 6 13 C 8 5 8 -5 6 -14 C 2 -15 -2 -15 -6 -14 Z',
  surfaces: {
    V: 'M -6 -14 C -2 -13 2 -12 5 -11 C 7 -8 6 -3 3 0 L -3 0 C -6 -3 -7 -8 -6 -14 Z',
    L: 'M -3 2 C -2 7 2 11 5 9 L 6 2 C 4 -1 -4 -1 -3 2 Z',
    O: 'M -3 0 C -1 -1 1 -1 3 0 L 3 2 C 1 3 -1 3 -3 2 Z',
    M: 'M -6 -14 L -3 0 L -3 2 L -6 13 L -8 5 Z',
    D: 'M 6 -14 L 3 0 L 3 2 L 6 13 L 8 5 Z',
  },
  fissures: ['M -4 -1 L 4 -1'],
  vestibular: {
    crown: 'M -7 -11 C -8 -2 -7 7 -5 11 L 5 11 C 7 7 8 -2 7 -11 C 3 -12 -3 -12 -7 -11 Z',
    roots: ['M -2 11 L -3 28 C -1 30 1 30 3 28 L 2 11 Z'],
    outline: 'M -7 -11 C -8 -2 -7 7 -5 11 L 5 11 C 7 7 8 -2 7 -11 C 3 -12 -3 -12 -7 -11 Z M -2 11 L -3 28 C -1 30 1 30 3 28 L 2 11 Z',
  },
};

const CANINE_OCCLUSAL: ToothGeometry = {
  outline: 'M -8 -16 C -10 -4 -8 8 -4 14 L 4 14 C 8 8 10 -4 8 -16 C 3 -18 -3 -18 -8 -16 Z',
  surfaces: {
    V: 'M -8 -16 C -4 -15 0 -14 4 -13 C 7 -9 6 -2 2 2 L -2 2 C -6 -2 -7 -9 -8 -16 Z',
    L: 'M -2 4 C 0 9 3 12 5 10 L 6 4 C 4 1 -4 1 -2 4 Z',
    O: 'M -2 2 C 0 0 2 0 4 2 L 3 5 C 1 6 -1 6 -2 5 Z',
    M: 'M -8 -16 L -2 2 L -2 5 L -4 14 L -10 6 Z',
    D: 'M 8 -16 L 2 2 L 2 5 L 4 14 L 10 6 Z',
  },
  fissures: ['M 0 -14 L 0 4'],
  vestibular: {
    crown: 'M -9 -13 C -10 -2 -8 8 -4 12 L 4 12 C 8 8 10 -2 9 -13 C 4 -14 -4 -14 -9 -13 Z',
    roots: ['M -2 12 L -3 32 C -1 34 1 34 3 32 L 2 12 Z'],
    outline: 'M -9 -13 C -10 -2 -8 8 -4 12 L 4 12 C 8 8 10 -2 9 -13 C 4 -14 -4 -14 -9 -13 Z M -2 12 L -3 32 C -1 34 1 34 3 32 L 2 12 Z',
  },
};

const PREMOLAR1_OCCLUSAL: ToothGeometry = {
  outline: 'M -13 -14 C -15 -4 -14 6 -11 14 L 11 14 C 14 6 15 -4 13 -14 C 7 -16 -7 -16 -13 -14 Z',
  surfaces: {
    V: 'M -13 -14 C -6 -13 0 -12 6 -12 C 12 -12 13 -6 9 0 L -9 0 C -13 -6 -13 -12 Z',
    L: 'M -9 2 C -6 8 0 12 8 10 L 10 2 C 6 -2 -6 -2 -9 2 Z',
    O: 'M -9 0 C -4 -2 4 -2 9 0 L 8 6 C 4 8 -4 8 -8 6 Z',
    M: 'M -13 -14 L -9 0 L -8 6 L -11 14 L -15 6 Z',
    D: 'M 13 -14 L 9 0 L 8 6 L 11 14 L 15 6 Z',
  },
  fissures: ['M -7 -14 C -4 -4 -4 4 -7 14', 'M 7 -14 C 4 -4 4 4 7 14'],
  vestibular: {
    crown: 'M -12 -12 C -13 -2 -11 8 -8 12 L 8 12 C 11 8 13 -2 12 -12 C 6 -13 -6 -13 -12 -12 Z',
    roots: [
      'M -4 12 L -5 28 C -3 30 -1 30 0 28 L -1 12 Z',
      'M 2 12 L 1 28 C 3 30 5 30 6 28 L 5 12 Z',
    ],
    outline: 'M -12 -12 C -13 -2 -11 8 -8 12 L 8 12 C 11 8 13 -2 12 -12 C 6 -13 -6 -13 -12 -12 Z',
  },
};

const PREMOLAR2_OCCLUSAL: ToothGeometry = {
  outline: 'M -14 -15 C -16 -4 -15 7 -12 15 L 12 15 C 15 7 16 -4 14 -15 C 8 -17 -8 -17 -14 -15 Z',
  surfaces: {
    V: 'M -14 -15 C -7 -14 0 -13 7 -13 C 13 -13 14 -7 10 -1 L -10 -1 C -14 -7 -14 -13 Z',
    L: 'M -10 1 C -7 9 0 13 9 11 L 11 1 C 7 -3 -7 -3 -10 1 Z',
    O: 'M -10 -1 C -5 -3 5 -3 10 -1 L 9 5 C 5 7 -5 7 -9 5 Z',
    M: 'M -14 -15 L -10 -1 L -9 5 L -12 15 L -16 7 Z',
    D: 'M 14 -15 L 10 -1 L 9 5 L 12 15 L 16 7 Z',
  },
  fissures: ['M -8 -15 C -5 -5 -5 5 -8 15', 'M 8 -15 C 5 -5 5 5 8 15', 'M 0 -15 L 0 15'],
  vestibular: {
    crown: 'M -13 -13 C -14 -2 -12 9 -9 13 L 9 13 C 12 9 14 -2 13 -13 C 7 -14 -7 -14 -13 -13 Z',
    roots: ['M -3 13 L -4 30 C -2 32 0 32 2 30 L 1 13 Z'],
    outline: 'M -13 -13 C -14 -2 -12 9 -9 13 L 9 13 C 12 9 14 -2 13 -13 C 7 -14 -7 -14 -13 -13 Z M -3 13 L -4 30 C -2 32 0 32 2 30 L 1 13 Z',
  },
};

const MOLAR_OCCLUSAL: ToothGeometry = {
  outline: 'M -18 -16 C -20 -4 -18 9 -14 16 L 14 16 C 18 9 20 -4 18 -16 C 10 -18 -10 -18 -18 -16 Z',
  surfaces: {
    V: 'M -18 -16 C -9 -15 0 -14 9 -14 C 16 -14 18 -8 14 -2 L -14 -2 C -18 -8 -18 -14 Z',
    L: 'M -14 0 C -9 9 0 14 10 12 L 14 0 C 9 -4 -9 -4 -14 0 Z',
    O: 'M -14 -2 C -7 -5 7 -5 14 -2 L 12 8 C 6 10 -6 10 -12 8 Z',
    M: 'M -18 -16 L -14 -2 L -12 8 L -14 16 L -20 8 Z',
    D: 'M 18 -16 L 14 -2 L 12 8 L 14 16 L 20 8 Z',
  },
  fissures: [
    'M -18 -2 L 18 -2',
    'M 0 -16 L 0 16',
    'M -11 -11 C -8 -2 -8 6 -11 14',
    'M 11 -11 C 8 -2 8 6 11 14',
  ],
  vestibular: {
    crown: 'M -16 -14 C -17 -2 -15 10 -12 14 L 12 14 C 15 10 17 -2 16 -14 C 9 -15 -9 -15 -16 -14 Z',
    roots: [
      'M -8 14 L -9 30 C -7 32 -5 32 -4 30 L -5 14 Z',
      'M 2 14 L 1 30 C 3 32 5 32 6 30 L 5 14 Z',
      'M -1 14 L -2 28 C 0 30 2 30 3 28 L 2 14 Z',
    ],
    outline: 'M -16 -14 C -17 -2 -15 10 -12 14 L 12 14 C 15 10 17 -2 16 -14 C 9 -15 -9 -15 -16 -14 Z',
  },
};

const MOLAR3_OCCLUSAL: ToothGeometry = {
  ...MOLAR_OCCLUSAL,
  outline: 'M -16 -15 C -18 -4 -16 8 -13 15 L 13 15 C 16 8 18 -4 16 -15 C 9 -17 -9 -17 -16 -15 Z',
  surfaces: {
    ...MOLAR_OCCLUSAL.surfaces,
    V: 'M -16 -15 C -8 -14 0 -13 8 -13 C 14 -13 16 -7 12 -2 L -12 -2 C -16 -7 -16 -13 Z',
    M: 'M -16 -15 L -12 -2 L -11 7 L -13 15 L -18 7 Z',
    D: 'M 16 -15 L 12 -2 L 11 7 L 13 15 L 18 7 Z',
  },
};

const GEOMETRY: Record<ToothVariant, ToothGeometry> = {
  central: CENTRAL_OCCLUSAL,
  lateral: LATERAL_OCCLUSAL,
  canine: CANINE_OCCLUSAL,
  premolar1: PREMOLAR1_OCCLUSAL,
  premolar2: PREMOLAR2_OCCLUSAL,
  molar1: MOLAR_OCCLUSAL,
  molar2: MOLAR_OCCLUSAL,
  molar3: MOLAR3_OCCLUSAL,
};

export function getToothGeometry(variant: ToothVariant, mesialLeft: boolean): ToothGeometry {
  const base = GEOMETRY[variant];
  return {
    ...base,
    surfaces: flipMesial(base.surfaces, mesialLeft),
  };
}

export function scaleForVariant(variant: ToothVariant): number {
  switch (variant) {
    case 'central':
      return 1.05;
    case 'lateral':
      return 0.95;
    case 'canine':
      return 1.02;
    case 'premolar1':
      return 1;
    case 'premolar2':
      return 1.03;
    case 'molar1':
      return 1.08;
    case 'molar2':
      return 1.06;
    case 'molar3':
      return 0.94;
    default:
      return 1;
  }
}
