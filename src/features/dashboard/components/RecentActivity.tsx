import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { getChallengeCategoryLook, getChallengeIconStyle } from '@/features/challenges/challengeCategoryLook';
import { useRecentActivity } from '@/features/challenges/hooks/useRecentActivity';
import styles from './RecentActivity.module.scss';

interface RecentActivityProps {
  userId?: string;
}

export function RecentActivity({ userId }: RecentActivityProps) {
  const { data: activity = [], error, isLoading } = useRecentActivity(userId);

  return (
    <Card eyebrow="Log" title="Recent activity">
      {isLoading && <Loader className={styles.state} label="Loading activity" size="sm" />}
      {error && <p className={styles.error}>Activity could not be loaded.</p>}
      {!isLoading && !error && activity.length === 0 && <p className={styles.state}>Completed challenges will appear here.</p>}
      {!isLoading && !error && activity.length > 0 && (
        <ul className={styles.list}>
          {activity.map((item) => {
            const challengeLook = getChallengeCategoryLook(item.category ?? '');
            const Icon = challengeLook.icon;

            return (
              <li key={item.id} style={getChallengeIconStyle(challengeLook)}>
                <i>
                  <Icon />
                </i>
                <span>{item.reason}</span>
                <strong>+{item.amount} XP</strong>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
