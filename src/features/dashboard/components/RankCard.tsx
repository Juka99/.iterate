import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RankBadge } from '@/features/ranks/RankBadge';
import { getRankProgress } from '@/features/ranks/rankUtils';
import type { Profile } from '@/types/user';
import styles from './RankCard.module.scss';

interface RankCardProps {
  profile: Profile | null | undefined;
}

export function RankCard({ profile }: RankCardProps) {
  const totalXp = profile?.total_xp ?? 0;
  const rankProgress = getRankProgress(totalXp);
  const nextRankLabel = rankProgress.nextRank
    ? `Rank ${rankProgress.nextRank.name}: ${rankProgress.nextRank.classTitle}`
    : 'Max rank';

  return (
    <Card className={styles.card} eyebrow="Current rank" title={`Rank ${rankProgress.currentRank.name}`}>
      <div className={styles.rankSeal} data-rank={rankProgress.currentRank.name}>
        <RankBadge rank={rankProgress.currentRank.name} size="lg" />
        <small>{rankProgress.currentRank.classTitle}</small>
      </div>
      <p className={styles.xp}>{totalXp.toLocaleString()} total XP archived</p>
      <ProgressBar label={nextRankLabel} max={rankProgress.progressMax} value={rankProgress.progressValue} />
    </Card>
  );
}
