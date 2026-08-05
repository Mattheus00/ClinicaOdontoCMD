import DenteSvg from './DenteSvg';
import { LOWER_GUM_PATH, layoutLowerArch, layoutUpperArch, UPPER_PALATE_PATH } from './svgArchLayout';

type Props = {
  statuses: Map<string, string>;
  selectedTeeth: Set<string>;
  focusedTooth: string | null;
  onSelectTooth: (fdi: string) => void;
};

export default function ArcadaSuperior({ statuses, selectedTeeth, focusedTooth, onSelectTooth }: Props) {
  const teeth = layoutUpperArch();

  return (
    <g className="arcada arcada-superior" aria-label="Arcada superior">
      <path d={UPPER_PALATE_PATH} className="arcada-gengiva arcada-palato" />
      {teeth.map((layout) => (
        <DenteSvg
          key={layout.fdi}
          layout={layout}
          status={statuses.get(layout.fdi) ?? 'HEALTHY'}
          selected={selectedTeeth.has(layout.fdi)}
          focused={focusedTooth === layout.fdi}
          onSelect={onSelectTooth}
        />
      ))}
    </g>
  );
}

export function ArcadaInferior({ statuses, selectedTeeth, focusedTooth, onSelectTooth }: Props) {
  const teeth = layoutLowerArch();

  return (
    <g className="arcada arcada-inferior" aria-label="Arcada inferior">
      <path d={LOWER_GUM_PATH} className="arcada-gengiva arcada-lingua" fillRule="evenodd" />
      {teeth.map((layout) => (
        <DenteSvg
          key={layout.fdi}
          layout={layout}
          status={statuses.get(layout.fdi) ?? 'HEALTHY'}
          selected={selectedTeeth.has(layout.fdi)}
          focused={focusedTooth === layout.fdi}
          onSelect={onSelectTooth}
        />
      ))}
    </g>
  );
}
