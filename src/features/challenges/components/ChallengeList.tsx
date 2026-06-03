import { ChallengeCard } from './ChallengeCard';
import type { Challenge } from '@/types/challenge';
import styles from './ChallengeList.module.scss';

interface ChallengeListProps {
  challenges: Challenge[];
  completingChallengeId?: string;
  emptyMessage?: string;
  onComplete?: (challenge: Challenge) => void;
}

export function ChallengeList({ challenges, completingChallengeId, emptyMessage = 'No active challenges yet.', onComplete }: ChallengeListProps) {
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
        />
      ))}
    </div>
  );
}

