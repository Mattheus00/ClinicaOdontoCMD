import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Invoice, Subscription } from '../../api/types';

export function useSubscription() {
  return useQuery({ queryKey: ['subscription'], queryFn: async ({ signal }) => (await api.get<Subscription>('/billing/subscription', { signal })).data });
}

export function useInvoices() {
  return useQuery({ queryKey: ['invoices'], queryFn: async ({ signal }) => (await api.get<Invoice[]>('/billing/invoices', { signal })).data });
}

export function useSubscribe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => (await api.post<{ checkoutUrl?: string }>('/billing/subscribe', { planId })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription'] }),
  });
}
