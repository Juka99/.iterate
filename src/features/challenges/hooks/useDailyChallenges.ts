import { useQuery } from '@tanstack/react-query';
import { getDailyChallenges } from '../challengesService';

export function useDailyChallenges(limit?: number) {
  return useQuery({
    queryKey: ['daily-challenges', limit],
    queryFn: () => getDailyChallenges(limit),
  });
}

