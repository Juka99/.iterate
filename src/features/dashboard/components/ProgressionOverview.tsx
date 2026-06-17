import { TrendingUp, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { RankBadge } from '@/features/ranks/RankBadge';
import { getRankProgress } from '@/features/ranks/rankUtils';
import type { Profile } from '@/types/user';
import styles from './ProgressionOverview.module.scss';

interface ProgressionOverviewProps {
  profile: Profile | null | undefined;
}

export function ProgressionOverview({ profile }: ProgressionOverviewProps) {
  const totalXp = profile?.total_xp ?? 0;
  const rankProgress = getRankProgress(totalXp);
  const nextRank = rankProgress.nextRank;
  const xpToNext = rankProgress.nextRank ? Math.max(rankProgress.nextRank.minXp - totalXp, 0) : 0;

  return (
    <Card className={styles.card} eyebrow="Your progression" title="Character growth">
      <div className={styles.grid}>
        <article className={`${styles.stat} ${styles.xpPanel}`}>
          <div className={styles.xpPanelCopy}>
            <span>Total XP</span>
            <strong>{totalXp.toLocaleString()}</strong>
          </div>
          <TrendingUp />
        </article>
        <article className={`${styles.stat} ${styles.rankPanel}`} data-rank={rankProgress.currentRank.name}>
          <div className={styles.rankPanelCopy}>
            <span>Current rank</span>
            <strong>{rankProgress.currentRank.name}</strong>
            <small className={styles.rankPanelTitle}>{rankProgress.currentRank.classTitle}</small>
          </div>
          <RankBadge className={styles.rankPanelBadge} rank={rankProgress.currentRank.name} showLabel={false} size="sm" />
        </article>
        <article className={`${styles.stat} ${styles.rankPanel}`} data-rank={nextRank?.name ?? 'max'}>
          <div className={styles.rankPanelCopy}>
            <span>Next rank</span>
            <strong>{nextRank?.name ?? 'Max'}</strong>
            <small>{nextRank ? `${xpToNext.toLocaleString()} XP to go` : 'Peak reached'}</small>
          </div>
          {nextRank && <RankBadge className={styles.rankPanelBadge} rank={nextRank.name} showLabel={false} size="sm" />}
        </article>
        <article className={`${styles.stat} ${styles.achievementPanel}`}>
          <div className={styles.achievementPanelCopy}>
            <span>Achievements</span>
            <strong>12</strong>
            <small>Unlocked</small>
          </div>
          <Trophy />
        </article>
      </div>
    </Card>
  );
}
