import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Appointment } from '../../api/types';

// Drafts stay in memory, scoped to user and appointment. Never store clinical text on disk.
export function useReportDraft(appointment: Appointment | undefined, userId: string | null) {
  const client = useQueryClient();
  const key = ['appointment-report-draft', userId, appointment?.id];
  const draft = useQuery<string>({ queryKey: key, queryFn: () => appointment?.report ?? '', enabled: false,
    initialData: () => appointment?.report ?? '', gcTime: 30 * 60 * 1000 });
  return [draft.data ?? '', (text: string) => client.setQueryData(key, text)] as const;
}
