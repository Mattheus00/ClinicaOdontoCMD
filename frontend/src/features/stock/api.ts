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

export function useStockItems() {
  return useQuery({
    queryKey: ['stock-items'],
    queryFn: async () => asPage<StockItem>((await api.get('/stock/items')).data),
  });
}

export function useCreateStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StockItemInput) => (await api.post<StockItem>('/stock/items', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-items'] }),
  });
}

export function useUpdateStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: StockItemInput & { id: string }) =>
      (await api.put<StockItem>(`/stock/items/${id}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-items'] }),
  });
}

export function useDeleteStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/stock/items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-items'] }),
  });
}

export function useStockMovements(itemId?: string) {
  return useQuery({
    queryKey: ['stock-movements', itemId],
    enabled: Boolean(itemId),
    queryFn: async () => (await api.get<StockMovement[]>(`/stock/items/${itemId}/movements`)).data,
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: StockMovementInput) =>
      (await api.post<StockItem>(`/stock/items/${id}/movements`, input)).data,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements', variables.id] });
    },
  });
}
