import type { Appointment } from '../../api/types';
import './AgendaMobileList.css';

type WeekDay = { date: string; label: string; dayNumber: number; isToday: boolean };

const STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Aguardando aceite', className: 'badge-warning' },
  SCHEDULED: { label: 'Agendada', className: 'badge-info' },
  CONFIRMED: { label: 'Confirmada', className: 'badge-success' },
  COMPLETED: { label: 'Realizada', className: 'badge-success' },
  CANCELLED: { label: 'Cancelada', className: 'badge-danger' },
  NO_SHOW: { label: 'Faltou', className: 'badge-warning' },
};

function toLocalDateKey(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

type Props = {
  weekDays: WeekDay[];
  appointments: Appointment[];
  showProfessionalName?: boolean;
  onAppointmentSelect: (appointmentId: string) => void;
};

export default function AgendaMobileList({
  weekDays,
  appointments,
  showProfessionalName = false,
  onAppointmentSelect,
}: Props) {
  return (
    <div className="agenda-mobile-list">
      {weekDays.map((day) => {
        const items = appointments
          .filter((item) => toLocalDateKey(item.startsAt) === day.date)
          .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

        return (
          <section key={day.date} className={`agenda-mobile-day ${day.isToday ? 'is-today' : ''}`}>
            <header className="agenda-mobile-day-header">
              <div>
                <strong>{day.label}</strong>
                {day.isToday ? <span className="agenda-mobile-today">Hoje</span> : null}
              </div>
              <span className="agenda-mobile-day-number">{day.dayNumber}</span>
            </header>

            {items.length ? (
              <div className="agenda-mobile-cards">
                {items.map((appointment) => {
                  const status = STATUS[appointment.status] ?? { label: appointment.status, className: 'badge-info' };
                  return (
                    <button
                      key={appointment.id}
                      type="button"
                      className={`agenda-mobile-card status-${appointment.status.toLowerCase()}`}
                      onClick={() => onAppointmentSelect(appointment.id)}
                    >
                      <div className="agenda-mobile-card-time">
                        <strong>{formatTime(appointment.startsAt)}</strong>
                        <span>{formatTime(appointment.endsAt)}</span>
                      </div>
                      <div className="agenda-mobile-card-body">
                        <strong>{appointment.patient.name}</strong>
                        {showProfessionalName ? <span>{appointment.professional.name}</span> : null}
                        {appointment.procedure ? <span>{appointment.procedure.name}</span> : null}
                        <span className={`badge ${status.className}`}>{status.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="agenda-mobile-empty">Sem consultas neste dia.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
