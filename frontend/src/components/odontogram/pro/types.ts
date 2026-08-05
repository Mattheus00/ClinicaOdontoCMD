import type { OdontogramStatus } from '../../../features/odontogram/odontogram.types';

export type ToothSurface = 'V' | 'L' | 'M' | 'D' | 'O';

export type ToothView = 'occlusal' | 'vestibular';

export type ToothVariant =
  | 'central'
  | 'lateral'
  | 'canine'
  | 'premolar1'
  | 'premolar2'
  | 'molar1'
  | 'molar2'
  | 'molar3';

export type ArchSide = 'upper' | 'lower';

export type OdontogramClickPayload = {
  tooth: number;
  surface: ToothSurface;
  status: OdontogramStatus;
};

export type ToothLayoutPro = {
  fdi: string;
  x: number;
  y: number;
  rotation: number;
  variant: ToothVariant;
  scale: number;
  mesialSide: 'left' | 'right';
};

export type SurfacePaths = Record<ToothSurface, string>;

export type ToothGeometry = {
  outline: string;
  surfaces: SurfacePaths;
  fissures: string[];
  vestibular: {
    crown: string;
    roots: string[];
    outline: string;
  };
};

export type OdontogramSvgProps = {
  statuses: Map<string, string>;
  selectedTeeth: Set<string>;
  focusedTooth: string | null;
  hovered: { tooth: string; surface: ToothSurface } | null;
  onSurfaceClick: (payload: OdontogramClickPayload) => void;
  onSurfaceHover: (tooth: string | null, surface: ToothSurface | null) => void;
};
