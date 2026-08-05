import { useState } from 'react';
import { useCreateProfessional, useProfessionals } from '../../features/professionals/api';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const professionals = useProfessionals();
  const create = useCreateProfessional();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Profissionais e horários da clínica.</p>
        </div>
      </div>

      <section className="glass-card">
        <h2 className="card-section-title">Adicionar profissional</h2>
        <form
          className="dashboard-form"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate(
              { name, email, specialty },
              {
                onSuccess: () => {
                  setName('');
                  setEmail('');
                  setSpecialty('');
                },
              },
            );
          }}
        >
          <label>
            Nome
            <input
              required
              className="input-field"
              placeholder="Nome do profissional"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            E-mail
            <input
              required
              type="email"
              className="input-field"
              placeholder="profissional@clinica.com.br"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Especialidade
            <input
              className="input-field"
              placeholder="Ex.: Ortodontia"
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
            />
          </label>
          <div className="dashboard-form-actions">
            <button className="btn btn-primary" disabled={create.isPending}>
              {create.isPending ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </section>

      {professionals.isLoading ? (
        <LoadingState />
      ) : professionals.isError ? (
        <ErrorState onRetry={() => professionals.refetch()} />
      ) : professionals.data?.content.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Especialidade</th>
              </tr>
            </thead>
            <tbody>
              {professionals.data.content.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.specialty ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Nenhum profissional cadastrado"
          description="Adicione o primeiro profissional para organizar a agenda."
        />
      )}
    </div>
  );
}
