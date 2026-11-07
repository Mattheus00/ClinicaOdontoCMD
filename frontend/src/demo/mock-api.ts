import axios, { AxiosError, type AxiosAdapter } from "axios";
import { api } from "../services/api";
import { clinicDate, clinicInstant } from "../lib/clinic-time";
import type { Appointment } from "../api/types";
const KEY = "odonto-ux-fixtures-v1";
const professionals = [
  {
    id: "demo-pro-1",
    name: "Profissional A (fictício)",
    specialty: "Avaliação",
  },
  {
    id: "demo-pro-2",
    name: "Profissional B (fictício)",
    specialty: "Avaliação",
  },
];
const procedures = [
  { id: "demo-evaluation", name: "Avaliação odontológica", price: 0 },
];
const patients = [
  { id: "demo-patient-1", name: "Ana Exemplo", phone: "00000000000" },
  { id: "demo-patient-2", name: "Bruno Exemplo", phone: "00000000000" },
];
function seed(): Appointment[] {
  return [0, 1, 2].map((index) => ({
    id: `demo-appt-${index}`,
    patient: patients[index % 2],
    professional: professionals[index % 2],
    procedure: procedures[0],
    startsAt: `${clinicDate()}T${["09:00", "10:00", "14:00"][index]}:00-03:00`,
    endsAt: `${clinicDate()}T${["09:30", "10:30", "14:30"][index]}:00-03:00`,
    durationMinutes: 30,
    status: index === 1 ? "PENDING" : "SCHEDULED",
  }));
}
let appointments: Appointment[] =
  JSON.parse(sessionStorage.getItem(KEY) ?? "null") ?? seed();
const save = () => sessionStorage.setItem(KEY, JSON.stringify(appointments));
export const resetFixtures = () => {
  sessionStorage.removeItem(KEY);
  sessionStorage.removeItem("odonto-ux-scenario");
  location.assign("/");
};
function isFree(
  professionalId: string,
  startsAt: string,
  duration = 30,
  exceptId?: string,
) {
  const start = clinicInstant(startsAt).getTime();
  return (
    start > Date.now() &&
    !appointments.some(
      (item) =>
        item.id !== exceptId &&
        item.status !== "CANCELLED" &&
        item.professional.id === professionalId &&
        start < clinicInstant(item.endsAt).getTime() &&
        start + duration * 60000 > clinicInstant(item.startsAt).getTime(),
    )
  );
}
export function installMockApi() {
  // No HTTP fallback. Both the instance and the raw refresh client use the local adapter.
  const adapter: AxiosAdapter = async (config) => {
    const url = new URL(config.url ?? "", "http://localhost");
    const path = url.pathname.replace(/^\/api/, "");
    const params = config.params as Record<string, string> | undefined;
    const input =
      typeof config.data === "string"
        ? JSON.parse(config.data)
        : (config.data ?? {});
    await new Promise((resolve) => setTimeout(resolve, 250));
    const respond = (data: unknown) => ({
      data: structuredClone(data),
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
    const fail = (status: number, message: string): never => {
      throw new AxiosError(message, String(status), config, undefined, {
        ...respond({ message }),
        status,
      });
    };
    const scenario = sessionStorage.getItem("odonto-ux-scenario");
    if (path === "/auth/refresh") {
      if (location.pathname !== "/agenda")
        return fail(401, "Sem sessão de teste");
      return respond({
        accessToken: `demo.${btoa(JSON.stringify({ role: "SECRETARY" }))}.invalid`,
      });
    }
    if (path === "/auth/logout") return respond({});
    if (path === "/public/booking/demonstracao")
      return respond({
        clinicName: "Maria Alice · clínica fictícia",
        bookingSlug: "demonstracao",
        professionals,
        procedures,
      });
    if (path.endsWith("/availability") && path.startsWith("/public/booking/")) {
      if (scenario === "error") return fail(503, "Falha simulada");
      const slots =
        scenario === "empty"
          ? []
          : ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]
              .map((time) => `${params?.date}T${time}:00-03:00`)
              .filter((slot) => isFree(params?.professionalId ?? "", slot));
      return respond({ date: params?.date, slots });
    }
    if (
      path === "/public/booking/demonstracao/appointments" &&
      config.method === "post"
    ) {
      if (scenario === "conflict") {
        sessionStorage.removeItem("odonto-ux-scenario");
        const professional = professionals.find(
          (p) => p.id === input.professionalId,
        );
        if (professional) {
          appointments.push({
            id: crypto.randomUUID(),
            patient: patients[1],
            professional,
            procedure: procedures[0],
            startsAt: input.startsAt,
            endsAt: new Date(
              clinicInstant(input.startsAt).getTime() + 30 * 60000,
            ).toISOString(),
            durationMinutes: 30,
            status: "SCHEDULED",
          });
          save();
        }
        return fail(409, "Conflito simulado");
      }
      if (scenario === "error") return fail(503, "Falha simulada");
      if (!isFree(input.professionalId, input.startsAt))
        return fail(409, "Horário indisponível");
      const professional = professionals.find(
        (p) => p.id === input.professionalId,
      );
      if (
        !professional ||
        input.procedureId !== procedures[0].id ||
        !input.name ||
        !input.phone
      )
        return fail(400, "Revise os dados");
      const patient = {
        id: crypto.randomUUID(),
        name: input.name,
        phone: input.phone,
        email: input.email,
      };
      const item: Appointment = {
        id: crypto.randomUUID(),
        patient,
        professional,
        procedure: procedures[0],
        startsAt: input.startsAt,
        endsAt: new Date(
          clinicInstant(input.startsAt).getTime() + 30 * 60000,
        ).toISOString(),
        durationMinutes: 30,
        status: "PENDING",
      };
      appointments.push(item);
      save();
      return respond({
        appointmentId: item.id,
        clinicName: "Maria Alice · clínica fictícia",
        professionalName: professional.name,
        procedureName: procedures[0].name,
        startsAt: item.startsAt,
        patientName: patient.name,
      });
    }
    const paged = (content: unknown[]) =>
      respond({
        content,
        totalElements: content.length,
        totalPages: 1,
        number: 0,
        size: 100,
      });
    if (path === "/professionals") return paged(professionals);
    if (path === "/procedures") return paged(procedures);
    if (path === "/patients") return paged(patients);
    if (path === "/staff-notifications")
      return respond({ unreadCount: 0, items: [] });
    if (path === "/appointments" && config.method === "get") {
      if (scenario === "error") return fail(503, "Falha simulada");
      return paged(
        scenario === "empty"
          ? []
          : appointments.filter(
              (item) =>
                (!params?.from || clinicDate(item.startsAt) >= params.from) &&
                (!params?.to || clinicDate(item.startsAt) <= params.to) &&
                (!params?.professionalId ||
                  item.professional.id === params.professionalId),
            ),
      );
    }
    if (path === "/appointments" && config.method === "post") {
      if (!isFree(input.professionalId, input.startsAt, input.durationMinutes))
        return fail(409, "Horário indisponível");
      const patient = patients.find((p) => p.id === input.patientId),
        professional = professionals.find((p) => p.id === input.professionalId);
      if (!patient || !professional || input.procedureId !== procedures[0].id)
        return fail(400, "Revise os dados");
      const item: Appointment = {
        id: crypto.randomUUID(),
        patient,
        professional,
        procedure: procedures[0],
        startsAt: input.startsAt,
        endsAt: new Date(
          clinicInstant(input.startsAt).getTime() +
            input.durationMinutes * 60000,
        ).toISOString(),
        durationMinutes: input.durationMinutes,
        status: "SCHEDULED",
      };
      appointments.push(item);
      save();
      return respond(item);
    }
    const match = path.match(
      /^\/appointments\/([^/]+)\/(accept|cancel|reschedule)$/,
    );
    if (match) {
      const item = appointments.find((item) => item.id === match[1]);
      if (!item) return fail(404, "Consulta não encontrada");
      if (match[2] === "accept") {
        if (item.status !== "PENDING") return fail(409, "Pedido já tratado");
        item.status = "SCHEDULED";
      }
      if (match[2] === "cancel") item.status = "CANCELLED";
      if (match[2] === "reschedule") {
        if (
          !isFree(
            input.professionalId,
            input.startsAt,
            item.durationMinutes,
            item.id,
          )
        )
          return fail(409, "Horário indisponível");
        const professional = professionals.find(
          (p) => p.id === input.professionalId,
        );
        if (!professional) return fail(400, "Profissional inválido");
        item.startsAt = input.startsAt;
        item.endsAt = new Date(
          clinicInstant(input.startsAt).getTime() +
            (item.durationMinutes ?? 30) * 60000,
        ).toISOString();
        item.professional = professional;
      }
      save();
      return respond(item);
    }
    return fail(501, "Operação fora desta simulação local");
  };
  axios.defaults.adapter = adapter;
  api.defaults.adapter = adapter;
}
