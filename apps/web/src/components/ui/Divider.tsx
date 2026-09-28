import React from 'react';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
//  Divider Component
// ─────────────────────────────────────────────────────────────────────────────

interface DividerProps {
  label?: string;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Divider({
  label,
  className,
  orientation = 'horizontal',
}: DividerProps): React.ReactElement {
  if (orientation === 'vertical') {
    return <div className={cn('inline-block h-full min-h-[1em] w-[1px] self-stretch bg-surface-border', className)} />;
  }

  if (label) {
    return (
      <div className={cn('relative flex py-3 items-center', className)}>
        <div className="flex-grow border-t border-surface-border" />
        <span className="flex-shrink mx-3 text-xs uppercase tracking-wider text-text-muted font-medium">
          {label}
        </span>
        <div className="flex-grow border-t border-surface-border" />
      </div>
    );
  }

  return <div className={cn('w-full border-t border-surface-border my-4', className)} />;
}
