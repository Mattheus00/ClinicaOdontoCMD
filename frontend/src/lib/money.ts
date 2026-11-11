export function money(value?: number | null, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value ?? 0);
}

/** Parse Brazilian money strings like "180,50" or "1.234,56" into a number in reais. */
export function parseMoneyBr(raw: string | number | null | undefined): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  const cleaned = trimmed
    .replace(/[Rr]\$\s?/g, '')
    .replace(/\s/g, '')
    .replace(/[^\d.,-]/g, '');

  if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === ',') return null;

  const negative = cleaned.startsWith('-');
  const digits = negative ? cleaned.slice(1) : cleaned;

  let normalized: string;
  if (digits.includes(',') && digits.includes('.')) {
    // 1.234,56 → remove thousand separators, comma as decimal
    normalized = digits.replace(/\./g, '').replace(',', '.');
  } else if (digits.includes(',')) {
    normalized = digits.replace(',', '.');
  } else {
    normalized = digits;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

/** Format a number as Brazilian decimal for input display (e.g. 180.5 → "180,50"). */
export function formatMoneyBrInput(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
