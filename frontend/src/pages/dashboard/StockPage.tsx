import { useDataReadyMetric } from '../../lib/performance';
import { Pagination } from '../../components/Pagination';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { EmptyState, ErrorState, LoadingState, RefreshState } from '../../components/AsyncState';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';
import {
  useCreateStockItem,
  useCreateStockMovement,
  useDeleteStockItem,
  useStockItems,
  useStockSummary,
  useStockMovements,
  useUpdateStockItem,
} from '../../features/stock/api';
import type { StockCategory, StockItem, StockMovementType } from '../../api/types';
import './StockPage.css';

const UNITS = ['un', 'caixa', 'pacote', 'frasco', 'tubete', 'ml', 'L', 'g', 'kg'];

const CATEGORY_LABEL: Record<StockCategory, string> = {
  DENTAL: 'Odontológico',
  CLINIC: 'Clínica',
};

const MOVEMENT_LABEL: Record<StockMovementType, string> = {
  IN: 'Entrada',
  OUT: 'Saída',
  ADJUST: 'Ajuste',
};

type Filter = 'ALL' | StockCategory | 'LOW';

const formatQty = (value: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);

const formatWhen = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export default function StockPage() {
  const { role } = useAuth();
  const canManage = role === 'ADMIN' || role === 'SECRETARY';
  const canDelete = role === 'ADMIN';

  const create = useCreateStockItem();
  const update = useUpdateStockItem();
  const remove = useDeleteStockItem();
  const move = useCreateStockMovement();

  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const items = useStockItems(page, useDebouncedValue(search), filter);
  useDataReadyMetric("StockPage", Boolean(items.data));
  const summary = useStockSummary();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StockCategory>('DENTAL');
  const [unit, setUnit] = useState('un');
  const [quantity, setQuantity] = useState('0');
  const [minimum, setMinimum] = useState('0');
  const [notes, setNotes] = useState('');

  const [editing, setEditing] = useState<StockItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<StockCategory>('DENTAL');
  const [editUnit, setEditUnit] = useState('un');
  const [editMinimum, setEditMinimum] = useState('0');
  const [editNotes, setEditNotes] = useState('');

  const [moving, setMoving] = useState<StockItem | null>(null);
  const [movementType, setMovementType] = useState<StockMovementType>('OUT');
  const [movementQty, setMovementQty] = useState('');
  const [movementNote, setMovementNote] = useState('');
  const [entrySuccess, setEntrySuccess] = useState<string | null>(null);
  const history = useStockMovements(moving?.id, historyPage);

  useEffect(() => {
    if (!entrySuccess) return;
    const timer = window.setTimeout(() => setEntrySuccess(null), 3500);
    return () => window.clearTimeout(timer);
  }, [entrySuccess]);

  const list = items.data?.content ?? [];
  const lowCount = summary.data?.low ?? 0;
  const visible = list;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    const parsedMinimum = Number(minimum);
    if (!name.trim() || Number.isNaN(parsedQuantity) || Number.isNaN(parsedMinimum)) return;
    create.mutate(
      {
        name: name.trim(),
        category,
        unit,
        quantity: parsedQuantity,
        minimumQuantity: parsedMinimum,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setName('');
          setCategory('DENTAL');
          setUnit('un');
          setQuantity('0');
          setMinimum('0');
          setNotes('');
          setCreating(false);
        },
      },
    );
  };

  const openEdit = (item: StockItem) => {
    setEditing(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditUnit(item.unit);
    setEditMinimum(String(item.minimumQuantity));
    setEditNotes(item.notes ?? '');
  };

  const submitEdit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const parsedMinimum = Number(editMinimum);
    if (!editName.trim() || Number.isNaN(parsedMinimum)) return;
    update.mutate(
      {
        id: editing.id,
        name: editName.trim(),
        category: editCategory,
        unit: editUnit,
        minimumQuantity: parsedMinimum,
        notes: editNotes.trim() || undefined,
      },
      { onSuccess: () => setEditing(null) },
    );
  };

  const openMove = (item: StockItem, type: StockMovementType) => {
    setHistoryPage(0);
    setMoving(item);
    setMovementType(type);
    setMovementQty('');
    setMovementNote('');
    setEntrySuccess(null);
  };

  const submitMove = (event: FormEvent) => {
    event.preventDefault();
    if (!moving) return;
    const parsed = Number(movementQty);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    const note = movementNote.trim() || undefined;
    const type = movementType;
    move.mutate(
      {
        id: moving.id,
        type,
        quantity: parsed,
        note,
      },
      {
        onSuccess: (updated) => {
          setMoving(updated);
          setMovementQty('');
          setMovementNote('');
          if (type === 'IN') {
            const message = `Entrada de ${formatQty(parsed)} ${updated.unit} adicionada.`;
            setEntrySuccess(message);
            window.dispatchEvent(
              new CustomEvent('app:toast', {
                detail: { message, tone: 'success' },
              }),
            );
          }
        },
      },
    );
  };

  return (
    <div className="stock-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Estoque</h1>
          <p className="page-subtitle">Controle materiais odontológicos e os demais itens da clínica.</p>
        </div>
        {canManage ? (
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            Registrar material
          </button>
        ) : null}
      </div>

      <div className="stock-summary">
        <article>
          <span>Itens cadastrados</span>
          <strong>{summary.data?.total ?? 0}</strong>
        </article>
        <article className={lowCount ? 'is-alert' : undefined}>
          <span>Abaixo do mínimo</span>
          <strong>{lowCount}</strong>
        </article>
      </div>

      <div className="stock-toolbar">
        <input
          className="input-field"
          placeholder="Buscar material"
          value={search}
          onChange={(e) => { setPage(0); setSearch(e.target.value); }}
        />
        <div className="stock-filters" role="tablist" aria-label="Filtrar estoque">
          {(
            [
              ['ALL', 'Todos'],
              ['DENTAL', 'Odontológico'],
              ['CLINIC', 'Clínica'],
              ['LOW', 'Abaixo do mínimo'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? 'is-active' : undefined}
              onClick={() => { setPage(0); setFilter(value); }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <RefreshState fetching={items.isRefetching} error={items.isError && Boolean(items.data)} onRetry={() => items.refetch()} />
      <Pagination data={items.data} page={page} onChange={setPage} busy={items.isFetching} />
      {items.isLoading ? (
        <LoadingState />
      ) : items.isError && !items.data ? (
        <ErrorState onRetry={() => items.refetch()} />
      ) : visible.length ? (
        <>
          <div className="table-wrap desktop-only">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Tipo</th>
                  <th>Saldo</th>
                  <th>Mínimo</th>
                  <th>Status</th>
                  <th className="col-actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id} className={item.lowStock ? 'is-low' : undefined}>
                    <td>
                      <strong>{item.name}</strong>
                      {item.notes ? <small>{item.notes}</small> : null}
                    </td>
                    <td>{CATEGORY_LABEL[item.category]}</td>
                    <td>
                      {formatQty(item.quantity)} {item.unit}
                    </td>
                    <td>
                      {formatQty(item.minimumQuantity)} {item.unit}
                    </td>
                    <td>
                      <span className={`badge ${item.lowStock ? 'badge-warning' : 'badge-success'}`}>
                        {item.lowStock ? 'Repor' : 'Ok'}
                      </span>
                    </td>
                    <td className="col-actions">
                      <div className="stock-actions">
                        <button type="button" className="stock-action" onClick={() => openMove(item, 'IN')}>
                          <ArrowDownToLine size={15} aria-hidden />
                          Entrada
                        </button>
                        <button type="button" className="stock-action" onClick={() => openMove(item, 'OUT')}>
                          <ArrowUpFromLine size={15} aria-hidden />
                          Saída
                        </button>
                        {canManage ? (
                          <button type="button" className="stock-action stock-action-icon" aria-label="Editar" title="Editar" onClick={() => openEdit(item)}>
                            <Pencil size={15} aria-hidden />
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            className="stock-action stock-action-icon stock-delete"
                            aria-label="Excluir"
                            title="Excluir"
                            disabled={remove.isPending}
                            onClick={() => {
                              if (window.confirm(`Excluir "${item.name}" do estoque?`)) remove.mutate(item.id);
                            }}
                          >
                            <Trash2 size={15} aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobile-card-list mobile-only" aria-label="Lista de estoque">
            {visible.map((item) => (
              <article key={item.id} className={`mobile-card${item.lowStock ? ' is-low' : ''}`}>
                <div className="mobile-card-head">
                  <strong>{item.name}</strong>
                  <span className={`badge ${item.lowStock ? 'badge-warning' : 'badge-success'}`}>
                    {item.lowStock ? 'Repor' : 'Ok'}
                  </span>
                </div>
                <div className="mobile-card-meta">
                  <p>
                    {CATEGORY_LABEL[item.category]} · {formatQty(item.quantity)} {item.unit}
                  </p>
                  <p>
                    Mínimo: {formatQty(item.minimumQuantity)} {item.unit}
                  </p>
                  {item.notes ? <p>{item.notes}</p> : null}
                </div>
                <div className="mobile-card-actions stock-mobile-actions">
                  <button type="button" className="stock-action" onClick={() => openMove(item, 'IN')}>
                    <ArrowDownToLine size={15} aria-hidden />
                    Entrada
                  </button>
                  <button type="button" className="stock-action" onClick={() => openMove(item, 'OUT')}>
                    <ArrowUpFromLine size={15} aria-hidden />
                    Saída
                  </button>
                  {canManage ? (
                    <button type="button" className="stock-action stock-action-icon" aria-label="Editar" onClick={() => openEdit(item)}>
                      <Pencil size={15} aria-hidden />
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      className="stock-action stock-action-icon stock-delete"
                      aria-label="Excluir"
                      disabled={remove.isPending}
                      onClick={() => {
                        if (window.confirm(`Excluir "${item.name}" do estoque?`)) remove.mutate(item.id);
                      }}
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title={list.length ? 'Nenhum material nesse filtro' : 'Nenhum material cadastrado'}
          description="Cadastre luvas, resinas, anestésicos e também papel, álcool e os demais itens da clínica."
        />
      )}

      {creating ? (
        <Modal title="Registrar material" onClose={() => setCreating(false)}>
          <form className="form-grid" onSubmit={submit}>
            <label className="full-width">
              Nome
              <input
                required
                className="input-field"
                placeholder="Ex.: Luvas, Resina, Álcool 70%"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Tipo
              <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value as StockCategory)}>
                <option value="DENTAL">Material odontológico</option>
                <option value="CLINIC">Demais materiais da clínica</option>
              </select>
            </label>
            <label>
              Unidade
              <select className="input-field" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantidade inicial
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            <label>
              Estoque mínimo
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                value={minimum}
                onChange={(e) => setMinimum(e.target.value)}
              />
            </label>
            <label className="full-width">
              Observação
              <input
                className="input-field"
                placeholder="Opcional"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <div className="modal-actions full-width">
              <button type="button" className="btn btn-secondary" onClick={() => setCreating(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" disabled={create.isPending}>
                {create.isPending ? 'Salvando...' : 'Cadastrar material'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {editing ? (
        <Modal title="Editar material" onClose={() => setEditing(null)}>
          <form className="form-grid" onSubmit={submitEdit}>
            <label className="full-width">
              Nome
              <input required className="input-field" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </label>
            <label>
              Tipo
              <select className="input-field" value={editCategory} onChange={(e) => setEditCategory(e.target.value as StockCategory)}>
                <option value="DENTAL">Material odontológico</option>
                <option value="CLINIC">Demais materiais da clínica</option>
              </select>
            </label>
            <label>
              Unidade
              <select className="input-field" value={editUnit} onChange={(e) => setEditUnit(e.target.value)}>
                {UNITS.includes(editUnit) ? null : <option value={editUnit}>{editUnit}</option>}
                {UNITS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-width">
              Estoque mínimo
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                value={editMinimum}
                onChange={(e) => setEditMinimum(e.target.value)}
              />
            </label>
            <label className="full-width">
              Observação
              <input className="input-field" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </label>
            <div className="modal-actions full-width">
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" disabled={update.isPending}>
                {update.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {moving ? (
        <Modal title={moving.name} onClose={() => setMoving(null)}>
          {entrySuccess ? (
            <div className="stock-entry-success" role="status">
              <CheckCircle2 size={20} aria-hidden="true" />
              <span>{entrySuccess}</span>
            </div>
          ) : null}
          <p className="stock-balance">
            Saldo atual: <strong>{formatQty(moving.quantity)} {moving.unit}</strong>
          </p>
          <form className="form-grid" onSubmit={submitMove}>
            <label className="full-width">
              Movimentação
              <select
                className="input-field"
                value={movementType}
                onChange={(e) => setMovementType(e.target.value as StockMovementType)}
              >
                <option value="IN">Entrada</option>
                <option value="OUT">Saída</option>
                <option value="ADJUST">Ajuste de contagem</option>
              </select>
            </label>
            <label className="full-width">
              {movementType === 'ADJUST' ? 'Novo saldo' : 'Quantidade'}
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                className="input-field"
                value={movementQty}
                onChange={(e) => setMovementQty(e.target.value)}
              />
            </label>
            <label className="full-width">
              Observação
              <input
                className="input-field"
                placeholder="Opcional. Ex.: usado na consulta, compra do fornecedor"
                value={movementNote}
                onChange={(e) => setMovementNote(e.target.value)}
              />
            </label>
            <div className="modal-actions full-width">
              <button type="button" className="btn btn-secondary" onClick={() => setMoving(null)}>
                Fechar
              </button>
              <button className="btn btn-primary" disabled={move.isPending}>
                {move.isPending ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </form>
          <div className="stock-history">
            <h3>Movimentações</h3>
            <Pagination data={history.data} page={historyPage} onChange={setHistoryPage} busy={history.isFetching} />
            <RefreshState fetching={history.isRefetching} error={history.isError && Boolean(history.data)} onRetry={() => history.refetch()} />
            {history.isError && !history.data && <ErrorState onRetry={() => history.refetch()} />}
            {history.isLoading ? (
              <p>Carregando...</p>
            ) : history.data?.content.length ? (
              <ul>
                {history.data.content.map((entry) => (
                  <li key={entry.id}>
                    <span>
                      {MOVEMENT_LABEL[entry.type]} · {formatQty(entry.quantity)} {moving.unit}
                    </span>
                    <small>
                      saldo {formatQty(entry.balanceAfter)} · {formatWhen(entry.createdAt)}
                      {entry.note ? ` · ${entry.note}` : ''}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma movimentação ainda.</p>
            )}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
