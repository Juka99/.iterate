import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from './Header.module.scss';

interface HeaderProps {
  onMenuClick: () => void;
  onSignOut: () => void;
  username?: string;
}

export function Header({ onMenuClick, onSignOut, username }: HeaderProps) {
  return (
    <header className={styles.header}>
      <Button aria-label="Open navigation" className={styles.menuButton} icon={<Menu />} onClick={onMenuClick} variant="ghost">
        Menu
      </Button>
      <div>
        <p className={styles.kicker}>Current hunter</p>
        <h1>{username ?? 'Player'}</h1>
      </div>
      <Button icon={<LogOut />} onClick={onSignOut} variant="secondary">
        Sign out
      </Button>
    </header>
  );
}

