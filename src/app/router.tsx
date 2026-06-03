import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { signOut } from '@/features/auth/authService';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ChallengesPage } from '@/features/challenges/ChallengesPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { useProfile } from '@/features/profile/hooks/useProfile';
import styles from './router.module.scss';

function AuthenticatedLayout() {
  const { isLoading, user } = useAuthSession();
  const { data: profile } = useProfile(user?.id);

  if (isLoading) {
    return <div className={styles.centered}>Loading your hunter file...</div>;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return <AppLayout onSignOut={signOut} username={profile?.username ?? user.email ?? undefined} />;
}

function PublicOnly({ children }: { children: JSX.Element }) {
  const { isLoading, user } = useAuthSession();

  if (isLoading) {
    return <div className={styles.centered}>Checking session...</div>;
  }

  if (user) {
    return <Navigate replace to="/" />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    element: <AuthenticatedLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/challenges', element: <ChallengesPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
  {
    path: '/login',
    element: (
      <PublicOnly>
        <LoginPage />
      </PublicOnly>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnly>
        <RegisterPage />
      </PublicOnly>
    ),
  },
]);

