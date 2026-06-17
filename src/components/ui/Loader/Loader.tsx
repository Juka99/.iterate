import { HTMLAttributes } from 'react';
import styles from './Loader.module.scss';

interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Loader({ className = '', label = 'Loading', size = 'md', ...props }: LoaderProps) {
  return (
    <div className={`${styles.loader} ${styles[size]} ${className}`} role="status" {...props}>
      <span className={styles.orbit} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
