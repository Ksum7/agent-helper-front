import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

export function ProtectedRoute() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
