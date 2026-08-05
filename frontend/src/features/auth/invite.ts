import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export type InvitePreview = {
  professionalName: string;
  clinicName: string;
  email: string;
};

export function useInvitePreview(token?: string) {
  return useQuery({
    queryKey: ['invite-preview', token],
    enabled: Boolean(token),
    queryFn: async () => (await api.get<InvitePreview>(`/auth/invite/${token}`)).data,
    retry: false,
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) =>
      (await api.post<{ accessToken: string }>(`/auth/invite/${token}/accept`, { password })).data,
  });
}
