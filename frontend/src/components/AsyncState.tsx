import type { ReactNode } from 'react';

export function RefreshState({ fetching, error, onRetry }: { fetching: boolean; error: boolean; onRetry: () => void }) {
  if (error) return <div className="refresh-state" role="status">Não foi possível atualizar. Exibindo os últimos dados. <button type="button" className="btn btn-secondary" onClick={onRetry}>Tentar novamente</button></div>;
  return fetching ? <div className="refresh-state" role="status">Atualizando…</div> : null;
}

export function LoadingState({ label = 'Carregando dados...' }: { label?: string }) {
  return <div className="async-state" role="status">{label}</div>;
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <section className="async-state async-state-error" role="alert">
      <strong>Não foi possível carregar estas informações.</strong>
      <span>{message ?? 'Verifique sua conexão e tente novamente.'}</span>
      {onRetry && <button className="btn btn-secondary" onClick={onRetry}>Tentar novamente</button>}
    </section>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <section className="async-state">
      <strong>{title}</strong>
      <span>{description}</span>
      {action}
    </section>
  );
}
