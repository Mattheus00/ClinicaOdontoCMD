/** Digits-only phone suitable for wa.me, with Brazil country code when missing. */
export function toWhatsAppPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D+/g, '');
  if (digits.length < 10) return null;
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  return `55${digits}`;
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string | null {
  const waPhone = toWhatsAppPhone(phone);
  if (!waPhone) return null;
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
}

export function buildAppointmentConfirmationMessage(input: {
  patientName: string;
  startsAt: string;
  professionalName: string;
  procedureName?: string | null;
}): string {
  const when = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(input.startsAt));

  const firstName = input.patientName.trim().split(/\s+/)[0] || input.patientName;
  const procedure = input.procedureName?.trim() || 'Consulta';

  return [
    `Olá, ${firstName}! ✅`,
    '',
    'Confirmamos seu agendamento:',
    `📅 ${when}`,
    `🦷 ${procedure} com ${input.professionalName}`,
    '',
    'Qualquer dúvida, é só responder por aqui. Aguardamos você!',
  ].join('\n');
}
