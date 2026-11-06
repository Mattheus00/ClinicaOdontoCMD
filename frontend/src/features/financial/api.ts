import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { FinancialDashboard } from '../../api/types';

export type FinancialFilters = {
  from?: string;
  to?: string;
};

export function useFinancialDashboard(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: ['financial-dashboard', filters],
    queryFn: async ({ signal }) =>
      (await api.get<FinancialDashboard>('/financial/dashboard', { signal, params: filters })).data,
  });
}
