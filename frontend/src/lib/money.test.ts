import { describe, expect, it } from 'vitest';
import { formatMoneyBrInput, parseMoneyBr } from './money';

describe('parseMoneyBr', () => {
  it('parses Brazilian decimal with comma', () => {
    expect(parseMoneyBr('180,50')).toBe(180.5);
  });

  it('parses thousands with dot and decimal comma', () => {
    expect(parseMoneyBr('1.234,56')).toBe(1234.56);
  });

  it('does not multiply by 100 when comma is used', () => {
    expect(parseMoneyBr('180,50')).not.toBe(18050);
  });

  it('formats input display', () => {
    expect(formatMoneyBrInput(180.5)).toBe('180,50');
  });
});
