import styles from './ProgressBar.module.scss';

interface ProgressBarProps {
  label: string;
  max: number;
  value: number;
}

export function ProgressBar({ label, max, value }: ProgressBarProps) {
  const safeMax = Math.max(max, 1);
  const percent = Math.min(Math.max((value / safeMax) * 100, 0), 100);

  return (
    <div className={styles.wrapper}>
      <div className={styles.meta}>
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <div className={styles.track} aria-label={label} aria-valuemax={max} aria-valuemin={0} aria-valuenow={value} role="progressbar">
        <span className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

