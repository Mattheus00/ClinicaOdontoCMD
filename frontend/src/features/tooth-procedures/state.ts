import { ALL_TEETH } from './constants';
import type { OdontogramAppointment, ToothProcedureRecord, ToothState, ToothStatus } from './types';

const FDI_ORDER = new Map(ALL_TEETH.map((tooth, index) => [tooth, index]));

export function sortTeeth(teeth: string[]) {
  return [...teeth].sort((a, b) => (FDI_ORDER.get(a) ?? 99) - (FDI_ORDER.get(b) ?? 99));
}

export function toggleTooth(selection: string[], tooth: string) {
  return selection.includes(tooth) ? selection.filter((value) => value !== tooth) : [...selection, tooth];
}

export function stateByTooth(teeth: ToothState[] | undefined) {
  const map = new Map<string, ToothState>();
  for (const tooth of teeth ?? []) map.set(tooth.toothNumber, tooth);
  return map;
}

export function displayStatus(state: ToothState | undefined): ToothStatus {
  return state ? state.status : 'HEALTHY';
}

export function isExtracted(state: ToothState | undefined) {
  return state?.procedureType === 'EXTRACTION' && state.status !== 'NEEDS_TREATMENT';
}

export function recordsForTooth(records: ToothProcedureRecord[] | undefined, tooth: string) {
  return (records ?? [])
    .filter((record) => record.toothNumber === tooth)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function sameLocalDay(iso: string, now: Date) {
  const date = new Date(iso);
  return (
    date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
  );
}

/**
 * Appointment a new record should be linked to: the one from the URL when allowed,
 * otherwise today's appointment the user can register on, otherwise none.
 */
export function pickRegisterAppointment(
  options: OdontogramAppointment[] | undefined,
  requestedId: string | null,
  now = new Date(),
) {
  const allowed = (options ?? []).filter((option) => option.canRegister);
  if (requestedId) {
    const requested = allowed.find((option) => option.id === requestedId);
    if (requested) return requested.id;
  }
  const today = allowed
    .filter((option) => sameLocalDay(option.startsAt, now))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return today[0]?.id ?? null;
}
