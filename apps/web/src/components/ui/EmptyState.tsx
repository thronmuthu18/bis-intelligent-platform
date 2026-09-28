import React from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import type { LucideIcon } from 'lucide-react';
import { FolderOpen, AlertCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  EmptyState Component
// ─────────────────────────────────────────────────────────────────────────────

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  secondaryAction,
  actionLabel,
  onAction,
  className,
  size = 'md',
}: EmptyStateProps): React.ReactElement {
  const iconSize = { sm: 32, md: 40, lg: 48 }[size];
  const textSize = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' }[size];
  const padding = { sm: 'py-8', md: 'py-12', lg: 'py-16' }[size];

  const primaryAction = action || (actionLabel ? { label: actionLabel, onClick: onAction } : undefined);

  return (
    <div className={cn('flex flex-col items-center justify-center text-center', padding, className)}>
      <div className="w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center mb-4">
        <Icon size={iconSize} className="text-text-muted" strokeWidth={1.5} />
      </div>
      <h3 className={cn('font-medium text-text-primary mb-2', textSize)}>{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm leading-relaxed mb-6">{description}</p>
      )}
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3">
          {primaryAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="secondary"
              size="sm"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ErrorState Component
// ─────────────────────────────────────────────────────────────────────────────

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}: ErrorStateProps): React.ReactElement {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12', className)}>
      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-red-500" />
      </div>
      <h3 className="text-base font-medium text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
