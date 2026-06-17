import { useEffect, useState } from 'react';
import { Bell, Coins, LogOut, Menu, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ProfileCosmetics } from '@/features/profile/profileCosmetics';
import styles from './Header.module.scss';

interface HeaderProps {
  avatarUrl?: string | null;
  cosmetics: ProfileCosmetics;
  essenceBalance?: number;
  onMenuClick: () => void;
  onSignOut: () => void;
  username?: string;
}

export function Header({ avatarUrl, cosmetics, essenceBalance = 0, onMenuClick, onSignOut, username }: HeaderProps) {
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const shouldShowAvatar = Boolean(avatarUrl && !hasAvatarError);

  useEffect(() => {
    setHasAvatarError(false);
  }, [avatarUrl]);

  const mobileDock = (
    <div className={styles.mobileDock}>
      <div className={styles.mobileEssence}>
        <Coins />
        <div>
          <span className={styles.mobileLabel}>Essence</span>
          <strong>{essenceBalance.toLocaleString()}</strong>
        </div>
      </div>

      <Button aria-label="Notifications" className={styles.mobileAction} icon={<Bell />} variant="ghost" />

      <Button aria-label="Sign out" className={styles.mobileAction} icon={<LogOut />} onClick={onSignOut} variant="secondary" />
    </div>
  );

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <Button aria-label="Open navigation" className={styles.menuButton} icon={<Menu />} onClick={onMenuClick} variant="ghost">
          Menu
        </Button>
        {mobileDock}

        <div className={styles.desktopContent}>
          <div className={styles.identity}>
            <span
              className={`${styles.emblem} ${shouldShowAvatar ? styles.avatar : ''} ${
                cosmetics.nameplate === 'living' ? styles.livingPlate : cosmetics.nameplate === 'paragon' ? styles.paragonPlate : ''
              } ${
                cosmetics.aura === 'iterated' ? styles.iteratedAura : ''
              } ${cosmetics.frame === 'cosmic' ? styles.cosmicFrame : ''}`}
            >
              {shouldShowAvatar ? <img alt="" onError={() => setHasAvatarError(true)} src={avatarUrl as string} /> : <ShieldCheck />}
            </span>
            <div>
              <p className={`${styles.kicker} ${cosmetics.legacy ? styles.legacyKicker : ''}`}>{cosmetics.legacy ? 'Legacy hunter' : 'Current hunter'}</p>
              <h1 className={cosmetics.nameplate === 'paragon' ? styles.paragonNameplate : cosmetics.nameplate === 'living' ? styles.livingNameplate : ''}>
                {username ?? 'Player'}
              </h1>
            </div>
          </div>
          <div className={styles.essence}>
            <Coins />
            <div>
              <span>Essence</span>
              <strong>{essenceBalance.toLocaleString()}</strong>
            </div>
          </div>
          <div className={styles.actions}>
            <Button aria-label="Notifications" icon={<Bell />} variant="ghost">
              Alerts
            </Button>
            <Button icon={<LogOut />} onClick={onSignOut} variant="secondary">
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
