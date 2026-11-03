import { useQuery } from '@tanstack/react-query';
import { GLB_MODEL_URL } from '../../features/tooth-procedures/constants';

/** The dev server and SPA hosting answer unknown paths with index.html, so the content type matters. */
export function useGlbAvailable() {
  return useQuery({
    queryKey: ['odontogram-glb', GLB_MODEL_URL],
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch(GLB_MODEL_URL, { method: 'HEAD' });
        const type = response.headers.get('content-type') ?? '';
        return response.ok && !type.includes('text/html');
      } catch {
        return false;
      }
    },
  });
}
