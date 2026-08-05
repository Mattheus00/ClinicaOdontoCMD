import { useMemo, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { useAuth } from '../../contexts/AuthContext';
import { useFinancialDashboard } from '../../features/financial/api';
import { money } from '../../lib/money';
import './FinancialDashboardPage.css';

const today = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const monthStart = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

const formatPeriod = (from: string, to: string) => {
  const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${formatter.format(new Date(`${from}T12:00:00`))} — ${formatter.format(new Date(`${to}T12:00:00`))}`;
};

export default function FinancialDashboardPage() {
  const { role } = useAuth();
  const isDentist = role === 'DENTIST';
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());

  const filters = useMemo(() => ({ from, to }), [from, to]);
  const dashboard = useFinancialDashboard(filters);

  if (dashboard.isLoading) return <LoadingState />;
  if (dashboard.isError) return <ErrorState onRetry={() => dashboard.refetch()} />;

  const data = dashboard.data;
  if (!data) return <EmptyState title="Sem dados financeiros" description="Cadastre pacientes e registre pagamentos para visualizar o resumo." />;

  const { totals, byProfessional, period } = data;

  return (
    <div className="financial-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">
            {isDentist
              ? 'Resumo dos seus recebimentos e saldo em aberto.'
              : 'Visão consolidada da clínica e desempenho por dentista.'}
          </p>
        </div>
        {!isDentist && (
          <div className="financial-period-filters">
            <label>
              De
              <input
                className="input-field compact-field"
                type="date"
                value={from}
                max={to}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <label>
              Até
              <input
                className="input-field compact-field"
                type="date"
                value={to}
                min={from}
                max={today()}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      <p className="financial-period-label">
        Recebido no período: <strong>{formatPeriod(period.from, period.to)}</strong>
      </p>

      <div className="financial-summary-cards">
        <article>
          <span>Recebido no período</span>
          <strong className="financial-highlight">{money(totals.receivedInPeriod)}</strong>
        </article>
        <article>
          <span>Total recebido</span>
          <strong>{money(totals.paid)}</strong>
        </article>
        <article>
          <span>Planos aprovados</span>
          <strong>{money(totals.approved)}</strong>
        </article>
        <article>
          <span>Pendente</span>
          <strong>{money(totals.pending)}</strong>
        </article>
        <article>
          <span>Saldo em aberto</span>
          <strong>{money(totals.openBalance)}</strong>
        </article>
        <article>
          <span>Em atraso</span>
          <strong className="financial-danger">{money(totals.overdue)}</strong>
        </article>
      </div>

      {!isDentist && (
      <section className="glass-card financial-by-dentist">
        <h2 className="card-section-title">Por dentista</h2>
        <p className="financial-attribution-note">
          Valores atribuídos pelo dentista preferencial do paciente ou pela consulta mais recente.
        </p>

        {byProfessional.length ? (
          <div className="table-wrap">
            <table className="data-table financial-table">
              <thead>
                <tr>
                  <th>Dentista</th>
                  <th>Pacientes</th>
                  <th>Recebido no período</th>
                  <th>Total recebido</th>
                  <th>Aprovado</th>
                  <th>Pendente</th>
                  <th>Saldo em aberto</th>
                  <th>Em atraso</th>
                </tr>
              </thead>
              <tbody>
                {byProfessional.map((row) => (
                  <tr key={row.professionalId ?? 'unassigned'}>
                    <td>
                      <strong>{row.professionalName}</strong>
                    </td>
                    <td>{row.patientCount}</td>
                    <td>{money(row.receivedInPeriod)}</td>
                    <td>{money(row.paid)}</td>
                    <td>{money(row.approved)}</td>
                    <td>{money(row.pending)}</td>
                    <td>{money(row.openBalance)}</td>
                    <td className={row.overdue > 0 ? 'financial-danger' : undefined}>{money(row.overdue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Nenhum dentista cadastrado"
            description="Cadastre profissionais para acompanhar o financeiro por dentista."
          />
        )}
      </section>
      )}
    </div>
  );
}
