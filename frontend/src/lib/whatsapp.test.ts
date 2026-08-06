import { describe, expect, it } from 'vitest';
import { buildAppointmentConfirmationMessage, buildWhatsAppUrl, toWhatsAppPhone } from './whatsapp';

describe('whatsapp helpers', () => {
  it('adds Brazil country code when missing', () => {
    expect(toWhatsAppPhone('(11) 99999-8888')).toBe('5511999998888');
    expect(toWhatsAppPhone('5511999998888')).toBe('5511999998888');
  });

  it('builds wa.me url with encoded message', () => {
    const url = buildWhatsAppUrl('11999998888', 'Olá!');
    expect(url).toBe('https://wa.me/5511999998888?text=Ol%C3%A1!');
  });

  it('builds confirmation copy with appointment details', () => {
    const message = buildAppointmentConfirmationMessage({
      patientName: 'Matheus Pereira',
      startsAt: '2026-08-03T15:00:00.000Z',
      professionalName: 'Dra. Maria',
      procedureName: 'Limpeza',
    });
    expect(message).toContain('Olá, Matheus!');
    expect(message).toContain('Limpeza com Dra. Maria');
    expect(message).toContain('Confirmamos seu agendamento');
  });
});
