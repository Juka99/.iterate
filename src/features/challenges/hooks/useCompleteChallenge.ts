import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completeChallenge } from '../challengesService';
import type { Challenge } from '@/types/challenge';

interface CompleteChallengeInput {
  challenge: Challenge;
  userId: string;
}

export function useCompleteChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ challenge, userId }: CompleteChallengeInput) => completeChallenge(userId, challenge),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ['recent-activity', variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ['daily-challenges'] });
    },
  });
}

