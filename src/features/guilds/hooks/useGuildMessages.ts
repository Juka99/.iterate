import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGuildMessages, sendGuildMessage } from '../guildService';

interface SendGuildMessageInput {
  body: string;
  guildId: string;
  userId: string;
}

export function useGuildMessages(guildId?: string) {
  return useQuery({
    enabled: Boolean(guildId),
    queryKey: ['guild-messages', guildId],
    queryFn: () => getGuildMessages(guildId as string),
    refetchInterval: 8000,
    refetchIntervalInBackground: false,
  });
}

export function useSendGuildMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, guildId, userId }: SendGuildMessageInput) => sendGuildMessage(userId, guildId, body),
    onSuccess: (_message, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['guild-messages', variables.guildId] });
    },
  });
}
