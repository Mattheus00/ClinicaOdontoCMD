import { useCallback, useState } from 'react';
import type { ToothSurface } from './types';

export function useOdontogramHover() {
  const [hovered, setHovered] = useState<{ tooth: string; surface: ToothSurface } | null>(null);

  const handleSurfaceHover = useCallback((tooth: string | null, surface: ToothSurface | null) => {
    if (tooth && surface) setHovered({ tooth, surface });
    else setHovered(null);
  }, []);

  return { hovered, handleSurfaceHover };
}
