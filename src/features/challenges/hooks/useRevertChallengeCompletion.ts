import { useMutation, useQueryClient } from '@tanstack/react-query';
import { revertChallengeCompletion } from '../challengesService';
import type { Challenge } from '@/types/challenge';

interface RevertChallengeCompletionInput {
  challenge: Challenge;
  userId: string;
}

export function useRevertChallengeCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ challenge, userId }: RevertChallengeCompletionInput) => revertChallengeCompletion(userId, challenge),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ['profile-showcase', variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ['recent-activity', variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ['daily-challenges', variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ['challenge-sections', variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ['inventory', variables.userId] });
    },
  });
}
