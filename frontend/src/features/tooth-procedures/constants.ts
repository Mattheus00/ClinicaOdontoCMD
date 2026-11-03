import type { Dentition, ProcedureType, RecordedStatus, ToothFace, ToothStatus } from './types';

/** Display order from the patient's right to left, as the dentist sees the mouth. */
export const UPPER_PERMANENT = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
export const LOWER_PERMANENT = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];
export const UPPER_DECIDUOUS = ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65'];
export const LOWER_DECIDUOUS = ['85', '84', '83', '82', '81', '71', '72', '73', '74', '75'];

export const ALL_TEETH = [...UPPER_PERMANENT, ...LOWER_PERMANENT, ...UPPER_DECIDUOUS, ...LOWER_DECIDUOUS];

export function archTeeth(dentition: Dentition) {
  return dentition === 'permanent'
    ? { upper: UPPER_PERMANENT, lower: LOWER_PERMANENT }
    : { upper: UPPER_DECIDUOUS, lower: LOWER_DECIDUOUS };
}

export function isDeciduous(tooth: string) {
  return Number(tooth[0]) >= 5;
}

export function isUpper(tooth: string) {
  const quadrant = Number(tooth[0]);
  return quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
}

/** True for the patient's right side (quadrants 1, 4, 5, 8). */
export function isPatientRight(tooth: string) {
  const quadrant = Number(tooth[0]);
  return quadrant === 1 || quadrant === 4 || quadrant === 5 || quadrant === 8;
}

export type ToothKind = 'central' | 'lateral' | 'canine' | 'premolar' | 'molar';

export function toothKind(tooth: string): ToothKind {
  const position = Number(tooth[1]);
  if (position === 1) return 'central';
  if (position === 2) return 'lateral';
  if (position === 3) return 'canine';
  if (isDeciduous(tooth)) return 'molar';
  return position <= 5 ? 'premolar' : 'molar';
}

const PERMANENT_NAMES: Record<number, string> = {
  1: 'Incisivo central',
  2: 'Incisivo lateral',
  3: 'Canino',
  4: 'Primeiro pré-molar',
  5: 'Segundo pré-molar',
  6: 'Primeiro molar',
  7: 'Segundo molar',
  8: 'Terceiro molar',
};

const DECIDUOUS_NAMES: Record<number, string> = {
  1: 'Incisivo central',
  2: 'Incisivo lateral',
  3: 'Canino',
  4: 'Primeiro molar',
  5: 'Segundo molar',
};

export function toothName(tooth: string) {
  const position = Number(tooth[1]);
  const base = isDeciduous(tooth) ? DECIDUOUS_NAMES[position] : PERMANENT_NAMES[position];
  const arch = isUpper(tooth) ? 'superior' : 'inferior';
  const side = isPatientRight(tooth) ? 'direito' : 'esquerdo';
  return `${base} ${arch} ${side}${isDeciduous(tooth) ? ' (decíduo)' : ''}`;
}

export const PROCEDURES: { value: ProcedureType; label: string }[] = [
  { value: 'RESTORATION', label: 'Restauração' },
  { value: 'CLEANING', label: 'Limpeza/Profilaxia' },
  { value: 'EXTRACTION', label: 'Extração' },
  { value: 'ROOT_CANAL', label: 'Canal (Endodontia)' },
  { value: 'SEALANT', label: 'Selante' },
  { value: 'FLUORIDE', label: 'Aplicação de flúor' },
  { value: 'WHITENING', label: 'Clareamento' },
  { value: 'CROWN', label: 'Coroa' },
  { value: 'IMPLANT', label: 'Implante' },
  { value: 'VENEER', label: 'Facetas' },
  { value: 'SCALING', label: 'Raspagem' },
  { value: 'OTHER', label: 'Outro' },
];

export const PROCEDURE_LABEL = Object.fromEntries(PROCEDURES.map((p) => [p.value, p.label])) as Record<ProcedureType, string>;

export const FACES: { value: ToothFace; label: string }[] = [
  { value: 'O', label: 'Oclusal' },
  { value: 'V', label: 'Vestibular' },
  { value: 'L', label: 'Lingual' },
  { value: 'M', label: 'Mesial' },
  { value: 'D', label: 'Distal' },
];

export const FACE_LABEL = Object.fromEntries(FACES.map((f) => [f.value, f.label])) as Record<ToothFace, string>;

export type StatusMeta = { label: string; fill: string; light: string; stroke: string };

export const STATUS_META: Record<ToothStatus, StatusMeta> = {
  HEALTHY: { label: 'Saudável', fill: '#e5e7eb', light: '#ffffff', stroke: '#c3c8d2' },
  TREATED: { label: 'Tratado na consulta', fill: '#5b8def', light: '#c9dafd', stroke: '#3b6fd8' },
  RESTORATION: { label: 'Restauração', fill: '#5cc48a', light: '#cdeedb', stroke: '#2f9c63' },
  IN_PROGRESS: { label: 'Tratamento em andamento', fill: '#f5c542', light: '#fcebb6', stroke: '#c99a12' },
  NEEDS_TREATMENT: { label: 'Necessita tratamento', fill: '#ef6b6b', light: '#fbd0d0', stroke: '#c94444' },
};

export const STATUS_ORDER: ToothStatus[] = ['HEALTHY', 'TREATED', 'RESTORATION', 'IN_PROGRESS', 'NEEDS_TREATMENT'];

export const RECORDED_STATUSES: RecordedStatus[] = ['TREATED', 'RESTORATION', 'IN_PROGRESS', 'NEEDS_TREATMENT'];

export const SELECTED_META = { fill: '#4f63e7', light: '#aab6ff', stroke: '#3445c4' };

export function defaultStatusFor(procedure: ProcedureType): RecordedStatus {
  switch (procedure) {
    case 'RESTORATION':
    case 'CROWN':
    case 'VENEER':
    case 'IMPLANT':
    case 'SEALANT':
      return 'RESTORATION';
    case 'ROOT_CANAL':
      return 'IN_PROGRESS';
    default:
      return 'TREATED';
  }
}

export const GLB_MODEL_URL = '/models/arcada.glb';
