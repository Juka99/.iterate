import { Flame } from 'lucide-react';
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
        <Flame />
        <strong>{profile?.streak_count ?? 0}</strong>
        <span>days</span>
      </div>
    </Card>
  );
}

