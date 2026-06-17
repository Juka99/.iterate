import { useState } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { ChallengeList } from '@/features/challenges/components/ChallengeList';
import { formatResetDistance, getNextDailyReset } from '@/features/challenges/challengesService';
import { useCompleteChallenge } from '@/features/challenges/hooks/useCompleteChallenge';
import { useDailyChallenges } from '@/features/challenges/hooks/useDailyChallenges';
import { useRevertChallengeCompletion } from '@/features/challenges/hooks/useRevertChallengeCompletion';
import type { ChallengeWithCompletion } from '@/types/challenge';
import styles from './DailyChallenges.module.scss';

interface DailyChallengesProps {
  userId?: string;
}

export function DailyChallenges({ userId }: DailyChallengesProps) {
  const [completingChallengeId, setCompletingChallengeId] = useState<string | undefined>();
  const { data: challenges = [], error, isLoading } = useDailyChallenges(userId);
  const completeChallenge = useCompleteChallenge();
  const revertChallengeCompletion = useRevertChallengeCompletion();
  const resetLabel = formatResetDistance(getNextDailyReset());

  async function handleComplete(challenge: ChallengeWithCompletion) {
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

  async function handleRevert(challenge: ChallengeWithCompletion) {
    if (!userId) {
      return;
    }

    setCompletingChallengeId(challenge.id);

    try {
      await revertChallengeCompletion.mutateAsync({ challenge, userId });
    } finally {
      setCompletingChallengeId(undefined);
    }
  }

  return (
    <Card
      actions={(
        <span className={styles.reset}>
          <Clock />
          Resets in {resetLabel}
        </span>
      )}
      className={styles.card}
      eyebrow="Today"
      title="Daily challenges"
    >
      <div className={styles.summary}>
        <CalendarDays />
        <span>Active missions</span>
        <Badge tone="info">{challenges.length}</Badge>
      </div>
      {isLoading && <Loader className={styles.state} label="Loading today's queue" size="sm" />}
      {error && <p className={styles.error}>Daily challenges could not be loaded.</p>}
      {!isLoading && !error && (
        <ChallengeList
          challenges={challenges}
          completingChallengeId={completingChallengeId}
          emptyMessage="No active challenges have been added yet."
          onComplete={handleComplete}
          onRevert={handleRevert}
        />
      )}
    </Card>
  );
}
