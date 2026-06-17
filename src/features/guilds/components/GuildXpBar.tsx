import { getGuildLevelProgress } from '../guildService';
import styles from '../GuildPage.module.scss';

interface GuildXpBarProps {
  totalXp: number;
}

export function GuildXpBar({ totalXp }: GuildXpBarProps) {
  const progress = getGuildLevelProgress(totalXp);
  const percent = Math.min(Math.max((progress.progressValue / Math.max(progress.progressMax, 1)) * 100, 0), 100);

  return (
    <div className={styles.guildXp}>
      <div>
        <span>Guild XP</span>
        <strong>{progress.nextLevel ? `${progress.xpToNext.toLocaleString()} XP to Level ${progress.nextLevel}` : 'Max guild level reached'}</strong>
      </div>
      <div className={styles.guildXpTrack} aria-label="Guild XP progress" aria-valuemax={progress.progressMax} aria-valuemin={0} aria-valuenow={progress.progressValue} role="progressbar">
        <span style={{ width: `${percent}%` }} />
      </div>
      <small>
        {progress.progressValue.toLocaleString()} / {progress.progressMax.toLocaleString()}
      </small>
    </div>
  );
}
