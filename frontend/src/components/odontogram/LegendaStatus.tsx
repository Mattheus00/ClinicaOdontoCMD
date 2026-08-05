import {
  ODONTOGRAM_STATUS_CHIP_CLASS,
  ODONTOGRAM_STATUS_ICONS,
  ODONTOGRAM_STATUS_LABELS,
} from '../../features/odontogram/odontogram.constants';
import type { OdontogramStatus } from '../../features/odontogram/odontogram.types';
import './Odontograma.css';

type Props = {
  activeStatus?: OdontogramStatus | null;
  onPickStatus?: (status: OdontogramStatus) => void;
};

export default function LegendaStatus({ activeStatus, onPickStatus }: Props) {
  const entries = Object.entries(ODONTOGRAM_STATUS_LABELS) as Array<[OdontogramStatus, string]>;

  return (
    <div className="odo-legend" role="list" aria-label="Legenda de status do odontograma">
      {onPickStatus && (
        <span className="odo-legend-hint">Clique em um status para usar na marcação:</span>
      )}
      {entries.map(([status, label]) => {
        const Tag = onPickStatus ? 'button' : 'span';
        return (
          <Tag
            key={status}
            type={onPickStatus ? 'button' : undefined}
            className={`odo-legend-chip ${ODONTOGRAM_STATUS_CHIP_CLASS[status]} ${activeStatus === status ? 'is-active' : ''}`}
            role="listitem"
            onClick={onPickStatus ? () => onPickStatus(status) : undefined}
            aria-pressed={onPickStatus ? activeStatus === status : undefined}
          >
            <span className="odo-legend-icon" aria-hidden>
              {ODONTOGRAM_STATUS_ICONS[status]}
            </span>
            {label}
          </Tag>
        );
      })}
    </div>
  );
}
