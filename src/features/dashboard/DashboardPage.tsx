import { Card } from '@/components/ui/Card';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { DailyChallenges } from './components/DailyChallenges';
import { RankCard } from './components/RankCard';
import { RecentActivity } from './components/RecentActivity';
import { StreakCard } from './components/StreakCard';
import styles from './DashboardPage.module.scss';

export function DashboardPage() {
  const { user } = useAuthSession();
  const { data: profile, error, isLoading } = useProfile(user?.id);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p>System dashboard</p>
          <h1>{profile?.username ? `Keep moving, ${profile.username}` : 'Your next iteration starts now'}</h1>
        </div>
      </section>

      {isLoading && <Card>Loading profile...</Card>}
      {error && <Card className={styles.error}>Profile could not be loaded. Check Supabase env vars and RLS policies.</Card>}

      <section className={styles.grid}>
        <RankCard profile={profile} />
        <StreakCard profile={profile} />
      </section>

      <section className={styles.columns}>
        <DailyChallenges userId={user?.id} />
        <RecentActivity userId={user?.id} />
      </section>
    </div>
  );
}

