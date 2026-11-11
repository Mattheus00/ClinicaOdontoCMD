import { useDataReadyMetric } from '../../lib/performance';
import { Pagination } from '../../components/Pagination';
import { useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useParams, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ErrorState, LoadingState, RefreshState } from '../../components/AsyncState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DateInput } from '../../components/DateInput';
import { MoneyInput } from '../../components/MoneyInput';
import { DentalChartWorkspace } from '../../components/dental-chart/DentalChartWorkspace';
import { useProfessionals } from '../../features/professionals/api';
import {
  useAnamnesis,
  useCreatePatientPayment,
  useCreateTreatmentPlan,
  usePatientAppointments,
  usePatientPayments,
  usePatientSummary,
  useSaveAnamnesis,
  useTreatmentPlans,
  useUpdatePatient,
} from '../../features/patients/api';
import type { Anamnesis, Patient, PatientInput } from '../../api/types';
import { validateCpf } from '../../lib/cpf';
import { maskCpf, maskPhone, withMask } from '../../lib/masks';
import { notifyError, notifySuccess } from '../../lib/notify';
import './PatientDetailPage.css';

const phoneSchema = z.string().refine(
  (value) => value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 13,
  'Informe um telefone válido.',
);

const optionalCpfSchema = z
  .string()
  .optional()
  .refine((value) => !value?.trim() || validateCpf(value), 'Informe um CPF válido.');

const patientCadastroSchema = z.object({
  name: z.string().min(2, 'Informe o nome completo.'),
  phone: phoneSchema,
  phoneIsWhatsapp: z.boolean().optional(),
  email: z.string().email('Informe um e-mail válido.').or(z.literal('')),
  cpf: optionalCpfSchema,
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
  guardianCpf: optionalCpfSchema,
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
    phone: maskPhone(patient.phone),
    phoneIsWhatsapp: patient.phoneIsWhatsapp ?? true,
    email: patient.email ?? '',
    cpf: maskCpf(patient.cpf ?? ''),
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
    guardianPhone: maskPhone(patient.guardianPhone ?? ''),
    guardianCpf: maskCpf(patient.guardianCpf ?? ''),
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

type Tab = 'cadastro' | 'anamnese' | 'odontograma' | 'consultas' | 'financeiro';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'cadastro', label: 'Cadastro' },
  { id: 'anamnese', label: 'Anamnese' },
  { id: 'odontograma', label: 'Odontograma' },
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

const TREATMENT_PLAN_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho',
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  CANCELLED: 'Cancelado',
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  PIX: 'PIX',
  CASH: 'Dinheiro',
  CARD: 'Cartão',
  BOLETO: 'Boleto',
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Estornado',
};

function tabFromSearchParams(params: URLSearchParams): Tab {
  const candidate = params.get('tab');
  return TABS.some((item) => item.id === candidate) ? (candidate as Tab) : 'cadastro';
}

function writeTabToParams(params: URLSearchParams, next: Tab): URLSearchParams {
  const copy = new URLSearchParams(params);
  if (next === 'cadastro') copy.delete('tab');
  else copy.set('tab', next);
  return copy;
}

export default function PatientDetailPage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => tabFromSearchParams(searchParams));
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const syncingFromUrl = useRef(false);

  const [paymentPage, setPaymentPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const summary = usePatientSummary(id);
  useDataReadyMetric("PatientDetailPage", Boolean(summary.data));
  const patient = { ...summary, data: summary.data?.patient };
  const dentists = useProfessionals(tab === 'cadastro');
  const update = useUpdatePatient(id);
  const anamnesis = useAnamnesis(id, tab === 'anamnese');
  const saveAnamnesis = useSaveAnamnesis(id);
  const billing = { ...summary, data: summary.data?.billing };
  const plans = useTreatmentPlans(id, tab === 'financeiro');
  const createPlan = useCreateTreatmentPlan(id);
  const payments = usePatientPayments(id, tab === 'financeiro', paymentPage);
  const createPayment = useCreatePatientPayment(id);
  const history = usePatientAppointments(id, tab === 'consultas', historyPage);

  const cadastroForm = useForm<PatientCadastroForm>({
    resolver: zodResolver(patientCadastroSchema),
    defaultValues: {
      name: '',
      phone: '',
      phoneIsWhatsapp: true,
      email: '',
    },
  });
  const phoneField = cadastroForm.register('phone');
  const cpfField = cadastroForm.register('cpf');
  const guardianPhoneField = cadastroForm.register('guardianPhone');
  const guardianCpfField = cadastroForm.register('guardianCpf');
  const anamnesisForm = useForm<Anamnesis>();
  const planForm = useForm<{ title: string; dueDate?: string; description: string; unitPrice: number; status: string }>({
    defaultValues: { status: 'PENDING', unitPrice: 0, title: '', description: '' },
  });
  const paymentForm = useForm<{ amount: number; method: string; notes?: string }>({
    defaultValues: { method: 'PIX', amount: 0 },
  });

  const cadastroDirty = tab === 'cadastro' && cadastroForm.formState.isDirty;
  const anamnesisDirty = tab === 'anamnese' && anamnesisForm.formState.isDirty;
  const recordDirty = cadastroDirty || anamnesisDirty;

  const blocker = useBlocker(recordDirty);

  useEffect(() => {
    if (!recordDirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [recordDirty]);

  useEffect(() => {
    if (blocker.state === 'blocked') setLeaveConfirm(true);
  }, [blocker.state]);

  const applyTab = (next: Tab) => {
    setTab(next);
    syncingFromUrl.current = true;
    setSearchParams((current) => writeTabToParams(current, next), { replace: true });
    window.setTimeout(() => {
      syncingFromUrl.current = false;
    }, 0);
  };

  const requestTab = (next: Tab) => {
    if (next === tab) return;
    if (recordDirty) {
      setPendingTab(next);
      return;
    }
    applyTab(next);
  };

  useEffect(() => {
    if (syncingFromUrl.current) return;
    const urlTab = tabFromSearchParams(searchParams);
    if (urlTab === tab) return;
    if (recordDirty) {
      setPendingTab(urlTab);
      syncingFromUrl.current = true;
      setSearchParams((current) => writeTabToParams(current, tab), { replace: true });
      window.setTimeout(() => {
        syncingFromUrl.current = false;
      }, 0);
      return;
    }
    setTab(urlTab);
  }, [searchParams, tab, recordDirty, setSearchParams]);

  useEffect(() => {
    if (patient.data) {
      if (!cadastroForm.formState.isDirty) cadastroForm.reset(mapPatientToForm(patient.data));
    }
  }, [patient.data, cadastroForm]);

  useEffect(() => {
    if (anamnesis.data && !anamnesisForm.formState.isDirty) anamnesisForm.reset(anamnesis.data);
  }, [anamnesis.data, anamnesisForm]);

  if (patient.isLoading) return <LoadingState />;
  if (!patient.data) return <ErrorState onRetry={() => patient.refetch()} />;

  const data = patient.data;

  const handleSaveCadastro = cadastroForm.handleSubmit(
    async (values) => {
      const saved = await update.mutateAsync(buildPatientPayload(values));
      cadastroForm.reset(mapPatientToForm(saved));
      notifySuccess('Cadastro salvo com sucesso.');
    },
    () => {
      notifyError('Revise os campos destacados antes de salvar.');
    },
  );

  const confirmDiscardTab = () => {
    if (!pendingTab) return;
    if (tab === 'cadastro') cadastroForm.reset(patient.data ? mapPatientToForm(patient.data) : undefined);
    else if (tab === 'anamnese' && anamnesis.data) anamnesisForm.reset(anamnesis.data);
    applyTab(pendingTab);
    setPendingTab(null);
  };

  return (
    <div className="patient-detail">
      <RefreshState fetching={summary.isFetching} error={summary.isError} onRetry={() => summary.refetch()} />
      <div className="page-header">
        <div>
          <Link to="/patients" className="patient-back">
            ← Voltar para pacientes
          </Link>
          <h1 className="page-title">{data.name}</h1>
          <p className="page-subtitle">
            {maskPhone(data.phone)}
            {data.cpf ? ` · CPF ${maskCpf(data.cpf)}` : ''}
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
            <span>Última consulta realizada</span>
            <strong>
              {summary.data.lastVisitAt
                ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
                    new Date(summary.data.lastVisitAt),
                  )
                : '—'}
            </strong>
          </article>
          {summary.data.billing.draft != null ? (
            <article>
              <span>Em rascunho</span>
              <strong>{money(summary.data.billing.draft)}</strong>
            </article>
          ) : null}
        </div>
      )}

      <div className="patient-tabs" role="tablist" aria-label="Seções do prontuário">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`patient-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls="patient-details-panel"
            tabIndex={tab === item.id ? 0 : -1}
            onKeyDown={event => {
              const index = TABS.findIndex(candidate => candidate.id === item.id);
              let next = index;
              if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
              else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
              else if (event.key === 'Home') next = 0;
              else if (event.key === 'End') next = TABS.length - 1;
              else return;
              event.preventDefault();
              requestTab(TABS[next].id);
              document.getElementById(`patient-tab-${TABS[next].id}`)?.focus();
            }}
            className={`patient-tab ${tab === item.id ? 'is-active' : ''}`}
            onClick={() => requestTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="patient-panel" role="tabpanel" id="patient-details-panel" aria-labelledby={`patient-tab-${tab}`} tabIndex={0}>
        {tab === 'odontograma' && <DentalChartWorkspace key={id} patientId={id} />}

        {tab === 'cadastro' && (
          <form className="form-grid patient-form" noValidate onSubmit={handleSaveCadastro}>
            <details open className="patient-form-section full-width">
              <summary className="section-title">Contato</summary>
            <label>
              Nome completo
              <input {...cadastroForm.register('name')} />
              <small>{cadastroForm.formState.errors.name?.message}</small>
            </label>
            <label>
              Telefone
              <input
                inputMode="tel"
                placeholder="(11) 99999-9999"
                {...phoneField}
                onChange={withMask(maskPhone, phoneField.onChange)}
              />
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
            </details>

            <details className="patient-form-section full-width">
              <summary className="section-title">Documentos</summary>
            <label>
              CPF
              <input
                inputMode="numeric"
                placeholder="000.000.000-00"
                {...cpfField}
                onChange={withMask(maskCpf, cpfField.onChange)}
              />
            </label>
            <label>
              RG
              <input {...cadastroForm.register('rg')} />
            </label>
            <label>
              Nascimento
              <Controller
                name="birthDate"
                control={cadastroForm.control}
                render={({ field }) => (
                  <DateInput
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
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
            </details>

            <details className="patient-form-section full-width">
              <summary className="section-title">Endereço</summary>
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
            </details>

            <details className="patient-form-section full-width">
              <summary className="section-title">Responsável (menor de idade)</summary>
            <label>
              Nome
              <input {...cadastroForm.register('guardianName')} />
            </label>
            <label>
              Telefone
              <input
                inputMode="tel"
                placeholder="(11) 99999-9999"
                {...guardianPhoneField}
                onChange={withMask(maskPhone, guardianPhoneField.onChange)}
              />
            </label>
            <label>
              CPF
              <input
                inputMode="numeric"
                placeholder="000.000.000-00"
                {...guardianCpfField}
                onChange={withMask(maskCpf, guardianCpfField.onChange)}
              />
            </label>
            </details>

            <details className="patient-form-section full-width">
              <summary className="section-title">Origem e preferências</summary>
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
            </details>
          </form>
        )}

        {tab === 'anamnese' && (
          <form
            className="form-grid patient-form"
            onSubmit={anamnesisForm.handleSubmit(async (values) => {
              await saveAnamnesis.mutateAsync(values);
              anamnesisForm.reset(values);
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

            <RefreshState fetching={history.isRefetching} error={history.isError && Boolean(history.data)} onRetry={() => history.refetch()} />
            <Pagination data={history.data} page={historyPage} onChange={setHistoryPage} busy={history.isFetching} />
            {history.isLoading ? (
              <LoadingState />
            ) : history.isError && !history.data ? <ErrorState onRetry={() => history.refetch()} /> : history.data?.content.length ? (
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
                    {history.data.content.map((item) => {
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
              {billing.data?.draft != null ? (
                <article>
                  <span>Em rascunho</span>
                  <strong>{money(billing.data.draft)}</strong>
                </article>
              ) : null}
              <article>
                <span>Pago</span>
                <strong>{money(billing.data?.paid)}</strong>
              </article>
              <article>
                <span>Em atraso</span>
                <strong>{money(billing.data?.overdue)}</strong>
              </article>
            </div>

            <div className="split-panel finance-forms">
              <form
                className="form-grid patient-form finance-card"
                onSubmit={planForm.handleSubmit(async (values) => {
                  await createPlan.mutateAsync({
                    title: values.title,
                    dueDate: values.dueDate,
                    status: values.status,
                    items: [{ description: values.description, quantity: 1, unitPrice: Number(values.unitPrice) }],
                  });
                  planForm.reset({ status: 'PENDING', unitPrice: 0, title: '', description: '' });
                  notifySuccess('Orçamento criado com sucesso.');
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
                  <Controller
                    name="unitPrice"
                    control={planForm.control}
                    rules={{ required: true, min: 0.01 }}
                    render={({ field }) => (
                      <MoneyInput
                        value={field.value}
                        onValueChange={(next) => field.onChange(next ?? 0)}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </label>
                <label>
                  Vencimento
                  <Controller
                    name="dueDate"
                    control={planForm.control}
                    render={({ field }) => (
                      <DateInput
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </label>
                <label>
                  Status
                  <select {...planForm.register('status')}>
                    <option value="DRAFT">Rascunho</option>
                    <option value="PENDING">Pendente</option>
                    <option value="APPROVED">Aprovado</option>
                  </select>
                </label>
                <button className="btn btn-primary" disabled={createPlan.isPending}>
                  {createPlan.isPending ? 'Salvando...' : 'Criar orçamento'}
                </button>
              </form>

              <form
                className="form-grid patient-form finance-card"
                onSubmit={paymentForm.handleSubmit(async (values) => {
                  await createPayment.mutateAsync({ ...values, amount: Number(values.amount) });
                  paymentForm.reset({ method: 'PIX', amount: 0 });
                  notifySuccess('Pagamento registrado com sucesso.');
                })}
              >
                <h3 className="full-width section-title">Registrar pagamento</h3>
                <label>
                  Valor
                  <Controller
                    name="amount"
                    control={paymentForm.control}
                    rules={{ required: true, min: 0.01 }}
                    render={({ field }) => (
                      <MoneyInput
                        value={field.value}
                        onValueChange={(next) => field.onChange(next ?? 0)}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
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
                <button className="btn btn-primary" disabled={createPayment.isPending}>
                  {createPayment.isPending ? 'Salvando...' : 'Lançar pagamento'}
                </button>
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
                      {TREATMENT_PLAN_STATUS_LABEL[plan.status] ?? plan.status}
                      {plan.dueDate ? ` · vence ${plan.dueDate}` : ''}
                    </span>
                  </article>
                ))}
              </div>
              <div className="history-list">
                <h3 className="section-title">Pagamentos</h3>
                <RefreshState fetching={payments.isFetching} error={payments.isError && Boolean(payments.data)} onRetry={() => payments.refetch()} />
                {payments.isError && !payments.data && <ErrorState onRetry={() => payments.refetch()} />}
                <Pagination data={payments.data} page={paymentPage} onChange={setPaymentPage} busy={payments.isFetching} />
                {payments.data?.content.map((payment) => (
                  <article key={payment.id}>
                    <strong>{money(payment.amount)}</strong>
                    <span>
                      {PAYMENT_METHOD_LABEL[payment.method] ?? payment.method} ·{' '}
                      {PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}
                    </span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {pendingTab ? (
        <ConfirmDialog
          title="Descartar alterações?"
          message="Você tem alterações não salvas nesta aba. Se continuar, elas serão perdidas."
          confirmLabel="Descartar e continuar"
          danger
          onConfirm={confirmDiscardTab}
          onCancel={() => setPendingTab(null)}
        />
      ) : null}

      {leaveConfirm && blocker.state === 'blocked' ? (
        <ConfirmDialog
          title="Sair sem salvar?"
          message="Você tem alterações não salvas. Deseja sair sem salvar?"
          confirmLabel="Sair sem salvar"
          danger
          onConfirm={() => {
            setLeaveConfirm(false);
            blocker.proceed?.();
          }}
          onCancel={() => {
            setLeaveConfirm(false);
            blocker.reset?.();
          }}
        />
      ) : null}
    </div>
  );
}
