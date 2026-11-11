/** Valida CPF brasileiro (11 dígitos + verificadores). Aceita valor mascarado ou só números. */
export function validateCpf(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calcCheck = (slice: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < slice.length; i += 1) {
      sum += Number(slice[i]) * (factor - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const base = digits.slice(0, 9);
  const d1 = calcCheck(base, 10);
  if (d1 !== Number(digits[9])) return false;
  const d2 = calcCheck(base + digits[9], 11);
  return d2 === Number(digits[10]);
}
