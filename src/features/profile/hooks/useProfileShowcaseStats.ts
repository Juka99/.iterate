import { useQuery } from '@tanstack/react-query';
import { getProfileShowcaseStats } from '../profileShowcaseService';

export function useProfileShowcaseStats(userId?: string, enabled = true) {
  return useQuery({
    enabled: Boolean(userId) && enabled,
    queryKey: ['profile-showcase', userId],
    queryFn: () => getProfileShowcaseStats(userId as string),
  });
}
