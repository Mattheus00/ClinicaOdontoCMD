import { useDataReadyMetric } from "../../lib/performance";
import {
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  Plus,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  RefreshState,
} from "../../components/AsyncState";
import DateTimePicker from "../../components/DateTimePicker";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Modal } from "../../components/Modal";
import { readApiError } from "../../lib/api-error";
import { notifyClearErrors, notifySuccess } from "../../lib/notify";
import type { Appointment } from "../../api/types";
import AgendaScheduleGrid, {
  getWeekDays,
} from "../../components/schedule/AgendaScheduleGrid";
import AgendaMobileList from "../../components/schedule/AgendaMobileList";
import { AppointmentDetailsModal } from "../../components/schedule/AppointmentDetailsModal";
import {
  useAcceptAppointment,
  useAppointments,
  useAvailability,
  useCancelAppointment,
  useConfirmAppointment,
  useCreateAppointment,
  useRescheduleAppointment,
  useUpdateAppointmentReport,
} from "../../features/appointments/api";
import { PatientPicker } from "../../components/schedule/PatientPicker";
import { useReportDraft } from "../../components/schedule/useReportDraft";
import { useProcedures } from "../../features/procedures/api";
import { useProfessionals } from "../../features/professionals/api";
import { useAuth } from "../../contexts/AuthContext";
import { useMediaQuery } from "../../lib/useMediaQuery";
import {
  APPOINTMENT_DURATION_OPTIONS,
  DEFAULT_APPOINTMENT_DURATION,
} from "../../lib/appointment-duration";
import { money } from "../../lib/money";
import {
  buildAppointmentConfirmationMessage,
  buildAppointmentRescheduleMessage,
  buildWhatsAppUrl,
} from "../../lib/whatsapp";
import {
  clinicDate,
  clinicDateTime,
  clinicTime,
  clinicDateLabel,
} from "../../lib/clinic-time";
import { PageHeader } from "../../components/panel/PageHeader";
import "./AgendaPage.css";

const schema = z.object({
  patientId: z.string().min(1, "Selecione um paciente."),
  professionalId: z.string().min(1, "Selecione um dentista."),
  procedureId: z.string().min(1, "Selecione um procedimento."),
  startsAt: z.string().min(1, "Informe data e horário."),
  durationMinutes: z.coerce
    .number()
    .min(15, "Informe a duração.")
    .max(480, "A duração máxima é de 8 horas."),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

const today = () => clinicDate();

const shiftDate = (date: string, days: number) => {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatWeekRange = (from: string, to: string, compact = false) => {
  const fromDate = new Date(`${from}T12:00:00`);
  const toDate = new Date(`${to}T12:00:00`);
  if (compact) {
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    });
    return `${formatter.format(fromDate)} — ${formatter.format(toDate)}`;
  }
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${formatter.format(fromDate)} — ${formatter.format(toDate)}`;
};

const toDateTimeLocalValue = clinicDateTime;

function occupiedTimesForProfessional(
  list: Appointment[],
  professionalId: string,
  date: string,
  excludeId?: string,
): string[] {
  return list
    .filter(
      (item) =>
        item.status !== "CANCELLED" &&
        item.professional.id === professionalId &&
        clinicDate(item.startsAt) === date &&
        item.id !== excludeId,
    )
    .map((item) => clinicTime(item.startsAt));
}

type AgendaConfirm =
  | { kind: "accept" }
  | { kind: "cancel" }
  | { kind: "confirm" }
  | { kind: "confirmEarly" };
const STATUS_OPTIONS = [
  ["", "Todas as situações"],
  ["PENDING", "Aguardando aceite"],
  ["SCHEDULED", "Agendada"],
  ["CONFIRMED", "Confirmada"],
  ["COMPLETED", "Realizada"],
  ["CANCELLED", "Cancelada"],
  ["NO_SHOW", "Faltou"],
];
type AgendaPreferences = {
  date: string;
  professional: string;
  status: string;
  period: "day" | "week";
  view: "list" | "grid";
};
function readPreferences(key: string): AgendaPreferences {
  const defaults: AgendaPreferences = {
    date: today(),
    professional: "",
    status: "",
    period: "day",
    view: "list",
  };
  try {
    const data = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      date:
        typeof data.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(data.date) &&
        !Number.isNaN(Date.parse(data.date))
          ? data.date
          : defaults.date,
      professional:
        typeof data.professional === "string" ? data.professional : "",
      status: STATUS_OPTIONS.some(([value]) => value === data.status)
        ? data.status
        : "",
      period: data.period === "week" ? "week" : "day",
      view: data.view === "grid" ? "grid" : "list",
    };
  } catch {
    return defaults;
  }
}
export default function AgendaPage() {
  const { clinicId, userId } = useAuth();
  return <AgendaWorkspace key={`${clinicId}:${userId}`} />;
}
function AgendaWorkspace() {
  const { role, professionalId, userId, clinicId } = useAuth();
  const preferenceKey = `agenda-preferences:v1:${clinicId}:${userId}`;
  const [saved] = useState(() => readPreferences(preferenceKey));
  const [period, setPeriod] = useState(saved.period);
  const [view, setView] = useState(saved.view);
  const [statusFilter, setStatusFilter] = useState(saved.status);
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = role === "ADMIN" || role === "SECRETARY";
  const isDentist = role === "DENTIST";
  const isMobile = useMediaQuery("(max-width: 800px)");

  const deepLinkAppointmentId = searchParams.get("appointmentId");
  const deepLinkDate = searchParams.get("date");

  const [anchorDate, setAnchorDate] = useState(
    deepLinkDate && /^\d{4}-\d{2}-\d{2}$/.test(deepLinkDate)
      ? deepLinkDate
      : saved.date,
  );
  const [open, setOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(deepLinkAppointmentId);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(
    deepLinkAppointmentId ? "" : saved.professional,
  );
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleProfessional, setRescheduleProfessional] = useState("");
  const [rescheduleWhatsAppPrompt, setRescheduleWhatsAppPrompt] = useState<{
    patientName: string;
    url: string;
  } | null>(null);
  const [createError, setCreateError] = useState("");
  const [rescheduleFormError, setRescheduleFormError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<AgendaConfirm | null>(null);

  useEffect(() => {
    if (!deepLinkAppointmentId && !deepLinkDate) return;
    if (deepLinkDate && /^\d{4}-\d{2}-\d{2}$/.test(deepLinkDate)) {
      setAnchorDate(deepLinkDate);
    }
    if (deepLinkAppointmentId) {
      setSelectedAppointmentId(deepLinkAppointmentId);
      setSelectedProfessionalId("");
      setStatusFilter("");
    }
    setSearchParams({}, { replace: true });
  }, [deepLinkAppointmentId, deepLinkDate, setSearchParams]);

  useEffect(() => {
    try {
      localStorage.setItem(
        preferenceKey,
        JSON.stringify({
          date: anchorDate,
          professional: selectedProfessionalId,
          status: statusFilter,
          period,
          view,
        }),
      );
    } catch {
      /* Optional preference storage. */
    }
  }, [
    preferenceKey,
    anchorDate,
    selectedProfessionalId,
    statusFilter,
    period,
    view,
  ]);
  const weekDays = useMemo(
    () =>
      getWeekDays(anchorDate).filter(
        (day) => period === "week" || day.date === anchorDate,
      ),
    [anchorDate, period],
  );
  const weekFrom = weekDays[0]?.date ?? anchorDate;
  const weekTo = weekDays[weekDays.length - 1]?.date ?? anchorDate;
  const weekRangeLabel =
    period === "day"
      ? clinicDateLabel(anchorDate)
      : formatWeekRange(weekFrom, weekTo, isMobile);
  const isCurrentWeek = weekDays.some((day) => day.isToday);

  const effectiveProfessionalId = isDentist
    ? (professionalId ?? "")
    : selectedProfessionalId;

  const filters = useMemo(
    () => ({
      from: weekFrom,
      to: weekTo,
      ...(effectiveProfessionalId
        ? { professionalId: effectiveProfessionalId }
        : {}),
    }),
    [weekFrom, weekTo, effectiveProfessionalId],
  );

  const appointments = useAppointments(filters);
  useDataReadyMetric("AgendaPage", Boolean(appointments.data));
  const dentists = useProfessionals(isAdmin);
  const dentistsList = dentists.data?.content ?? [];
  const procedureList = useProcedures(isAdmin && open);
  const create = useCreateAppointment(filters);
  const cancel = useCancelAppointment(filters);
  const accept = useAcceptAppointment(filters);
  const confirm = useConfirmAppointment(filters);
  const updateReport = useUpdateAppointmentReport(filters);
  const reschedule = useRescheduleAppointment(filters);

  const form = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      durationMinutes: DEFAULT_APPOINTMENT_DURATION,
    },
  });

  const watchProfessionalId = form.watch("professionalId");
  const watchStartsAt = form.watch("startsAt");
  const minDateTime = clinicDateTime(new Date());
  const allAppointments = appointments.data?.content ?? [];

  const createDay = watchStartsAt ? clinicDate(watchStartsAt) : "";
  const rescheduleDay = rescheduleStart ? clinicDate(rescheduleStart) : "";
  const createAvailability = useAvailability(
    watchProfessionalId || undefined,
    createDay || undefined,
    open && Boolean(watchProfessionalId && createDay),
  );
  const rescheduleAvailability = useAvailability(
    rescheduleProfessional || undefined,
    rescheduleDay || undefined,
    rescheduleOpen && Boolean(rescheduleProfessional && rescheduleDay),
  );

  const createOccupiedTimes = useMemo(
    () =>
      occupiedTimesForProfessional(
        allAppointments,
        watchProfessionalId ?? "",
        createDay,
      ),
    [allAppointments, watchProfessionalId, createDay],
  );

  const rescheduleOccupiedTimes = useMemo(
    () =>
      occupiedTimesForProfessional(
        allAppointments,
        rescheduleProfessional,
        rescheduleDay,
        selectedAppointmentId ?? undefined,
      ),
    [allAppointments, rescheduleProfessional, rescheduleDay, selectedAppointmentId],
  );

  const openCreateModal = (defaults?: {
    startsAt?: string;
    professionalId?: string;
  }) => {
    setCreateError("");
    form.reset({
      patientId: "",
      professionalId: defaults?.professionalId ?? selectedProfessionalId ?? "",
      procedureId: "",
      startsAt: defaults?.startsAt
        ? toDateTimeLocalValue(defaults.startsAt)
        : "",
      durationMinutes: DEFAULT_APPOINTMENT_DURATION,
    });
    setOpen(true);
  };

  const submit = form.handleSubmit(async (data) => {
    setCreateError("");
    try {
      await create.mutateAsync(data);
      notifyClearErrors();
      notifySuccess("Consulta agendada");
      setOpen(false);
      form.reset();
    } catch (error) {
      setCreateError(
        readApiError(error, "Não foi possível salvar o agendamento."),
      );
    }
  });

  const visibleAppointments = (appointments.data?.content ?? []).filter(
    (item) => !statusFilter || item.status === statusFilter,
  );
  const firstAppointment = visibleAppointments
    .filter(
      (item) => !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(item.status),
    )
    .sort((a, b) => clinicDateTime(a.startsAt).localeCompare(clinicDateTime(b.startsAt)))[0];
  const selectedAppointment = appointments.data?.content.find(
    (item) => item.id === selectedAppointmentId,
  );

  const rescheduleDirty = useMemo(() => {
    if (!selectedAppointment) return false;
    return (
      rescheduleStart !== toDateTimeLocalValue(selectedAppointment.startsAt) ||
      rescheduleProfessional !== selectedAppointment.professional.id
    );
  }, [rescheduleStart, rescheduleProfessional, selectedAppointment]);

  const [reportDraft, setReportDraft] = useReportDraft(
    selectedAppointment,
    userId,
  );
  const proceduresList = procedureList.data?.content ?? [];

  const canEditReport =
    Boolean(selectedAppointment) &&
    selectedAppointment?.status !== "CANCELLED" &&
    (isAdmin ||
      (isDentist && selectedAppointment?.professional.id === professionalId));

  const selectedDentist = isDentist
    ? null
    : dentistsList.find((item) => item.id === selectedProfessionalId);

  const whatsappConfirmUrl = useMemo(() => {
    if (!selectedAppointment) return null;
    if (
      selectedAppointment.status !== "SCHEDULED" &&
      selectedAppointment.status !== "CONFIRMED"
    ) {
      return null;
    }
    const message = buildAppointmentConfirmationMessage({
      patientName: selectedAppointment.patient.name,
      startsAt: selectedAppointment.startsAt,
      professionalName: selectedAppointment.professional.name,
      procedureName: selectedAppointment.procedure?.name,
    });
    return buildWhatsAppUrl(selectedAppointment.patient.phone, message);
  }, [selectedAppointment]);

  return (
    <div className="agenda-page">
      <RefreshState
        fetching={appointments.isRefetching}
        error={appointments.isError && Boolean(appointments.data)}
        onRetry={() => appointments.refetch()}
      />
      <PageHeader
        title="Agenda"
        description={weekRangeLabel}
        actions={
          isAdmin ? (
            <button
              className="btn btn-primary"
              disabled={!dentistsList.length}
              onClick={() => openCreateModal()}
            >
              <Plus size={18} /> Novo
            </button>
          ) : null
        }
      />

      {appointments.isLoading ? (
        <LoadingState />
      ) : appointments.isError && !appointments.data ? (
        <ErrorState onRetry={() => appointments.refetch()} />
      ) : isAdmin && dentists.isSuccess && !dentistsList.length ? (
        <EmptyState
          title="Cadastre um dentista para usar a agenda"
          description="Adicione pelo menos um dentista para começar a agendar consultas."
          action={
            <Link className="btn btn-primary" to="/dentists">
              Ir para dentistas
            </Link>
          }
        />
      ) : isAdmin && procedureList.isSuccess && !proceduresList.length ? (
        <EmptyState
          title="Cadastre procedimentos para usar a agenda"
          description="Adicione pelo menos um procedimento antes de criar agendamentos."
          action={
            <Link className="btn btn-primary" to="/procedures">
              Ir para procedimentos
            </Link>
          }
        />
      ) : (
        <div className="agenda-body">
          <section className="agenda-overview" aria-label="Resumo do período">
            <div className="agenda-stat">
              <span>Consultas</span>
              <strong>{visibleAppointments.length}</strong>
            </div>
            <div className="agenda-stat">
              <span>Aguardando</span>
              <strong>
                {visibleAppointments.filter((item) => item.status === "PENDING").length}
              </strong>
            </div>
            <div className="agenda-stat agenda-stat-wide">
              <span>Próxima</span>
              <strong>
                {firstAppointment
                  ? `${clinicTime(firstAppointment.startsAt)} · ${firstAppointment.patient.name}`
                  : "—"}
              </strong>
            </div>
          </section>
          <div className="agenda-main">
          <details className="agenda-filter-details" open={!isMobile}>
            <summary>
              Alterar data e filtros{" "}
              <span>
                {period === "day" ? "Dia" : "Semana"} ·{" "}
                {statusFilter
                  ? STATUS_OPTIONS.find(([value]) => value === statusFilter)?.[1]
                  : "Todas as situações"}
              </span>
            </summary>
            <div className="agenda-toolbar">
              <div className="agenda-toolbar-group agenda-toolbar-nav">
                <div className="agenda-week-controls">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm agenda-nav-btn"
                    onClick={() =>
                      setAnchorDate((current) =>
                        shiftDate(current, period === "day" ? -1 : -7),
                      )
                    }
                    aria-label={period === "day" ? "Dia anterior" : "Semana anterior"}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={isCurrentWeek}
                    onClick={() => setAnchorDate(today())}
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm agenda-nav-btn"
                    onClick={() =>
                      setAnchorDate((current) =>
                        shiftDate(current, period === "day" ? 1 : 7),
                      )
                    }
                    aria-label={period === "day" ? "Próximo dia" : "Próxima semana"}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <label className="agenda-filter">
                  <span>Data</span>
                  <input
                    className="input-field compact-field"
                    type="date"
                    aria-label="Data da agenda"
                    value={anchorDate}
                    onChange={(event) => {
                      if (event.target.value) setAnchorDate(event.target.value);
                    }}
                  />
                </label>
              </div>

              <div
                className="agenda-toolbar-group agenda-toolbar-period agenda-segment"
                role="group"
                aria-label="Período"
              >
                <button type="button" aria-pressed={period === "day"} onClick={() => setPeriod("day")}>
                  Dia
                </button>
                <button type="button" aria-pressed={period === "week"} onClick={() => setPeriod("week")}>
                  Semana
                </button>
              </div>

              <div className="agenda-toolbar-group agenda-toolbar-filters">
                {isAdmin && (
                  <label className="agenda-filter">
                    <span>Dentista</span>
                    <select
                      className="input-field compact-field"
                      value={selectedProfessionalId}
                      onChange={(event) => setSelectedProfessionalId(event.target.value)}
                      aria-label="Filtrar agenda por dentista"
                    >
                      <option value="">Todos os dentistas</option>
                      {dentistsList.map((dentist) => (
                        <option key={dentist.id} value={dentist.id}>
                          {dentist.name}
                          {dentist.specialty ? ` — ${dentist.specialty}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="agenda-filter">
                  <span>Situação</span>
                  <select
                    className="input-field compact-field"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    aria-label="Filtrar por situação"
                  >
                    {STATUS_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </details>
          <div className="agenda-results-bar">
            <p aria-live="polite">
              {visibleAppointments.length}{" "}
              {visibleAppointments.length === 1 ? "consulta" : "consultas"} ·{" "}
              {selectedDentist?.name ??
                (isDentist ? "Sua agenda" : "Todos os dentistas")}{" "}
              · {STATUS_OPTIONS.find(([value]) => value === statusFilter)?.[1]}
            </p>
            {!isMobile && (
              <div
                className="agenda-segment"
                role="group"
                aria-label="Visualização"
              >
                <button
                  type="button"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <List size={16} /> Lista
                </button>
                <button
                  type="button"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                >
                  <LayoutGrid size={16} /> Grade
                </button>
              </div>
            )}
          </div>
          {isMobile || view === "list" ? (
            <AgendaMobileList
              weekDays={weekDays}
              appointments={visibleAppointments}
              showProfessionalName={!effectiveProfessionalId}
              onAppointmentSelect={setSelectedAppointmentId}
            />
          ) : (
            <AgendaScheduleGrid
              weekDays={weekDays}
              appointments={visibleAppointments}
              defaultProfessionalId={effectiveProfessionalId || undefined}
              showProfessionalName={!effectiveProfessionalId}
              onSlotClick={
                isAdmin ? (slot) => openCreateModal(slot) : undefined
              }
              onReschedule={
                isAdmin
                  ? (payload) => {
                      const current = appointments.data?.content.find(
                        (item) => item.id === payload.id,
                      );
                      const professional =
                        dentistsList.find(
                          (item) => item.id === payload.professionalId,
                        ) ?? current?.professional;
                      if (!professional || !current) return;
                      const previousStartsAt = current.startsAt;
                      reschedule.mutate(
                        { ...payload, professional },
                        {
                          onSuccess: (updated) => {
                            notifySuccess("Consulta remarcada.");
                            const message = buildAppointmentRescheduleMessage({
                              patientName: updated.patient.name,
                              previousStartsAt,
                              startsAt: updated.startsAt,
                              professionalName: updated.professional.name,
                              procedureName: updated.procedure?.name,
                            });
                            const url = buildWhatsAppUrl(
                              updated.patient.phone,
                              message,
                            );
                            if (url) {
                              setRescheduleWhatsAppPrompt({
                                patientName: updated.patient.name,
                                url,
                              });
                            } else {
                              window.dispatchEvent(
                                new CustomEvent("app:toast", {
                                  detail: {
                                    message:
                                      "Cadastre o WhatsApp do paciente para avisar sobre a remarcação.",
                                  },
                                }),
                              );
                            }
                          },
                        },
                      );
                    }
                  : undefined
              }
              onAppointmentSelect={setSelectedAppointmentId}
              isRescheduling={reschedule.isPending}
            />
          )}
          </div>
        </div>
      )}

      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          report={reportDraft}
          onReportChange={setReportDraft}
          canEditReport={canEditReport}
          isAdmin={isAdmin}
          whatsappUrl={whatsappConfirmUrl}
          busy={{
            accept: accept.isPending,
            confirm: confirm.isPending,
            save: updateReport.isPending,
            cancel: cancel.isPending,
          }}
          onClose={() => setSelectedAppointmentId(null)}
          onReschedule={
            isAdmin &&
            ["SCHEDULED", "CONFIRMED"].includes(selectedAppointment.status)
              ? () => {
                  setRescheduleFormError("");
                  setRescheduleStart(
                    toDateTimeLocalValue(selectedAppointment.startsAt),
                  );
                  setRescheduleProfessional(
                    selectedAppointment.professional.id,
                  );
                  setRescheduleOpen(true);
                }
              : undefined
          }
          onAccept={() => setConfirmDialog({ kind: "accept" })}
          onConfirm={() => {
            const startsInFuture =
              new Date(selectedAppointment.startsAt).getTime() > Date.now();
            setConfirmDialog({
              kind: startsInFuture ? "confirmEarly" : "confirm",
            });
          }}
          onSaveReport={async () => {
            const updated = await updateReport.mutateAsync({
              id: selectedAppointment.id,
              report: reportDraft,
            });
            setReportDraft(updated.report ?? "");
            window.dispatchEvent(
              new CustomEvent("app:toast", {
                detail: { message: "Relatório salvo.", tone: "success" },
              }),
            );
          }}
          onCancel={() => setConfirmDialog({ kind: "cancel" })}
        />
      )}

      {confirmDialog && selectedAppointment && (
        <ConfirmDialog
          title={
            confirmDialog.kind === "accept"
              ? "Aceitar agendamento?"
              : confirmDialog.kind === "cancel"
                ? selectedAppointment.status === "PENDING"
                  ? "Recusar solicitação?"
                  : "Cancelar agendamento?"
                : confirmDialog.kind === "confirmEarly"
                  ? "Horário ainda não chegou"
                  : "Concluir atendimento?"
          }
          message={
            confirmDialog.kind === "accept"
              ? "Aceitar esta solicitação e confirmar o horário na agenda?"
              : confirmDialog.kind === "cancel"
                ? selectedAppointment.status === "PENDING"
                  ? "Recusar esta solicitação de agendamento?"
                  : "Cancelar este agendamento?"
                : confirmDialog.kind === "confirmEarly"
                  ? "O horário ainda não chegou. Concluir mesmo assim?"
                  : "Concluir o atendimento e salvar o relatório? Nenhum recebimento será registrado automaticamente."
          }
          confirmLabel={
            confirmDialog.kind === "accept"
              ? "Aceitar"
              : confirmDialog.kind === "cancel"
                ? selectedAppointment.status === "PENDING"
                  ? "Recusar"
                  : "Cancelar agendamento"
                : "Concluir"
          }
          danger={confirmDialog.kind === "cancel"}
          busy={accept.isPending || cancel.isPending || confirm.isPending}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={() => {
            if (confirmDialog.kind === "confirmEarly") {
              setConfirmDialog({ kind: "confirm" });
              return;
            }
            if (confirmDialog.kind === "accept") {
              accept.mutate(selectedAppointment.id, {
                onSuccess: () => {
                  notifySuccess(
                    "Agendamento aceito. Envie a confirmação pelo WhatsApp.",
                  );
                  setConfirmDialog(null);
                },
              });
              return;
            }
            if (confirmDialog.kind === "cancel") {
              cancel.mutate(selectedAppointment.id, {
                onSuccess: () => {
                  notifySuccess(
                    selectedAppointment.status === "PENDING"
                      ? "Solicitação recusada."
                      : "Agendamento cancelado.",
                  );
                  setSelectedAppointmentId(null);
                  setConfirmDialog(null);
                },
              });
              return;
            }
            confirm.mutate(
              { id: selectedAppointment.id, report: reportDraft },
              {
                onSuccess: () => {
                  notifySuccess("Atendimento concluído.");
                  setSelectedAppointmentId(null);
                  setConfirmDialog(null);
                },
              },
            );
          }}
        />
      )}

      {rescheduleOpen && selectedAppointment && (
        <Modal
          title="Reagendar consulta"
          isDirty={rescheduleDirty}
          onClose={() => {
            setRescheduleOpen(false);
            setRescheduleFormError("");
          }}
        >
          <form
            className="form-grid"
            onSubmit={async (event) => {
              event.preventDefault();
              setRescheduleFormError("");
              try {
                await reschedule.mutateAsync({
                  id: selectedAppointment.id,
                  startsAt: rescheduleStart,
                  professionalId: rescheduleProfessional,
                });
                notifyClearErrors();
                notifySuccess("Consulta remarcada.");
                setRescheduleOpen(false);
                setSelectedAppointmentId(null);
              } catch (error) {
                setRescheduleFormError(
                  readApiError(
                    error,
                    "Não foi possível reagendar. Verifique a disponibilidade e tente novamente.",
                  ),
                );
              }
            }}
          >
            <p className="full-width">{selectedAppointment.patient.name}</p>
            <label className="full-width">
              Nova data e horário
              <DateTimePicker
                value={rescheduleStart}
                onChange={setRescheduleStart}
                min={minDateTime}
                occupiedTimes={rescheduleOccupiedTimes}
                availableTimes={
                  rescheduleAvailability.data?.length
                    ? rescheduleAvailability.data
                    : undefined
                }
              />
            </label>
            <label className="full-width">
              Dentista
              <select
                value={rescheduleProfessional}
                onChange={(event) =>
                  setRescheduleProfessional(event.target.value)
                }
              >
                {dentistsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            {rescheduleFormError && (
              <p role="alert" className="form-error full-width">
                {rescheduleFormError}
              </p>
            )}
            <div className="modal-actions full-width">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRescheduleOpen(false)}
              >
                Voltar
              </button>
              <button
                className="btn btn-primary"
                disabled={reschedule.isPending || !rescheduleStart}
              >
                {reschedule.isPending ? "Reagendando…" : "Salvar novo horário"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {rescheduleWhatsAppPrompt && (
        <Modal
          title="Avisar pelo WhatsApp?"
          onClose={() => setRescheduleWhatsAppPrompt(null)}
        >
          <p>
            A consulta de{" "}
            <strong>
              {rescheduleWhatsAppPrompt.patientName.trim().split(/\s+/)[0]}
            </strong>{" "}
            foi remarcada. Deseja enviar a mensagem pronta pelo WhatsApp?
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRescheduleWhatsAppPrompt(null)}
            >
              Agora não
            </button>
            <a
              className="btn btn-primary"
              href={rescheduleWhatsAppPrompt.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setRescheduleWhatsAppPrompt(null)}
            >
              Enviar WhatsApp
            </a>
          </div>
        </Modal>
      )}

      {isAdmin && open && (
        <Modal
          title="Novo agendamento"
          isDirty={form.formState.isDirty}
          onClose={() => {
            setOpen(false);
            setCreateError("");
          }}
        >
          <form className="form-grid" onSubmit={submit}>
            <div className="full-width">
              <Controller
                name="patientId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <PatientPicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>
            <label>
              Dentista
              <select {...form.register("professionalId")}>
                <option value="">Selecione</option>
                {dentistsList.map((dentist) => (
                  <option key={dentist.id} value={dentist.id}>
                    {dentist.name}
                  </option>
                ))}
              </select>
              <small>{form.formState.errors.professionalId?.message}</small>
            </label>
            <label className="full-width">
              Data e horário
              <Controller
                name="startsAt"
                control={form.control}
                render={({ field }) => (
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    error={form.formState.errors.startsAt?.message}
                    min={minDateTime}
                    occupiedTimes={createOccupiedTimes}
                    availableTimes={
                      createAvailability.data?.length
                        ? createAvailability.data
                        : undefined
                    }
                  />
                )}
              />
            </label>
            <label>
              Duração
              <select
                {...form.register("durationMinutes", { valueAsNumber: true })}
              >
                {APPOINTMENT_DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small>{form.formState.errors.durationMinutes?.message}</small>
            </label>
            <label className="full-width">
              Procedimento
              <select {...form.register("procedureId")}>
                <option value="">Selecione</option>
                {proceduresList.map((procedure) => (
                  <option key={procedure.id} value={procedure.id}>
                    {procedure.name} — {money(procedure.price)}
                  </option>
                ))}
              </select>
              <small>{form.formState.errors.procedureId?.message}</small>
            </label>
            {createError && (
              <p role="alert" className="form-error full-width">
                {createError}
              </p>
            )}
            <div className="modal-actions full-width">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-primary" disabled={create.isPending}>
                {create.isPending ? "Salvando..." : "Agendar consulta"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
