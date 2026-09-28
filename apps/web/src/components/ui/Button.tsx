import React from 'react';
import { cn } from '@/lib/cn';
import { Loader2, type LucideIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  Button Component
// ─────────────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 focus-visible:ring-accent-500 border border-accent-500 shadow-2xs',
  secondary:
    'bg-white text-text-primary border border-surface-border hover:bg-surface-muted active:bg-surface-muted focus-visible:ring-accent-500 shadow-2xs',
  ghost:
    'bg-transparent text-text-secondary border border-transparent hover:bg-surface-muted hover:text-text-primary focus-visible:ring-accent-500',
  danger:
    'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 focus-visible:ring-red-500 shadow-2xs',
  link: 'bg-transparent text-accent-500 border-transparent underline-offset-4 hover:underline focus-visible:ring-accent-500 px-0',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded',
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: LucideIcon;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      icon: Icon,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin shrink-0" />
        ) : Icon ? (
          <Icon size={15} className="shrink-0" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
      </button>
    );
  },
);
Button.displayName = 'Button';

// ─────────────────────────────────────────────────────────────────────────────
//  IconButton Component
// ─────────────────────────────────────────────────────────────────────────────

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', size = 'md', className, ...props }, ref) => {
    const sizeMap: Record<ButtonSize, string> = {
      xs: 'h-7 w-7 rounded',
      sm: 'h-8 w-8 rounded-md',
      md: 'h-9 w-9 rounded-lg',
      lg: 'h-10 w-10 rounded-lg',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-150 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          VARIANT_CLASSES[variant],
          sizeMap[size],
          className,
        )}
        {...props}
      />
    );
  },
);
IconButton.displayName = 'IconButton';
