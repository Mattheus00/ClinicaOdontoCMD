import {
  ODONTOGRAM_STATUS_CHIP_CLASS,
  ODONTOGRAM_STATUS_ICONS,
  ODONTOGRAM_STATUS_LABELS,
  procedureLabel,
} from '../../features/odontogram/odontogram.constants';
import type { ToothRecord } from '../../features/odontogram/odontogram.types';

type Props = {
  selected: ToothRecord[];
  marked: ToothRecord[];
  activeTooth: string | null;
  onSelectTooth: (numero: string) => void;
};

export default function ListaDentesSelecionados({ selected, marked, activeTooth, onSelectTooth }: Props) {
  const list = selected.length > 0 ? selected : marked;

  return (
    <section className="odo-list glass-card" aria-label="Lista de dentes">
      <div className="odo-list-header">
        <h3 className="odo-list-title">
          {selected.length > 0 ? 'Dentes selecionados' : 'Dentes marcados'}
        </h3>
        <span className="odo-list-count">{list.length}</span>
      </div>

      {list.length === 0 ? (
        <p className="odo-list-empty">Nenhum dente marcado ainda. Clique no odontograma para começar.</p>
      ) : (
        <ul className="odo-list-items">
          {list.map((tooth) => (
            <li key={tooth.numero}>
              <button
                type="button"
                className={`odo-list-item ${activeTooth === tooth.numero ? 'is-active' : ''}`}
                onClick={() => onSelectTooth(tooth.numero)}
                aria-label={`Dente ${tooth.numero}, ${ODONTOGRAM_STATUS_LABELS[tooth.status]}`}
                aria-current={activeTooth === tooth.numero ? 'true' : undefined}
              >
                <span className="odo-list-num">{tooth.numero}</span>
                <span className={`odo-list-status ${ODONTOGRAM_STATUS_CHIP_CLASS[tooth.status]}`}>
                  <span aria-hidden>{ODONTOGRAM_STATUS_ICONS[tooth.status]}</span>
                  {ODONTOGRAM_STATUS_LABELS[tooth.status]}
                </span>
                {tooth.procedimento && (
                  <span className="odo-list-proc">{procedureLabel(tooth.procedimento)}</span>
                )}
                {tooth.observacao && <span className="odo-list-notes">{tooth.observacao}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
