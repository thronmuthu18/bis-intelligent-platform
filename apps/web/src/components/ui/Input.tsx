import React from 'react';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  Form field wrapper
// ─────────────────────────────────────────────────────────────────────────────

interface FieldWrapperProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FieldWrapper({ label, htmlFor, error, hint, required, children }: FieldWrapperProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={htmlFor} className="text-xs font-semibold text-text-primary">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Input Component
// ─────────────────────────────────────────────────────────────────────────────

const inputBase =
  'block w-full rounded-lg border bg-white px-3 py-2 text-xs text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:ring-1 disabled:bg-surface-muted disabled:cursor-not-allowed shadow-2xs';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  icon?: LucideIcon;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftElement, rightElement, icon: Icon, className, id, required, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const hasLeftIcon = Boolean(Icon || leftElement);
    return (
      <FieldWrapper label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
        <div className="relative flex items-center">
          {Icon ? (
            <span className="absolute left-3 text-text-muted flex items-center pointer-events-none">
              <Icon size={15} />
            </span>
          ) : leftElement ? (
            <span className="absolute left-3 text-text-muted flex items-center">{leftElement}</span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputBase,
              error ? 'border-red-400 focus:ring-red-400' : 'border-surface-border focus:border-accent-500 focus:ring-accent-500',
              hasLeftIcon ? 'pl-9' : undefined,
              rightElement ? 'pr-9' : undefined,
              className,
            )}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 text-text-muted flex items-center">{rightElement}</span>
          )}
        </div>
      </FieldWrapper>
    );
  },
);
Input.displayName = 'Input';

// ─────────────────────────────────────────────────────────────────────────────
//  Textarea Component
// ─────────────────────────────────────────────────────────────────────────────

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, required, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <FieldWrapper label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
        <textarea
          ref={ref}
          id={inputId}
          rows={4}
          className={cn(
            inputBase,
            'resize-none',
            error ? 'border-red-400 focus:ring-red-400' : 'border-surface-border focus:border-accent-500 focus:ring-accent-500',
            className,
          )}
          {...props}
        />
      </FieldWrapper>
    );
  },
);
Textarea.displayName = 'Textarea';

// ─────────────────────────────────────────────────────────────────────────────
//  Select Component
// ─────────────────────────────────────────────────────────────────────────────

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, placeholder, options, className, id, required, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <FieldWrapper label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
        <select
          ref={ref}
          id={inputId}
          className={cn(
            inputBase,
            'appearance-none cursor-pointer pr-8',
            error ? 'border-red-400 focus:ring-red-400' : 'border-surface-border focus:border-accent-500 focus:ring-accent-500',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FieldWrapper>
    );
  },
);
Select.displayName = 'Select';

// ─────────────────────────────────────────────────────────────────────────────
//  Checkbox Component
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex items-start gap-2.5">
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          className={cn(
            'h-4 w-4 rounded border-surface-border text-accent-500 focus:ring-accent-500 mt-0.5 cursor-pointer',
            className,
          )}
          {...props}
        />
        {(label || description) && (
          <label htmlFor={inputId} className="cursor-pointer">
            {label && <p className="text-xs font-semibold text-text-primary">{label}</p>}
            {description && <p className="text-[11px] text-text-muted mt-0.5">{description}</p>}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';

// ─────────────────────────────────────────────────────────────────────────────
//  Radio Component
// ─────────────────────────────────────────────────────────────────────────────

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex items-start gap-2.5">
        <input
          ref={ref}
          type="radio"
          id={inputId}
          className={cn(
            'h-4 w-4 border-surface-border text-accent-500 focus:ring-accent-500 mt-0.5 cursor-pointer',
            className,
          )}
          {...props}
        />
        {(label || description) && (
          <label htmlFor={inputId} className="cursor-pointer">
            {label && <p className="text-xs font-semibold text-text-primary">{label}</p>}
            {description && <p className="text-[11px] text-text-muted mt-0.5">{description}</p>}
          </label>
        )}
      </div>
    );
  },
);
Radio.displayName = 'Radio';
