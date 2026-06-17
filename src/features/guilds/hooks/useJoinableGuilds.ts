import { useQuery } from '@tanstack/react-query';
import { getJoinableGuilds } from '../guildService';

export function useJoinableGuilds(enabled = true) {
  return useQuery({
    enabled,
    queryKey: ['joinable-guilds'],
    queryFn: () => getJoinableGuilds(),
  });
}
