import {useEffect, useState} from 'react';
import {NavLink} from 'react-router-dom';
import {
  Backpack,
  BadgeCheck,
  LayoutDashboard,
  Lock,
  ShoppingBag,
  Target,
  Trophy,
  Users,
  User,
} from 'lucide-react';
import {useAchievements} from '@/features/achievements/hooks/useAchievements';
import type {ProfileCosmetics} from '@/features/profile/profileCosmetics';
import {RankBadge} from '@/features/ranks/RankBadge';
import {getRankProgress} from '@/features/ranks/rankUtils';
import type {Profile} from '@/types/user';
import styles from './Sidebar.module.scss';

const navigationItems = [
  {href: '/', icon: LayoutDashboard, label: 'Dashboard'},
  {href: '/challenges', icon: Target, label: 'Challenges'},
  {href: '/guilds', icon: Users, label: 'Guilds'},
  {href: '/leaderboard', icon: Trophy, label: 'Leaderboard'},
  {href: '/achievements', icon: BadgeCheck, label: 'Achievements'},
  {href: '/inventory', icon: Backpack, label: 'Inventory'},
  {href: '/shop', icon: ShoppingBag, label: 'Shop'},
  {href: '/profile', icon: User, label: 'Profile'},
];

interface SidebarProps {
  cosmetics: ProfileCosmetics;
  isOpen: boolean;
  onClose: () => void;
  profile?: Profile | null;
  username?: string;
}

export function Sidebar({
  cosmetics,
  isOpen,
  onClose,
  profile,
  username,
}: SidebarProps) {
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const totalXp = profile?.total_xp ?? 0;
  const progress = getRankProgress(totalXp);
  const {data: achievements = []} = useAchievements(profile?.id);
  const claimableAchievementCount = achievements.filter(
    achievement => achievement.status === 'claimable',
  ).length;
  const xpToNext = progress.nextRank
    ? `${Math.max(progress.nextRank.minXp - totalXp, 0).toLocaleString()} XP to Rank ${progress.nextRank.name}`
    : 'Max rank reached';
  const shouldShowAvatar = Boolean(profile?.avatar_url && !hasAvatarError);

  useEffect(() => {
    setHasAvatarError(false);
  }, [profile?.avatar_url]);

  return (
    <>
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.brand}>
          <img alt="Iterate" className={styles.brandLogo} src="/assets/iterate_logo.png" />
        </div>
        <nav className={styles.nav} aria-label="Main navigation">
          {navigationItems.map(item => {
            const Icon = item.icon;

            return (
              <NavLink
                className={({isActive}) =>
                  `${styles.link} ${isActive ? styles.active : ''}`
                }
                key={item.href}
                onClick={onClose}
                to={item.href}
              >
                <Icon />
                <span>{item.label}</span>
                {item.href === '/achievements' &&
                  claimableAchievementCount > 0 && (
                    <i
                      className={styles.navDot}
                      aria-label={`${claimableAchievementCount} achievements ready to claim`}
                    />
                  )}
              </NavLink>
            );
          })}
        </nav>
        {progress.currentRank.order < 3 && (
          <div className={styles.locked}>
            <Lock />
            <span>Reach Rank C to unlock Guilds</span>
          </div>
        )}
        <div
          className={`${styles.playerCard} ${progress.currentRank.order >= 3 ? styles.playerCardAtBottom : ''} ${
            cosmetics.nameplate === 'living'
              ? styles.livingIdentityCard
              : cosmetics.nameplate === 'paragon'
                ? styles.paragonIdentityCard
                : ''
          } ${
            cosmetics.showcase === 'pedestal'
              ? styles.showcaseCard
              : cosmetics.showcase === 'monument'
                ? styles.monumentCard
                : ''
          }`}
        >
          {shouldShowAvatar ? (
            <span
              className={`${styles.playerAvatar} ${
                cosmetics.nameplate === 'living'
                  ? styles.livingPlate
                  : cosmetics.nameplate === 'paragon'
                    ? styles.paragonPlate
                    : ''
              } ${cosmetics.aura === 'iterated' ? styles.iteratedAura : ''} ${
                cosmetics.frame === 'cosmic' ? styles.cosmicFrame : ''
              }`}
            >
              <img
                alt=""
                onError={() => setHasAvatarError(true)}
                src={profile?.avatar_url as string}
              />
            </span>
          ) : (
            <RankBadge
              className={styles.playerRankBadge}
              rank={progress.currentRank.name}
              size="sm"
            />
          )}
          <div className={styles.playerMeta}>
            <strong
              className={
                cosmetics.nameplate === 'paragon'
                  ? styles.paragonNameplate
                  : cosmetics.nameplate === 'living'
                    ? styles.livingNameplate
                    : ''
              }
            >
              {username ?? 'Player'}
            </strong>
            <span data-rank={progress.currentRank.name}>
              {progress.currentRank.classTitle}
            </span>
          </div>
          {cosmetics.relic && (
            <i aria-hidden="true" className={styles.relicMark} />
          )}
          <div className={styles.playerProgress}>
            <span
              style={{
                width: `${Math.min(Math.max((progress.progressValue / Math.max(progress.progressMax, 1)) * 100, 0), 100)}%`,
              }}
            />
          </div>
          <small className={styles.nextRank}>{xpToNext}</small>
        </div>
      </aside>
      {isOpen && (
        <button
          aria-label="Close navigation"
          className={styles.overlay}
          onClick={onClose}
        />
      )}
    </>
  );
}
