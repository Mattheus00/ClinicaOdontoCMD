import { useState, type FormEvent } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { Modal } from '../../components/Modal';
import {
  useCreateProfessional,
  useDeleteProfessional,
  useProfessionals,
  useRegenerateProfessionalInvite,
} from '../../features/professionals/api';
import { readApiError } from '../../lib/api-error';
import type { Professional } from '../../api/types';
import './DentistsPage.css';

type DeleteTarget = Pick<Professional, 'id' | 'name' | 'appointmentCount'>;

export default function DentistsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [latestInviteUrl, setLatestInviteUrl] = useState('');
  const [latestInviteName, setLatestInviteName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const dentists = useProfessionals();
  const create = useCreateProfessional();
  const regenerate = useRegenerateProfessionalInvite();
  const remove = useDeleteProfessional();

  const showInvite = (dentistName: string, url?: string | null) => {
    if (!url) return;
    setLatestInviteName(dentistName);
    setLatestInviteUrl(url);
    window.setTimeout(() => {
      document.getElementById('dentist-invite-link')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const dentistName = name.trim();
    create.mutate(
      { name: dentistName, email, specialty },
      {
        onSuccess: (data) => {
          setName('');
          setEmail('');
          setSpecialty('');
          showInvite(data.name || dentistName, data.inviteUrl);
        },
        onError: (error: unknown) => {
          window.dispatchEvent(new CustomEvent('app:api-error', {
            detail: { message: readApiError(error, 'Não foi possível cadastrar o dentista.') },
          }));
        },
      },
    );
  };

  const copyInvite = async (url: string) => {
    await navigator.clipboard.writeText(url);
    window.dispatchEvent(new CustomEvent('app:api-error', { detail: { message: 'Link copiado.' } }));
  };

  const handleRegenerateInvite = (dentist: { id: string; name: string; email?: string | null }) => {
    const emailOverride = dentist.email
      ? undefined
      : window.prompt('Este dentista não tem e-mail cadastrado. Informe o e-mail:')?.trim();
    if (!dentist.email && !emailOverride) return;

    regenerate.mutate(
      { id: dentist.id, email: emailOverride },
      {
        onSuccess: (data) => {
          showInvite(dentist.name, data.inviteUrl);
        },
        onError: (error: unknown) => {
          window.dispatchEvent(new CustomEvent('app:api-error', {
            detail: { message: readApiError(error, 'Não foi possível gerar o convite.') },
          }));
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        window.dispatchEvent(new CustomEvent('app:api-error', { detail: { message: 'Dentista excluído.' } }));
      },
      onError: (error: unknown) => {
        window.dispatchEvent(new CustomEvent('app:api-error', {
          detail: { message: readApiError(error, 'Não foi possível excluir o dentista.') },
        }));
      },
    });
  };

  const appointmentCount = deleteTarget?.appointmentCount ?? 0;

  return (
    <div className="dentists-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dentistas</h1>
          <p className="page-subtitle">Cadastre a equipe e envie o link de primeiro acesso.</p>
        </div>
      </div>

      <section className="glass-card dentists-form-card">
        <h2 className="card-section-title">Adicionar dentista</h2>
        <form className="dashboard-form" onSubmit={submit}>
          <label>
            Nome completo
            <input
              required
              className="input-field"
              placeholder="Ex.: Dra. Maria Alice"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            E-mail
            <input
              required
              type="email"
              className="input-field"
              placeholder="dentista@clinica.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Especialidade
            <input
              className="input-field"
              placeholder="Ex.: Ortodontia"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </label>

          {latestInviteUrl && (
            <div id="dentist-invite-link" className="dentist-invite-field">
              <span className="dentist-invite-label">Link de primeiro acesso</span>
              {latestInviteName ? (
                <p className="dentist-invite-success">
                  Link gerado para <strong>{latestInviteName}</strong>. Envie para o dentista concluir o cadastro.
                </p>
              ) : null}
              <div className="dentist-invite-row">
                <input className="input-field" readOnly value={latestInviteUrl} aria-label="Link de convite" />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => copyInvite(latestInviteUrl)}>
                  Copiar link
                </button>
              </div>
            </div>
          )}

          <div className="dashboard-form-actions">
            <button className="btn btn-primary" disabled={create.isPending}>
              {create.isPending ? 'Salvando...' : 'Cadastrar e gerar link'}
            </button>
          </div>
        </form>
      </section>

      {dentists.isLoading ? (
        <LoadingState />
      ) : dentists.isError ? (
        <ErrorState onRetry={() => dentists.refetch()} />
      ) : dentists.data?.content.length ? (
        <div className="table-wrap dentists-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Dentista</th>
                <th>E-mail</th>
                <th>Especialidade</th>
                <th>Status</th>
                <th className="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {dentists.data.content.map((dentist) => (
                <tr key={dentist.id}>
                  <td className="dentist-name">{dentist.name}</td>
                  <td>{dentist.email || '—'}</td>
                  <td>{dentist.specialty || 'Clínico geral'}</td>
                  <td className="col-left">
                    <span className={`badge ${dentist.accessStatus === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                      {dentist.accessStatus === 'ACTIVE' ? 'Acesso ativo' : 'Convite pendente'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="dentist-actions">
                      {dentist.accessStatus === 'PENDING' && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={regenerate.isPending}
                          onClick={() => handleRegenerateInvite(dentist)}
                        >
                          {dentist.email ? 'Novo link' : 'Definir e-mail'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm dentist-delete"
                        disabled={remove.isPending}
                        onClick={() =>
                          setDeleteTarget({
                            id: dentist.id,
                            name: dentist.name,
                            appointmentCount: dentist.appointmentCount ?? 0,
                          })
                        }
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Nenhum dentista cadastrado"
          description="Cadastre um dentista para liberar os agendamentos."
        />
      )}

      {deleteTarget && (
        <Modal title="Excluir dentista" onClose={() => setDeleteTarget(null)}>
          <div className="dentist-delete-modal">
            <p>
              Tem certeza que deseja excluir <strong>{deleteTarget.name}</strong>?
            </p>
            {appointmentCount > 0 ? (
              <p className="dentist-delete-warning">
                Este dentista possui <strong>{appointmentCount}</strong>{' '}
                {appointmentCount === 1 ? 'agendamento' : 'agendamentos'}. Ao confirmar,{' '}
                {appointmentCount === 1 ? 'ele será removido' : 'eles serão removidos'} permanentemente.
              </p>
            ) : (
              <p className="dentist-delete-note">Esta ação não pode ser desfeita.</p>
            )}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-danger" disabled={remove.isPending} onClick={confirmDelete}>
              {remove.isPending ? 'Excluindo...' : 'Excluir dentista'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
