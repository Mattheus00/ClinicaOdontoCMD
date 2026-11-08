import { useDataReadyMetric } from '../../lib/performance';
import { useMemo, useState } from 'react';
import { EmptyState, ErrorState, LoadingState, RefreshState } from '../../components/AsyncState';
import DateTimePicker from '../../components/DateTimePicker';
import { PageHeader } from '../../components/panel/PageHeader';
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
  useDataReadyMetric("FinancialDashboardPage", Boolean(dashboard.data));

  if (dashboard.isLoading) return <LoadingState />;
  if (dashboard.isError && !dashboard.data) return <ErrorState onRetry={() => dashboard.refetch()} />;

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
  const summaryMetrics = [
    { label: 'Recebido no período', value: money(totals.receivedInPeriod), hint: formatPeriod(period.from, period.to) },
    { label: 'Total recebido', value: money(totals.paid) },
    { label: 'Aprovado', value: money(totals.approved) },
    { label: 'Pendente', value: money(totals.pending) },
    { label: 'Saldo em aberto', value: money(totals.openBalance) },
    { label: 'Em atraso', value: money(totals.overdue), danger: totals.overdue > 0 },
  ];

  const composition = [
    { label: 'Recebido', value: totals.paid, color: '#315C46' },
    { label: 'Pendente', value: totals.pending, color: '#C9A970' },
    { label: 'Em atraso', value: totals.overdue, color: '#B74848' },
  ];
  const compositionTotal = composition.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="financial-dashboard">
      <RefreshState fetching={dashboard.isRefetching} error={dashboard.isError && Boolean(dashboard.data)} onRetry={() => dashboard.refetch()} />
      <PageHeader
        eyebrow="GESTÃO FINANCEIRA"
        title="Financeiro"
        description={
          isDentist
            ? 'Acompanhe seus recebimentos e valores em aberto.'
            : 'Resumo da clínica e desempenho por dentista.'
        }
        actions={
          <div className="financial-period-filters">
            <label>
              De
              <DateTimePicker
                mode="date"
                value={from}
                max={to}
                clearable={false}
                onChange={(value) => {
                  if (value) setFrom(value);
                }}
              />
            </label>
            <label>
              Até
              <DateTimePicker
                mode="date"
                value={to}
                min={from}
                max={today()}
                clearable={false}
                onChange={(value) => {
                  if (value) setTo(value);
                }}
              />
            </label>
          </div>
        }
      />

      <div className="financial-summary-cards" aria-label="Indicadores financeiros">
        {summaryMetrics.map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            {'hint' in metric && metric.hint ? <small>{metric.hint}</small> : null}
            <strong className={metric.danger ? 'financial-danger' : undefined}>{metric.value}</strong>
          </article>
        ))}
      </div>

      {!isDentist ? (
        <section className="financial-charts" aria-label="Visão gráfica">
          <article className="financial-chart-card">
            <h2 className="card-section-title">Recebimentos por dentista</h2>
            {byProfessional.length && compositionTotal > 0 ? (
              <ul className="financial-bar-chart">
                {byProfessional.map((row) => {
                  const max = Math.max(...byProfessional.map((item) => item.receivedInPeriod), 1);
                  const width = Math.max(4, Math.round((row.receivedInPeriod / max) * 100));
                  return (
                    <li key={row.professionalId ?? 'unassigned'}>
                      <div className="financial-bar-meta">
                        <span>{row.professionalName}</span>
                        <strong>{money(row.receivedInPeriod)}</strong>
                      </div>
                      <div className="financial-bar-track" aria-hidden="true">
                        <span style={{ width: `${width}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                title="Sem recebimentos no período"
                description="Quando houver valores recebidos, o gráfico aparece aqui."
              />
            )}
          </article>

          <article className="financial-chart-card">
            <h2 className="card-section-title">Composição financeira</h2>
            {compositionTotal > 0 ? (
              <div className="financial-donut-wrap">
                <svg viewBox="0 0 36 36" className="financial-donut" aria-hidden="true">
                  {(() => {
                    let offset = 0;
                    return composition.map((slice) => {
                      const pct = (slice.value / compositionTotal) * 100;
                      const circle = (
                        <circle
                          key={slice.label}
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="3.2"
                          strokeDasharray={`${pct} ${100 - pct}`}
                          strokeDashoffset={25 - offset}
                        />
                      );
                      offset += pct;
                      return circle;
                    });
                  })()}
                </svg>
                <ul className="financial-donut-legend">
                  {composition.map((slice) => (
                    <li key={slice.label}>
                      <span style={{ background: slice.color }} />
                      {slice.label}
                      <strong>
                        {compositionTotal
                          ? `${Math.round((slice.value / compositionTotal) * 100)}%`
                          : '0%'}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyState
                title="Sem composição para exibir"
                description="Registre pagamentos para ver a distribuição."
              />
            )}
          </article>
        </section>
      ) : null}

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
