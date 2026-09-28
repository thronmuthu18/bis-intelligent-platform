import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { ShieldCheck } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  ProtectedRoute — Route Guard for Protected Application Pages
//  Redirects unauthenticated visitors to /login with return path preservation.
//  Prevents UI flickering with a professional loading state.
// ─────────────────────────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-page flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-500 text-white shadow-md animate-pulse">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">
              BIS Intelligent Platform
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Verifying secure session...
            </p>
          </div>
          <Spinner size="md" className="text-accent-600 mt-2" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
