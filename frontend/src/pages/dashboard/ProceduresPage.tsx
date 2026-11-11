import { useDataReadyMetric } from '../../lib/performance';
import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, RefreshState } from '../../components/AsyncState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MoneyInput } from '../../components/MoneyInput';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/panel/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import {
  useCreateProcedure,
  useDeleteProcedure,
  useProcedures,
  useUpdateProcedure,
} from '../../features/procedures/api';
import { money } from '../../lib/money';
import { notifySuccess } from '../../lib/notify';
import type { Procedure } from '../../api/types';
import './ProceduresPage.css';

export default function ProceduresPage() {
  const { role } = useAuth();
  const canDelete = role === 'ADMIN';
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [editing, setEditing] = useState<Procedure | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Procedure | null>(null);

  const procedures = useProcedures();
  useDataReadyMetric('ProceduresPage', Boolean(procedures.data));
  const create = useCreateProcedure();
  const update = useUpdateProcedure();
  const remove = useDeleteProcedure();

  const openCreateModal = () => {
    setName('');
    setPrice(null);
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setName('');
    setPrice(null);
  };

  const createDirty = Boolean(name.trim() || price != null);
  const editDirty = Boolean(
    editing && (editName.trim() !== editing.name || (editPrice ?? 0) !== editing.price),
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || price == null || Number.isNaN(price) || price < 0) return;

    create.mutate(
      { name: name.trim(), price },
      {
        onSuccess: () => {
          notifySuccess(`Procedimento "${name.trim()}" cadastrado.`);
          closeCreateModal();
        },
      },
    );
  };

  const openEdit = (procedure: Procedure) => {
    setEditing(procedure);
    setEditName(procedure.name);
    setEditPrice(procedure.price);
  };

  const submitEdit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (!editName.trim() || editPrice == null || Number.isNaN(editPrice) || editPrice < 0) return;

    update.mutate(
      { id: editing.id, name: editName.trim(), price: editPrice },
      {
        onSuccess: () => {
          notifySuccess('Procedimento atualizado.');
          setEditing(null);
        },
      },
    );
  };

  return (
    <div className="procedures-page">
      <RefreshState fetching={procedures.isRefetching} error={procedures.isError && Boolean(procedures.data)} onRetry={() => procedures.refetch()} />
      <PageHeader
        title="Procedimentos"
        actions={
          <button className="btn btn-primary" type="button" onClick={openCreateModal}>
            <Plus size={18} /> Novo
          </button>
        }
      />

      {procedures.isLoading ? (
        <LoadingState />
      ) : procedures.isError && !procedures.data ? (
        <ErrorState onRetry={() => procedures.refetch()} />
      ) : procedures.data?.content.length ? (
        <>
          <div className="table-wrap procedures-table-wrap desktop-only">
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
                        {canDelete ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm procedure-delete"
                            disabled={remove.isPending}
                            onClick={() => setDeleteTarget(procedure)}
                          >
                            Excluir
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobile-card-list mobile-only" aria-label="Lista de procedimentos">
            {procedures.data.content.map((procedure) => (
              <article key={procedure.id} className="mobile-card">
                <div className="mobile-card-head">
                  <strong>{procedure.name}</strong>
                  <span className="procedure-mobile-price">{money(procedure.price)}</span>
                </div>
                <div className="mobile-card-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(procedure)}>
                    Editar
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm procedure-delete"
                      disabled={remove.isPending}
                      onClick={() => setDeleteTarget(procedure)}
                    >
                      Excluir
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="Nenhum procedimento cadastrado"
          description="Cadastre procedimentos para usá-los ao criar agendamentos."
          action={
            <button className="btn btn-primary" type="button" onClick={openCreateModal}>
              Cadastrar procedimentos
            </button>
          }
        />
      )}

      {createOpen ? (
        <Modal title="Adicionar procedimento" onClose={closeCreateModal} isDirty={createDirty}>
          <form className="form-grid" onSubmit={submit}>
            <label className="full-width">
              Nome do procedimento
              <input
                required
                className="input-field"
                placeholder="Ex.: Limpeza, Clareamento, Avaliação"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="full-width">
              Valor (R$)
              <MoneyInput
                required
                className="input-field"
                placeholder="0,00"
                value={price}
                onValueChange={setPrice}
              />
            </label>
            <div className="modal-actions full-width">
              <button type="button" className="btn btn-secondary" onClick={closeCreateModal}>
                Cancelar
              </button>
              <button className="btn btn-primary" disabled={create.isPending}>
                {create.isPending ? 'Salvando...' : 'Cadastrar procedimento'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {editing && (
        <Modal title="Editar procedimento" onClose={() => setEditing(null)} isDirty={editDirty}>
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
              <MoneyInput
                required
                className="input-field"
                value={editPrice}
                onValueChange={setEditPrice}
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

      {deleteTarget ? (
        <ConfirmDialog
          title="Excluir procedimento"
          message={`Excluir o procedimento "${deleteTarget.name}"?`}
          confirmLabel="Excluir"
          danger
          busy={remove.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            remove.mutate(deleteTarget.id, {
              onSuccess: () => {
                notifySuccess('Procedimento excluído.');
                setDeleteTarget(null);
              },
            });
          }}
        />
      ) : null}
    </div>
  );
}
