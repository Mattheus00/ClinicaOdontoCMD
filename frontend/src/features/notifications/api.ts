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
    queryFn: async ({ signal }) => (await api.get<StaffNotificationList>('/staff-notifications', { signal })).data,
    // Public bookings arrive from another tab/session — poll often while the dashboard is open.
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/staff-notifications/${id}/read`),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<StaffNotificationList>(['staff-notifications'], old => {
        if (!old) return old;
        const unread = old.items.some(item => item.id === id && !item.readAt);
        return { unreadCount: Math.max(0, old.unreadCount - (unread ? 1 : 0)), items: old.items.map(item => item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item) };
      });
      return queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/staff-notifications/read-all'),
    onSuccess: () => {
      queryClient.setQueryData<StaffNotificationList>(['staff-notifications'], old => old ? { unreadCount: 0, items: old.items.map(item => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })) } : old);
      return queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });
}

export function useClearStaffNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/staff-notifications'),
    onSuccess: () => {
      queryClient.setQueryData<StaffNotificationList>(['staff-notifications'], {
        unreadCount: 0,
        items: [],
      });
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });
}
