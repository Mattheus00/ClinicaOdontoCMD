import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/AsyncState";
import { Modal } from "../../components/Modal";
import AgendaScheduleGrid, {
  getWeekDays,
} from "../../components/schedule/AgendaScheduleGrid";
import AgendaMobileList from "../../components/schedule/AgendaMobileList";
import {
  useAcceptAppointment,
  useAppointments,
  useCancelAppointment,
  useConfirmAppointment,
  useRescheduleAppointment,
  useUpdateAppointmentReport,
} from "../../features/appointments/api";
import { useProcedures } from "../../features/procedures/api";
import { useProfessionals } from "../../features/professionals/api";
import { useAuth } from "../../contexts/AuthContext";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { formatAppointmentDuration } from "../../lib/appointment-duration";
import { money } from "../../lib/money";
import {
  buildAppointmentConfirmationMessage,
  buildWhatsAppUrl,
} from "../../lib/whatsapp";
import { clinicDate, clinicDateTime, clinicTime } from "../../lib/clinic-time";
import { isUxDemo } from "../../lib/experience";
import "./AgendaPage.css";

const AppointmentCreateForm = lazy(() => import("./AppointmentCreateForm"));

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

const APPOINTMENT_STATUS: Record<string, { label: string; className: string }> =
  {
    PENDING: { label: "Aguardando aceite", className: "badge-warning" },
    SCHEDULED: { label: "Agendada", className: "badge-info" },
    CONFIRMED: { label: "Confirmada (legado)", className: "badge-success" },
    COMPLETED: { label: "Realizada", className: "badge-success" },
    CANCELLED: { label: "Cancelada", className: "badge-danger" },
    NO_SHOW: { label: "Faltou", className: "badge-warning" },
  };

function toDateTimeLocalValue(value: string) {
  return `${clinicDate(value)}T${clinicTime(value)}`;
}

export default function AgendaPage() {
  const { role, professionalId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = role === "ADMIN" || role === "SECRETARY";
  const isDentist = role === "DENTIST";
  const isMobile = useMediaQuery("(max-width: 768px)");

  const deepLinkAppointmentId = searchParams.get("appointmentId");
  const dateParam = searchParams.get("date") ?? "";
  const parsedDate = new Date(`${dateParam}T12:00:00Z`);
  const anchorDate =
    /^\d{4}-\d{2}-\d{2}$/.test(dateParam) &&
    Number.isFinite(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === dateParam
      ? dateParam
      : today();
  // Non-sensitive display filters live in the URL so Back and reload preserve context.
  const updateFilters = (changes: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };
  const setAnchorDate = (value: string | ((current: string) => string)) =>
    updateFilters({
      date: typeof value === "function" ? value(anchorDate) : value,
    });
  const [open, setOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<{
    startsAt?: string;
    professionalId?: string;
  }>({});
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(deepLinkAppointmentId);
  const selectedProfessionalId = searchParams.get("professional") ?? "";
  const [reportDraft, setReportDraft] = useState("");
  const statusParam = searchParams.get("status") ?? "";
  const statusFilter = Object.hasOwn(APPOINTMENT_STATUS, statusParam)
    ? statusParam
    : "";
  const period = searchParams.get("period") === "week" ? "week" : "day";
  const view =
    period === "week" && searchParams.get("view") === "week" ? "week" : "list";
  const [rescheduleTime, setRescheduleTime] = useState("");

  useEffect(() => {
    if (!deepLinkAppointmentId) return;
    setSelectedAppointmentId(deepLinkAppointmentId);
    const next = new URLSearchParams(searchParams);
    next.delete("appointmentId");
    setSearchParams(next, { replace: true });
  }, [deepLinkAppointmentId, searchParams, setSearchParams]);

  const weekDays = useMemo(() => getWeekDays(anchorDate), [anchorDate]);
  const weekFrom = weekDays[0]?.date ?? anchorDate;
  const weekTo = weekDays[6]?.date ?? anchorDate;
  const weekRangeLabel = formatWeekRange(weekFrom, weekTo, isMobile);
  const isCurrentWeek = weekDays.some((day) => day.isToday);

  const effectiveProfessionalId = isDentist
    ? (professionalId ?? "")
    : selectedProfessionalId;

  const filters = useMemo(
    () => ({
      from: period === "day" ? anchorDate : weekFrom,
      to: period === "day" ? anchorDate : weekTo,
      ...(effectiveProfessionalId
        ? { professionalId: effectiveProfessionalId }
        : {}),
    }),
    [period, anchorDate, weekFrom, weekTo, effectiveProfessionalId],
  );

  const appointments = useAppointments(filters);
  const dentists = useProfessionals(isAdmin);
  const procedureList = useProcedures(isAdmin);
  const cancel = useCancelAppointment(filters);
  const accept = useAcceptAppointment(filters);
  const confirm = useConfirmAppointment(filters);
  const updateReport = useUpdateAppointmentReport(filters);
  const reschedule = useRescheduleAppointment(filters);

  const openCreateModal = (defaults?: {
    startsAt?: string;
    professionalId?: string;
  }) => {
    setCreateDefaults({
      professionalId: defaults?.professionalId ?? selectedProfessionalId,
      startsAt: defaults?.startsAt
        ? toDateTimeLocalValue(defaults.startsAt)
        : "",
    });
    setOpen(true);
  };

  const selectedAppointment = appointments.data?.content.find(
    (item) => item.id === selectedAppointmentId,
  );
  const dentistsList = dentists.data?.content ?? [];
  const proceduresList = procedureList.data?.content ?? [];

  useEffect(() => {
    setReportDraft(selectedAppointment?.report ?? "");
    setRescheduleTime(
      selectedAppointment?.startsAt
        ? toDateTimeLocalValue(selectedAppointment.startsAt)
        : "",
    );
  }, [
    selectedAppointment?.id,
    selectedAppointment?.report,
    selectedAppointment?.startsAt,
  ]);

  const canEditReport =
    Boolean(selectedAppointment) &&
    selectedAppointment?.status !== "CANCELLED" &&
    (isAdmin ||
      (isDentist && selectedAppointment?.professional.id === professionalId));
  const reportDirty =
    (selectedAppointment?.report ?? "") !== reportDraft.trim();

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

  const visibleAppointments = (appointments.data?.content ?? []).filter(
    (item) => !statusFilter || item.status === statusFilter,
  );
  const activeFilterCount =
    Number(Boolean(statusFilter)) + Number(isAdmin && Boolean(selectedProfessionalId));
  const dentistFilter = isAdmin && (
    <label className="agenda-filter">
      <span>Dentista</span>
      <select
        className="input-field compact-field"
        value={selectedProfessionalId}
        onChange={(event) =>
          updateFilters({ professional: event.target.value })
        }
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
  );
  const statusFilterField = (
    <label className="agenda-filter">
    <span>Situação</span>
    <select
      className="input-field"
      value={statusFilter}
      onChange={(e) => updateFilters({ status: e.target.value })}
    >
      <option value="">Todas as situações</option>
      {Object.entries(APPOINTMENT_STATUS).map(([key, value]) => (
        <option key={key} value={key}>
          {value.label}
        </option>
      ))}
    </select>
  </label>
  );

  return (
    <div className="agenda-page">
      <div className="page-header">
        <div className="page-header-intro">
          <h1 className="page-title">Agenda</h1>
          {!isMobile && (
            <p className="page-subtitle">
              {isDentist
                ? `Sua agenda — ${weekRangeLabel}.`
                : selectedDentist
                  ? `Agenda de ${selectedDentist.name} — ${weekRangeLabel}.`
                  : `Semana de ${weekRangeLabel}.`}
            </p>
          )}
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => openCreateModal()}>
            Novo agendamento
          </button>
        )}
      </div>

      <p className="agenda-zone">Horários de Brasília · America/Sao_Paulo</p>
      <p className="agenda-rule-note">
        Aceite do pedido e situação do atendimento são etapas diferentes. Esta
        base ainda não registra confirmação de presença ou chegada
        separadamente.
      </p>
      {isAdmin && dentists.isSuccess && !dentistsList.length ? (
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
        <>
          <div className="agenda-toolbar">
            <div className="agenda-toolbar-main">
              <div className="agenda-week-controls">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm agenda-nav-btn"
                  onClick={() =>
                    setAnchorDate((current) =>
                      shiftDate(current, period === "day" ? -1 : -7),
                    )
                  }
                  aria-label={
                    period === "day" ? "Dia anterior" : "Semana anterior"
                  }
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={
                    period === "day" ? anchorDate === today() : isCurrentWeek
                  }
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
                  aria-label={
                    period === "day" ? "Próximo dia" : "Próxima semana"
                  }
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <span className="agenda-week-range" aria-live="polite">
                {weekRangeLabel}
              </span>
              <label className="agenda-date">
                Ir para data
                <input
                  type="date"
                  className="input-field"
                  value={anchorDate}
                  onChange={(e) => {
                    if (e.target.value) setAnchorDate(e.target.value);
                  }}
                />
              </label>
            </div>

            {!isMobile && dentistFilter}
          </div>

          <div className="agenda-view-controls">
            <div
              role="group"
              className="agenda-view-switch"
              aria-label="Período da agenda"
            >
              <span className="agenda-control-label">Período</span>
              <button
                type="button"
                className="btn btn-secondary"
                aria-pressed={period === "day"}
                onClick={() => {
                  updateFilters({ period: "day", view: "list" });
                }}
              >
                Dia
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                aria-pressed={period === "week"}
                onClick={() => updateFilters({ period: "week" })}
              >
                Semana
              </button>
            </div>
            {isMobile ? (
              <details className="agenda-mobile-filters">
                <summary>Filtros ({activeFilterCount})</summary>
                <div>{dentistFilter}{statusFilterField}</div>
              </details>
            ) : statusFilterField}
            {!isMobile ? (
              <div
                className="agenda-view-switch"
                role="group"
                aria-label="Visualização da agenda"
              >
                <span className="agenda-control-label">Visualização</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  aria-pressed={view === "list"}
                  onClick={() => updateFilters({ view: "list" })}
                >
                  Lista
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  aria-pressed={view === "week"}
                  onClick={() => {
                    updateFilters({ view: "week", period: "week" });
                  }}
                >
                  Grade semanal
                </button>
              </div>
            ) : null}
            {appointments.isSuccess && (
              <p role="status">
                {visibleAppointments.length} consulta(s) no período e filtros.
              </p>
            )}
          </div>
          {appointments.isLoading ? (
            <LoadingState />
          ) : appointments.isError ? (
            <ErrorState onRetry={() => appointments.refetch()} />
          ) : isMobile || view === "list" ? (
            <AgendaMobileList
              weekDays={
                period === "day"
                  ? weekDays.filter((day) => day.date === anchorDate)
                  : weekDays
              }
              appointments={visibleAppointments}
              showProfessionalName={!effectiveProfessionalId}
              onAppointmentSelect={setSelectedAppointmentId}
            />
          ) : (
            <AgendaScheduleGrid
              weekDays={
                period === "day"
                  ? weekDays.filter((day) => day.date === anchorDate)
                  : weekDays
              }
              appointments={visibleAppointments}
              defaultProfessionalId={effectiveProfessionalId || undefined}
              showProfessionalName={!effectiveProfessionalId}
              onSlotClick={
                isAdmin ? (slot) => openCreateModal(slot) : undefined
              }
              onReschedule={
                isAdmin
                  ? (payload) => {
                      const professional =
                        dentistsList.find(
                          (item) => item.id === payload.professionalId,
                        ) ??
                        appointments.data?.content.find(
                          (item) => item.id === payload.id,
                        )?.professional;
                      if (!professional) return;
                      reschedule.mutate({ ...payload, professional });
                    }
                  : undefined
              }
              onAppointmentSelect={setSelectedAppointmentId}
              isRescheduling={reschedule.isPending}
            />
          )}
        </>
      )}

      {selectedAppointment && (
        <Modal
          title="Detalhes do agendamento"
          onClose={() => setSelectedAppointmentId(null)}
        >
          <div className="appointment-detail">
            <p>
              <strong>Paciente:</strong> {selectedAppointment.patient.name}
            </p>
            <p>
              <strong>Dentista:</strong> {selectedAppointment.professional.name}
            </p>
            <p>
              <strong>Horário:</strong>{" "}
              {clinicDateTime(selectedAppointment.startsAt)} (Brasília)
            </p>
            <p>
              <strong>Duração:</strong>{" "}
              {formatAppointmentDuration(
                selectedAppointment.durationMinutes ??
                  Math.max(
                    15,
                    Math.round(
                      (new Date(selectedAppointment.endsAt).getTime() -
                        new Date(selectedAppointment.startsAt).getTime()) /
                        60000,
                    ),
                  ),
              )}
            </p>
            <p>
              <strong>Situação do atendimento:</strong>{" "}
              <span
                className={`badge ${APPOINTMENT_STATUS[selectedAppointment.status]?.className ?? "badge-info"}`}
              >
                {APPOINTMENT_STATUS[selectedAppointment.status]?.label ??
                  selectedAppointment.status}
              </span>
            </p>
            {selectedAppointment.procedure ? (
              <p>
                <strong>Procedimento:</strong>{" "}
                {selectedAppointment.procedure.name} (
                {money(selectedAppointment.procedure.price)})
              </p>
            ) : null}
            {selectedAppointment.createdVia === "instagram" ? (
              <p>
                <strong>Origem:</strong> Instagram / link público
              </p>
            ) : null}
            {!isUxDemo && whatsappConfirmUrl ? (
              <p className="appointment-whatsapp-hint">
                Envie a confirmação pelo WhatsApp para o paciente ficar ciente
                do horário.
              </p>
            ) : null}
            {isAdmin &&
            selectedAppointment.status !== "CANCELLED" &&
            selectedAppointment.status !== "COMPLETED" ? (
              <div className="appointment-reschedule">
                <label>
                  Remarcar para (horário de Brasília)
                  <input
                    type="datetime-local"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={!rescheduleTime || reschedule.isPending}
                  onClick={() =>
                    reschedule.mutate({
                      id: selectedAppointment.id,
                      startsAt: rescheduleTime,
                      professionalId: selectedAppointment.professional.id,
                      professional: selectedAppointment.professional,
                    })
                  }
                >
                  {reschedule.isPending ? "Remarcando..." : "Remarcar consulta"}
                </button>
              </div>
            ) : null}
            {!isUxDemo ? (
              <label className="appointment-report-field">
                Relatório da consulta
                <textarea
                  rows={4}
                  value={reportDraft}
                  onChange={(e) => setReportDraft(e.target.value)}
                  disabled={
                    !canEditReport ||
                    confirm.isPending ||
                    updateReport.isPending
                  }
                  placeholder="Descreva o que foi feito nesta consulta (procedimentos, observações, orientações). Fica no histórico do paciente para outros dentistas."
                />
                <small>
                  Esse relatório aparece no histórico do paciente e ajuda outro
                  dentista a saber o que já foi feito.
                </small>
              </label>
            ) : (
              <p>
                Simulação operacional: sem prontuário, cobrança ou envio de
                mensagens.
              </p>
            )}
          </div>
          <div className="modal-actions">
            {isAdmin && selectedAppointment.status === "PENDING" && (
              <button
                className="btn btn-primary"
                disabled={accept.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      "Aceitar esta solicitação e confirmar o horário na agenda?",
                    )
                  ) {
                    accept.mutate(selectedAppointment.id, {
                      onSuccess: () => {
                        window.dispatchEvent(
                          new CustomEvent("app:toast", {
                            detail: {
                              message:
                                "Solicitação aceita na agenda. Aceite não registra presença.",
                            },
                          }),
                        );
                      },
                    });
                  }
                }}
              >
                {accept.isPending ? "Aceitando..." : "Aceitar agendamento"}
              </button>
            )}
            {!isUxDemo && whatsappConfirmUrl ? (
              <a
                className="btn btn-whatsapp"
                href={whatsappConfirmUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={16} strokeWidth={2} />
                Confirmar no WhatsApp
              </a>
            ) : null}
            {!isUxDemo &&
              selectedAppointment.status !== "CANCELLED" &&
              selectedAppointment.status !== "COMPLETED" &&
              selectedAppointment.status !== "PENDING" && (
                <button
                  className="btn btn-primary"
                  disabled={
                    confirm.isPending ||
                    !selectedAppointment.procedure ||
                    !canEditReport
                  }
                  onClick={() => {
                    const label = selectedAppointment.procedure
                      ? `Confirmar atendimento e registrar pagamento de ${money(selectedAppointment.procedure.price)}?`
                      : "Confirmar atendimento?";
                    if (window.confirm(label)) {
                      confirm.mutate(
                        { id: selectedAppointment.id, report: reportDraft },
                        {
                          onSuccess: () => setSelectedAppointmentId(null),
                        },
                      );
                    }
                  }}
                >
                  {confirm.isPending
                    ? "Confirmando..."
                    : "Concluir atendimento (fluxo legado)"}
                </button>
              )}
            {!isUxDemo &&
              selectedAppointment.status === "COMPLETED" &&
              canEditReport && (
                <button
                  className="btn btn-primary"
                  disabled={updateReport.isPending || !reportDirty}
                  onClick={() => {
                    updateReport.mutate(
                      { id: selectedAppointment.id, report: reportDraft },
                      {
                        onSuccess: () => setSelectedAppointmentId(null),
                      },
                    );
                  }}
                >
                  {updateReport.isPending ? "Salvando..." : "Salvar relatório"}
                </button>
              )}
            {isAdmin &&
              selectedAppointment.status !== "CANCELLED" &&
              selectedAppointment.status !== "COMPLETED" && (
                <button
                  className="btn btn-danger"
                  disabled={cancel.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        selectedAppointment.status === "PENDING"
                          ? "Recusar esta solicitação de agendamento?"
                          : "Cancelar este agendamento?",
                      )
                    ) {
                      cancel.mutate(selectedAppointment.id, {
                        onSuccess: () => setSelectedAppointmentId(null),
                      });
                    }
                  }}
                >
                  {selectedAppointment.status === "PENDING"
                    ? "Recusar solicitação"
                    : "Cancelar agendamento"}
                </button>
              )}
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedAppointmentId(null)}
            >
              Fechar
            </button>
          </div>
        </Modal>
      )}

      {isAdmin && open && (
        <Modal title="Novo agendamento" onClose={() => setOpen(false)}>
          <Suspense fallback={<LoadingState />}>
            <AppointmentCreateForm
              filters={filters}
              dentistsList={dentistsList}
              proceduresList={proceduresList}
              defaults={createDefaults}
              onClose={() => setOpen(false)}
            />
          </Suspense>
        </Modal>
      )}
    </div>
  );
}
