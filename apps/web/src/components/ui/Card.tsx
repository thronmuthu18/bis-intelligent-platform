import React from 'react';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
//  Card Components
// ─────────────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hoverable = false, onClick }: CardProps): React.ReactElement {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-surface-border shadow-card',
        hoverable && 'cursor-pointer transition-shadow duration-150 hover:shadow-card-hover hover:border-surface-divider',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function CardHeader({ children, className, action }: CardHeaderProps): React.ReactElement {
  return (
    <div className={cn('flex items-center justify-between px-5 py-4 border-b border-surface-border', className)}>
      <div className="min-w-0">{children}</div>
      {action && <div className="ml-4 shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }): React.ReactElement {
  return <h2 className={cn('text-sm font-semibold text-text-primary', className)}>{children}</h2>;
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }): React.ReactElement {
  return <p className={cn('text-xs text-text-muted mt-0.5', className)}>{children}</p>;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBody({ children, className }: CardBodyProps): React.ReactElement {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps): React.ReactElement {
  return (
    <div className={cn('px-5 py-3 border-t border-surface-border bg-surface-muted/50 rounded-b-xl', className)}>
      {children}
    </div>
  );
}
