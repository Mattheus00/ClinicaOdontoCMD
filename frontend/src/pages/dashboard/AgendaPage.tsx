import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import DateTimePicker from '../../components/DateTimePicker';
import { Modal } from '../../components/Modal';
import AgendaScheduleGrid, { getWeekDays } from '../../components/schedule/AgendaScheduleGrid';
import AgendaMobileList from '../../components/schedule/AgendaMobileList';
import {
  useAppointments,
  useCancelAppointment,
  useConfirmAppointment,
  useCreateAppointment,
  useRescheduleAppointment,
} from '../../features/appointments/api';
import { usePatients } from '../../features/patients/api';
import { useProcedures } from '../../features/procedures/api';
import { useProfessionals } from '../../features/professionals/api';
import { useAuth } from '../../contexts/AuthContext';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { APPOINTMENT_DURATION_OPTIONS, DEFAULT_APPOINTMENT_DURATION, formatAppointmentDuration } from '../../lib/appointment-duration';
import { money } from '../../lib/money';
import './AgendaPage.css';

const schema = z.object({
  patientId: z.string().min(1, 'Selecione um paciente.'),
  professionalId: z.string().min(1, 'Selecione um dentista.'),
  procedureId: z.string().min(1, 'Selecione um procedimento.'),
  startsAt: z.string().min(1, 'Informe data e horário.'),
  durationMinutes: z.coerce.number().min(15, 'Informe a duração.').max(480, 'A duração máxima é de 8 horas.'),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

const today = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftDate = (date: string, days: number) => {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, '0');
  const day = String(next.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatWeekRange = (from: string, to: string, compact = false) => {
  const fromDate = new Date(`${from}T12:00:00`);
  const toDate = new Date(`${to}T12:00:00`);
  if (compact) {
    const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
    return `${formatter.format(fromDate)} — ${formatter.format(toDate)}`;
  }
  const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${formatter.format(fromDate)} — ${formatter.format(toDate)}`;
};

const APPOINTMENT_STATUS: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: 'Agendada', className: 'badge-info' },
  CONFIRMED: { label: 'Confirmada', className: 'badge-success' },
  COMPLETED: { label: 'Realizada', className: 'badge-success' },
  CANCELLED: { label: 'Cancelada', className: 'badge-danger' },
  NO_SHOW: { label: 'Faltou', className: 'badge-warning' },
};

function toDateTimeLocalValue(value: string) {
  const date = new Date(value.includes('T') ? value : `${value}:00`);
  if (Number.isNaN(date.getTime())) {
    const [dayPart, timePart] = value.split('T');
    return `${dayPart}T${(timePart ?? '09:00').slice(0, 5)}`;
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function AgendaPage() {
  const { role, professionalId } = useAuth();
  const isAdmin = role === 'ADMIN' || role === 'SECRETARY';
  const isDentist = role === 'DENTIST';
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [anchorDate, setAnchorDate] = useState(today());
  const [open, setOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');

  const weekDays = useMemo(() => getWeekDays(anchorDate), [anchorDate]);
  const weekFrom = weekDays[0]?.date ?? anchorDate;
  const weekTo = weekDays[6]?.date ?? anchorDate;
  const weekRangeLabel = formatWeekRange(weekFrom, weekTo, isMobile);
  const isCurrentWeek = weekDays.some((day) => day.isToday);

  const effectiveProfessionalId = isDentist ? (professionalId ?? '') : selectedProfessionalId;

  const filters = useMemo(
    () => ({
      from: weekFrom,
      to: weekTo,
      ...(effectiveProfessionalId ? { professionalId: effectiveProfessionalId } : {}),
    }),
    [weekFrom, weekTo, effectiveProfessionalId],
  );

  const appointments = useAppointments(filters);
  const dentists = useProfessionals(isAdmin);
  const procedureList = useProcedures(isAdmin);
  const patients = usePatients('', 0, isAdmin);
  const create = useCreateAppointment(filters);
  const cancel = useCancelAppointment(filters);
  const confirm = useConfirmAppointment(filters);
  const reschedule = useRescheduleAppointment(filters);

  const form = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      durationMinutes: DEFAULT_APPOINTMENT_DURATION,
    },
  });

  const openCreateModal = (defaults?: { startsAt?: string; professionalId?: string }) => {
    form.reset({
      patientId: '',
      professionalId: defaults?.professionalId ?? selectedProfessionalId ?? '',
      procedureId: '',
      startsAt: defaults?.startsAt ? toDateTimeLocalValue(defaults.startsAt) : '',
      durationMinutes: DEFAULT_APPOINTMENT_DURATION,
    });
    setOpen(true);
  };

  const submit = form.handleSubmit(async (data) => {
    await create.mutateAsync(data);
    setOpen(false);
    form.reset();
  });

  const selectedAppointment = appointments.data?.content.find((item) => item.id === selectedAppointmentId);
  const dentistsList = dentists.data?.content ?? [];
  const proceduresList = procedureList.data?.content ?? [];

  const selectedDentist = isDentist
    ? null
    : dentistsList.find((item) => item.id === selectedProfessionalId);

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

      {appointments.isLoading || (isAdmin && (dentists.isLoading || procedureList.isLoading)) ? (
        <LoadingState />
      ) : appointments.isError ? (
        <ErrorState onRetry={() => appointments.refetch()} />
      ) : isAdmin && !dentistsList.length ? (
        <EmptyState
          title="Cadastre um dentista para usar a agenda"
          description="Adicione pelo menos um dentista para começar a agendar consultas."
          action={
            <Link className="btn btn-primary" to="/dentists">
              Ir para dentistas
            </Link>
          }
        />
      ) : isAdmin && !proceduresList.length ? (
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
                  onClick={() => setAnchorDate((current) => shiftDate(current, -7))}
                  aria-label="Semana anterior"
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
                  onClick={() => setAnchorDate((current) => shiftDate(current, 7))}
                  aria-label="Próxima semana"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <span className="agenda-week-range">{weekRangeLabel}</span>
            </div>

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
                      {dentist.specialty ? ` — ${dentist.specialty}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {isMobile ? (
            <AgendaMobileList
              weekDays={weekDays}
              appointments={appointments.data?.content ?? []}
              showProfessionalName={!effectiveProfessionalId}
              onAppointmentSelect={setSelectedAppointmentId}
            />
          ) : (
            <AgendaScheduleGrid
              weekDays={weekDays}
              appointments={appointments.data?.content ?? []}
              defaultProfessionalId={effectiveProfessionalId || undefined}
              showProfessionalName={!effectiveProfessionalId}
              onSlotClick={isAdmin ? (slot) => openCreateModal(slot) : undefined}
              onReschedule={
                isAdmin
                  ? (payload) => {
                      const professional =
                        dentistsList.find((item) => item.id === payload.professionalId) ??
                        appointments.data?.content.find((item) => item.id === payload.id)?.professional;
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
        <Modal title="Detalhes do agendamento" onClose={() => setSelectedAppointmentId(null)}>
          <div className="appointment-detail">
            <p>
              <strong>Paciente:</strong> {selectedAppointment.patient.name}
            </p>
            <p>
              <strong>Dentista:</strong> {selectedAppointment.professional.name}
            </p>
            <p>
              <strong>Horário:</strong>{' '}
              {new Intl.DateTimeFormat('pt-BR', {
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
              }).format(new Date(selectedAppointment.startsAt))}
            </p>
            <p>
              <strong>Duração:</strong>{' '}
              {formatAppointmentDuration(
                selectedAppointment.durationMinutes ??
                  Math.max(
                    15,
                    Math.round(
                      (new Date(selectedAppointment.endsAt).getTime() - new Date(selectedAppointment.startsAt).getTime()) /
                        60000,
                    ),
                  ),
              )}
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <span className={`badge ${APPOINTMENT_STATUS[selectedAppointment.status]?.className ?? 'badge-info'}`}>
                {APPOINTMENT_STATUS[selectedAppointment.status]?.label ?? selectedAppointment.status}
              </span>
            </p>
            {selectedAppointment.procedure ? (
              <p>
                <strong>Procedimento:</strong> {selectedAppointment.procedure.name} ({money(selectedAppointment.procedure.price)})
              </p>
            ) : null}
          </div>
          <div className="modal-actions">
            {selectedAppointment.status !== 'CANCELLED' && selectedAppointment.status !== 'COMPLETED' && (
              <button
                className="btn btn-primary"
                disabled={confirm.isPending || !selectedAppointment.procedure}
                onClick={() => {
                  const label = selectedAppointment.procedure
                    ? `Confirmar atendimento e registrar pagamento de ${money(selectedAppointment.procedure.price)}?`
                    : 'Confirmar atendimento?';
                  if (window.confirm(label)) {
                    confirm.mutate(selectedAppointment.id, {
                      onSuccess: () => setSelectedAppointmentId(null),
                    });
                  }
                }}
              >
                {confirm.isPending ? 'Confirmando...' : 'Confirmar atendimento'}
              </button>
            )}
            {isAdmin && selectedAppointment.status !== 'CANCELLED' && selectedAppointment.status !== 'COMPLETED' && (
              <button
                className="btn btn-danger"
                disabled={cancel.isPending}
                onClick={() => {
                  if (window.confirm('Cancelar este agendamento?')) {
                    cancel.mutate(selectedAppointment.id, {
                      onSuccess: () => setSelectedAppointmentId(null),
                    });
                  }
                }}
              >
                Cancelar agendamento
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => setSelectedAppointmentId(null)}>
              Fechar
            </button>
          </div>
        </Modal>
      )}

      {isAdmin && open && (
        <Modal title="Novo agendamento" onClose={() => setOpen(false)}>
          <form className="form-grid" onSubmit={submit}>
            <label>
              Paciente
              <select {...form.register('patientId')}>
                <option value="">Selecione</option>
                {patients.data?.content.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
              <small>{form.formState.errors.patientId?.message}</small>
            </label>
            <label>
              Dentista
              <select {...form.register('professionalId')}>
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
                  />
                )}
              />
            </label>
            <label>
              Duração
              <select {...form.register('durationMinutes', { valueAsNumber: true })}>
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
              <select {...form.register('procedureId')}>
                <option value="">Selecione</option>
                {proceduresList.map((procedure) => (
                  <option key={procedure.id} value={procedure.id}>
                    {procedure.name} — {money(procedure.price)}
                  </option>
                ))}
              </select>
              <small>{form.formState.errors.procedureId?.message}</small>
            </label>
            {create.isError && <p className="form-error">Não foi possível salvar o agendamento.</p>}
            <div className="modal-actions full-width">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" disabled={create.isPending}>
                {create.isPending ? 'Salvando...' : 'Agendar consulta'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
