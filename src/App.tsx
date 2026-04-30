import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import { ApiError } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Toaster } from '@/components/Toaster';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { ChatLayout } from '@/pages/ChatLayout';
import { ChatHome } from '@/pages/ChatHome';
import { ChatSessionPage } from '@/pages/ChatSession';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, err) => {
        if (err instanceof ApiError && err.status === 401) return false;
        return count < 1;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setUser, setLoading]);

  // Global 401 handler — clear user when any query 401s
  useEffect(() => {
    const sub = queryClient.getQueryCache().subscribe((e) => {
      if (
        e.type === 'updated' &&
        e.query.state.status === 'error' &&
        e.query.state.error instanceof ApiError &&
        e.query.state.error.status === 401
      ) {
        setUser(null);
      }
    });
    return sub;
  }, [setUser]);

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/chat" element={<ChatLayout />}>
                <Route index element={<ChatHome />} />
                <Route path=":id" element={<ChatSessionPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
          <Toaster />
        </AuthBootstrap>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
