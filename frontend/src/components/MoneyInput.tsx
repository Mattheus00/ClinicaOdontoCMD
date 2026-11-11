import { type InputHTMLAttributes, useEffect, useId, useRef, useState } from 'react';
import { formatMoneyBrInput, money, parseMoneyBr } from '../lib/money';

type MoneyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'inputMode'> & {
  value: number | null | undefined;
  onValueChange: (value: number | null) => void;
  showPreview?: boolean;
  max?: number;
};

export function MoneyInput({
  value,
  onValueChange,
  showPreview = true,
  max = 1_000_000,
  id,
  className,
  onBlur,
  disabled,
  ...rest
}: MoneyInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const focused = useRef(false);
  const [text, setText] = useState(() => formatMoneyBrInput(value ?? null));

  useEffect(() => {
    if (focused.current) return;
    setText(formatMoneyBrInput(value ?? null));
  }, [value]);

  const handleChange = (raw: string) => {
    const filtered = raw.replace(/[^\d.,]/g, '');
    setText(filtered);
    const parsed = parseMoneyBr(filtered);
    if (parsed == null) {
      onValueChange(filtered.trim() ? null : null);
      return;
    }
    if (parsed > max) {
      onValueChange(max);
      setText(formatMoneyBrInput(max));
      return;
    }
    onValueChange(parsed);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    focused.current = false;
    const parsed = parseMoneyBr(text);
    if (parsed != null) setText(formatMoneyBrInput(parsed));
    else if (!text.trim()) setText('');
    onBlur?.(event);
  };

  const preview = value != null && Number.isFinite(value) ? money(value) : null;

  return (
    <div className={`money-input${className ? ` ${className}` : ''}`}>
      <input
        {...rest}
        id={inputId}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        disabled={disabled}
        value={text}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        aria-describedby={showPreview && preview ? `${inputId}-preview` : undefined}
      />
      {showPreview && preview ? (
        <span id={`${inputId}-preview`} className="money-input-preview">
          {preview}
        </span>
      ) : null}
    </div>
  );
}
