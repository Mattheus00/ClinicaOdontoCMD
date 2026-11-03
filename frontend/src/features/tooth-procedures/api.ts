import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type {
  Odontogram,
  OdontogramAppointment,
  RegisterToothProceduresInput,
  RegisterToothProceduresResult,
  ToothProcedureAuditEntry,
  ToothProcedureRecord,
  UpdateToothProcedureInput,
} from './types';

export const odontogramKeys = {
  all: (patientId: string) => ['odontogram', patientId] as const,
  state: (patientId: string, appointmentId: string | null) =>
    ['odontogram', patientId, 'state', appointmentId ?? 'current'] as const,
  appointments: (patientId: string) => ['odontogram', patientId, 'appointments'] as const,
  procedures: (patientId: string) => ['odontogram', patientId, 'procedures'] as const,
  audit: (procedureId: string) => ['tooth-procedure-audit', procedureId] as const,
};

export function useOdontogramState(patientId: string | undefined, appointmentId: string | null) {
  return useQuery({
    queryKey: odontogramKeys.state(patientId ?? '', appointmentId),
    enabled: Boolean(patientId),
    placeholderData: (previous: Odontogram | undefined) => (previous?.patient.id === patientId ? previous : undefined),
    queryFn: async () =>
      (await api.get<Odontogram>(`/patients/${patientId}/odontogram`, {
        params: appointmentId ? { appointmentId } : undefined,
      })).data,
  });
}

export function useOdontogramAppointments(patientId: string | undefined) {
  return useQuery({
    queryKey: odontogramKeys.appointments(patientId ?? ''),
    enabled: Boolean(patientId),
    queryFn: async () =>
      (await api.get<OdontogramAppointment[]>(`/patients/${patientId}/odontogram/appointments`)).data,
  });
}

export function useToothProcedures(patientId: string | undefined) {
  return useQuery({
    queryKey: odontogramKeys.procedures(patientId ?? ''),
    enabled: Boolean(patientId),
    queryFn: async () =>
      (await api.get<ToothProcedureRecord[]>(`/patients/${patientId}/tooth-procedures`)).data,
  });
}

export function useRegisterToothProcedures(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegisterToothProceduresInput) =>
      (await api.post<RegisterToothProceduresResult>(`/patients/${patientId}/tooth-procedures`, input)).data,
    onSuccess: (result) => {
      queryClient.setQueryData(odontogramKeys.state(patientId, null), result.odontogram);
      queryClient.invalidateQueries({
        queryKey: odontogramKeys.all(patientId),
        predicate: (query) => query.queryKey[3] !== 'current',
      });
    },
  });
}

export function useUpdateToothProcedure(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateToothProcedureInput }) =>
      (await api.patch<ToothProcedureRecord>(`/tooth-procedures/${id}`, input)).data,
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: odontogramKeys.all(patientId) });
      queryClient.invalidateQueries({ queryKey: odontogramKeys.audit(record.id) });
    },
  });
}

export function useCancelToothProcedure(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      (await api.delete<ToothProcedureRecord>(`/tooth-procedures/${id}`, { params: { reason } })).data,
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: odontogramKeys.all(patientId) });
      queryClient.invalidateQueries({ queryKey: odontogramKeys.audit(record.id) });
    },
  });
}

export function useToothProcedureAudit(procedureId: string | null) {
  return useQuery({
    queryKey: odontogramKeys.audit(procedureId ?? ''),
    enabled: Boolean(procedureId),
    queryFn: async () =>
      (await api.get<ToothProcedureAuditEntry[]>(`/tooth-procedures/${procedureId}/audit`)).data,
  });
}
