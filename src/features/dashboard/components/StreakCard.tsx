import { Card } from '@/components/ui/Card';
import type { Profile } from '@/types/user';
import styles from './StreakCard.module.scss';

interface StreakCardProps {
  profile: Profile | null | undefined;
}

export function StreakCard({ profile }: StreakCardProps) {
  return (
    <Card className={styles.card} eyebrow="Momentum" title="Streak">
      <div className={styles.value}>
        <span aria-hidden="true" className={styles.ring} />
        <span aria-hidden="true" className={styles.sparks} />
        <div className={styles.copy}>
          <strong>{profile?.streak_count ?? 0}</strong>
          <span>days</span>
        </div>
      </div>
    </Card>
  );
}
