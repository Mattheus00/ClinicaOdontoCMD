import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { BillingPlan, Invoice, Subscription } from '../../api/types';

export function usePlans() {
  return useQuery({
    queryKey: ['billing-plans'],
    queryFn: async ({ signal }) => (await api.get<BillingPlan[]>('/billing/plans', { signal })).data,
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async ({ signal }) => (await api.get<Subscription>('/billing/subscription', { signal })).data,
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async ({ signal }) => (await api.get<Invoice[]>('/billing/invoices', { signal })).data,
  });
}

export function useSubscribe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { planSlug: string; coupon?: string }) =>
      (
        await api.post<{ checkoutUrl?: string }>('/billing/subscribe', {
          planSlug: input.planSlug,
          coupon: input.coupon?.trim() || undefined,
        })
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription'] }),
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<{ status: string }>('/billing/cancel')).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription'] }),
  });
}
