import { ChallengeCard } from './ChallengeCard';
import type { ChallengeWithCompletion } from '@/types/challenge';
import styles from './ChallengeList.module.scss';

interface ChallengeListProps {
  challenges: ChallengeWithCompletion[];
  completingChallengeId?: string;
  emptyMessage?: string;
  onComplete?: (challenge: ChallengeWithCompletion) => void;
  onRevert?: (challenge: ChallengeWithCompletion) => void;
}

export function ChallengeList({
  challenges,
  completingChallengeId,
  emptyMessage = 'No active challenges yet.',
  onComplete,
  onRevert,
}: ChallengeListProps) {
  if (challenges.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.list}>
      {challenges.map((challenge) => (
        <ChallengeCard
          challenge={challenge}
          isCompleting={completingChallengeId === challenge.id}
          key={challenge.id}
          onComplete={onComplete}
          onRevert={onRevert}
        />
      ))}
    </div>
  );
}
