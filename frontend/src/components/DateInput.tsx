import DateTimePicker from './DateTimePicker';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  min?: string;
  max?: string;
  clearable?: boolean;
};

/** Campo de data em pt-BR (calendário customizado). */
export function DateInput({ value, onChange, onBlur, error, min, max, clearable = true }: Props) {
  return (
    <DateTimePicker
      mode="date"
      value={value}
      onChange={(next) => {
        onChange(next);
        onBlur?.();
      }}
      error={error}
      min={min}
      max={max}
      clearable={clearable}
    />
  );
}
