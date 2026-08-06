import { useMemo, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { useAuth } from '../../contexts/AuthContext';
import { useFinancialDashboard } from '../../features/financial/api';
import type { ProfessionalFinancialBreakdown } from '../../api/types';
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

function DentistBreakdownCard({ row }: { row: ProfessionalFinancialBreakdown }) {
  return (
    <article className="financial-dentist-card">
      <header className="financial-dentist-card-head">
        <div>
          <strong>{row.professionalName}</strong>
          <span>
            {row.patientCount} {row.patientCount === 1 ? 'paciente' : 'pacientes'}
          </span>
        </div>
        <div className="financial-dentist-card-period">
          <small>No período</small>
          <strong className="financial-highlight">{money(row.receivedInPeriod)}</strong>
        </div>
      </header>
      <dl className="financial-dentist-metrics">
        <div>
          <dt>Total recebido</dt>
          <dd>{money(row.paid)}</dd>
        </div>
        <div>
          <dt>Aprovado</dt>
          <dd>{money(row.approved)}</dd>
        </div>
        <div>
          <dt>Pendente</dt>
          <dd>{money(row.pending)}</dd>
        </div>
        <div>
          <dt>Em aberto</dt>
          <dd>{money(row.openBalance)}</dd>
        </div>
        <div className="financial-dentist-metrics-wide">
          <dt>Em atraso</dt>
          <dd className={row.overdue > 0 ? 'financial-danger' : undefined}>{money(row.overdue)}</dd>
        </div>
      </dl>
    </article>
  );
}

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
  if (!data) {
    return (
      <EmptyState
        title="Sem dados financeiros"
        description="Cadastre pacientes e registre pagamentos para visualizar o resumo."
      />
    );
  }

  const { totals, byProfessional, period } = data;
  const secondaryMetrics = [
    { label: 'Total recebido', value: money(totals.paid) },
    { label: 'Planos aprovados', value: money(totals.approved) },
    { label: 'Pendente', value: money(totals.pending) },
    { label: 'Saldo em aberto', value: money(totals.openBalance) },
    {
      label: 'Em atraso',
      value: money(totals.overdue),
      danger: totals.overdue > 0,
    },
    {
      label: isDentist ? 'Seus pacientes' : 'Pacientes',
      value: String(totals.patientCount),
    },
  ];

  return (
    <div className="financial-dashboard">
      <div className="page-header financial-header">
        <div className="financial-header-copy">
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">
            {isDentist
              ? 'Acompanhe seus recebimentos e valores em aberto.'
              : 'Resumo da clínica e desempenho por dentista.'}
          </p>
        </div>

        <div className="financial-period-filters">
          <label>
            De
            <input
              className="input-field"
              type="date"
              value={from}
              max={to}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label>
            Até
            <input
              className="input-field"
              type="date"
              value={to}
              min={from}
              max={today()}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
        </div>
      </div>

      <section className="financial-hero" aria-label="Recebido no período">
        <div className="financial-hero-copy">
          <span>Recebido no período</span>
          <p>{formatPeriod(period.from, period.to)}</p>
        </div>
        <strong className="financial-highlight">{money(totals.receivedInPeriod)}</strong>
      </section>

      <div className="financial-summary-cards">
        {secondaryMetrics.map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong className={metric.danger ? 'financial-danger' : undefined}>{metric.value}</strong>
          </article>
        ))}
      </div>

      {!isDentist && (
        <section className="financial-by-dentist">
          <div className="financial-by-dentist-head">
            <h2 className="card-section-title">Por dentista</h2>
            <p className="financial-attribution-note">
              Valores atribuídos pelo dentista preferencial do paciente ou pela consulta mais recente.
            </p>
          </div>

          {byProfessional.length ? (
            <>
              <div className="financial-dentist-list">
                {byProfessional.map((row) => (
                  <DentistBreakdownCard key={row.professionalId ?? 'unassigned'} row={row} />
                ))}
              </div>

              <div className="table-wrap financial-table-desktop">
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
                        <td className={row.overdue > 0 ? 'financial-danger' : undefined}>
                          {money(row.overdue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <EmptyState
              title="Nenhum dentista cadastrado"
              description="Cadastre profissionais para acompanhar o financeiro por dentista."
            />
          )}
        </section>
      )}

      {isDentist && (
        <section className="financial-dentist-note">
          <p>
            Os valores consideram os pacientes atribuídos a você no período selecionado.
          </p>
        </section>
      )}
    </div>
  );
}
