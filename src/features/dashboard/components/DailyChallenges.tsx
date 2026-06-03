import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ChallengeList } from '@/features/challenges/components/ChallengeList';
import { useCompleteChallenge } from '@/features/challenges/hooks/useCompleteChallenge';
import { useDailyChallenges } from '@/features/challenges/hooks/useDailyChallenges';
import type { Challenge } from '@/types/challenge';
import styles from './DailyChallenges.module.scss';

interface DailyChallengesProps {
  userId?: string;
}

export function DailyChallenges({ userId }: DailyChallengesProps) {
  const [completingChallengeId, setCompletingChallengeId] = useState<string | undefined>();
  const { data: challenges = [], error, isLoading } = useDailyChallenges();
  const completeChallenge = useCompleteChallenge();

  async function handleComplete(challenge: Challenge) {
    if (!userId) {
      return;
    }

    setCompletingChallengeId(challenge.id);

    try {
      await completeChallenge.mutateAsync({ challenge, userId });
    } finally {
      setCompletingChallengeId(undefined);
    }
  }

  return (
    <Card className={styles.card} eyebrow="Today" title="Daily challenges">
      {isLoading && <p className={styles.state}>Loading today&apos;s queue...</p>}
      {error && <p className={styles.error}>Daily challenges could not be loaded.</p>}
      {!isLoading && !error && (
        <ChallengeList
          challenges={challenges}
          completingChallengeId={completingChallengeId}
          emptyMessage="No active challenges have been added yet."
          onComplete={handleComplete}
        />
      )}
    </Card>
  );
}

