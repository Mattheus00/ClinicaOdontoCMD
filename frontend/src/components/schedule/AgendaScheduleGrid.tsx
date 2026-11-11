import { clinicDate, clinicDateTime, clinicTime } from '../../lib/clinic-time';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Appointment } from '../../api/types';
import { layoutConcurrentAppointments } from './schedule-layout';
import './AgendaScheduleGrid.css';
const START_HOUR = 7;
const END_HOUR = 20;
const SLOT_MINUTES = 30;
const ROW_HEIGHT = 52;

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

type Slot = { label: string; value: string };
type WeekDay = { date: string; label: string; dayNumber: number; isToday: boolean };

type Props = {
  weekDays: WeekDay[];
  appointments: Appointment[];
  defaultProfessionalId?: string;
  showProfessionalName?: boolean;
  onReschedule?: (payload: { id: string; startsAt: string; professionalId: string }) => void;
  onSlotClick?: (payload: { startsAt: string; professionalId?: string }) => void;
  onAppointmentSelect?: (appointmentId: string) => void;
  isRescheduling?: boolean;
};

function buildSlots(): Slot[] {
  const slots: Slot[] = [];
  for (let hour = START_HOUR; hour < END_HOUR; hour += 1) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      const label = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push({ label, value: label });
    }
  }
  return slots;
}

const toLocalDateKey = clinicDate;
const wallDate = (value: string) => new Date(clinicDateTime(value));

function slotIndexFromDate(value: Date): number {
  const minutes = value.getHours() * 60 + value.getMinutes();
  const startMinutes = START_HOUR * 60;
  return Math.floor((minutes - startMinutes) / SLOT_MINUTES);
}

function formatTimeRange(startsAt: string, endsAt: string) {
  return `${clinicTime(startsAt)} – ${clinicTime(endsAt)}`;
}

const statusClass: Record<string, string> = {
  PENDING: 'schedule-event-pending',
  CONFIRMED: 'schedule-event-confirmed',
  SCHEDULED: 'schedule-event-scheduled',
  CANCELLED: 'schedule-event-cancelled',
  COMPLETED: 'schedule-event-completed',
};
const statusLabel: Record<string, string> = { PENDING: 'Aguardando aceite', SCHEDULED: 'Agendada', CONFIRMED: 'Confirmada', COMPLETED: 'Realizada', CANCELLED: 'Cancelada', NO_SHOW: 'Faltou' };

export function getWeekDays(anchorDate: string): WeekDay[] {
  const todayKey = toLocalDateKey(new Date());
  const base = new Date(`${anchorDate}T12:00:00`);
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    const date = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`;
    return {
      date,
      label: WEEKDAY_LABELS[index],
      dayNumber: current.getDate(),
      isToday: date === todayKey,
    };
  });
}

export default function AgendaScheduleGrid({
  weekDays,
  appointments,
  defaultProfessionalId,
  showProfessionalName = true,
  onReschedule,
  onSlotClick,
  onAppointmentSelect,
  isRescheduling = false,
}: Props) {
  const slots = useMemo(() => buildSlots(), []);
  const gridRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const canEdit = Boolean(onSlotClick || onReschedule);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const day of weekDays) {
      map.set(day.date, []);
    }
    for (const appointment of appointments) {
      const key = toLocalDateKey(appointment.startsAt);
      const list = map.get(key);
      if (list) list.push(appointment);
    }
    return map;
  }, [appointments, weekDays]);

  const layoutByDay = useMemo(() => {
    const map = new Map<string, Map<string, { columnIndex: number; columnCount: number }>>();
    for (const [day, dayAppointments] of appointmentsByDay) {
      map.set(day, layoutConcurrentAppointments(dayAppointments));
    }
    return map;
  }, [appointmentsByDay]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const todayKey = toLocalDateKey(new Date());
    const todayVisible = weekDays.some((day) => day.date === todayKey);
    let slotIndex = 0;

    if (todayVisible) {
      const now = new Date();
      slotIndex = slotIndexFromDate(now);
    } else {
      const upcoming = appointments
        .filter((item) => !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(item.status))
        .filter((item) => weekDays.some((day) => day.date === toLocalDateKey(item.startsAt)))
        .sort((a, b) => clinicDateTime(a.startsAt).localeCompare(clinicDateTime(b.startsAt)));
      const first = upcoming[0];
      if (first) {
        slotIndex = slotIndexFromDate(wallDate(first.startsAt));
      }
    }

    if (slotIndex < 0) slotIndex = 0;
    const visibleRows = Math.max(1, Math.floor(grid.clientHeight / ROW_HEIGHT) - 1);
    const targetIndex = Math.max(0, slotIndex - Math.floor(visibleRows / 3));
    grid.scrollTop = targetIndex * ROW_HEIGHT;
  }, [weekDays, appointments]);

  const handleDrop = (dayDate: string, slotValue: string) => {
    if (!draggingId || isRescheduling) return;
    const appointment = appointments.find((item) => item.id === draggingId);
    if (!appointment || (appointment.status !== 'SCHEDULED' && appointment.status !== 'CONFIRMED')) {
      return;
    }

    const startsAt = `${dayDate}T${slotValue}:00`;
    const currentStart = wallDate(appointment.startsAt);
    const currentSlot = `${String(currentStart.getHours()).padStart(2, '0')}:${String(currentStart.getMinutes()).padStart(2, '0')}`;
    const currentDay = toLocalDateKey(appointment.startsAt);
    const sameSlot = currentSlot === slotValue && currentDay === dayDate;

    if (!sameSlot && onReschedule) {
      onReschedule({
        id: appointment.id,
        startsAt,
        professionalId: appointment.professional.id,
      });
    }

    setDraggingId(null);
    setDropTarget(null);
  };

  return (
    <div className="schedule-shell" role="region" aria-label="Grade de consultas" tabIndex={0}>
      <div className="schedule-hint">
        {canEdit
          ? 'Abra uma consulta para remarcar pelo teclado ou arraste entre horários. Use Novo agendamento para criar uma consulta.'
          : 'Clique em um agendamento para ver detalhes e confirmar atendimento.'}
      </div>

      <div
        ref={gridRef}
        className="schedule-grid"
        style={{ '--schedule-cols': weekDays.length } as React.CSSProperties}
      >
        <div className="schedule-corner" />
        {weekDays.map((day) => (
          <div key={day.date} className={`schedule-header ${day.isToday ? 'is-today' : ''}`}>
            <strong>{day.label}</strong>
            <span className="schedule-day-number">{day.dayNumber}</span>
          </div>
        ))}

        <div className="schedule-time-column">
          {slots.map((slot) => (
            <div key={slot.value} className="schedule-time-label" style={{ height: ROW_HEIGHT }}>
              {slot.label}
            </div>
          ))}
        </div>

        {weekDays.map((day) => {
          const columnAppointments = appointmentsByDay.get(day.date) ?? [];
          const dayLayout = layoutByDay.get(day.date) ?? new Map();

          return (
            <div
              key={day.date}
              className={`schedule-column ${day.isToday ? 'is-today' : ''}`}
              style={{ height: slots.length * ROW_HEIGHT }}
            >
              {slots.map((slot) => {
                const targetKey = `${day.date}-${slot.value}`;
                return (
                  <button
                    key={targetKey}
                    type="button"
                    disabled={!onSlotClick}
                    tabIndex={-1}
                    className={`schedule-slot ${dropTarget === targetKey ? 'is-drop-target' : ''}`}
                    style={{ height: ROW_HEIGHT }}
                    onClick={() =>
                      onSlotClick?.({
                        startsAt: `${day.date}T${slot.value}:00`,
                        professionalId: defaultProfessionalId,
                      })
                    }
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (draggingId) setDropTarget(targetKey);
                    }}
                    onDragLeave={() => {
                      if (dropTarget === targetKey) setDropTarget(null);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDrop(day.date, slot.value);
                    }}
                    aria-label={`Horário ${slot.label} em ${day.label}`}
                  />
                );
              })}

              {columnAppointments.map((appointment) => {
                const start = wallDate(appointment.startsAt);
                const index = slotIndexFromDate(start);
                if (index < 0 || index >= slots.length) return null;

                const durationSlots = Math.max(
                  1,
                  Math.round(
                    (wallDate(appointment.endsAt).getTime() - start.getTime()) / (SLOT_MINUTES * 60 * 1000),
                  ),
                );

                const draggable =
                  canEdit &&
                  !isRescheduling &&
                  (appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED');
                const layout = dayLayout.get(appointment.id) ?? { columnIndex: 0, columnCount: 1 };
                const gap = 2;
                const horizontalPadding = 6;
                const widthExpression = `calc((100% - ${horizontalPadding * 2}px - ${(layout.columnCount - 1) * gap}px) / ${layout.columnCount})`;
                const leftExpression = `calc(${horizontalPadding}px + ${layout.columnIndex} * (${widthExpression} + ${gap}px))`;

                return (
                  <button
                    type="button"
                    key={appointment.id}
                    aria-label={`${appointment.patient.name}, ${formatTimeRange(appointment.startsAt, appointment.endsAt)}, ${appointment.procedure?.name ?? 'Consulta'}. Abrir detalhes`}
                    className={`schedule-event ${statusClass[appointment.status] ?? 'schedule-event-scheduled'} ${draggingId === appointment.id ? 'is-dragging' : ''}`}
                    style={{
                      top: index * ROW_HEIGHT + 3,
                      height: durationSlots * ROW_HEIGHT - 6,
                      left: leftExpression,
                      width: widthExpression,
                    }}
                    draggable={draggable}
                    onDragStart={(event) => {
                      if (!draggable) {
                        event.preventDefault();
                        return;
                      }
                      event.dataTransfer.setData('text/appointment-id', appointment.id);
                      event.dataTransfer.effectAllowed = 'move';
                      setDraggingId(appointment.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDropTarget(null);
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onAppointmentSelect?.(appointment.id);
                    }}
                  >
                    <strong>{appointment.patient.name}</strong>
                    <span>{formatTimeRange(appointment.startsAt, appointment.endsAt)}</span>
                    {appointment.procedure ? <span className="schedule-procedure">{appointment.procedure.name}</span> : null}
                    {showProfessionalName ? <em>{appointment.professional.name}</em> : null}
                    <small>{statusLabel[appointment.status] ?? appointment.status}</small>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
