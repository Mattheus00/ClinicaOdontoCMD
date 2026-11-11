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
  /** `datetime` = data + horário (padrão). `date` = só o dia (YYYY-MM-DD). */
  mode?: 'datetime' | 'date';
  min?: string;
  max?: string;
  clearable?: boolean;
  /** Times "HH:mm" that cannot be selected (occupied). */
  occupiedTimes?: string[];
  /** If set, only these times are enabled (working hours). */
  availableTimes?: string[];
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseValue(value: string, dateOnly: boolean) {
  if (!value) return { date: '', time: '' };
  if (dateOnly) return { date: value.slice(0, 10), time: '' };
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

function formatDateLabel(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function formatDisplay(date: string, time: string, dateOnly: boolean) {
  if (!date) return dateOnly ? 'Escolha a data' : 'Escolha data e horário';
  if (dateOnly) return formatDateLabel(date);
  if (!time) return 'Escolha data e horário';
  return `${formatDateLabel(date)} · ${time}`;
}

function isOutOfRange(dateKey: string, min?: string, max?: string) {
  if (min && dateKey < min) return true;
  if (max && dateKey > max) return true;
  return false;
}

export default function DateTimePicker({
  value,
  onChange,
  error,
  mode = 'datetime',
  min,
  max,
  clearable = true,
  occupiedTimes = [],
  availableTimes,
}: Props) {
  const dateOnly = mode === 'date';
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const parsed = parseValue(value, dateOnly);
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

  const occupiedSet = useMemo(() => new Set(occupiedTimes), [occupiedTimes]);
  const availableSet = useMemo(
    () => (availableTimes ? new Set(availableTimes) : null),
    [availableTimes],
  );
  const timeSlots = useMemo(() => {
    const base = availableTimes?.length ? availableTimes : buildTimeSlots();
    return base;
  }, [availableTimes]);
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const todayKey = toDateKey(new Date());

  const isTimeDisabled = (slot: string, dateKey: string) => {
    if (occupiedSet.has(slot)) return true;
    if (availableSet && !availableSet.has(slot)) return true;
    if (!min || !dateKey) return false;
    const minDate = min.slice(0, 10);
    const minTime = min.includes('T') ? min.slice(11, 16) : '';
    if (dateKey < minDate) return true;
    if (dateKey === minDate && minTime && slot < minTime) return true;
    return false;
  };

  useEffect(() => {
    const next = parseValue(value, dateOnly);
    setSelectedDate(next.date);
    setSelectedTime(next.time);
    if (next.date) {
      const [year, month] = next.date.split('-').map(Number);
      setVisibleMonth(new Date(year, month - 1, 1));
    }
  }, [value, dateOnly]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(dateOnly ? 320 : 420, window.innerWidth - 24);
      const left = Math.min(rect.left, window.innerWidth - width - 12);
      const maxHeight = Math.min(dateOnly ? 340 : 360, window.innerHeight - 24);
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUp = spaceBelow < 280 && spaceAbove > spaceBelow;
      const available = openUp ? spaceAbove : spaceBelow;

      setPopoverStyle({
        position: 'fixed',
        left: Math.max(12, left),
        width,
        height: dateOnly ? undefined : Math.min(maxHeight, Math.max(260, available)),
        maxHeight: Math.min(maxHeight, Math.max(260, available)),
        top: openUp ? undefined : rect.bottom + 8,
        bottom: openUp ? window.innerHeight - rect.top + 8 : undefined,
        zIndex: 80,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [open, dateOnly]);

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

  const commitDateTime = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    if (date && time) {
      onChange(`${date}T${time}`);
      setOpen(false);
    }
  };

  const commitDate = (date: string) => {
    if (isOutOfRange(date, min, max)) return;
    setSelectedDate(date);
    onChange(date);
    setOpen(false);
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
          <span>{formatDisplay(selectedDate, selectedTime, dateOnly)}</span>
        </span>
        {!dateOnly ? <Clock3 size={18} /> : null}
      </button>

      {open && (
        <div
          className={`dtp-popover${dateOnly ? ' is-date-only' : ''}`}
          style={popoverStyle}
          role="dialog"
          aria-label={dateOnly ? 'Selecionar data' : 'Selecionar data e horário'}
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
                const disabled = isOutOfRange(key, min, max);

                return (
                  <button
                    key={`${key}-${day.getMonth()}`}
                    type="button"
                    disabled={disabled}
                    className={[
                      'dtp-day',
                      inMonth ? '' : 'is-muted',
                      isSelected ? 'is-selected' : '',
                      isToday ? 'is-today' : '',
                      disabled ? 'is-disabled' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      if (disabled) return;
                      if (dateOnly) {
                        commitDate(key);
                        return;
                      }
                      if (selectedTime) commitDateTime(key, selectedTime);
                      else setSelectedDate(key);
                    }}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="dtp-calendar-actions">
              {clearable ? (
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
              ) : (
                <span />
              )}
              <button
                type="button"
                className="dtp-link"
                disabled={isOutOfRange(todayKey, min, max)}
                onClick={() => {
                  if (isOutOfRange(todayKey, min, max)) return;
                  if (dateOnly) {
                    commitDate(todayKey);
                    return;
                  }
                  const now = new Date();
                  const roundedMinutes = now.getMinutes() < 30 ? 0 : 30;
                  const time = `${pad(Math.max(7, Math.min(19, now.getHours())))}:${pad(roundedMinutes)}`;
                  commitDateTime(todayKey, time);
                }}
              >
                Hoje
              </button>
            </div>
          </div>

          {!dateOnly && (
            <div className="dtp-times">
              <div className="dtp-times-title">
                <Clock3 size={16} />
                Horários
              </div>
              <div className="dtp-times-list">
                {timeSlots.map((slot) => {
                  const disabled = isTimeDisabled(slot, selectedDate || todayKey);
                  const occupied = occupiedSet.has(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={disabled}
                      title={occupied ? 'Horário ocupado' : undefined}
                      className={`dtp-time ${selectedTime === slot ? 'is-selected' : ''} ${occupied ? 'is-occupied' : ''} ${disabled ? 'is-disabled' : ''}`}
                      onClick={() => {
                        if (disabled) return;
                        if (selectedDate) commitDateTime(selectedDate, slot);
                        else setSelectedTime(slot);
                      }}
                    >
                      {slot}{occupied ? ' · ocupado' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {error ? <small className="dtp-error">{error}</small> : null}
    </div>
  );
}
