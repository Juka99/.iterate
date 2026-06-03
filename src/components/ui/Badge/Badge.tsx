import { HTMLAttributes } from 'react';
import styles from './Badge.module.scss';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ children, className = '', tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]} ${className}`} {...props}>
      {children}
    </span>
  );
}

