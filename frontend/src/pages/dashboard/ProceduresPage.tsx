import { useState, type FormEvent } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { Modal } from '../../components/Modal';
import {
  useCreateProcedure,
  useDeleteProcedure,
  useProcedures,
  useUpdateProcedure,
} from '../../features/procedures/api';
import { money } from '../../lib/money';
import type { Procedure } from '../../api/types';
import './ProceduresPage.css';

export default function ProceduresPage() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [editing, setEditing] = useState<Procedure | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const procedures = useProcedures();
  const create = useCreateProcedure();
  const update = useUpdateProcedure();
  const remove = useDeleteProcedure();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedPrice = Number(price);
    if (!name.trim() || Number.isNaN(parsedPrice) || parsedPrice < 0) return;

    create.mutate(
      { name: name.trim(), price: parsedPrice },
      {
        onSuccess: () => {
          setName('');
          setPrice('');
        },
      },
    );
  };

  const openEdit = (procedure: Procedure) => {
    setEditing(procedure);
    setEditName(procedure.name);
    setEditPrice(String(procedure.price));
  };

  const submitEdit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const parsedPrice = Number(editPrice);
    if (!editName.trim() || Number.isNaN(parsedPrice) || parsedPrice < 0) return;

    update.mutate(
      { id: editing.id, name: editName.trim(), price: parsedPrice },
      { onSuccess: () => setEditing(null) },
    );
  };

  const handleDelete = (procedure: Procedure) => {
    if (!window.confirm(`Excluir o procedimento "${procedure.name}"?`)) return;
    remove.mutate(procedure.id);
  };

  return (
    <div className="procedures-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Procedimentos</h1>
          <p className="page-subtitle">Cadastre os procedimentos e valores usados nos agendamentos.</p>
        </div>
      </div>

      <section className="glass-card procedures-form-card">
        <h2 className="card-section-title">Adicionar procedimento</h2>
        <form className="dashboard-form" onSubmit={submit}>
          <label>
            Nome do procedimento
            <input
              required
              className="input-field"
              placeholder="Ex.: Limpeza, Clareamento, Avaliação"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Valor (R$)
            <input
              required
              type="number"
              min="0"
              step="0.01"
              className="input-field"
              placeholder="0,00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <div className="dashboard-form-actions">
            <button className="btn btn-primary" disabled={create.isPending}>
              {create.isPending ? 'Salvando...' : 'Cadastrar procedimento'}
            </button>
          </div>
        </form>
      </section>

      {procedures.isLoading ? (
        <LoadingState />
      ) : procedures.isError ? (
        <ErrorState onRetry={() => procedures.refetch()} />
      ) : procedures.data?.content.length ? (
        <div className="table-wrap procedures-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Procedimento</th>
                <th>Valor</th>
                <th className="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {procedures.data.content.map((procedure) => (
                <tr key={procedure.id}>
                  <td className="procedure-name">{procedure.name}</td>
                  <td>{money(procedure.price)}</td>
                  <td className="col-actions">
                    <div className="procedure-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(procedure)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm procedure-delete"
                        disabled={remove.isPending}
                        onClick={() => handleDelete(procedure)}
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
          title="Nenhum procedimento cadastrado"
          description="Cadastre procedimentos para usá-los ao criar agendamentos."
        />
      )}

      {editing && (
        <Modal title="Editar procedimento" onClose={() => setEditing(null)}>
          <form className="form-grid" onSubmit={submitEdit}>
            <label className="full-width">
              Nome do procedimento
              <input
                required
                className="input-field"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </label>
            <label className="full-width">
              Valor (R$)
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
              />
            </label>
            <div className="modal-actions full-width">
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" disabled={update.isPending}>
                {update.isPending ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
