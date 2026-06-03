import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getRankProgress } from '@/features/ranks/rankUtils';
import type { Profile } from '@/types/user';
import styles from './RankCard.module.scss';

interface RankCardProps {
  profile: Profile | null | undefined;
}

export function RankCard({ profile }: RankCardProps) {
  const totalXp = profile?.total_xp ?? 0;
  const rankProgress = getRankProgress(totalXp);
  const nextRankLabel = rankProgress.nextRank ? `Rank ${rankProgress.nextRank.name}` : 'Max rank';

  return (
    <Card className={styles.card} eyebrow="Current rank" title={`Rank ${rankProgress.currentRank.name}`}>
      <p className={styles.xp}>{totalXp.toLocaleString()} total XP</p>
      <ProgressBar label={nextRankLabel} max={rankProgress.progressMax} value={rankProgress.progressValue} />
    </Card>
  );
}

