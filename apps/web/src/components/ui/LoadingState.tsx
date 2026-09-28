import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
//  LoadingState Component
// ─────────────────────────────────────────────────────────────────────────────

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({
  message = 'Loading...',
  subMessage,
  size = 'md',
  className,
}: LoadingStateProps): React.ReactElement {
  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 40,
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <Loader2 size={iconSizes[size]} className="animate-spin text-accent-500 mb-3" />
      <p className="text-sm font-medium text-text-primary">{message}</p>
      {subMessage && <p className="text-xs text-text-muted mt-1 max-w-sm">{subMessage}</p>}
    </div>
  );
}
