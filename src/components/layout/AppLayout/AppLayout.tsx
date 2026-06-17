import { ReactNode, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Outlet, useLocation, useOutlet } from 'react-router-dom';
import { getDefaultProfileCosmetics } from '@/features/profile/profileCosmetics';
import { useProfileCosmetics } from '@/features/profile/hooks/useProfileCosmetics';
import type { Profile } from '@/types/user';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import styles from './AppLayout.module.scss';

interface AppLayoutProps {
  children?: ReactNode;
  onSignOut: () => void;
  profile?: Profile | null;
  username?: string;
}

export function AppLayout({ children, onSignOut, profile, username }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const outlet = useOutlet();
  const shouldReduceMotion = useReducedMotion();
  const { data: cosmetics = getDefaultProfileCosmetics() } = useProfileCosmetics(profile?.id);
  const routeContent = children ?? outlet ?? <Outlet />;
  const routeKey = `${location.pathname}${location.search}${location.hash}`;

  return (
    <div className={styles.shell}>
      <Sidebar cosmetics={cosmetics} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} profile={profile} username={username} />
      <div className={styles.content}>
        <Header
          avatarUrl={profile?.avatar_url}
          essenceBalance={profile?.essence_balance}
          cosmetics={cosmetics}
          onMenuClick={() => setIsSidebarOpen(true)}
          onSignOut={onSignOut}
          username={username}
        />
        <main className={styles.main}>
          <div className={styles.routeViewport}>
            <AnimatePresence
              initial={false}
              mode="wait"
              onExitComplete={() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })}
            >
              <motion.div
                key={routeKey}
                className={styles.routeScene}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : {
                        opacity: 0,
                        y: 22,
                        scale: 0.988,
                        filter: 'blur(6px)',
                        transition: {
                          opacity: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
                          y: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
                          scale: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
                          filter: { duration: 0.34, ease: [0.32, 0.72, 0, 1] },
                        },
                      }
                }
                animate={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        filter: 'blur(0px)',
                        transition: {
                          opacity: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
                          y: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
                          scale: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
                          filter: { duration: 0.34, ease: [0.32, 0.72, 0, 1] },
                        },
                      }
                }
                exit={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : {
                        opacity: 0,
                        y: -18,
                        scale: 1.008,
                        filter: 'blur(8px)',
                        transition: {
                          opacity: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
                          y: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
                          scale: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
                          filter: { duration: 0.24, ease: [0.4, 0, 0.2, 1] },
                        },
                      }
                }
              >
                {routeContent}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
