import { useQuery } from '@tanstack/react-query';
import { getGuildOverview } from '../guildService';

export function useGuild(userId?: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ['guild', userId],
    queryFn: () => getGuildOverview(userId as string),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}
