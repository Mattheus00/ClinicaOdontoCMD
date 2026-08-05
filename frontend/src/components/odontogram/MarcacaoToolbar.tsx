import {
  ODONTOGRAM_PROCEDURES,
  ODONTOGRAM_STATUS_LABELS,
} from '../../features/odontogram/odontogram.constants';
import type { OdontogramStatus } from '../../features/odontogram/odontogram.types';

export type MarkMode = 'select' | 'paint';

type Props = {
  mode: MarkMode;
  onModeChange: (mode: MarkMode) => void;
  brushStatus: OdontogramStatus;
  brushProcedure: string | null;
  onBrushStatusChange: (status: OdontogramStatus) => void;
  onBrushProcedureChange: (procedure: string | null) => void;
};

export default function MarcacaoToolbar({
  mode,
  onModeChange,
  brushStatus,
  brushProcedure,
  onBrushStatusChange,
  onBrushProcedureChange,
}: Props) {
  const statusOptions = Object.entries(ODONTOGRAM_STATUS_LABELS) as Array<[OdontogramStatus, string]>;

  return (
    <div className="odo-mark-toolbar glass-card">
      <div className="odo-mark-modes" role="tablist" aria-label="Modo do odontograma">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'select'}
          className={`odo-mark-mode ${mode === 'select' ? 'is-active' : ''}`}
          onClick={() => onModeChange('select')}
        >
          Selecionar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'paint'}
          className={`odo-mark-mode ${mode === 'paint' ? 'is-active' : ''}`}
          onClick={() => onModeChange('paint')}
        >
          Marcar dentes
        </button>
      </div>

      {mode === 'paint' && (
        <div className="odo-mark-brush">
          <label className="odo-field odo-field-inline">
            Status para marcar
            <select
              value={brushStatus}
              onChange={(e) => onBrushStatusChange(e.target.value as OdontogramStatus)}
              aria-label="Status para marcar nos dentes"
            >
              {statusOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="odo-field odo-field-inline">
            Procedimento (opcional)
            <select
              value={brushProcedure ?? ''}
              onChange={(e) => onBrushProcedureChange(e.target.value || null)}
              aria-label="Procedimento para marcar nos dentes"
            >
              {ODONTOGRAM_PROCEDURES.map((p) => (
                <option key={p.value || 'none'} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <p className="odo-mark-hint">Clique diretamente no dente para aplicar a marcação.</p>
        </div>
      )}
    </div>
  );
}
