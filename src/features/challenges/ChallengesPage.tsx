import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import type { Challenge } from '@/types/challenge';
import { ChallengeList } from './components/ChallengeList';
import { useCompleteChallenge } from './hooks/useCompleteChallenge';
import { useDailyChallenges } from './hooks/useDailyChallenges';
import styles from './ChallengesPage.module.scss';

export function ChallengesPage() {
  const { user } = useAuthSession();
  const [completingChallengeId, setCompletingChallengeId] = useState<string | undefined>();
  const { data: challenges = [], error, isLoading } = useDailyChallenges(12);
  const completeChallenge = useCompleteChallenge();

  async function handleComplete(challenge: Challenge) {
    if (!user) {
      return;
    }

    setCompletingChallengeId(challenge.id);

    try {
      await completeChallenge.mutateAsync({ challenge, userId: user.id });
    } finally {
      setCompletingChallengeId(undefined);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.heading}>
        <p>Daily queue</p>
        <h1>Challenges</h1>
      </section>
      <Card title="Available challenges">
        {isLoading && <p className={styles.state}>Loading challenges...</p>}
        {error && <p className={styles.error}>Could not load challenges.</p>}
        {!isLoading && !error && (
          <ChallengeList challenges={challenges} completingChallengeId={completingChallengeId} onComplete={handleComplete} />
        )}
      </Card>
    </div>
  );
}

