import { useQuery } from '@tanstack/react-query';
import { getRecentActivity } from '../challengesService';

export function useRecentActivity(userId?: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ['recent-activity', userId],
    queryFn: () => getRecentActivity(userId as string),
  });
}

