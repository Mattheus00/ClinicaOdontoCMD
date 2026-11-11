import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type FeedbackTone = 'error' | 'info' | 'success';
type Feedback = { id: number; message: string; tone: FeedbackTone };

export function AppFeedback() {
  const [items, setItems] = useState<Feedback[]>([]);

  useEffect(() => {
    const push = (message: string, tone: FeedbackTone) => {
      const item = { id: Date.now() + Math.random(), message, tone };
      setItems((current) => [...current, item]);
      window.setTimeout(() => setItems((current) => current.filter((entry) => entry.id !== item.id)), 5000);
    };

    const onError = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      push(detail?.message ?? 'Ocorreu um erro inesperado.', 'error');
    };
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string; tone?: FeedbackTone }>).detail;
      const tone = detail?.tone === 'success' || detail?.tone === 'error' ? detail.tone : 'info';
      if (tone === 'success') {
        setItems((current) => current.filter((entry) => entry.tone !== 'error'));
      }
      push(detail?.message ?? 'Atualização recebida.', tone);
    };
    const onClearErrors = () => {
      setItems((current) => current.filter((entry) => entry.tone !== 'error'));
    };

    window.addEventListener('app:api-error', onError);
    window.addEventListener('app:toast', onToast);
    window.addEventListener('app:toast-clear-errors', onClearErrors);
    return () => {
      window.removeEventListener('app:api-error', onError);
      window.removeEventListener('app:toast', onToast);
      window.removeEventListener('app:toast-clear-errors', onClearErrors);
    };
  }, []);

  if (!items.length) return null;
  return (
    <div className="toast-region" aria-live="polite">
      {items.map((item) => (
        <div
          className={`toast${item.tone === 'info' ? ' toast-info' : ''}${item.tone === 'success' ? ' toast-success' : ''}`}
          key={item.id}
        >
          {item.tone === 'success' ? <CheckCircle2 size={18} aria-hidden="true" /> : null}
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  );
}
