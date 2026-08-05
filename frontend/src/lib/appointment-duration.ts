export const APPOINTMENT_DURATION_OPTIONS = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' },
  { value: 150, label: '2h 30min' },
  { value: 180, label: '3 horas' },
  { value: 240, label: '4 horas' },
] as const;

export const DEFAULT_APPOINTMENT_DURATION = 30;

export function formatAppointmentDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return hours === 1 ? '1 hora' : `${hours} horas`;
  return `${hours}h ${rest}min`;
}
