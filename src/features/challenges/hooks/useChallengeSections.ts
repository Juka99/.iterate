import { useQuery } from '@tanstack/react-query';
import { getChallengeSections } from '../challengesService';

export function useChallengeSections(userId?: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ['challenge-sections', userId],
    queryFn: () => getChallengeSections(userId as string),
  });
}
