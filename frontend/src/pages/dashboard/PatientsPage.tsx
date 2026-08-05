import { useState } from 'react';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { Modal } from '../../components/Modal';
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

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const patients = usePatients(useDebouncedValue(search), page);
  const create = useCreatePatient();
  const form = useForm<PatientForm>({ resolver: zodResolver(schema) });

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
      <div className="page-header">
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-subtitle">Cadastros, contatos e prontuário completo.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          Novo paciente
        </button>
      </div>

      <div className="patients-toolbar">
        <input
          className="input-field search-field"
          placeholder="Buscar por nome, telefone ou CPF"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
      </div>

      {patients.isLoading ? (
        <LoadingState />
      ) : patients.isError ? (
        <ErrorState onRetry={() => patients.refetch()} />
      ) : patients.data?.content.length ? (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Telefone</th>
                  <th>CPF</th>
                  <th>E-mail</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {patients.data.content.map((patient) => (
                  <tr key={patient.id}>
                    <td className="patient-name">{patient.name}</td>
                    <td>{patient.phone}</td>
                    <td>{patient.cpf ?? '—'}</td>
                    <td>{patient.email ?? '—'}</td>
                    <td>
                      <Link className="btn btn-ghost btn-sm" to={`/patients/${patient.id}`}>
                        Abrir ficha
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <input placeholder="11999999999" {...form.register('phone')} />
              <small>{form.formState.errors.phone?.message}</small>
            </label>
            <label>
              CPF
              <input placeholder="000.000.000-00" {...form.register('cpf')} />
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
