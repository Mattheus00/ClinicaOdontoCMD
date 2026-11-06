import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  asPage,
  type AccessLog,
  type Anamnesis,
  type AppointmentHistory,
  type BillingSummary,
  type Patient,
  type PatientInput,
  type PatientInsurance,
  type PatientPayment,
  type PatientSummary,
  type TreatmentPlan,
  type TreatmentRecord,
} from '../../api/types';

export type { PatientInput };

export function usePatients(search = '', page = 0, enabled = true) {
  return useQuery({
    queryKey: ['patients', search, page],
    enabled,
    queryFn: async ({ signal }) => asPage<Patient>((await api.get('/patients', { signal, params: { search, page, size: 20 } })).data),
  });
}

export function usePatient(id?: string) {
  return useQuery({
    queryKey: ['patient', id],
    enabled: Boolean(id),
    queryFn: async ({ signal }) => (await api.get<Patient>(`/patients/${id}`, { signal })).data,
  });
}

export function usePatientSummary(id?: string, enabled = true) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['patient-summary', id],
    enabled: Boolean(id) && enabled,
    queryFn: async ({ signal }) => {
      const result = (await api.get<PatientSummary>(`/patients/${id}/summary`, { signal })).data;
      if (!signal.aborted) queryClient.setQueryData(['patient', id], result.patient);
      return result;
    },
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PatientInput) => (await api.post<Patient>('/patients', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useUpdatePatient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PatientInput) => (await api.put<Patient>(`/patients/${id}`, input)).data,
    onSuccess: (patient) => {
      queryClient.setQueryData(['patient', id], patient);
      queryClient.setQueryData<PatientSummary>(['patient-summary', id], old => old ? { ...old, patient } : old);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['patient-summary', id] });
    },
  });
}

export function useAnonymizePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/patients/${id}/personal-data`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['patient-summary', id] });
    },
  });
}

export function useAnamnesis(id?: string, enabled = true) {
  return useQuery({
    queryKey: ['anamnesis', id],
    enabled: Boolean(id) && enabled,
    queryFn: async ({ signal }) => (await api.get<Anamnesis>(`/patients/${id}/anamnesis`, { signal })).data,
  });
}

export function useSaveAnamnesis(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Anamnesis) => (await api.put<Anamnesis>(`/patients/${id}/anamnesis`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis', id] });
      queryClient.invalidateQueries({ queryKey: ['patient-summary', id] });
    },
  });
}

export function useTreatments(id?: string) {
  return useQuery({
    queryKey: ['treatments', id],
    enabled: Boolean(id),
    queryFn: async ({ signal }) => (await api.get<TreatmentRecord[]>(`/patients/${id}/treatments`, { signal })).data,
  });
}

export function useCreateTreatment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { procedureName: string; notes?: string; performedAt?: string; professionalId?: string; status?: string }) =>
      (await api.post<TreatmentRecord>(`/patients/${id}/treatments`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['treatments', id] }),
  });
}

export function useBillingSummary(id?: string, enabled = true) {
  return useQuery({
    queryKey: ['billing-summary', id],
    enabled: Boolean(id) && enabled,
    queryFn: async ({ signal }) => (await api.get<BillingSummary>(`/patients/${id}/billing/summary`, { signal })).data,
  });
}

export function useTreatmentPlans(id?: string, enabled = true) {
  return useQuery({
    queryKey: ['treatment-plans', id],
    enabled: Boolean(id) && enabled,
    queryFn: async ({ signal }) => (await api.get<TreatmentPlan[]>(`/patients/${id}/billing/plans`, { signal })).data,
  });
}

export function useCreateTreatmentPlan(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; status?: string; dueDate?: string; notes?: string; items: Array<{ description: string; quantity: number; unitPrice: number }> }) =>
      (await api.post<TreatmentPlan>(`/patients/${id}/billing/plans`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans', id] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary', id] });
      queryClient.invalidateQueries({ queryKey: ['patient-summary', id] });
    },
  });
}

export function usePatientPayments(id?: string, enabled = true, page = 0) {
  return useQuery({
    queryKey: ['patient-payments', id, page],
    enabled: Boolean(id) && enabled,
    queryFn: async ({ signal }) => asPage<PatientPayment>((await api.get(`/patients/${id}/billing/payments`, { signal, params: { page, size: 20 } })).data),
  });
}

export function useCreatePatientPayment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { amount: number; method?: string; status?: string; paidAt?: string; planId?: string; notes?: string }) =>
      (await api.post<PatientPayment>(`/patients/${id}/billing/payments`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-payments', id] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary', id] });
      queryClient.invalidateQueries({ queryKey: ['patient-summary', id] });
    },
  });
}

export function usePatientInsurances(id?: string, enabled = true) {
  return useQuery({
    queryKey: ['patient-insurances', id],
    enabled: Boolean(id) && enabled,
    queryFn: async ({ signal }) => (await api.get<PatientInsurance[]>(`/patients/${id}/billing/insurances`, { signal })).data,
  });
}

export function useCreatePatientInsurance(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { providerName: string; planName?: string; cardNumber?: string; status?: string }) =>
      (await api.post<PatientInsurance>(`/patients/${id}/billing/insurances`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patient-insurances', id] }),
  });
}

export function usePatientAppointments(id?: string, enabled = true, page = 0) {
  return useQuery({
    queryKey: ['patient-appointments', id, page],
    enabled: Boolean(id) && enabled,
    queryFn: async ({ signal }) => asPage<AppointmentHistory>((await api.get(`/patients/${id}/appointments`, { signal, params: { page, size: 20 } })).data),
  });
}

export function usePatientAccessLogs(id?: string) {
  return useQuery({
    queryKey: ['patient-access-logs', id],
    enabled: Boolean(id),
    queryFn: async ({ signal }) => (await api.get<AccessLog[]>(`/patients/${id}/access-logs`, { signal })).data,
  });
}
