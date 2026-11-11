import type { ReactNode } from 'react';

export function RefreshState({ fetching, error, onRetry }: { fetching: boolean; error: boolean; onRetry: () => void }) {
  if (!fetching && !error) return null;
  if (error) {
    return (
      <div className="refresh-state-layer" role="status">
        <div className="refresh-state">
          Não foi possível atualizar. Exibindo os últimos dados.{' '}
          <button type="button" className="btn btn-secondary" onClick={onRetry}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="refresh-state-layer" role="status">
      <div className="refresh-state">Atualizando…</div>
    </div>
  );
}

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="async-state async-state-loading" role="status" aria-label={label}>
      <div className="async-skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <span className="async-state-label">{label}</span>
    </div>
  );
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
