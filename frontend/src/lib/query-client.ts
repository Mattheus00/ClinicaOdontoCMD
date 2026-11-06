import { hashKey, QueryClient, type QueryKey } from '@tanstack/react-query';
import axios from 'axios';

export const QUERY_FRESHNESS = { reference: 300_000, patient: 30_000, live: 15_000 } as const;
export type CacheIdentity = { clinicId: string | null; userId: string | null; role: string | null };
export const cacheScope = ({ clinicId, userId, role }: CacheIdentity) => JSON.stringify([clinicId, userId, role]);

/** Each identity owns a separate memory-only client. Prefix invalidations remain compatible. */
export function createAppQueryClient(scope: string) {
  const client = new QueryClient({ defaultOptions: {
    queries: {
      queryKeyHashFn: (key: QueryKey) => hashKey([scope, ...key]),
      staleTime: QUERY_FRESHNESS.patient,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: true,
      retry: (count, error) => count < 1 && !axios.isCancel(error)
        && (!axios.isAxiosError(error) || !error.response || error.response.status >= 500),
    },
    mutations: { retry: false },
  } });
  for (const key of ['professionals', 'procedures', 'subscription']) client.setQueryDefaults([key], { staleTime: QUERY_FRESHNESS.reference });
  for (const key of ['appointments', 'stock-items', 'stock-movements', 'stock-summary', 'staff-notifications']) client.setQueryDefaults([key], { staleTime: QUERY_FRESHNESS.live });
  return client;
}

export function disposeQueryClient(client: QueryClient) {
  void client.cancelQueries();
  client.clear();
}
