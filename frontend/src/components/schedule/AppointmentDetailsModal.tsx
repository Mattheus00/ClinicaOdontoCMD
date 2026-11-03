import { useId } from 'react';
import { ArrowUpRight, CalendarDays, Check, Clock3, FileText, Hourglass, Link2, MessageCircle, Save, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Appointment } from '../../api/types';
import { formatAppointmentDuration } from '../../lib/appointment-duration';
import { money } from '../../lib/money';
import { Modal } from '../Modal';
import './AppointmentDetailsModal.css';

const STATUS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: 'Aguardando aceite', tone: 'pending' },
  SCHEDULED: { label: 'Agendada', tone: 'scheduled' },
  CONFIRMED: { label: 'Confirmada', tone: 'confirmed' },
  COMPLETED: { label: 'Realizada', tone: 'confirmed' },
  CANCELLED: { label: 'Cancelada', tone: 'cancelled' },
  NO_SHOW: { label: 'Faltou', tone: 'pending' },
};

type Props = {
  appointment: Appointment;
  report: string;
  canEditReport: boolean;
  isAdmin: boolean;
  whatsappUrl: string | null;
  busy: { accept: boolean; confirm: boolean; save: boolean; cancel: boolean };
  onReportChange: (value: string) => void;
  onClose: () => void;
  onAccept: () => void;
  onConfirm: () => void;
  onSaveReport: () => void;
  onCancel: () => void;
};

export function AppointmentDetailsModal({ appointment, report, canEditReport, isAdmin, whatsappUrl, busy,
  onReportChange, onClose, onAccept, onConfirm, onSaveReport, onCancel }: Props) {
  const reportId = useId();
  const status = STATUS[appointment.status] ?? { label: appointment.status, tone: 'scheduled' };
  const starts = new Date(appointment.startsAt);
  const duration = appointment.durationMinutes ?? Math.max(15, Math.round((new Date(appointment.endsAt).getTime() - starts.getTime()) / 60000));
  const initials = appointment.patient.name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]);
  const completed = appointment.status === 'COMPLETED';
  const cancelled = appointment.status === 'CANCELLED';
  const pending = appointment.status === 'PENDING';
  const submitting = Object.values(busy).some(Boolean);
  const reportDirty = (appointment.report ?? '') !== report.trim();
  const canConclude = !cancelled && !completed && !pending;

  return <Modal title="Detalhes do agendamento" className="appointment-modal" onClose={onClose}>
    <div className="appointment-modal-content">
      <div className="appointment-patient">
        <div className="appointment-patient-avatar" aria-hidden="true">{initials[0]}{initials.length > 1 ? initials.at(-1) : ''}</div>
        <div className="appointment-patient-name"><span>Paciente</span><h3>{appointment.patient.name}</h3></div>
        <span className={`appointment-status appointment-status-${status.tone}`}><i aria-hidden="true" />{status.label}</span>
      </div>

      <dl className="appointment-meta">
        <div><Stethoscope size={18} aria-hidden="true" /><div><dt>Dentista</dt><dd>{appointment.professional.name}</dd></div></div>
        <div><CalendarDays size={18} aria-hidden="true" /><div><dt>Data da consulta</dt><dd>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(starts)}<small>{new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(starts)}</small></dd></div></div>
        <div><Clock3 size={18} aria-hidden="true" /><div><dt>Horário</dt><dd><time dateTime={appointment.startsAt}>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(starts)}</time></dd></div></div>
        <div><Hourglass size={18} aria-hidden="true" /><div><dt>Duração</dt><dd>{formatAppointmentDuration(duration)}</dd></div></div>
      </dl>

      <div className="appointment-procedure-summary">
        <div><span>Procedimento</span><strong>{appointment.procedure?.name ?? 'Não informado'}</strong></div>
        {appointment.procedure && <div className="appointment-procedure-price"><span>Valor</span><strong>{money(appointment.procedure.price)}</strong></div>}
      </div>
      {appointment.createdVia === 'instagram' && <p className="appointment-origin"><Link2 size={14} aria-hidden="true" />Agendado pelo Instagram / link público</p>}

      <Link className="appointment-chart-link" to={`/odontograma/${appointment.patient.id}?consulta=${appointment.id}`}>
        <span className="appointment-chart-icon" aria-hidden="true"><svg width="22" height="24" viewBox="0 0 24 26" fill="none"><path d="M12 3C8-1 2 2 3 8c.4 3 2 5 2.6 9 .5 4.5 1 7 2.8 7 2 0 1-9 3.6-9s1.6 9 3.6 9c1.8 0 2.3-2.5 2.8-7 .6-4 2.2-6 2.6-9 1-6-5-9-9-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 3c2 1 3 2 5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></span>
        <span><strong>Abrir odontograma</strong><small>Consultar e registrar procedimentos por dente</small></span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </Link>

      <div className="appointment-report">
        <label htmlFor={reportId}><FileText size={17} aria-hidden="true" />Relatório da consulta{!canEditReport && <span>Somente leitura</span>}</label>
        <textarea id={reportId} rows={3} value={report} onChange={(event) => onReportChange(event.target.value)}
          disabled={!canEditReport || submitting} aria-describedby={`${reportId}-hint`}
          placeholder={canEditReport ? 'Procedimentos realizados, observações e orientações ao paciente…' : 'Nenhum relatório registrado.'} />
        <p id={`${reportId}-hint`}>Disponível no histórico do paciente para a equipe clínica.</p>
      </div>

      {whatsappUrl && <div className="appointment-whatsapp">
        <MessageCircle size={21} aria-hidden="true" />
        <div><strong>Confirme o horário com o paciente</strong><p>Abra a mensagem pronta no WhatsApp.</p></div>
        <a className="btn appointment-whatsapp-button" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Abrir WhatsApp<ArrowUpRight size={15} aria-hidden="true" /></a>
      </div>}

      {canConclude && canEditReport && <p className="appointment-completion-note">
        {appointment.procedure
          ? <>Ao confirmar o atendimento, o relatório será salvo e um pagamento de <strong>{money(appointment.procedure.price)}</strong> será registrado.</>
          : 'Vincule um procedimento ao agendamento para confirmar o atendimento.'}
      </p>}
    </div>

    <footer className="appointment-modal-footer">
      {isAdmin && !cancelled && !completed && <button type="button" className="appointment-cancel" disabled={submitting} onClick={onCancel}>
        {busy.cancel ? 'Cancelando…' : pending ? 'Recusar solicitação' : 'Cancelar agendamento'}
      </button>}
      <div className="appointment-main-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>
        {isAdmin && pending && <button type="button" className="btn btn-primary" disabled={submitting} onClick={onAccept}>
          <Check size={16} aria-hidden="true" />{busy.accept ? 'Aceitando…' : 'Aceitar agendamento'}
        </button>}
        {canConclude && <button type="button" className="btn btn-primary" disabled={submitting || !appointment.procedure || !canEditReport} onClick={onConfirm}>
          <Check size={16} aria-hidden="true" />{busy.confirm ? 'Confirmando…' : 'Confirmar atendimento'}
        </button>}
        {completed && canEditReport && <button type="button" className="btn btn-primary" disabled={submitting || !reportDirty} onClick={onSaveReport}>
          <Save size={16} aria-hidden="true" />{busy.save ? 'Salvando…' : 'Salvar relatório'}
        </button>}
      </div>
    </footer>
  </Modal>;
}
