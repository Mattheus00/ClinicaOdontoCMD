import { describe, expect, it } from 'vitest';
import { maskCpf, maskPhone } from './masks';

describe('masks', () => {
  it('formats a mobile phone as it is typed', () => {
    expect(maskPhone('11')).toBe('(11');
    expect(maskPhone('11999998888')).toBe('(11) 99999-8888');
  });

  it('formats a landline and strips the country code', () => {
    expect(maskPhone('1133334444')).toBe('(11) 3333-4444');
    expect(maskPhone('5511999998888')).toBe('(11) 99999-8888');
  });

  it('formats a CPF', () => {
    expect(maskCpf('12345678901')).toBe('123.456.789-01');
    expect(maskCpf('123.456.789-01')).toBe('123.456.789-01');
  });
});
