import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ─────────────────────────────────────────────────────────────────────────────
//  NotFoundPage — 404 Error Shell
// ─────────────────────────────────────────────────────────────────────────────

export function NotFoundPage(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-surface-border shadow-card space-y-4">
        <div className="w-14 h-14 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center mx-auto">
          <ShieldAlert size={28} />
        </div>
        <p className="text-5xl font-extrabold text-accent-700 tracking-tight">404</p>
        <h1 className="text-lg font-bold text-text-primary">Page Not Found</h1>
        <p className="text-xs text-text-secondary leading-relaxed">
          The regulatory module or page you are trying to access does not exist or has been relocated.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Home}
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
