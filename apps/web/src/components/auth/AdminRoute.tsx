import React from 'react';
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  AdminRoute — Role-based Route Guard for Admin Knowledge Workspace
//  Ensures only ADMIN or elevated data managers can access /admin routes.
// ─────────────────────────────────────────────────────────────────────────────

interface AdminRouteProps {
  children?: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps): React.ReactElement {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <Spinner size="md" className="text-blue-500 mb-2" />
        <p className="text-xs text-slate-400 font-mono">Authenticating administrative privileges...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = (user as any)?.role;
  const isAuthorized = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'DATA_MANAGER';

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">403 — Forbidden</h1>
          <p className="text-xs text-slate-400">
            Administrative access is restricted to authorized Bureau of Indian Standards personnel and Data Managers.
          </p>
          <div className="pt-4 border-t border-slate-800/80 flex justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Platform Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
