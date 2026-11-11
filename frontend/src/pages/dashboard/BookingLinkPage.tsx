import { useMemo, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, Copy, Link2, RefreshCw, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorState, LoadingState } from '../../components/AsyncState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/panel/PageHeader';
import { useBookingLink, useRegenerateBookingLink } from '../../features/booking/api';
import { notifyError, notifySuccess } from '../../lib/notify';
import './BookingLinkPage.css';

export default function BookingLinkPage() {
  const bookingLink = useBookingLink();
  const regenerate = useRegenerateBookingLink();
  const [copied, setCopied] = useState<'link' | 'caption' | null>(null);
  const [regenerateOpen, setRegenerateOpen] = useState(false);

  const absoluteUrl = useMemo(() => {
    if (!bookingLink.data) return '';
    return `${window.location.origin}${bookingLink.data.path}`;
  }, [bookingLink.data]);

  const captionWithAbsoluteUrl = useMemo(() => {
    if (!bookingLink.data) return '';
    return bookingLink.data.caption.replace(bookingLink.data.path, absoluteUrl);
  }, [absoluteUrl, bookingLink.data]);

  if (bookingLink.isLoading) return <LoadingState />;
  if (bookingLink.isError || !bookingLink.data) {
    return <ErrorState onRetry={() => bookingLink.refetch()} />;
  }

  const readiness = bookingLink.data.readiness ?? {
    ready: false,
    totalDentists: 0,
    activeDentists: 0,
    procedureCount: 0,
    hasCustomWorkingHours: false,
    workingHoursLabel: 'Usando expediente padrão (seg–sex 9–18, sáb 9–13)',
  };

  const copyText = async (value: string, kind: 'link' | 'caption') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      notifySuccess(kind === 'link' ? 'Link copiado.' : 'Legenda copiada.');
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      notifyError('Não foi possível copiar. Copie o texto manualmente.');
    }
  };

  const handleRegenerate = () => {
    regenerate.mutate(undefined, {
      onSuccess: () => {
        setRegenerateOpen(false);
        notifySuccess('Novo link de agendamento gerado.');
      },
      onError: () => setRegenerateOpen(false),
    });
  };

  const dentistsOk = readiness.activeDentists > 0;
  const proceduresOk = readiness.procedureCount > 0;

  return (
    <div className="booking-link-page">
      <PageHeader title="Link da bio" description="Compartilhe o agendamento online." />

      <section className="glass-card booking-link-readiness" aria-labelledby="booking-readiness-title">
        <h3 id="booking-readiness-title">
          {readiness.ready ? (
            <>
              <CheckCircle2 size={18} className="booking-readiness-ok" /> Pronto para receber agendamentos
            </>
          ) : (
            <>
              <AlertCircle size={18} className="booking-readiness-warn" /> Configure a clínica para liberar o link
            </>
          )}
        </h3>
        <ul className="booking-readiness-list">
          <li className={dentistsOk ? 'is-ok' : 'is-pending'}>
            {dentistsOk ? <Check size={16} /> : <XCircle size={16} />}
            <span>
              Dentistas ativos: <strong>{readiness.activeDentists}</strong> de {readiness.totalDentists}
            </span>
          </li>
          <li className={proceduresOk ? 'is-ok' : 'is-pending'}>
            {proceduresOk ? <Check size={16} /> : <XCircle size={16} />}
            <span>
              Procedimentos cadastrados: <strong>{readiness.procedureCount}</strong>
            </span>
          </li>
          <li className="is-neutral">
            <Check size={16} aria-hidden={!readiness.hasCustomWorkingHours} />
            <span>{readiness.workingHoursLabel}</span>
          </li>
        </ul>
        {readiness.activeDentists === 0 ? (
          <p className="booking-readiness-hint">
            <Link to="/dentists">
              Cadastre e ative dentistas
            </Link>{' '}
            para que pacientes possam escolher profissional no agendamento.
          </p>
        ) : null}
      </section>

      <section className="glass-card booking-link-card">
        <h3>
          <Link2 size={18} /> Seu link
        </h3>
        <div className="booking-link-url-row">
          <code>{absoluteUrl}</code>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => copyText(absoluteUrl, 'link')}
          >
            {copied === 'link' ? <Check size={16} /> : <Copy size={16} />}
            {copied === 'link' ? 'Copiado' : 'Copiar link'}
          </button>
        </div>

        <label className="booking-link-caption-label">
          Texto sugerido para o post
          <textarea className="input-field booking-link-caption" readOnly rows={4} value={captionWithAbsoluteUrl} />
        </label>
        <div className="booking-link-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => copyText(captionWithAbsoluteUrl, 'caption')}
          >
            {copied === 'caption' ? <Check size={16} /> : <Copy size={16} />}
            {copied === 'caption' ? 'Legenda copiada' : 'Copiar legenda'}
          </button>
          <a className="btn btn-ghost" href={absoluteUrl} target="_blank" rel="noreferrer">
            Abrir página pública
          </a>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={regenerate.isPending}
            onClick={() => setRegenerateOpen(true)}
          >
            <RefreshCw size={16} />
            {regenerate.isPending ? 'Gerando...' : 'Gerar novo link'}
          </button>
        </div>
      </section>

      <section className="booking-link-tips">
        <h3>Como usar no Instagram</h3>
        <ol>
          <li>Copie o link e cole na bio do perfil da clínica.</li>
          <li>Ou use a legenda sugerida em um post/story com o link na bio.</li>
          <li>Acompanhe as solicitações no sino da agenda e aceite ou recuse cada pedido.</li>
        </ol>
      </section>

      {regenerateOpen ? (
        <ConfirmDialog
          title="Gerar novo link?"
          message="O link atual deixará de funcionar. Pacientes com o link antigo não conseguirão agendar até receberem o novo endereço."
          confirmLabel="Gerar novo link"
          danger
          busy={regenerate.isPending}
          onConfirm={handleRegenerate}
          onCancel={() => setRegenerateOpen(false)}
        />
      ) : null}
    </div>
  );
}
