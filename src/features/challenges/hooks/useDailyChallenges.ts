import { useQuery } from '@tanstack/react-query';
import { getDailyChallenges } from '../challengesService';

export function useDailyChallenges(userId?: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ['daily-challenges', userId],
    queryFn: () => getDailyChallenges(userId as string),
  });
}
