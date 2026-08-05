import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Invoice, Subscription } from '../../api/types';

export function useSubscription() {
  return useQuery({ queryKey: ['subscription'], queryFn: async () => (await api.get<Subscription>('/billing/subscription')).data });
}

export function useInvoices() {
  return useQuery({ queryKey: ['invoices'], queryFn: async () => (await api.get<Invoice[]>('/billing/invoices')).data });
}

export function useSubscribe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => (await api.post<{ checkoutUrl?: string }>('/billing/subscribe', { planId })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription'] }),
  });
}
