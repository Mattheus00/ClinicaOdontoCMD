import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { asPage, type Professional } from '../../api/types';

export type CreateProfessionalInput = {
  name: string;
  email: string;
  specialty?: string;
};

export function useProfessionals(enabled = true) {
  return useQuery({
    queryKey: ['professionals'],
    enabled,
    queryFn: async () => asPage<Professional>((await api.get('/professionals', { params: { size: 100 } })).data),
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProfessionalInput) =>
      (await api.post<Professional>('/professionals', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['professionals'] }),
  });
}

export function useRegenerateProfessionalInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, email }: { id: string; email?: string }) =>
      (await api.post<Professional>(`/professionals/${id}/regenerate-invite`, email ? { email } : {})).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['professionals'] }),
  });
}

export function useDeleteProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/professionals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
