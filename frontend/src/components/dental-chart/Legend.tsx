import { STATUS_META, STATUS_ORDER } from '../../features/tooth-procedures/constants';

export function Legend() {
  return (
    <ul className="odg-legend" aria-label="Legenda das cores do odontograma">
      {STATUS_ORDER.map((status) => (
        <li key={status}>
          <span
            className="odg-legend-swatch"
            style={{ background: STATUS_META[status].fill, borderColor: STATUS_META[status].stroke }}
            aria-hidden="true"
          />
          {STATUS_META[status].label}
        </li>
      ))}
    </ul>
  );
}
