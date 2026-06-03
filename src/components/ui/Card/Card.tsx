import { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.scss';

interface CardProps extends HTMLAttributes<HTMLElement> {
  actions?: ReactNode;
  eyebrow?: string;
  title?: string;
}

export function Card({ actions, children, className = '', eyebrow, title, ...props }: CardProps) {
  return (
    <section className={`${styles.card} ${className}`} {...props}>
      {(eyebrow || title || actions) && (
        <header className={styles.header}>
          <div>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            {title && <h2>{title}</h2>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

