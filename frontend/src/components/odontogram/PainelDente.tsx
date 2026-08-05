import {
  ODONTOGRAM_PROCEDURES,
  ODONTOGRAM_STATUS_LABELS,
} from '../../features/odontogram/odontogram.constants';
import type { OdontogramStatus, ToothRecord } from '../../features/odontogram/odontogram.types';

type Props = {
  record: ToothRecord | null;
  selectionCount: number;
  onChange: (patch: Partial<ToothRecord>) => void;
  onApplyToSelection: (patch: Partial<ToothRecord>) => void;
  onMark: () => void;
  onMarkSelection: () => void;
  onRemove: () => void;
};

export default function PainelDente({
  record,
  selectionCount,
  onChange,
  onApplyToSelection,
  onMark,
  onMarkSelection,
  onRemove,
}: Props) {
  if (!record) {
    return (
      <aside className="odo-panel glass-card" aria-label="Painel do dente">
        <h3 className="odo-panel-title">Selecione um dente</h3>
        <p className="odo-panel-hint">Clique em um dente na arcada para marcar ou editar.</p>
      </aside>
    );
  }

  const statusOptions = Object.entries(ODONTOGRAM_STATUS_LABELS) as Array<[OdontogramStatus, string]>;

  return (
    <aside className="odo-panel glass-card" aria-label={`Painel do dente ${record.numero}`}>
      <div className="odo-panel-header">
        <h3 className="odo-panel-title">Dente {record.numero}</h3>
        {selectionCount > 1 && (
          <span className="odo-panel-badge">{selectionCount} selecionados</span>
        )}
      </div>

      <label className="odo-field">
        Status clínico
        <select
          value={record.status}
          onChange={(e) => {
            const status = e.target.value as OdontogramStatus;
            if (selectionCount > 1) onApplyToSelection({ status });
            else onChange({ status });
          }}
          aria-label={`Status do dente ${record.numero}`}
        >
          {statusOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="odo-field">
        Procedimento
        <select
          value={record.procedimento ?? ''}
          onChange={(e) => {
            const procedimento = e.target.value || null;
            if (selectionCount > 1) onApplyToSelection({ procedimento });
            else onChange({ procedimento });
          }}
          aria-label={`Procedimento do dente ${record.numero}`}
        >
          {ODONTOGRAM_PROCEDURES.map((p) => (
            <option key={p.value || 'none'} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="odo-field">
        Observação
        <textarea
          rows={3}
          value={record.observacao}
          onChange={(e) => onChange({ observacao: e.target.value })}
          placeholder="Ex.: lesão na face oclusal, sensibilidade..."
          aria-label={`Observação do dente ${record.numero}`}
        />
      </label>

      {selectionCount > 1 && (
        <p className="odo-panel-hint">
          Alterações de status e procedimento aplicam-se a todos os dentes selecionados. Observação é individual do dente ativo.
        </p>
      )}

      <div className="odo-panel-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={onMark}>
          Marcar dente
        </button>
        {selectionCount > 1 && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onMarkSelection}>
            Marcar {selectionCount} dentes
          </button>
        )}
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRemove}>
          Remover marcação
        </button>
      </div>
    </aside>
  );
}
