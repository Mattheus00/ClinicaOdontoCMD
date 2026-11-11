import { useMemo, useState } from 'react';
import { ArrowUpRight, CalendarClock, Check, CreditCard, ReceiptText, TicketPercent } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, RefreshState } from '../../components/AsyncState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/panel/PageHeader';
import { notifySuccess } from '../../lib/notify';
import {
  useCancelSubscription,
  useInvoices,
  usePlans,
  useSubscribe,
  useSubscription,
} from '../../features/billing/api';
import { moneyFromCents, VELORA_PLANS } from '../../lib/velora-plans';
import './BillingPage.css';

const money = (value: number, currency = 'BRL') =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);

const subscriptionStatusLabels = {
  ACTIVE: 'Ativa',
  TRIAL: 'Em teste',
  SUSPENDED: 'Suspensa',
};

const invoiceStatusLabels: Record<string, string> = {
  PAID: 'Pago',
  PENDING: 'Pendente',
  FAILED: 'Falhou',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
  CANCELED: 'Cancelado',
  REFUNDED: 'Estornado',
  REDEEMED: 'Resgatado',
};

const invoiceStatusLabel = (status?: string) => {
  const key = String(status || '').toUpperCase();
  return invoiceStatusLabels[key] ?? status ?? '—';
};

export default function BillingPage() {
  const subscription = useSubscription();
  const invoices = useInvoices();
  const plansQuery = usePlans();
  const subscribe = useSubscribe();
  const cancel = useCancelSubscription();
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [coupon, setCoupon] = useState('');

  const plans = useMemo(() => {
    if (plansQuery.data?.length) {
      return plansQuery.data.map((plan) => ({
        slug: plan.slug,
        name: plan.name,
        description: plan.description || '',
        priceCents: plan.priceCents,
        listPriceCents: plan.listPriceCents ?? plan.priceCents,
        features: plan.features || [],
        highlighted: Boolean(plan.highlighted),
        checkoutEnabled: Boolean(plan.checkoutEnabled),
        comingSoon: Boolean(plan.comingSoon ?? !plan.checkoutEnabled),
      }));
    }
    return VELORA_PLANS;
  }, [plansQuery.data]);

  if (subscription.isLoading) return <LoadingState />;
  if (subscription.isError && !subscription.data) {
    return <ErrorState onRetry={() => subscription.refetch()} />;
  }

  const data = subscription.data;
  if (!data) {
    return <EmptyState title="Assinatura não encontrada" description="Escolha um plano para continuar." />;
  }

  const hasPaidInvoice = Boolean(
    invoices.data?.some((invoice) => String(invoice.status || '').toUpperCase() === 'PAID'),
  );
  const isCancelledOrSuspended = data.status === 'SUSPENDED' || !data.planSlug;
  const showCancel =
    !isCancelledOrSuspended &&
    (data.status === 'ACTIVE' || Boolean(data.canCancel) || (hasPaidInvoice && Boolean(data.planSlug)));

  const readErrorMessage = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object' && 'response' in err) {
      const payload = (err as { response?: { data?: unknown } }).response?.data;
      if (typeof payload === 'string' && payload.trim()) return payload;
      if (payload && typeof payload === 'object' && 'message' in payload) {
        const message = String((payload as { message?: unknown }).message || '');
        if (message) return message;
      }
      if (payload != null && typeof payload !== 'object') return String(payload);
    }
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const startCheckout = async (planSlug: string) => {
    setError(null);
    try {
      const result = await subscribe.mutateAsync({
        planSlug,
        coupon: coupon.trim() || undefined,
      });
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      setError('Não foi possível abrir o checkout. Verifique a configuração do Abacate Pay.');
    } catch (err) {
      setError(readErrorMessage(err, 'Falha ao iniciar a assinatura. Tente novamente.'));
    }
  };

  const cancelSubscription = async () => {
    setError(null);
    try {
      await cancel.mutateAsync();
      setCancelOpen(false);
      notifySuccess('Assinatura cancelada com sucesso.');
      await subscription.refetch();
    } catch (err) {
      setError(readErrorMessage(err, 'Não foi possível cancelar a assinatura.'));
    }
  };

  return (
    <div className="billing-page">
      <RefreshState
        fetching={subscription.isRefetching}
        error={subscription.isError && Boolean(subscription.data)}
        onRetry={() => subscription.refetch()}
      />
      <PageHeader title="Assinatura" description="Gerencie seu plano, cobranças e faturas." />

      {data.status === 'TRIAL' && (
        <div className="notice">
          Seu período de teste termina em{' '}
          {data.trialEndsAt ? new Date(data.trialEndsAt).toLocaleDateString('pt-BR') : 'breve'}.
        </div>
      )}
      {data.status === 'SUSPENDED' && (
        <div className="notice notice-danger">
          A conta está suspensa. Operações de escrita permanecem bloqueadas até a reativação.
        </div>
      )}
      {error ? <div className="notice notice-danger">{error}</div> : null}

      <div className="billing-grid">
        <section className="glass-card billing-current" aria-labelledby="billing-current-title">
          <div className="billing-summary">
            <div className="billing-summary-top">
              <span className="billing-summary-label">
                <CreditCard size={16} aria-hidden />
                Seu plano
              </span>
              <span className="billing-status" data-status={data.status}>
                {subscriptionStatusLabels[data.status] ?? data.status}
              </span>
            </div>
            <h2 id="billing-current-title" className="billing-plan-name">{data.planName}</h2>
            <p className="billing-plan-price">
              <strong>{money(data.price, data.currency)}</strong>
              <span>/mês</span>
            </p>
          </div>
          <div className="billing-current-details">
            <div className="billing-next-charge">
              <span className="billing-next-charge-label">
                <CalendarClock size={17} aria-hidden />
                Próxima cobrança
              </span>
              <strong>
                {data.nextBillingAt ? new Date(data.nextBillingAt).toLocaleDateString('pt-BR') : 'Não agendada'}
              </strong>
            </div>
            {data.features.length > 0 && (
              <div className="billing-inclusions">
                <h3>O que está incluso</h3>
                <ul className="billing-features">
                  {data.features.map((feature) => (
                    <li key={feature}><Check size={14} aria-hidden />{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            {showCancel ? (
              <div className="billing-cancel">
                <p>O cancelamento é imediato na Abacate e interrompe as próximas cobranças.</p>
                <button
                  type="button"
                  className="btn billing-cancel-btn"
                  disabled={cancel.isPending}
                  onClick={() => setCancelOpen(true)}
                >
                  {cancel.isPending ? 'Cancelando...' : 'Cancelar assinatura'}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <div className="billing-side">
          <section className="glass-card billing-upgrade" aria-labelledby="billing-plans-title">
            <h2 id="billing-plans-title" className="billing-section-title">Escolher plano</h2>
            <p className="billing-section-description">Compare os planos para o seu consultório.</p>
            <label className="billing-coupon" htmlFor="billing-coupon">
              <span className="billing-coupon-label">
                <TicketPercent size={16} aria-hidden />
                Cupom de desconto
              </span>
              <input
                id="billing-coupon"
                className="input-field"
                type="text"
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                placeholder="Ex.: BEMVINDO10"
                autoComplete="off"
                spellCheck={false}
              />
              <span className="billing-coupon-hint">
                Digite o código igual ao do painel da Abacate. Se já foi usado e o limite for 1, esgota — use maxRedeems -1
                para testes. Com cupom, o checkout vai no cartão.
              </span>
            </label>
            <div className="billing-plan-options">
              {plans.map((plan) => {
                const isCurrent = data.status === 'ACTIVE' && data.planSlug === plan.slug;

                return (
                  <article key={plan.slug} className={`billing-plan-option${isCurrent ? ' is-current' : ''}`}>
                    <div>
                      <div className="billing-option-heading">
                        <h3>{plan.name}</h3>
                        {plan.highlighted && !isCurrent && <span className="billing-plan-tag">Recomendado</span>}
                      </div>
                      <p>{plan.description}</p>
                      <div className="billing-option-price">
                        {plan.listPriceCents > plan.priceCents && <del>{moneyFromCents(plan.listPriceCents)}</del>}
                        <span><strong>{moneyFromCents(plan.priceCents)}</strong><span className="billing-period">/mês</span></span>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="billing-plan-tag"><Check size={14} aria-hidden />Plano atual</span>
                    ) : plan.checkoutEnabled ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={subscribe.isPending}
                        onClick={() => startCheckout(plan.slug)}
                      >
                        Assinar {plan.name}
                        <ArrowUpRight size={15} aria-hidden />
                      </button>
                    ) : (
                      <span className="billing-plan-tag billing-plan-tag-soon">Em breve</span>
                    )}
                  </article>
                );
              })}
            </div>
            <p className="billing-payment-note">
              <CreditCard size={16} aria-hidden />
              <span>
                {coupon.trim()
                  ? 'Cupom aplicado: pagamento no cartão no checkout da Abacate.'
                  : 'Pagamento por cartão ou Pix Automático. Informe um cupom acima se tiver.'}
              </span>
            </p>
          </section>

          <section className="glass-card billing-history" aria-labelledby="billing-invoices-title">
            <h2 id="billing-invoices-title" className="billing-section-title">Faturas</h2>
            {invoices.isLoading ? (
              <LoadingState label="Carregando faturas..." />
            ) : invoices.isError ? (
              <ErrorState onRetry={() => invoices.refetch()} />
            ) : invoices.data?.length ? (
              <div className="table-wrap">
                <table className="data-table" aria-labelledby="billing-invoices-title">
                  <thead>
                    <tr>
                      <th scope="col">Data</th>
                      <th scope="col">Valor</th>
                      <th scope="col">Status</th>
                      <th scope="col">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.data.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{new Date(invoice.issuedAt).toLocaleDateString('pt-BR')}</td>
                        <td>{money(invoice.amount, data.currency)}</td>
                        <td>{invoiceStatusLabel(invoice.status)}</td>
                        <td>
                          {invoice.invoiceUrl ? (
                            <a href={invoice.invoiceUrl} target="_blank" rel="noreferrer">
                              Abrir
                            </a>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="billing-invoices-empty">
                <span className="billing-invoices-icon"><ReceiptText size={21} aria-hidden /></span>
                <div>
                  <p>Nenhuma fatura ainda</p>
                  <span>Suas faturas aparecem aqui após a primeira cobrança.</span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {cancelOpen ? (
        <ConfirmDialog
          title="Cancelar assinatura"
          danger
          confirmLabel="Cancelar assinatura"
          busy={cancel.isPending}
          message={
            <p>
              Cancelar a assinatura agora? A Abacate encerra a cobrança imediatamente e novas renovações não serão
              geradas.
            </p>
          }
          onCancel={() => setCancelOpen(false)}
          onConfirm={cancelSubscription}
        />
      ) : null}
    </div>
  );
}
