import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ErrorState, LoadingState } from '../../components/AsyncState';
import { useProfessionals } from '../../features/professionals/api';
import {
  useAnamnesis,
  useBillingSummary,
  useCreatePatientInsurance,
  useCreatePatientPayment,
  useCreateTreatmentPlan,
  usePatient,
  usePatientAppointments,
  usePatientInsurances,
  usePatientPayments,
  usePatientSummary,
  useSaveAnamnesis,
  useTreatmentPlans,
  useUpdatePatient,
} from '../../features/patients/api';
import type { Anamnesis, Patient, PatientInput } from '../../api/types';
import './PatientDetailPage.css';

const phoneSchema = z.string().refine(
  (value) => value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 13,
  'Informe um telefone válido.',
);

const patientCadastroSchema = z.object({
  name: z.string().min(2, 'Informe o nome completo.'),
  phone: phoneSchema,
  phoneIsWhatsapp: z.boolean().optional(),
  email: z.string().email('Informe um e-mail válido.').or(z.literal('')),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressDistrict: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianCpf: z.string().optional(),
  referralSource: z.string().optional(),
  referralNotes: z.string().optional(),
  notes: z.string().optional(),
  preferredProfessionalId: z.string().optional(),
  preferredTimeNotes: z.string().optional(),
});

type PatientCadastroForm = z.infer<typeof patientCadastroSchema>;

function mapPatientToForm(patient: Patient): PatientCadastroForm {
  return {
    name: patient.name,
    phone: patient.phone,
    phoneIsWhatsapp: patient.phoneIsWhatsapp ?? true,
    email: patient.email ?? '',
    cpf: patient.cpf ?? '',
    rg: patient.rg ?? '',
    birthDate: patient.birthDate ?? '',
    gender: patient.gender ?? '',
    addressStreet: patient.addressStreet ?? '',
    addressNumber: patient.addressNumber ?? '',
    addressComplement: patient.addressComplement ?? '',
    addressDistrict: patient.addressDistrict ?? '',
    addressCity: patient.addressCity ?? '',
    addressState: patient.addressState ?? '',
    addressZip: patient.addressZip ?? '',
    guardianName: patient.guardianName ?? '',
    guardianPhone: patient.guardianPhone ?? '',
    guardianCpf: patient.guardianCpf ?? '',
    referralSource: patient.referralSource ?? '',
    referralNotes: patient.referralNotes ?? '',
    notes: patient.notes ?? '',
    preferredProfessionalId: patient.preferredProfessionalId ?? '',
    preferredTimeNotes: patient.preferredTimeNotes ?? '',
  };
}

function buildPatientPayload(values: PatientCadastroForm): PatientInput {
  const optional = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  };

  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    phoneIsWhatsapp: values.phoneIsWhatsapp ?? true,
    email: optional(values.email),
    cpf: optional(values.cpf),
    rg: optional(values.rg),
    birthDate: optional(values.birthDate),
    gender: optional(values.gender),
    addressStreet: optional(values.addressStreet),
    addressNumber: optional(values.addressNumber),
    addressComplement: optional(values.addressComplement),
    addressDistrict: optional(values.addressDistrict),
    addressCity: optional(values.addressCity),
    addressState: optional(values.addressState),
    addressZip: optional(values.addressZip),
    guardianName: optional(values.guardianName),
    guardianPhone: optional(values.guardianPhone),
    guardianCpf: optional(values.guardianCpf),
    referralSource: optional(values.referralSource),
    referralNotes: optional(values.referralNotes),
    notes: optional(values.notes),
    preferredProfessionalId: values.preferredProfessionalId?.trim() || null,
    preferredTimeNotes: optional(values.preferredTimeNotes),
  };
}

type Tab = 'cadastro' | 'anamnese' | 'consultas' | 'financeiro';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'cadastro', label: 'Cadastro' },
  { id: 'anamnese', label: 'Anamnese' },
  { id: 'consultas', label: 'Consultas' },
  { id: 'financeiro', label: 'Financeiro' },
];

const APPOINTMENT_STATUS: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: 'Agendada', className: 'badge-info' },
  CONFIRMED: { label: 'Confirmada', className: 'badge-success' },
  COMPLETED: { label: 'Realizada', className: 'badge-success' },
  CANCELLED: { label: 'Cancelada', className: 'badge-danger' },
  NO_SHOW: { label: 'Faltou', className: 'badge-warning' },
  pending: { label: 'Pendente', className: 'badge-warning' },
};

const money = (value?: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);

export default function PatientDetailPage() {
  const { id = '' } = useParams();
  const [tab, setTab] = useState<Tab>('cadastro');

  const patient = usePatient(id);
  const summary = usePatientSummary(id);
  const dentists = useProfessionals(tab === 'cadastro');
  const update = useUpdatePatient(id);
  const anamnesis = useAnamnesis(id, tab === 'anamnese');
  const saveAnamnesis = useSaveAnamnesis(id);
  const billing = useBillingSummary(id, tab === 'financeiro');
  const plans = useTreatmentPlans(id, tab === 'financeiro');
  const createPlan = useCreateTreatmentPlan(id);
  const payments = usePatientPayments(id, tab === 'financeiro');
  const createPayment = useCreatePatientPayment(id);
  const insurances = usePatientInsurances(id, tab === 'financeiro');
  const createInsurance = useCreatePatientInsurance(id);
  const history = usePatientAppointments(id, tab === 'consultas');

  const cadastroForm = useForm<PatientCadastroForm>({
    resolver: zodResolver(patientCadastroSchema),
    defaultValues: {
      name: '',
      phone: '',
      phoneIsWhatsapp: true,
      email: '',
    },
  });
  const anamnesisForm = useForm<Anamnesis>();
  const planForm = useForm<{ title: string; dueDate?: string; description: string; unitPrice: number; status: string }>();
  const paymentForm = useForm<{ amount: number; method: string; notes?: string }>();
  const insuranceForm = useForm<{ providerName: string; planName?: string; cardNumber?: string }>();

  useEffect(() => {
    if (patient.data) {
      cadastroForm.reset(mapPatientToForm(patient.data));
    }
  }, [patient.data, cadastroForm]);

  useEffect(() => {
    if (anamnesis.data) anamnesisForm.reset(anamnesis.data);
  }, [anamnesis.data, anamnesisForm]);

  if (patient.isLoading) return <LoadingState />;
  if (patient.isError || !patient.data) return <ErrorState onRetry={() => patient.refetch()} />;

  const data = patient.data;

  const handleSaveCadastro = cadastroForm.handleSubmit(
    async (values) => {
      await update.mutateAsync(buildPatientPayload(values));
      window.dispatchEvent(new CustomEvent('app:api-error', {
        detail: { message: 'Cadastro salvo com sucesso.' },
      }));
    },
    () => {
      window.dispatchEvent(new CustomEvent('app:api-error', {
        detail: { message: 'Revise os campos destacados antes de salvar.' },
      }));
    },
  );

  return (
    <div className="patient-detail">
      <div className="page-header">
        <div>
          <Link to="/patients" className="patient-back">
            ← Voltar para pacientes
          </Link>
          <h1 className="page-title">{data.name}</h1>
          <p className="page-subtitle">
            {data.phone}
            {data.cpf ? ` · CPF ${data.cpf}` : ''}
            {summary.data?.hasAllergies ? ' · Alergias registradas' : ''}
            {summary.data?.pregnantFlag ? ' · Gestante' : ''}
          </p>
        </div>
        {tab === 'cadastro' && (
          <button type="button" className="btn btn-primary" onClick={handleSaveCadastro} disabled={update.isPending}>
            {update.isPending ? 'Salvando...' : 'Salvar cadastro'}
          </button>
        )}
      </div>

      {summary.data && (
        <div className="patient-summary-cards">
          <article>
            <span>Saldo em aberto</span>
            <strong>{money(summary.data.billing.openBalance)}</strong>
          </article>
          <article>
            <span>Em atraso</span>
            <strong>{money(summary.data.billing.overdue)}</strong>
          </article>
          <article>
            <span>Última consulta</span>
            <strong>
              {summary.data.lastVisitAt
                ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
                    new Date(summary.data.lastVisitAt),
                  )
                : '—'}
            </strong>
          </article>
        </div>
      )}

      <div className="patient-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className={`patient-tab ${tab === item.id ? 'is-active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="patient-panel">
        {tab === 'cadastro' && (
          <form className="form-grid patient-form" noValidate onSubmit={handleSaveCadastro}>
            <h3 className="full-width section-title">Contato</h3>
            <label>
              Nome completo
              <input {...cadastroForm.register('name')} />
              <small>{cadastroForm.formState.errors.name?.message}</small>
            </label>
            <label>
              Telefone
              <input {...cadastroForm.register('phone')} />
              <small>{cadastroForm.formState.errors.phone?.message}</small>
            </label>
            <label>
              E-mail
              <input type="email" {...cadastroForm.register('email')} />
              <small>{cadastroForm.formState.errors.email?.message}</small>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" {...cadastroForm.register('phoneIsWhatsapp')} />
              Telefone é WhatsApp
            </label>

            <h3 className="full-width section-title">Documentos</h3>
            <label>
              CPF
              <input {...cadastroForm.register('cpf')} />
            </label>
            <label>
              RG
              <input {...cadastroForm.register('rg')} />
            </label>
            <label>
              Nascimento
              <input type="date" {...cadastroForm.register('birthDate')} />
            </label>
            <label>
              Gênero
              <select {...cadastroForm.register('gender')}>
                <option value="">Não informado</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="O">Outro</option>
              </select>
            </label>

            <h3 className="full-width section-title">Endereço</h3>
            <label className="full-width">
              Rua
              <input {...cadastroForm.register('addressStreet')} />
            </label>
            <label>
              Número
              <input {...cadastroForm.register('addressNumber')} />
            </label>
            <label>
              Complemento
              <input {...cadastroForm.register('addressComplement')} />
            </label>
            <label>
              Bairro
              <input {...cadastroForm.register('addressDistrict')} />
            </label>
            <label>
              Cidade
              <input {...cadastroForm.register('addressCity')} />
            </label>
            <label>
              UF
              <input maxLength={2} {...cadastroForm.register('addressState')} />
            </label>
            <label>
              CEP
              <input {...cadastroForm.register('addressZip')} />
            </label>

            <h3 className="full-width section-title">Responsável (menor de idade)</h3>
            <label>
              Nome
              <input {...cadastroForm.register('guardianName')} />
            </label>
            <label>
              Telefone
              <input {...cadastroForm.register('guardianPhone')} />
            </label>
            <label>
              CPF
              <input {...cadastroForm.register('guardianCpf')} />
            </label>

            <h3 className="full-width section-title">Origem e preferências</h3>
            <label>
              Como conheceu
              <select {...cadastroForm.register('referralSource')}>
                <option value="">Selecione</option>
                <option value="indicacao">Indicação</option>
                <option value="instagram">Instagram</option>
                <option value="google">Google</option>
                <option value="convenio">Convênio</option>
                <option value="outro">Outro</option>
              </select>
            </label>
            <label>
              Detalhe da origem
              <input {...cadastroForm.register('referralNotes')} />
            </label>
            <label>
              Dentista preferido
              <select {...cadastroForm.register('preferredProfessionalId')}>
                <option value="">Nenhum</option>
                {dentists.data?.content.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preferência de horário
              <input {...cadastroForm.register('preferredTimeNotes')} placeholder="Ex.: manhãs, após 18h" />
            </label>
            <label className="full-width">
              Observações
              <textarea rows={3} {...cadastroForm.register('notes')} />
            </label>
            <div className="dashboard-form-actions full-width">
              <button type="submit" className="btn btn-primary" disabled={update.isPending}>
                {update.isPending ? 'Salvando...' : 'Salvar cadastro'}
              </button>
            </div>
          </form>
        )}

        {tab === 'anamnese' && (
          <form
            className="form-grid patient-form"
            onSubmit={anamnesisForm.handleSubmit(async (values) => {
              await saveAnamnesis.mutateAsync(values);
            })}
          >
            <label className="full-width">
              Alergias
              <textarea rows={2} placeholder="Anestésicos, látex, medicamentos..." {...anamnesisForm.register('allergies')} />
            </label>
            <label className="full-width">
              Doenças pré-existentes
              <textarea rows={2} placeholder="Diabetes, hipertensão, cardíacas..." {...anamnesisForm.register('preexistingConditions')} />
            </label>
            <label className="full-width">
              Medicamentos contínuos
              <textarea rows={2} {...anamnesisForm.register('continuousMedications')} />
            </label>
            <label className="checkbox-field">
              <input type="checkbox" {...anamnesisForm.register('isPregnant')} />
              Gestante
            </label>
            <label>
              Notas de gestação
              <input {...anamnesisForm.register('pregnancyNotes')} />
            </label>
            <label className="checkbox-field">
              <input type="checkbox" {...anamnesisForm.register('isSmoker')} />
              Fumante
            </label>
            <label className="checkbox-field">
              <input type="checkbox" {...anamnesisForm.register('hasBruxism')} />
              Bruxismo
            </label>
            <label className="full-width">
              Hábitos
              <textarea rows={2} {...anamnesisForm.register('habitsNotes')} />
            </label>
            <label className="full-width">
              Observações clínicas
              <textarea rows={3} {...anamnesisForm.register('clinicalNotes')} />
            </label>
            <div className="modal-actions full-width">
              <button className="btn btn-primary" disabled={saveAnamnesis.isPending}>
                {saveAnamnesis.isPending ? 'Salvando...' : 'Salvar anamnese'}
              </button>
            </div>
          </form>
        )}

        {tab === 'consultas' && (
          <div className="consultas-panel">
            <div className="consultas-header">
              <div>
                <h3 className="section-title">Histórico de consultas</h3>
                <p className="page-subtitle">
                  Agendamentos e relatórios clínicos deste paciente — útil quando outro dentista assume o atendimento.
                </p>
              </div>
              <Link className="btn btn-secondary btn-sm" to="/agenda">
                Ir para agenda
              </Link>
            </div>

            {history.isLoading ? (
              <LoadingState />
            ) : history.data?.length ? (
              <div className="table-wrap">
                <table className="data-table consultas-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Horário</th>
                      <th>Dentista</th>
                      <th>Status</th>
                      <th>Relatório</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.data.map((item) => {
                      const when = new Date(item.startsAt);
                      const status = APPOINTMENT_STATUS[item.status] ?? {
                        label: item.status,
                        className: 'badge-info',
                      };
                      return (
                        <tr key={item.id}>
                          <td>
                            {new Intl.DateTimeFormat('pt-BR', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }).format(when)}
                          </td>
                          <td>
                            {new Intl.DateTimeFormat('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(when)}
                          </td>
                          <td>{item.professionalName}</td>
                          <td>
                            <span className={`badge ${status.className}`}>{status.label}</span>
                          </td>
                          <td className="consulta-report-cell">
                            {item.report?.trim() ? (
                              <p className="consulta-report-text">{item.report}</p>
                            ) : (
                              <span className="consulta-report-empty">Sem relatório</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="page-subtitle">Nenhuma consulta encontrada para este paciente.</p>
            )}
          </div>
        )}

        {tab === 'financeiro' && (
          <div className="finance-panel">
            <div className="patient-summary-cards">
              <article>
                <span>Aprovado</span>
                <strong>{money(billing.data?.approved)}</strong>
              </article>
              <article>
                <span>Pendente</span>
                <strong>{money(billing.data?.pending)}</strong>
              </article>
              <article>
                <span>Pago</span>
                <strong>{money(billing.data?.paid)}</strong>
              </article>
              <article>
                <span>Em atraso</span>
                <strong>{money(billing.data?.overdue)}</strong>
              </article>
            </div>

            <div className="split-panel">
              <form
                className="form-grid patient-form"
                onSubmit={planForm.handleSubmit(async (values) => {
                  await createPlan.mutateAsync({
                    title: values.title,
                    dueDate: values.dueDate,
                    status: values.status,
                    items: [{ description: values.description, quantity: 1, unitPrice: Number(values.unitPrice) }],
                  });
                  planForm.reset({ status: 'PENDING', unitPrice: 0, title: '', description: '' });
                })}
              >
                <h3 className="full-width section-title">Novo orçamento</h3>
                <label className="full-width">
                  Título
                  <input {...planForm.register('title', { required: true })} />
                </label>
                <label className="full-width">
                  Item
                  <input {...planForm.register('description', { required: true })} />
                </label>
                <label>
                  Valor
                  <input type="number" step="0.01" {...planForm.register('unitPrice', { valueAsNumber: true, required: true })} />
                </label>
                <label>
                  Vencimento
                  <input type="date" {...planForm.register('dueDate')} />
                </label>
                <label>
                  Status
                  <select {...planForm.register('status')}>
                    <option value="DRAFT">Rascunho</option>
                    <option value="PENDING">Pendente</option>
                    <option value="APPROVED">Aprovado</option>
                  </select>
                </label>
                <button className="btn btn-primary">Criar orçamento</button>
              </form>

              <form
                className="form-grid patient-form"
                onSubmit={paymentForm.handleSubmit(async (values) => {
                  await createPayment.mutateAsync({ ...values, amount: Number(values.amount) });
                  paymentForm.reset({ method: 'PIX', amount: 0 });
                })}
              >
                <h3 className="full-width section-title">Registrar pagamento</h3>
                <label>
                  Valor
                  <input type="number" step="0.01" {...paymentForm.register('amount', { valueAsNumber: true, required: true })} />
                </label>
                <label>
                  Método
                  <select {...paymentForm.register('method')}>
                    <option value="PIX">PIX</option>
                    <option value="CASH">Dinheiro</option>
                    <option value="CARD">Cartão</option>
                    <option value="BOLETO">Boleto</option>
                  </select>
                </label>
                <label className="full-width">
                  Notas
                  <input {...paymentForm.register('notes')} />
                </label>
                <button className="btn btn-primary">Lançar pagamento</button>
              </form>
            </div>

            <div className="split-panel">
              <div className="history-list">
                <h3 className="section-title">Orçamentos</h3>
                {plans.data?.map((plan) => (
                  <article key={plan.id}>
                    <strong>
                      {plan.title} · {money(plan.totalAmount)}
                    </strong>
                    <span>
                      {plan.status}
                      {plan.dueDate ? ` · vence ${plan.dueDate}` : ''}
                    </span>
                  </article>
                ))}
              </div>
              <div className="history-list">
                <h3 className="section-title">Pagamentos</h3>
                {payments.data?.map((payment) => (
                  <article key={payment.id}>
                    <strong>{money(payment.amount)}</strong>
                    <span>
                      {payment.method} · {payment.status}
                    </span>
                  </article>
                ))}
              </div>
            </div>

            <form
              className="form-grid patient-form"
              onSubmit={insuranceForm.handleSubmit(async (values) => {
                await createInsurance.mutateAsync(values);
                insuranceForm.reset();
              })}
            >
              <h3 className="full-width section-title">Convênio</h3>
              <label>
                Operadora
                <input {...insuranceForm.register('providerName', { required: true })} />
              </label>
              <label>
                Plano
                <input {...insuranceForm.register('planName')} />
              </label>
              <label>
                Carteirinha
                <input {...insuranceForm.register('cardNumber')} />
              </label>
              <button className="btn btn-secondary">Salvar convênio</button>
            </form>
            <div className="history-list">
              {insurances.data?.map((item) => (
                <article key={item.id}>
                  <strong>{item.providerName}</strong>
                  <span>
                    {item.planName ?? '—'} · {item.status}
                  </span>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
