import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { AppToaster } from '@/components/ui/AppToaster/AppToaster';
import { AuthSessionProvider } from '@/features/auth/hooks/useAuthSession';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        <RouterProvider router={router} />
        <AppToaster />
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}
