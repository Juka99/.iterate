import { NavLink } from 'react-router-dom';
import { Award, LayoutDashboard, ShieldCheck, Target, User } from 'lucide-react';
import styles from './Sidebar.module.scss';

const navigationItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/challenges', icon: Target, label: 'Challenges' },
  { href: '/profile', icon: User, label: 'Profile' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.brand}>
          <span className={styles.mark}>
            <ShieldCheck />
          </span>
          <div>
            <strong>.Iterate</strong>
            <small>Level your life</small>
          </div>
        </div>
        <nav className={styles.nav} aria-label="Main navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`} key={item.href} onClick={onClose} to={item.href}>
                <Icon />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className={styles.locked}>
          <Award />
          <span>Guilds unlock after Rank C</span>
        </div>
      </aside>
      {isOpen && <button aria-label="Close navigation" className={styles.overlay} onClick={onClose} />}
    </>
  );
}

