import type { PageResponse } from '../api/types';

export function Pagination({ data, page, onChange, busy = false }: {
  data?: Pick<PageResponse<unknown>, 'totalPages' | 'totalElements'>;
  page: number; onChange: (page: number) => void; busy?: boolean;
}) {
  if (!data || (data.totalPages <= 1 && page === 0)) return null;
  return <nav className="pagination" aria-label="Paginação">
    <button className="btn btn-secondary" type="button" disabled={page === 0 || busy} onClick={() => onChange(page - 1)}>Anterior</button>
    <span aria-live="polite">Página {page + 1} de {Math.max(1, data.totalPages)} · {data.totalElements} registros</span>
    <button className="btn btn-secondary" type="button" disabled={page + 1 >= data.totalPages || busy} onClick={() => onChange(page + 1)}>Próxima</button>
  </nav>;
}
