import type { ChangeEvent } from 'react';

function digits(value: string) {
  return value.replace(/\D/g, '');
}

export function maskPhone(value: string) {
  let numbers = digits(value);
  if (numbers.startsWith('55') && numbers.length > 11) {
    numbers = numbers.slice(2);
  }
  numbers = numbers.slice(0, 11);
  if (numbers.length === 0) return '';
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

export function maskCpf(value: string) {
  const numbers = digits(value).slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

export function withMask(
  mask: (value: string) => string,
  onChange: (event: ChangeEvent<HTMLInputElement>) => void,
) {
  return (event: ChangeEvent<HTMLInputElement>) => {
    event.target.value = mask(event.target.value);
    onChange(event);
  };
}
