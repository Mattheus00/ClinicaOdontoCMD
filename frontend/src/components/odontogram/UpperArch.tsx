import { useMemo } from 'react';
import { occlusalArchPose, UPPER_FDI } from './archAnchors';
import { InterdentalPapilla, PalateSurface, UpperGingivaBand } from './GingivaCollar';
import Tooth3D from './Tooth3D';
import type { ToothSelectEvent } from '../../features/odontogram/odontogram.types';

type Props = {
  statuses: Map<string, string>;
  selectedTeeth: Set<string>;
  focusedTooth: string | null;
  onSelectTooth: (event: ToothSelectEvent) => void;
};

export default function UpperArch({ statuses, selectedTeeth, focusedTooth, onSelectTooth }: Props) {
  const items = useMemo(
    () => UPPER_FDI.map((_, index) => occlusalArchPose(index, UPPER_FDI.length, true)),
    [],
  );

  const papillae = useMemo(() => {
    const pts: Array<{ x: number; z: number; y: number }> = [];
    for (let i = 0; i < items.length - 1; i += 1) {
      const a = items[i];
      const b = items[i + 1];
      pts.push({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, y: a.y - 0.02 });
    }
    return pts;
  }, [items]);

  return (
    <group name="arcada-superior">
      <PalateSurface />
      <UpperGingivaBand />
      {papillae.map((p, i) => (
        <InterdentalPapilla key={`pap-u-${i}`} x={p.x} z={p.z} y={p.y} />
      ))}
      {items.map((item) => (
        <Tooth3D
          key={item.fdi}
          fdi={item.fdi}
          status={statuses.get(item.fdi) ?? 'HEALTHY'}
          selected={selectedTeeth.has(item.fdi)}
          focused={focusedTooth === item.fdi}
          position={[item.x, item.y, item.z]}
          rotY={item.rotY}
          onSelect={onSelectTooth}
        />
      ))}
    </group>
  );
}
