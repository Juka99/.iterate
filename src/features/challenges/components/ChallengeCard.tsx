import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Challenge } from '@/types/challenge';
import styles from './ChallengeCard.module.scss';

const difficultyTone = {
  easy: 'success',
  medium: 'warning',
  hard: 'info',
} as const;

interface ChallengeCardProps {
  challenge: Challenge;
  isCompleting?: boolean;
  onComplete?: (challenge: Challenge) => void;
}

export function ChallengeCard({ challenge, isCompleting = false, onComplete }: ChallengeCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.content}>
        <div className={styles.meta}>
          <Badge tone={difficultyTone[challenge.difficulty]}>{challenge.difficulty}</Badge>
          <span>{challenge.category}</span>
        </div>
        <h3>{challenge.title}</h3>
        {challenge.description && <p>{challenge.description}</p>}
      </div>
      <div className={styles.reward}>
        <strong>+{challenge.xp_reward} XP</strong>
        {onComplete && (
          <Button disabled={isCompleting} icon={<CheckCircle />} onClick={() => onComplete(challenge)} variant="secondary">
            Complete
          </Button>
        )}
      </div>
    </article>
  );
}

