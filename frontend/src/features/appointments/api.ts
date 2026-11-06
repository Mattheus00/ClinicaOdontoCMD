import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { asPage, type Appointment, type Professional, type PageResponse } from '../../api/types';

function updateAppointmentCache(client: QueryClient, data: Appointment) {
  client.setQueriesData<PageResponse<Appointment>>({ queryKey: ['appointments'] }, old => old ? {
    ...old, content: old.content.map(item => item.id === data.id ? data : item),
  } : old);
}

export type AppointmentFilters = { date?: string; from?: string; to?: string; professionalId?: string };
export type AppointmentInput = {
  patientId: string;
  professionalId: string;
  procedureId: string;
  startsAt: string;
  durationMinutes?: number;
};

export function useAppointments(filters: AppointmentFilters) {
  return useQuery({
    queryKey: ['appointments', filters],
    refetchOnWindowFocus: 'always',
    queryFn: async ({ signal }) => {
      const params: Record<string, string> = {};
      if (filters.from && filters.to) {
        params.from = filters.from;
        params.to = filters.to;
        params.date = filters.from;
      } else if (filters.date) {
        params.date = filters.date;
      }
      if (filters.professionalId) params.professionalId = filters.professionalId;
      return asPage<Appointment>((await api.get('/appointments', { signal, params })).data);
    },
  });
}

export function useCreateAppointment(_filters: AppointmentFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppointmentInput) => (await api.post<Appointment>('/appointments', input, { headers: { 'Idempotency-Key': crypto.randomUUID() } })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useCancelAppointment(_filters: AppointmentFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/appointments/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });
}

export function useAcceptAppointment(filters: AppointmentFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<Appointment>(`/appointments/${id}/accept`)).data,
    onSuccess: (data) => {
      updateAppointmentCache(queryClient, data);
      queryClient.setQueryData<{ content: Appointment[] }>(['appointments', filters], (previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          content: previous.content.map((item) => (item.id === data.id ? { ...item, ...data } : item)),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });
}

export function useConfirmAppointment(_filters: AppointmentFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, report }: { id: string; report?: string }) =>
      (await api.post<Appointment>(`/appointments/${id}/confirm`, { report: report || null })).data,
    onSuccess: (data) => {
      updateAppointmentCache(queryClient, data);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['patient-appointments', data.patient.id] });
      const patientId = data.patient.id;
      queryClient.invalidateQueries({ queryKey: ['billing-summary', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient-payments', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient-summary', patientId] });
    },
  });
}

export function useUpdateAppointmentReport(_filters: AppointmentFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, report }: { id: string; report: string }) =>
      (await api.patch<Appointment>(`/appointments/${id}/report`, { report: report || null })).data,
    onSuccess: (data) => {
      updateAppointmentCache(queryClient, data);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-appointments', data.patient.id] });
    },
  });
}

export type RescheduleInput = { id: string; startsAt: string; professionalId: string; professional?: Professional };

export function useRescheduleAppointment(filters: AppointmentFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RescheduleInput) =>
      (await api.patch<Appointment>(
        `/appointments/${input.id}/reschedule`,
        {
          startsAt: input.startsAt,
          professionalId: input.professionalId,
        },
        { skipGlobalError: true },
      )).data,
    onMutate: async (input: RescheduleInput) => {
      await queryClient.cancelQueries({ queryKey: ['appointments', filters] });
      const previous = queryClient.getQueryData<{ content: Appointment[] }>(['appointments', filters]);
      if (previous) {
        queryClient.setQueryData(['appointments', filters], {
          ...previous,
          content: previous.content.map((item) => {
            if (item.id !== input.id) return item;
            const durationMs = new Date(item.endsAt).getTime() - new Date(item.startsAt).getTime();
            return {
              ...item,
              startsAt: input.startsAt,
              endsAt: new Date(new Date(input.startsAt).getTime() + durationMs).toISOString(),
              professional: input.professional ?? item.professional,
            };
          }),
        });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['appointments', filters], context.previous);
      }
      window.dispatchEvent(
        new CustomEvent('app:api-error', {
          detail: { message: 'Não foi possível remarcar o agendamento. Verifique se o horário está livre.' },
        }),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useAvailability(professionalId?: string, date?: string, enabled = false) {
  return useQuery({
    queryKey: ['appointment-availability', professionalId, date],
    enabled: enabled && Boolean(professionalId && date),
    queryFn: async ({ signal }) => (await api.get<string[]>('/appointments/availability', { signal, params: { professionalId, date } })).data,
  });
}
