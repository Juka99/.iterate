import { Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useJoinGuild } from './hooks/useGuildMutations';
import { useJoinableGuilds } from './hooks/useJoinableGuilds';
import styles from './GuildPage.module.scss';

interface JoinGuildPageProps {
  userId: string;
}

export function JoinGuildPage({ userId }: JoinGuildPageProps) {
  const { data: guilds = [], error, isLoading } = useJoinableGuilds();
  const joinGuild = useJoinGuild(userId);

  return (
    <Card className={styles.joinCard} eyebrow="Find allies" title="Join guild">
      {isLoading && <Loader className={styles.emptyText} label="Searching guild halls" size="sm" />}
      {error && <p className={styles.error}>Guilds could not be loaded.</p>}
      {!isLoading && guilds.length === 0 && <p className={styles.emptyText}>No guilds have opened their halls yet.</p>}
      <div className={styles.joinList}>
        {guilds.map((guild) => (
          <article className={styles.joinGuildCard} key={guild.id}>
            <div>
              <strong>{guild.name}</strong>
              <span>Level {guild.level}</span>
            </div>
            <p>{guild.description || 'A shared progression hall.'}</p>
            <small>
              {guild.memberCount}/{guild.member_limit} members
            </small>
            <Button disabled={joinGuild.isPending || guild.memberCount >= guild.member_limit} icon={<Users />} onClick={() => joinGuild.mutate(guild.id)} variant="secondary">
              {joinGuild.isPending ? 'Joining' : 'Join'}
            </Button>
          </article>
        ))}
      </div>
      {joinGuild.error && <p className={styles.error}>{joinGuild.error instanceof Error ? joinGuild.error.message : 'Could not join guild.'}</p>}
    </Card>
  );
}
