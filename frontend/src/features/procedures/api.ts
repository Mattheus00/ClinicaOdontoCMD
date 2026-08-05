import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { asPage, type Procedure } from '../../api/types';

export type ProcedureInput = { name: string; price: number };

export function useProcedures(enabled = true) {
  return useQuery({
    queryKey: ['procedures'],
    enabled,
    queryFn: async () => asPage<Procedure>((await api.get('/procedures')).data),
  });
}

export function useCreateProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProcedureInput) => (await api.post<Procedure>('/procedures', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  });
}

export function useUpdateProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ProcedureInput & { id: string }) =>
      (await api.put<Procedure>(`/procedures/${id}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  });
}

export function useDeleteProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/procedures/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  });
}
