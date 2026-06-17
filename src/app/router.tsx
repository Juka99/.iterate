import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader } from '@/components/ui/Loader';
import { signOut } from '@/features/auth/authService';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { AchievementsPage } from '@/features/achievements/AchievementsPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { OnboardingPage } from '@/features/auth/OnboardingPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ChallengesPage } from '@/features/challenges/ChallengesPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { GuildPage } from '@/features/guilds/GuildPage';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import { LeaderboardGuildDetailPage } from '@/features/leaderboard/LeaderboardGuildDetailPage';
import { LeaderboardPage } from '@/features/leaderboard/LeaderboardPage';
import { LeaderboardUserDetailPage } from '@/features/leaderboard/LeaderboardUserDetailPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { ShopPage } from '@/features/shop/ShopPage';
import { useProfile } from '@/features/profile/hooks/useProfile';
import styles from './router.module.scss';

function AuthenticatedLayout() {
  const { isLoading, user } = useAuthSession();
  const { data: profile, isLoading: isProfileLoading } = useProfile(user?.id);

  if (isLoading || (user && isProfileLoading)) {
    return (
      <div className={styles.centered}>
        <Loader label="Loading your hunter file" size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (!profile?.onboarding_completed) {
    return <Navigate replace to="/onboarding" />;
  }

  return <AppLayout onSignOut={signOut} profile={profile} username={profile?.username ?? user.email ?? undefined} />;
}

function OnboardingRoute() {
  const { isLoading, user } = useAuthSession();
  const { data: profile, isLoading: isProfileLoading } = useProfile(user?.id);

  if (isLoading || (user && isProfileLoading)) {
    return (
      <div className={styles.centered}>
        <Loader label="Preparing your hunter file" size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (profile?.onboarding_completed) {
    return <Navigate replace to="/" />;
  }

  return <OnboardingPage />;
}

function PublicOnly({ children }: { children: JSX.Element }) {
  const { isLoading, user } = useAuthSession();

  if (isLoading) {
    return (
      <div className={styles.centered}>
        <Loader label="Checking session" size="lg" />
      </div>
    );
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
      { path: '/guilds', element: <GuildPage /> },
      { path: '/leaderboard', element: <LeaderboardPage /> },
      { path: '/leaderboard/guilds/:guildId', element: <LeaderboardGuildDetailPage /> },
      { path: '/leaderboard/users/:userId', element: <LeaderboardUserDetailPage /> },
      { path: '/achievements', element: <AchievementsPage /> },
      { path: '/inventory', element: <InventoryPage /> },
      { path: '/shop', element: <ShopPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
  {
    path: '/onboarding',
    element: <OnboardingRoute />,
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
