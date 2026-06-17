import { Link } from 'react-router-dom';
import { Crown, Flame, Shield, Trophy, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { RankBadge } from '@/features/ranks/RankBadge';
import { RANKS } from '@/features/ranks/rankUtils';
import { useGuildLeaderboard, useMyLeaderboardPlacement, useUserLeaderboard } from './hooks/useLeaderboard';
import type { GuildLeaderboardEntry, UserLeaderboardEntry } from './leaderboardTypes';
import styles from './LeaderboardPage.module.scss';

function getRankTitle(rank: string) {
  return RANKS.find((item) => item.name === rank)?.classTitle ?? 'Unranked Hunter';
}

function getHunterName(entry: Pick<UserLeaderboardEntry, 'id' | 'username'>) {
  return entry.username || `Hunter ${entry.id.slice(0, 6)}`;
}

function UserLeaderboardRow({ entry }: { entry: UserLeaderboardEntry }) {
  return (
    <Link className={styles.leaderRow} to={`/leaderboard/users/${entry.id}`}>
      <span className={styles.position}>#{entry.leaderboard_position}</span>
      <RankBadge rank={entry.current_rank} showLabel={false} size="sm" />
      <div className={styles.rowMain}>
        <strong>{getHunterName(entry)}</strong>
        <span>
          Rank {entry.current_rank}: {getRankTitle(entry.current_rank)}
        </span>
      </div>
      <dl className={styles.rowStats}>
        <div>
          <dt>XP</dt>
          <dd>{entry.total_xp.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Streak</dt>
          <dd>{entry.streak_count}</dd>
        </div>
      </dl>
    </Link>
  );
}

function GuildLeaderboardRow({ entry }: { entry: GuildLeaderboardEntry }) {
  return (
    <Link className={styles.leaderRow} to={`/leaderboard/guilds/${entry.id}`}>
      <span className={styles.position}>#{entry.leaderboard_position}</span>
      <span className={styles.guildMark}>{entry.emblem_url ? <img alt="" src={entry.emblem_url} /> : <Shield />}</span>
      <div className={styles.rowMain}>
        <strong>{entry.name}</strong>
        <span>{entry.description || 'A guild climbing the global hall.'}</span>
      </div>
      <dl className={styles.rowStats}>
        <div>
          <dt>Level</dt>
          <dd>{entry.level}</dd>
        </div>
        <div>
          <dt>Guild XP</dt>
          <dd>{entry.total_xp.toLocaleString()}</dd>
        </div>
      </dl>
    </Link>
  );
}

export function LeaderboardPage() {
  const { user } = useAuthSession();
  const userLeaderboard = useUserLeaderboard();
  const guildLeaderboard = useGuildLeaderboard();
  const placement = useMyLeaderboardPlacement(Boolean(user?.id));
  const isLoading = userLeaderboard.isLoading || guildLeaderboard.isLoading;
  const hasError = userLeaderboard.error || guildLeaderboard.error;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroIcon}>
          <Trophy />
        </div>
        <div>
          <p>Global standings</p>
          <h1>Leaderboard</h1>
          <span>Top hunters and guilds ranked by progression power.</span>
        </div>
      </section>

      <Card className={styles.placementCard} eyebrow="Global placement" title="Your Standing">
        {placement.isLoading && <Loader className={styles.state} label="Calculating placement" size="sm" />}
        {placement.error && <p className={styles.error}>{placement.error instanceof Error ? placement.error.message : 'Placement could not be loaded.'}</p>}
        {placement.data && (
          <div className={styles.placementGrid}>
            <article>
              <Flame />
              <span>Hunter rank</span>
              <strong>#{placement.data.user_position}</strong>
              <small>{placement.data.user_total_xp.toLocaleString()} XP</small>
            </article>
            <article>
              <Crown />
              <span>Guild rank</span>
              {placement.data.guild_id ? (
                <>
                  <strong>#{placement.data.guild_position}</strong>
                  <Link to={`/leaderboard/guilds/${placement.data.guild_id}`}>
                    {placement.data.guild_name} | {placement.data.guild_total_xp?.toLocaleString()} Guild XP
                  </Link>
                </>
              ) : (
                <>
                  <strong>-</strong>
                  <small>No guild joined yet</small>
                </>
              )}
            </article>
          </div>
        )}
      </Card>

      {isLoading && (
        <Card className={styles.state}>
          <Loader label="Loading global standings" size="md" />
        </Card>
      )}
      {hasError && <Card className={styles.error}>Leaderboards could not be loaded. Check the leaderboard migration and Supabase policies.</Card>}

      {!isLoading && !hasError && (
        <section className={styles.boardGrid}>
          <Card className={styles.boardCard} eyebrow="Top 50" title="Hunters">
            <div className={styles.listHeader}>
              <Users />
              <span>{userLeaderboard.data?.length ?? 0} ranked hunters</span>
            </div>
            <div className={styles.leaderList}>
              {userLeaderboard.data?.map((entry) => <UserLeaderboardRow entry={entry} key={entry.id} />)}
            </div>
          </Card>

          <Card className={styles.boardCard} eyebrow="Top 50" title="Guilds">
            <div className={styles.listHeader}>
              <Crown />
              <span>{guildLeaderboard.data?.length ?? 0} ranked guilds</span>
            </div>
            <div className={styles.leaderList}>
              {guildLeaderboard.data?.map((entry) => <GuildLeaderboardRow entry={entry} key={entry.id} />)}
            </div>
          </Card>
        </section>
      )}

      {!isLoading && !hasError && (userLeaderboard.data?.length ?? 0) === 0 && (guildLeaderboard.data?.length ?? 0) === 0 && (
        <Card className={styles.state}>No leaderboard entries yet. Complete challenges and found guilds to start the climb.</Card>
      )}

      <Card className={styles.metaCard} eyebrow="Ranking rule" title="How standings work">
        <div className={styles.metaGrid}>
          <div>
            <span>Hunters</span>
            <strong>Highest total XP</strong>
            <small>Rank badges come from each hunter's XP tier.</small>
          </div>
          <div>
            <span>Guilds</span>
            <strong>Highest guild XP</strong>
            <small>Guild XP is earned from member challenge contributions.</small>
          </div>
          <div>
            <span>Ties</span>
            <strong>Older entry first</strong>
            <small>Creation date only matters when XP is tied.</small>
          </div>
        </div>
      </Card>
    </div>
  );
}
