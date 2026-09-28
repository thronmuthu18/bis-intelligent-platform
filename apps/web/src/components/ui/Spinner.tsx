import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps): React.ReactElement {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 36,
  };

  return <Loader2 size={sizeMap[size]} className={cn('animate-spin text-accent-500', className)} />;
}
