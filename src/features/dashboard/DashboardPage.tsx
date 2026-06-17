import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { RankBadge } from '@/features/ranks/RankBadge';
import { getRankProgress } from '@/features/ranks/rankUtils';
import { DailyChallenges } from './components/DailyChallenges';
import { ProgressionOverview } from './components/ProgressionOverview';
import { RankCard } from './components/RankCard';
import { RecentActivity } from './components/RecentActivity';
import { StreakCard } from './components/StreakCard';
import styles from './DashboardPage.module.scss';

export function DashboardPage() {
  const { user } = useAuthSession();
  const { data: profile, error, isLoading } = useProfile(user?.id);
  const rankProgress = getRankProgress(profile?.total_xp ?? 0);
  const totalXp = profile?.total_xp ?? 0;
  const xpTarget = rankProgress.nextRank?.minXp ?? totalXp;
  const xpToNext = rankProgress.nextRank ? Math.max(rankProgress.nextRank.minXp - totalXp, 0) : 0;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p>System dashboard</p>
          <h1>
            Keep moving,
            <span>{profile?.username ?? 'Hunter'}</span>
          </h1>
          <div className={styles.heroProgress}>
            <span style={{ width: `${Math.min(Math.max((rankProgress.progressValue / Math.max(rankProgress.progressMax, 1)) * 100, 0), 100)}%` }} />
          </div>
          <small>{xpToNext.toLocaleString()} XP until Rank {rankProgress.nextRank?.name ?? rankProgress.currentRank.name}</small>
        </div>
        <dl className={styles.heroStats}>
          <div>
            <dt>Rank</dt>
            <dd className={styles.rankBadge}>
              <RankBadge rank={rankProgress.currentRank.name} />
            </dd>
          </div>
          <div>
            <dt>XP</dt>
            <dd>{totalXp.toLocaleString()}</dd>
            <small>/ {xpTarget.toLocaleString()}</small>
          </div>
          <div>
            <dt>Streak</dt>
            <dd>{profile?.streak_count ?? 0}</dd>
          </div>
        </dl>
      </section>

      {isLoading && (
        <Card>
          <Loader label="Loading profile" size="md" />
        </Card>
      )}
      {error && <Card className={styles.error}>Profile could not be loaded. Check Supabase env vars and RLS policies.</Card>}

      <section className={styles.grid}>
        <RankCard profile={profile} />
        <StreakCard profile={profile} />
      </section>

      <section className={styles.columns}>
        <DailyChallenges userId={user?.id} />
        <RecentActivity userId={user?.id} />
      </section>

      <ProgressionOverview profile={profile} />
    </div>
  );
}
