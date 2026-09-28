import React from 'react';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
//  Progress Bar Component
// ─────────────────────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0–100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
  color?: 'accent' | 'green' | 'yellow' | 'red';
}

const COLOR_CLASSES = {
  accent: 'bg-accent-500',
  green: 'bg-green-500',
  yellow: 'bg-amber-400',
  red: 'bg-red-500',
};

const SIZE_CLASSES = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  value,
  size = 'md',
  showLabel = false,
  label,
  className,
  color = 'accent',
}: ProgressBarProps): React.ReactElement {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-secondary">{label}</span>
          {showLabel && <span className="text-xs font-medium text-text-primary">{clamped}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-surface-muted rounded-full overflow-hidden', SIZE_CLASSES[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', COLOR_CLASSES[color])}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Progress Circle Component (SVG-based)
// ─────────────────────────────────────────────────────────────────────────────

interface ProgressCircleProps {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressCircle({
  value,
  size = 80,
  strokeWidth = 6,
  className,
  children,
}: ProgressCircleProps): React.ReactElement {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1a56db"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}
