import { Card } from '@/components/ui/Card';
import type { GuildActivityWithProfile } from '../guildTypes';
import styles from '../GuildPage.module.scss';

interface GuildActivityFeedProps {
  activity: GuildActivityWithProfile[];
}

function formatActivityTime(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt));
}

export function GuildActivityFeed({ activity }: GuildActivityFeedProps) {
  return (
    <Card className={styles.activityCard} eyebrow="Guild record" title="Recent activity">
      <div className={styles.activityFeed}>
        {activity.length === 0 && <p className={styles.emptyText}>Guild victories will appear here.</p>}
        {activity.map((item) => (
          <article key={item.id}>
            <span>{item.profile?.username || `Hunter ${item.user_id.slice(0, 6)}`}</span>
            <p>{item.description}</p>
            <small>{formatActivityTime(item.created_at)}</small>
          </article>
        ))}
      </div>
    </Card>
  );
}
