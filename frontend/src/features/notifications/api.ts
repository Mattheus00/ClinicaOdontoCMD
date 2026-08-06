import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

export type StaffNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  appointmentId?: string | null;
  appointmentStartsAt?: string | null;
  createdAt: string;
  readAt?: string | null;
};

export type StaffNotificationList = {
  unreadCount: number;
  items: StaffNotification[];
};

export function useStaffNotifications(enabled = true) {
  return useQuery({
    queryKey: ['staff-notifications'],
    enabled,
    queryFn: async () => (await api.get<StaffNotificationList>('/staff-notifications')).data,
    refetchInterval: 15_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/staff-notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/staff-notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-notifications'] }),
  });
}
