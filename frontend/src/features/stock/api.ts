import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { asPage, type StockCategory, type StockItem, type StockMovement, type StockMovementType } from '../../api/types';

export type StockItemInput = {
  name: string;
  category: StockCategory;
  unit: string;
  quantity?: number;
  minimumQuantity: number;
  notes?: string;
};

export type StockMovementInput = {
  id: string;
  type: StockMovementType;
  quantity: number;
  note?: string;
};

export function useStockItems(page = 0, search = '', filter = 'ALL') {
  return useQuery({
    queryKey: ['stock-items', { page, search, filter }],
    queryFn: async ({ signal }) => asPage<StockItem>((await api.get('/stock/items', { signal, params: { page, size: 20, search, filter } })).data),
  });
}

export function useCreateStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StockItemInput) => (await api.post<StockItem>('/stock/items', input)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-items'] }); queryClient.invalidateQueries({ queryKey: ['stock-summary'] }); },
  });
}

export function useUpdateStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: StockItemInput & { id: string }) =>
      (await api.put<StockItem>(`/stock/items/${id}`, input)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-items'] }); queryClient.invalidateQueries({ queryKey: ['stock-summary'] }); },
  });
}

export function useDeleteStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/stock/items/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-items'] }); queryClient.invalidateQueries({ queryKey: ['stock-summary'] }); },
  });
}

export function useStockMovements(itemId?: string, page = 0) {
  return useQuery({
    queryKey: ['stock-movements', itemId, page],
    enabled: Boolean(itemId),
    queryFn: async ({ signal }) => asPage<StockMovement>((await api.get(`/stock/items/${itemId}/movements`, { signal, params: { page, size: 20 } })).data),
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: StockMovementInput) =>
      (await api.post<StockItem>(`/stock/items/${id}/movements`, input)).data,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements', variables.id] });
    },
  });
}

export function useStockSummary() {
  return useQuery({ queryKey: ['stock-summary'], queryFn: async ({ signal }) =>
    (await api.get<{total: number; low: number}>('/stock/items/summary', { signal })).data });
}
