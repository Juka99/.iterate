import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Crown, Flame, Shield, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { RankBadge } from '@/features/ranks/RankBadge';
import { RANKS } from '@/features/ranks/rankUtils';
import { useLeaderboardUser } from './hooks/useLeaderboard';
import styles from './LeaderboardPage.module.scss';

function getRankTitle(rank: string) {
  return RANKS.find((item) => item.name === rank)?.classTitle ?? 'Unranked Hunter';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatRole(role: string | null) {
  if (!role) {
    return null;
  }

  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function LeaderboardUserDetailPage() {
  const { userId } = useParams();
  const { data: hunter, error, isLoading } = useLeaderboardUser(userId);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Card className={styles.state}>
          <Loader label="Loading hunter file" size="md" />
        </Card>
      </div>
    );
  }

  if (error || !hunter) {
    return (
      <div className={styles.page}>
        <Card className={styles.error}>{error instanceof Error ? error.message : 'Hunter could not be loaded.'}</Card>
      </div>
    );
  }

  const hunterName = hunter.username || `Hunter ${hunter.id.slice(0, 6)}`;
  const guildRole = formatRole(hunter.guild_role);

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/leaderboard">
        Back to leaderboard
      </Link>

      <section className={styles.detailHero}>
        <div className={styles.detailAvatar}>
          {hunter.avatar_url ? <img alt="" src={hunter.avatar_url} /> : <RankBadge rank={hunter.current_rank} showLabel={false} size="md" />}
        </div>
        <div className={styles.detailCopy}>
          <p>Hunter profile</p>
          <h1>{hunterName}</h1>
          <span>
            Rank {hunter.current_rank}: {getRankTitle(hunter.current_rank)}
          </span>
        </div>
        <div className={styles.detailRank}>
          <Trophy />
          <span>Global place</span>
          <strong>#{hunter.leaderboard_position}</strong>
        </div>
      </section>

      <section className={styles.detailGrid}>
        <Card className={styles.statCard} eyebrow="Progression" title="Hunter stats">
          <dl className={styles.statList}>
            <div>
              <Flame />
              <dt>Total XP</dt>
              <dd>{hunter.total_xp.toLocaleString()}</dd>
            </div>
            <div>
              <Shield />
              <dt>Streak</dt>
              <dd>{hunter.streak_count}</dd>
            </div>
            <div>
              <CalendarDays />
              <dt>Joined</dt>
              <dd>{formatDate(hunter.created_at)}</dd>
            </div>
          </dl>
        </Card>

        <Card className={styles.statCard} eyebrow="Guild" title="Guild standing">
          {hunter.guild_id ? (
            <div className={styles.guildSummary}>
              <Crown />
              <div>
                <Link to={`/leaderboard/guilds/${hunter.guild_id}`}>{hunter.guild_name}</Link>
                <span>
                  {guildRole} | Guild #{hunter.guild_position} | Level {hunter.guild_level}
                </span>
                <small>{(hunter.guild_total_xp_contributed ?? 0).toLocaleString()} Guild XP contributed</small>
              </div>
            </div>
          ) : (
            <p className={styles.state}>This hunter is not in a guild yet.</p>
          )}
        </Card>
      </section>
    </div>
  );
}
