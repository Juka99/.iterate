import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Crown, Shield, Trophy, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { RankBadge } from '@/features/ranks/RankBadge';
import { getGuildLevelProgress } from '@/features/guilds/guildService';
import { useLeaderboardGuild, useLeaderboardGuildMembers } from './hooks/useLeaderboard';
import styles from './LeaderboardPage.module.scss';

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatRole(role: string) {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function LeaderboardGuildDetailPage() {
  const { guildId } = useParams();
  const guildQuery = useLeaderboardGuild(guildId);
  const membersQuery = useLeaderboardGuildMembers(guildId);

  if (guildQuery.isLoading) {
    return (
      <div className={styles.page}>
        <Card className={styles.state}>
          <Loader label="Loading guild record" size="md" />
        </Card>
      </div>
    );
  }

  if (guildQuery.error || !guildQuery.data) {
    return (
      <div className={styles.page}>
        <Card className={styles.error}>{guildQuery.error instanceof Error ? guildQuery.error.message : 'Guild could not be loaded.'}</Card>
      </div>
    );
  }

  const guild = guildQuery.data;
  const progress = getGuildLevelProgress(guild.total_xp);
  const progressPercent = Math.min(Math.max((progress.progressValue / Math.max(progress.progressMax, 1)) * 100, 0), 100);

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/leaderboard">
        Back to leaderboard
      </Link>

      <section className={styles.detailHero}>
        <div className={styles.detailAvatar}>
          {guild.emblem_url ? <img alt="" src={guild.emblem_url} /> : <Shield />}
        </div>
        <div className={styles.detailCopy}>
          <p>Guild record</p>
          <h1>{guild.name}</h1>
          <span>{guild.description || 'A shared progression hall climbing the global board.'}</span>
        </div>
        <div className={styles.detailRank}>
          <Trophy />
          <span>Global place</span>
          <strong>#{guild.leaderboard_position}</strong>
        </div>
      </section>

      <section className={styles.detailGrid}>
        <Card className={styles.statCard} eyebrow="Guild power" title="Progress">
          <dl className={styles.statList}>
            <div>
              <Crown />
              <dt>Level</dt>
              <dd>{guild.level}</dd>
            </div>
            <div>
              <Shield />
              <dt>Guild XP</dt>
              <dd>{guild.total_xp.toLocaleString()}</dd>
            </div>
            <div>
              <Users />
              <dt>Members</dt>
              <dd>
                {guild.member_count}/{guild.member_limit}
              </dd>
            </div>
            <div>
              <CalendarDays />
              <dt>Founded</dt>
              <dd>{formatDate(guild.created_at)}</dd>
            </div>
          </dl>
          <div className={styles.guildProgress}>
            <div>
              <span>Level progress</span>
              <strong>{progress.nextLevel ? `${progress.xpToNext.toLocaleString()} XP to Level ${progress.nextLevel}` : 'Max guild level reached'}</strong>
            </div>
            <div aria-label="Guild level progress" aria-valuemax={progress.progressMax} aria-valuemin={0} aria-valuenow={progress.progressValue} role="progressbar">
              <span style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </Card>

        <Card className={styles.statCard} eyebrow="Top members" title="Contributors">
          {membersQuery.isLoading && <Loader className={styles.state} label="Loading members" size="sm" />}
          {membersQuery.error && <p className={styles.error}>Guild members could not be loaded.</p>}
          {!membersQuery.isLoading && !membersQuery.error && (
            <div className={styles.memberList}>
              {membersQuery.data?.map((member) => (
                <Link className={styles.memberRow} key={member.user_id} to={`/leaderboard/users/${member.user_id}`}>
                  <span className={styles.position}>#{member.leaderboard_position}</span>
                  <RankBadge rank={member.current_rank} showLabel={false} size="sm" />
                  <div>
                    <strong>{member.username || `Hunter ${member.user_id.slice(0, 6)}`}</strong>
                    <small>{formatRole(member.role)}</small>
                  </div>
                  <em>{member.total_xp_contributed.toLocaleString()} Guild XP</em>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
