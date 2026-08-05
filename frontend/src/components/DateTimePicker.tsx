import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import './DateTimePicker.css';

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseValue(value: string) {
  if (!value) return { date: '', time: '' };
  const [date = '', timePart = ''] = value.split('T');
  return { date, time: timePart.slice(0, 5) };
}

function buildTimeSlots() {
  const slots: string[] = [];
  for (let hour = 7; hour < 20; hour += 1) {
    slots.push(`${pad(hour)}:00`);
    slots.push(`${pad(hour)}:30`);
  }
  return slots;
}

function buildCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function formatDisplay(date: string, time: string) {
  if (!date || !time) return 'Escolha data e horário';
  const [year, month, day] = date.split('-').map(Number);
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date(year, month - 1, day));
  return `${label} · ${time}`;
}

export default function DateTimePicker({ value, onChange, error }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const parsed = parseValue(value);
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [selectedDate, setSelectedDate] = useState(parsed.date);
  const [selectedTime, setSelectedTime] = useState(parsed.time);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    if (parsed.date) {
      const [year, month] = parsed.date.split('-').map(Number);
      return new Date(year, month - 1, 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const timeSlots = useMemo(() => buildTimeSlots(), []);
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const todayKey = toDateKey(new Date());

  useEffect(() => {
    const next = parseValue(value);
    setSelectedDate(next.date);
    setSelectedTime(next.time);
    if (next.date) {
      const [year, month] = next.date.split('-').map(Number);
      setVisibleMonth(new Date(year, month - 1, 1));
    }
  }, [value]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(420, window.innerWidth - 24);
      const left = Math.min(rect.left, window.innerWidth - width - 12);
      const maxHeight = Math.min(360, window.innerHeight - 24);
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUp = spaceBelow < 280 && spaceAbove > spaceBelow;
      const available = openUp ? spaceAbove : spaceBelow;

      setPopoverStyle({
        position: 'fixed',
        left: Math.max(12, left),
        width,
        height: Math.min(maxHeight, Math.max(260, available)),
        top: openUp ? undefined : rect.bottom + 8,
        bottom: openUp ? window.innerHeight - rect.top + 8 : undefined,
        zIndex: 80,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Impede que o scroll da lista de horários role o modal por baixo.
  useEffect(() => {
    if (!open) return;
    const modal = rootRef.current?.closest('.modal') as HTMLElement | null;
    if (!modal) return;
    const previous = modal.style.overflow;
    modal.style.overflow = 'hidden';
    return () => {
      modal.style.overflow = previous;
    };
  }, [open]);

  const commit = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    if (date && time) {
      onChange(`${date}T${time}`);
      setOpen(false);
    }
  };

  return (
    <div className="dtp" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`dtp-trigger ${error ? 'has-error' : ''} ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="dtp-trigger-main">
          <CalendarDays size={18} />
          <span>{formatDisplay(selectedDate, selectedTime)}</span>
        </span>
        <Clock3 size={18} />
      </button>

      {open && (
        <div
          className="dtp-popover"
          style={popoverStyle}
          role="dialog"
          aria-label="Selecionar data e horário"
          onWheel={(event) => event.stopPropagation()}
        >
          <div className="dtp-calendar">
            <div className="dtp-month-nav">
              <button
                type="button"
                className="dtp-icon-btn"
                aria-label="Mês anterior"
                onClick={() =>
                  setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))
                }
              >
                <ChevronLeft size={18} />
              </button>
              <strong>
                {MONTH_LABELS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </strong>
              <button
                type="button"
                className="dtp-icon-btn"
                aria-label="Próximo mês"
                onClick={() =>
                  setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))
                }
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="dtp-weekdays">
              {WEEKDAY_LABELS.map((label, index) => (
                <span key={`${label}-${index}`}>{label}</span>
              ))}
            </div>

            <div className="dtp-days">
              {calendarDays.map((day) => {
                const key = toDateKey(day);
                const inMonth = day.getMonth() === visibleMonth.getMonth();
                const isSelected = key === selectedDate;
                const isToday = key === todayKey;

                return (
                  <button
                    key={`${key}-${day.getMonth()}`}
                    type="button"
                    className={[
                      'dtp-day',
                      inMonth ? '' : 'is-muted',
                      isSelected ? 'is-selected' : '',
                      isToday ? 'is-today' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      if (selectedTime) commit(key, selectedTime);
                      else setSelectedDate(key);
                    }}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="dtp-calendar-actions">
              <button
                type="button"
                className="dtp-link"
                onClick={() => {
                  setSelectedDate('');
                  setSelectedTime('');
                  onChange('');
                }}
              >
                Limpar
              </button>
              <button
                type="button"
                className="dtp-link"
                onClick={() => {
                  const now = new Date();
                  const roundedMinutes = now.getMinutes() < 30 ? 0 : 30;
                  const time = `${pad(Math.max(7, Math.min(19, now.getHours())))}:${pad(roundedMinutes)}`;
                  commit(todayKey, time);
                }}
              >
                Hoje
              </button>
            </div>
          </div>

          <div className="dtp-times">
            <div className="dtp-times-title">
              <Clock3 size={16} />
              Horários
            </div>
            <div className="dtp-times-list">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`dtp-time ${selectedTime === slot ? 'is-selected' : ''}`}
                  onClick={() => {
                    if (selectedDate) commit(selectedDate, slot);
                    else setSelectedTime(slot);
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error ? <small className="dtp-error">{error}</small> : null}
    </div>
  );
}
