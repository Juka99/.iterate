import { Skull } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { GuildBoss } from '../guildTypes';
import styles from '../GuildPage.module.scss';

interface GuildBossCardProps {
  boss: GuildBoss | null;
  canStart: boolean;
  isStarting: boolean;
  onStart: () => void;
}

export function GuildBossCard({ boss, canStart, isStarting, onStart }: GuildBossCardProps) {
  const hpPercent = boss ? Math.min(Math.max((boss.current_hp / Math.max(boss.max_hp, 1)) * 100, 0), 100) : 0;

  return (
    <Card
      className={styles.bossCard}
      eyebrow="Guild boss"
      title={boss?.name ?? 'No active boss'}
      actions={
        canStart && !boss ? (
          <Button onClick={onStart} variant="secondary">
            {isStarting ? 'Starting' : 'Start boss'}
          </Button>
        ) : null
      }
    >
      <div className={styles.bossPanel}>
        <Skull />
        {boss ? (
          <div>
            <div className={styles.bossHpMeta}>
              <span>HP</span>
              <strong>
                {boss.current_hp.toLocaleString()} / {boss.max_hp.toLocaleString()}
              </strong>
            </div>
            <div className={styles.bossHpTrack}>
              <span style={{ width: `${hpPercent}%` }} />
            </div>
            <small>Complete challenges to damage the boss.</small>
          </div>
        ) : (
          <p>Guild Masters and Captains can summon a weekly boss when the guild is ready.</p>
        )}
      </div>
    </Card>
  );
}
