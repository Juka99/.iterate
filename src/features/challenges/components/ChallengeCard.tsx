import { CheckCircle, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getChallengeCategoryLook, getChallengeIconStyle } from '@/features/challenges/challengeCategoryLook';
import { getChallengeEssenceReward } from '@/features/challenges/challengeRewards';
import type { ChallengeWithCompletion } from '@/types/challenge';
import styles from './ChallengeCard.module.scss';

const difficultyTone = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
} as const;

interface ChallengeCardProps {
  challenge: ChallengeWithCompletion;
  isCompleting?: boolean;
  onComplete?: (challenge: ChallengeWithCompletion) => void;
  onRevert?: (challenge: ChallengeWithCompletion) => void;
}

export function ChallengeCard({ challenge, isCompleting = false, onComplete, onRevert }: ChallengeCardProps) {
  const challengeLook = getChallengeCategoryLook(challenge.category);
  const CategoryIcon = challengeLook.icon;
  const isCompleted = challenge.is_completed && challenge.cadence !== 'repeatable';
  const essenceReward = getChallengeEssenceReward(challenge);

  return (
    <article className={`${styles.card} ${isCompleted ? styles.completed : ''}`} style={getChallengeIconStyle(challengeLook)}>
      <div className={styles.content}>
        <div className={styles.meta}>
          <Badge tone={difficultyTone[challenge.difficulty]}>{challenge.difficulty}</Badge>
          <span className={styles.categoryTag}>
            <CategoryIcon />
            {challenge.category}
          </span>
          <span className={styles.xpTag}>+{challenge.xp_reward} XP</span>
          <span className={styles.essenceTag}>+{essenceReward} Essence</span>
          {isCompleted && <span className={styles.completedTag}>Completed</span>}
        </div>
        {challenge.description && <p>{challenge.description}</p>}
        <div className={styles.reward}>
          {isCompleted && onRevert && (
            <Button disabled={isCompleting} icon={<RotateCcw />} onClick={() => onRevert(challenge)} variant="danger">
              Revert
            </Button>
          )}
          {!isCompleted && onComplete && (
            <Button disabled={isCompleting} icon={<CheckCircle />} onClick={() => onComplete(challenge)} variant="secondary">
              Mark as complete
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
