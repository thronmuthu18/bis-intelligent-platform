import React from 'react';
import { cn } from '@/lib/cn';
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  Alert Component
// ─────────────────────────────────────────────────────────────────────────────

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const ALERT_CONFIG: Record<AlertVariant, { icon: typeof Info; classes: string; iconClass: string }> = {
  info: {
    icon: Info,
    classes: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClass: 'text-blue-500',
  },
  success: {
    icon: CheckCircle2,
    classes: 'bg-green-50 border-green-200 text-green-800',
    iconClass: 'text-green-500',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'bg-amber-50 border-amber-200 text-amber-800',
    iconClass: 'text-amber-500',
  },
  error: {
    icon: XCircle,
    classes: 'bg-red-50 border-red-200 text-red-800',
    iconClass: 'text-red-500',
  },
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className,
}: AlertProps): React.ReactElement {
  const { icon: Icon, classes, iconClass } = ALERT_CONFIG[variant];
  return (
    <div
      role="alert"
      className={cn('flex gap-3 p-4 rounded-lg border text-sm', classes, className)}
    >
      <Icon size={16} className={cn('shrink-0 mt-0.5', iconClass)} />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss alert"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
