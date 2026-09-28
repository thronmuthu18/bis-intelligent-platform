import React from 'react';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
//  Skeleton Component
// ─────────────────────────────────────────────────────────────────────────────

export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, width, height, style }: SkeletonProps): React.ReactElement {
  return (
    <div
      className={cn('bg-surface-muted rounded animate-pulse', className)}
      style={{ width, height, ...style }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Skeleton presets for common patterns
// ─────────────────────────────────────────────────────────────────────────────

export function SkeletonText({ lines = 3 }: { lines?: number }): React.ReactElement {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard(): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonRow(): React.ReactElement {
  return (
    <div className="flex items-center gap-4 py-3 px-4">
      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full shrink-0" />
      <Skeleton className="h-3.5 w-20 shrink-0" />
    </div>
  );
}
