import { ReactNode, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import styles from './AppLayout.module.scss';

interface AppLayoutProps {
  children?: ReactNode;
  onSignOut: () => void;
  username?: string;
}

export function AppLayout({ children, onSignOut, username }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className={styles.content}>
        <Header onMenuClick={() => setIsSidebarOpen(true)} onSignOut={onSignOut} username={username} />
        <main className={styles.main}>{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}

