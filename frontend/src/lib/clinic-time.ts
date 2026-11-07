export const CLINIC_TIME_ZONE = "America/Sao_Paulo";
// Values without offsets from the existing API are clinic wall times, not device local times.
export function clinicInstant(value: string) {
  return new Date(
    /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}-03:00`,
  );
}
export function clinicDate(value: string | Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof value === "string" ? clinicInstant(value) : value);
}
export function clinicTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: CLINIC_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(clinicInstant(value));
}
export function clinicDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: CLINIC_TIME_ZONE,
    dateStyle: "full",
    timeStyle: "short",
  }).format(clinicInstant(value));
}
