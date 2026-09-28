import React from 'react';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  StatCard Component — Key metric display
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  description?: string;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  iconBg = 'bg-accent-50',
  iconColor = 'text-accent-600',
  description,
  className,
  onClick,
}: StatCardProps): React.ReactElement {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-surface-border p-5 shadow-card transition-all duration-150',
        onClick && 'cursor-pointer hover:shadow-card-hover hover:border-surface-divider',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', iconBg, iconColor)}>
            <Icon size={20} />
          </div>
        )}
      </div>

      {(change || description) && (
        <div className="mt-3 flex items-center gap-2">
          {change && (
            <span
              className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded',
                trend === 'up' && 'bg-status-successBg text-status-success',
                trend === 'down' && 'bg-status-errorBg text-status-error',
                (!trend || trend === 'neutral') && 'bg-surface-muted text-text-secondary',
              )}
            >
              {change}
            </span>
          )}
          {description && <span className="text-xs text-text-muted truncate">{description}</span>}
        </div>
      )}
    </div>
  );
}
