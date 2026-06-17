import { useQuery } from '@tanstack/react-query';
import { getProfileCosmetics } from '../profileCosmetics';

export function useProfileCosmetics(userId?: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ['profile-cosmetics', userId],
    queryFn: () => getProfileCosmetics(userId as string),
  });
}
