import { useDataReadyMetric } from '../../lib/performance';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Phone, Plus, Search, X } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { EmptyState, ErrorState, LoadingState, RefreshState } from '../../components/AsyncState';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/panel/PageHeader';
import { maskCpf, maskPhone, withMask } from '../../lib/masks';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { useCreatePatient, usePatients } from '../../features/patients/api';
import './PatientsPage.css';

const phoneSchema = z.string().refine(
  (value) => value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 13,
  'Informe um telefone válido.',
);

const schema = z.object({
  name: z.string().min(2, 'Informe o nome completo.'),
  phone: phoneSchema,
  email: z.string().email('Informe um e-mail válido.').or(z.literal('')),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  referralSource: z.string().optional(),
});

type PatientForm = z.infer<typeof schema>;

const AVATAR_TONE_COUNT = 6;

function patientInitial(name: string) {
  const letter = name.trim().charAt(0);
  return letter ? letter.toLocaleUpperCase('pt-BR') : '?';
}

function patientAvatarTone(name: string) {
  const normalized = name.trim().toLocaleLowerCase('pt-BR');
  let hash = 0;
  for (const char of normalized) {
    hash = (hash + char.charCodeAt(0)) % AVATAR_TONE_COUNT;
  }
  return hash;
}

function PatientAvatar({ name }: { name: string }) {
  return (
    <span
      className={`patient-avatar patient-avatar-tone-${patientAvatarTone(name)}`}
      aria-hidden="true"
    >
      {patientInitial(name)}
    </span>
  );
}

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const patients = usePatients(useDebouncedValue(search), page);
  useDataReadyMetric("PatientsPage", Boolean(patients.data));
  const create = useCreatePatient();
  const form = useForm<PatientForm>({ resolver: zodResolver(schema) });
  const phoneField = form.register('phone');
  const cpfField = form.register('cpf');

  const submit = form.handleSubmit(async (data) => {
    await create.mutateAsync({
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      cpf: data.cpf || undefined,
      birthDate: data.birthDate || undefined,
      referralSource: data.referralSource || undefined,
      phoneIsWhatsapp: true,
    });
    form.reset();
    setOpen(false);
  });

  return (
    <div>
      <RefreshState fetching={patients.isRefetching} error={patients.isError && Boolean(patients.data)} onRetry={() => patients.refetch()} />
      <PageHeader
        eyebrow="GESTÃO DE PACIENTES"
        title="Pacientes"
        description="Cadastros, contatos e prontuário completo."
        actions={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={18} /> Novo paciente
          </button>
        }
      />

      <div className="patients-toolbar">
        <label className="patients-search" htmlFor="patients-search">
          <Search size={18} aria-hidden="true" />
          <input
            id="patients-search"
            className="input-field search-field"
            placeholder="Buscar por nome, telefone ou CPF"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
          {search ? (
            <button
              type="button"
              className="patients-search-clear"
              aria-label="Limpar busca"
              onClick={() => {
                setSearch('');
                setPage(0);
              }}
            >
              <X size={16} />
            </button>
          ) : null}
        </label>
      </div>

      {patients.isLoading ? (
        <LoadingState />
      ) : patients.isError && !patients.data ? (
        <ErrorState onRetry={() => patients.refetch()} />
      ) : patients.data?.content.length ? (
        <>
          <div className="patients-queue" aria-label="Fila de cadastro de pacientes">
            {patients.data.content.map((patient) => {
              const tone = patientAvatarTone(patient.name);
              return (
                <Link
                  key={patient.id}
                  to={`/patients/${patient.id}`}
                  className={`patient-queue-card patient-queue-tone-${tone}`}
                  aria-label={`Abrir ficha de ${patient.name}`}
                >
                  <PatientAvatar name={patient.name} />
                  <div className="patient-queue-body">
                    <strong className="patient-queue-name">{patient.name}</strong>
                    <span className="patient-queue-meta">
                      <Phone size={14} aria-hidden="true" />
                      {maskPhone(patient.phone)}
                      {patient.cpf ? ` · ${maskCpf(patient.cpf)}` : null}
                    </span>
                  </div>
                  <ChevronRight
                    className="patient-queue-chevron"
                    size={20}
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>

          <div className="pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Anterior
            </button>
            <span>
              Página {page + 1} de {Math.max(patients.data.totalPages, 1)}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page + 1 >= patients.data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </button>
          </div>
        </>
      ) : (
        <EmptyState
          title="Nenhum paciente cadastrado"
          description="Cadastre o primeiro paciente da clínica."
          action={
            <button className="btn btn-primary" onClick={() => setOpen(true)}>
              Novo paciente
            </button>
          }
        />
      )}

      {open && (
        <Modal title="Novo paciente" onClose={() => setOpen(false)}>
          <form className="form-grid" onSubmit={submit}>
            <label>
              Nome completo
              <input {...form.register('name')} />
              <small>{form.formState.errors.name?.message}</small>
            </label>
            <label>
              Telefone / WhatsApp
              <input
                inputMode="tel"
                placeholder="(11) 99999-9999"
                {...phoneField}
                onChange={withMask(maskPhone, phoneField.onChange)}
              />
              <small>{form.formState.errors.phone?.message}</small>
            </label>
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
              Data de nascimento
              <input type="date" {...form.register('birthDate')} />
            </label>
            <label className="full-width">
              E-mail
              <input type="email" {...form.register('email')} />
              <small>{form.formState.errors.email?.message}</small>
            </label>
            <label className="full-width">
              Como conheceu a clínica
              <select {...form.register('referralSource')}>
                <option value="">Selecione</option>
                <option value="indicacao">Indicação</option>
                <option value="instagram">Instagram</option>
                <option value="google">Google</option>
                <option value="convenio">Convênio</option>
                <option value="outro">Outro</option>
              </select>
            </label>
            {create.isError && <p className="form-error">Não foi possível cadastrar o paciente.</p>}
            <div className="modal-actions full-width">
              <button className="btn btn-secondary" type="button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" disabled={create.isPending}>
                {create.isPending ? 'Salvando...' : 'Salvar paciente'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
