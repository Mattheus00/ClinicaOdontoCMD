import type { OdontogramStatus } from './odontogram.types';

/** FDI — arcada superior direita → esquerda, depois inferior esquerda → direita. */
export const UPPER_ARCH_FDI = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28',
] as const;

export const LOWER_ARCH_FDI = [
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38',
] as const;

export const ALL_FDI_TEETH = [...UPPER_ARCH_FDI, ...LOWER_ARCH_FDI] as const;

export const ODONTOGRAM_STATUS_LABELS: Record<OdontogramStatus, string> = {
  HEALTHY: 'Saudável',
  CARIES: 'Cárie',
  RESTORED: 'Restauração',
  MISSING: 'Ausente',
  EXTRACTION_INDICATED: 'Extração indicada',
  EXTRACTED: 'Extraído',
  IMPLANT: 'Implante',
  ROOT_CANAL: 'Canal',
  CROWN: 'Coroa',
  FRACTURE: 'Fratura',
  IN_TREATMENT: 'Em tratamento',
};

export const ODONTOGRAM_STATUS_ICONS: Record<OdontogramStatus, string> = {
  HEALTHY: '✓',
  CARIES: '●',
  RESTORED: '◆',
  MISSING: '○',
  EXTRACTION_INDICATED: '✕',
  EXTRACTED: '—',
  IMPLANT: '⬡',
  ROOT_CANAL: '◎',
  CROWN: '♛',
  FRACTURE: '⚡',
  IN_TREATMENT: '↻',
};

/** Cor do esmalte 3D por status. */
export const ODONTOGRAM_STATUS_TINT: Record<OdontogramStatus, string> = {
  HEALTHY: '#fbf8f1',
  CARIES: '#e8b07a',
  RESTORED: '#b7d4ea',
  MISSING: '#9aa3ab',
  EXTRACTION_INDICATED: '#f0a8a8',
  EXTRACTED: '#9aa3ab',
  IMPLANT: '#e9e4f8',
  ROOT_CANAL: '#e8a0aa',
  CROWN: '#e8d48a',
  FRACTURE: '#d4c4b0',
  IN_TREATMENT: '#a8d4f0',
};

/** Classes CSS da legenda (chips). */
export const ODONTOGRAM_STATUS_CHIP_CLASS: Record<OdontogramStatus, string> = {
  HEALTHY: 'status-healthy',
  CARIES: 'status-caries',
  RESTORED: 'status-restored',
  MISSING: 'status-missing',
  EXTRACTION_INDICATED: 'status-extraction_indicated',
  EXTRACTED: 'status-extracted',
  IMPLANT: 'status-implant',
  ROOT_CANAL: 'status-root_canal',
  CROWN: 'status-crown',
  FRACTURE: 'status-fracture',
  IN_TREATMENT: 'status-in_treatment',
};

export const ODONTOGRAM_PROCEDURES: Array<{ value: string; label: string }> = [
  { value: '', label: 'Nenhum' },
  { value: 'RESTAURACAO', label: 'Restauração' },
  { value: 'EXTRACAO', label: 'Extração' },
  { value: 'IMPLANTE', label: 'Implante' },
  { value: 'ENDODONTIA', label: 'Endodontia (canal)' },
  { value: 'PROTESE', label: 'Prótese / coroa' },
  { value: 'LIMPEZA', label: 'Limpeza / profilaxia' },
  { value: 'AVALIACAO', label: 'Avaliação clínica' },
  { value: 'OUTRO', label: 'Outro' },
];

export function isAbsentStatus(status: OdontogramStatus): boolean {
  return status === 'EXTRACTED' || status === 'MISSING';
}

export function procedureLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return ODONTOGRAM_PROCEDURES.find((p) => p.value === value)?.label ?? value;
}
