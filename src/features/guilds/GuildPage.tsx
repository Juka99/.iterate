import { Shield, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { getRankProgress } from '@/features/ranks/rankUtils';
import { CreateGuildPage } from './CreateGuildPage';
import { GuildDashboard } from './GuildDashboard';
import { JoinGuildPage } from './JoinGuildPage';
import { useGuild } from './hooks/useGuild';
import styles from './GuildPage.module.scss';

export function GuildPage() {
  const { user } = useAuthSession();
  const { data: profile } = useProfile(user?.id);
  const { data: overview, error, isLoading } = useGuild(user?.id);
  const rankProgress = getRankProgress(profile?.total_xp ?? 0);
  const canAccessGuilds = rankProgress.currentRank.order >= 3;

  if (!user) {
    return null;
  }

  if (!canAccessGuilds) {
    return (
      <div className={styles.page}>
        <Card className={styles.lockedGuilds} eyebrow="Guilds locked" title="Reach Rank C">
          <Shield />
          <p>Guild halls unlock once you reach Rank C. Keep completing challenges and your invitation will open.</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Card className={styles.state}>
          <Loader label="Loading guild hall" size="md" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Card className={styles.error}>Guild hall could not be loaded. Check the guild migration and Supabase policies.</Card>
      </div>
    );
  }

  if (overview) {
    return (
      <div className={styles.page}>
        <GuildDashboard overview={overview} userId={user.id} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.emptyHero}>
        <div className={styles.emptyIcon}>
          <Users />
        </div>
        <div>
          <p>Hunter association</p>
          <h1>Guilds</h1>
          <span>Join a shared progression hall where every completed challenge strengthens both you and your guild.</span>
        </div>
      </section>
      <section className={styles.emptyGrid}>
        <CreateGuildPage userId={user.id} />
        <JoinGuildPage userId={user.id} />
      </section>
    </div>
  );
}
