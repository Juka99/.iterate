import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { claimAchievement, getUserAchievements } from '../achievementService';

export function useAchievements(userId?: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ['achievements', userId],
    queryFn: () => getUserAchievements(userId as string),
  });
}

export function useClaimAchievement(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (achievementId: string) => claimAchievement(achievementId),
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: ['achievements', userId] });
        void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        void queryClient.invalidateQueries({ queryKey: ['profile-cosmetics', userId] });
        void queryClient.invalidateQueries({ queryKey: ['profile-showcase', userId] });
        void queryClient.invalidateQueries({ queryKey: ['shop-purchases', userId] });
        void queryClient.invalidateQueries({ queryKey: ['inventory', userId] });
      }
    },
  });
}
