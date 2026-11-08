export const CLINIC_TIME_ZONE = "America/Sao_Paulo";

/** Legacy API values without an offset already represent clinic wall time. */
export function clinicDateTime(value: string | Date) {
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value)
  )
    return value.slice(0, 16);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
export const clinicDate = (value: string | Date = new Date()) =>
  clinicDateTime(value).slice(0, 10);
export const clinicTime = (value: string | Date) =>
  clinicDateTime(value).slice(11, 16);
export function clinicDateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}
