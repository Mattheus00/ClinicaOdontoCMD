import { describe, expect, it } from 'vitest';
import { formatAppointmentDuration } from './appointment-duration';

describe('formatAppointmentDuration', () => {
  it('formats minutes under one hour', () => {
    expect(formatAppointmentDuration(45)).toBe('45 min');
  });

  it('formats exact hours', () => {
    expect(formatAppointmentDuration(60)).toBe('1 hora');
    expect(formatAppointmentDuration(120)).toBe('2 horas');
  });

  it('formats hours and minutes', () => {
    expect(formatAppointmentDuration(90)).toBe('1h 30min');
  });
});
