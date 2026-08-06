import { useMemo, useState } from 'react';
import { Check, Copy, Link2, RefreshCw, Share2 } from 'lucide-react';
import { ErrorState, LoadingState } from '../../components/AsyncState';
import { useBookingLink, useRegenerateBookingLink } from '../../features/booking/api';
import './BookingLinkPage.css';

export default function BookingLinkPage() {
  const bookingLink = useBookingLink();
  const regenerate = useRegenerateBookingLink();
  const [copied, setCopied] = useState<'link' | 'caption' | null>(null);

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

  const copyText = async (value: string, kind: 'link' | 'caption') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      window.dispatchEvent(
        new CustomEvent('app:api-error', {
          detail: { message: 'Não foi possível copiar. Copie o texto manualmente.' },
        }),
      );
    }
  };

  return (
    <div className="booking-link-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Link do Instagram</h1>
          <p className="page-subtitle">
            Gere um link para a bio ou stories. Quem abrir consegue marcar uma consulta online.
          </p>
        </div>
      </div>

      <section className="booking-link-hero">
        <div className="booking-link-hero-icon">
          <Share2 size={28} />
        </div>
        <div>
          <h2>Agendamento público</h2>
          <p>
            Pacientes chegam por este link, escolhem dentista, procedimento e horário. O horário entra
            direto na agenda da clínica.
          </p>
        </div>
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
            onClick={() => {
              if (window.confirm('Gerar um novo link? O link antigo deixará de funcionar.')) {
                regenerate.mutate();
              }
            }}
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
          <li>Confira os horários na agenda — reservas do Instagram entram como agendamentos normais.</li>
        </ol>
      </section>
    </div>
  );
}
