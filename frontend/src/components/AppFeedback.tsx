import { useEffect, useState } from 'react';

type Feedback = { id: number; message: string };

export function AppFeedback() {
  const [items, setItems] = useState<Feedback[]>([]);

  useEffect(() => {
    const show = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      const item = { id: Date.now(), message: detail?.message ?? 'Ocorreu um erro inesperado.' };
      setItems((current) => [...current, item]);
      window.setTimeout(() => setItems((current) => current.filter((entry) => entry.id !== item.id)), 5000);
    };
    window.addEventListener('app:api-error', show);
    return () => window.removeEventListener('app:api-error', show);
  }, []);

  if (!items.length) return null;
  return <div className="toast-region" aria-live="polite">{items.map((item) => <div className="toast" key={item.id}>{item.message}</div>)}</div>;
}
