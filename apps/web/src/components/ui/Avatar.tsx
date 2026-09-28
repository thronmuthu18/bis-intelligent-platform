import React from 'react';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
//  Avatar Component
// ─────────────────────────────────────────────────────────────────────────────

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', dot: 'w-1.5 h-1.5' },
  sm: { container: 'w-8 h-8', text: 'text-xs', dot: 'w-2 h-2' },
  md: { container: 'w-10 h-10', text: 'text-sm', dot: 'w-2.5 h-2.5' },
  lg: { container: 'w-12 h-12', text: 'text-base', dot: 'w-3 h-3' },
  xl: { container: 'w-16 h-16', text: 'text-lg', dot: 'w-3.5 h-3.5' },
};

interface AvatarProps {
  name?: string;
  src?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

export function Avatar({
  name,
  src,
  size = 'md',
  status,
  className,
}: AvatarProps): React.ReactElement {
  const { container, text, dot } = SIZE_MAP[size];

  const getInitials = (n?: string) => {
    if (!n) return 'U';
    return n
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn('relative inline-flex shrink-0 select-none items-center justify-center rounded-full bg-accent-100 text-accent-700 font-semibold', container, text, className)}>
      {src ? (
        <img src={src} alt={name || 'User avatar'} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            dot,
            status === 'online' && 'bg-status-success',
            status === 'busy' && 'bg-status-warning',
            status === 'offline' && 'bg-text-muted',
          )}
        />
      )}
    </div>
  );
}
