import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { asPage, type Appointment, type Professional } from '../../api/types';

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
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.from && filters.to) {
        params.from = filters.from;
        params.to = filters.to;
        params.date = filters.from;
      } else if (filters.date) {
        params.date = filters.date;
      }
      if (filters.professionalId) params.professionalId = filters.professionalId;
      return asPage<Appointment>((await api.get('/appointments', { params })).data);
    },
  });
}

export function useCreateAppointment(filters: AppointmentFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppointmentInput) => (await api.post<Appointment>('/appointments', input, { headers: { 'Idempotency-Key': crypto.randomUUID() } })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments', filters] }),
  });
}

export function useCancelAppointment(filters: AppointmentFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/appointments/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', filters] });
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });
}

export function useAcceptAppointment(filters: AppointmentFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<Appointment>(`/appointments/${id}/accept`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', filters] });
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });
}

export function useConfirmAppointment(filters: AppointmentFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<Appointment>(`/appointments/${id}/confirm`)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments', filters] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      const patientId = data.patient.id;
      queryClient.invalidateQueries({ queryKey: ['billing-summary', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient-payments', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient-summary', patientId] });
    },
  });
}

export type RescheduleInput = { id: string; startsAt: string; professionalId: string; professional?: Professional };

export function useRescheduleAppointment(filters: AppointmentFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RescheduleInput) =>
      (await api.patch<Appointment>(`/appointments/${input.id}/reschedule`, {
        startsAt: input.startsAt,
        professionalId: input.professionalId,
      })).data,
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['appointments', filters] }),
  });
}

export function useAvailability(professionalId?: string, date?: string, enabled = false) {
  return useQuery({
    queryKey: ['appointment-availability', professionalId, date],
    enabled: enabled && Boolean(professionalId && date),
    queryFn: async () => (await api.get<string[]>('/appointments/availability', { params: { professionalId, date } })).data,
  });
}
