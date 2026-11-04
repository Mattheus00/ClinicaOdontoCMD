import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './DatePicker.css';

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
  min?: string;
  max?: string;
  today?: string;
  id?: string;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseDateKey(value: string) {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return { year, month, day };
}

function monthIndex(year: number, month: number) {
  return year * 12 + month;
}

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function buildCalendarDays(year: number, month: number) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  const days: Array<{ key: string; day: number; inMonth: boolean }> = [];

  for (let index = firstWeekday - 1; index >= 0; index -= 1) {
    const day = prevMonthDays - index;
    const date = new Date(year, month - 2, day);
    days.push({
      key: toDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate()),
      day,
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      key: toDateKey(year, month, day),
      day,
      inMonth: true,
    });
  }

  const remaining = 42 - days.length;
  for (let day = 1; day <= remaining; day += 1) {
    const date = new Date(year, month, day);
    days.push({
      key: toDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate()),
      day,
      inMonth: false,
    });
  }

  return days;
}

function formatSelectedLabel(value: string) {
  if (!value) return 'Escolha uma data';
  const { year, month, day } = parseDateKey(value);
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(year, month - 1, day));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function DatePicker({ value, onChange, min, max, today, id }: Props) {
  const selected = value ? parseDateKey(value) : null;
  const [visible, setVisible] = useState(() => {
    if (selected) return { year: selected.year, month: selected.month };
    if (min) {
      const parsed = parseDateKey(min);
      return { year: parsed.year, month: parsed.month };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const calendarDays = useMemo(
    () => buildCalendarDays(visible.year, visible.month),
    [visible.year, visible.month],
  );

  const prevMonth = shiftMonth(visible.year, visible.month, -1);
  const nextMonth = shiftMonth(visible.year, visible.month, 1);
  const canGoPrev = !min || monthIndex(prevMonth.year, prevMonth.month) >= monthIndex(parseDateKey(min).year, parseDateKey(min).month);
  const canGoNext = !max || monthIndex(nextMonth.year, nextMonth.month) <= monthIndex(parseDateKey(max).year, parseDateKey(max).month);

  return (
    <div className="date-picker-inline" id={id}>
      <div className="date-picker-inline-summary" aria-live="polite">
        {formatSelectedLabel(value)}
      </div>

      <div className="date-picker-inline-calendar" role="group" aria-label="Calendário">
        <div className="date-picker-inline-nav">
          <button
            type="button"
            className="date-picker-inline-icon-btn"
            aria-label="Mês anterior"
            disabled={!canGoPrev}
            onClick={() => setVisible((current) => shiftMonth(current.year, current.month, -1))}
          >
            <ChevronLeft size={18} />
          </button>
          <strong>
            {MONTH_LABELS[visible.month - 1]} {visible.year}
          </strong>
          <button
            type="button"
            className="date-picker-inline-icon-btn"
            aria-label="Próximo mês"
            disabled={!canGoNext}
            onClick={() => setVisible((current) => shiftMonth(current.year, current.month, 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="date-picker-inline-weekdays">
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>

        <div className="date-picker-inline-days">
          {calendarDays.map((item) => {
            const isSelected = item.key === value;
            const isDisabled = Boolean((min && item.key < min) || (max && item.key > max));
            const isToday = Boolean(today && item.key === today);

            return (
              <button
                key={item.key}
                type="button"
                disabled={isDisabled}
                aria-label={formatSelectedLabel(item.key)}
                aria-pressed={isSelected}
                className={[
                  'date-picker-inline-day',
                  item.inMonth ? '' : 'is-muted',
                  isSelected ? 'is-selected' : '',
                  isToday ? 'is-today' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  if (isDisabled) return;
                  onChange(item.key);
                  const parsed = parseDateKey(item.key);
                  setVisible({ year: parsed.year, month: parsed.month });
                }}
              >
                {item.day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
