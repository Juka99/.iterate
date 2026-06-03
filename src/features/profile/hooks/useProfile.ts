import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../profileService';

export function useProfile(userId?: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId as string),
  });
}

