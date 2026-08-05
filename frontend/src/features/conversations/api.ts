import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { asPage, type Conversation } from '../../api/types';

export function useConversations(status?: string) {
  return useQuery({
    queryKey: ['conversations', status],
    queryFn: async () => asPage<Conversation>((await api.get('/conversations', { params: status ? { status } : undefined })).data),
    refetchInterval: 15_000,
  });
}

export function useTakeOverConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/conversations/${id}/take-over`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useSendMessage() {
  return useMutation({ mutationFn: ({ id, text }: { id: string; text: string }) => api.post(`/conversations/${id}/messages`, { text }) });
}
