import DenteHotspot from './DenteHotspot';
import { ALL_HOTSPOTS, IMAGE_HEIGHT, IMAGE_WIDTH, ODONTOGRAM_IMAGE } from './imageHotspots';
import type { ToothSelectEvent } from '../../../features/odontogram/odontogram.types';
import './OdontogramSvg.css';

type Props = {
  statuses: Map<string, string>;
  selectedTeeth: Set<string>;
  focusedTooth: string | null;
  onSelectTooth: (event: ToothSelectEvent) => void;
};

export default function OdontogramSvg({ statuses, selectedTeeth, focusedTooth, onSelectTooth }: Props) {
  const handleSelect = (fdi: string) => {
    onSelectTooth({ tooth: fdi });
  };

  const viewBox = `0 0 ${IMAGE_WIDTH} ${IMAGE_HEIGHT}`;

  return (
    <div className="odo-svg-wrap">
      <svg
        viewBox={viewBox}
        className="odo-svg odo-svg-image"
        role="img"
        aria-label="Odontograma clínico com arcadas superior e inferior"
        preserveAspectRatio="xMidYMid meet"
      >
        <image
          href={ODONTOGRAM_IMAGE}
          x={0}
          y={0}
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          className="odo-svg-bg"
          pointerEvents="none"
        />

        <g className="odo-hotspots" pointerEvents="all">
          {ALL_HOTSPOTS.map((hotspot) => (
            <DenteHotspot
              key={hotspot.fdi}
              hotspot={{
                ...hotspot,
                cx: (hotspot.cx / 100) * IMAGE_WIDTH,
                cy: (hotspot.cy / 100) * IMAGE_HEIGHT,
                w: (hotspot.w / 100) * IMAGE_WIDTH,
                h: (hotspot.h / 100) * IMAGE_HEIGHT,
              }}
              status={statuses.get(hotspot.fdi) ?? 'HEALTHY'}
              selected={selectedTeeth.has(hotspot.fdi)}
              focused={focusedTooth === hotspot.fdi}
              onSelect={handleSelect}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
