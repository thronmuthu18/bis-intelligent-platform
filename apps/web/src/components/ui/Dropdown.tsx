import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  Dropdown Component
// ─────────────────────────────────────────────────────────────────────────────

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
  width?: string;
}

export function Dropdown({
  trigger,
  children,
  align = 'left',
  className,
  width = 'w-56',
}: DropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={() => setIsOpen((prev) => !prev)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1.5 rounded-xl border border-surface-border bg-white shadow-dropdown py-1.5 animate-slide-up focus:outline-none',
            align === 'right' ? 'right-0' : 'left-0',
            width,
            className,
          )}
          role="menu"
        >
          <div onClick={() => setIsOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  destructive?: boolean;
}

export function DropdownItem({
  children,
  icon: Icon,
  destructive = false,
  className,
  ...props
}: DropdownItemProps): React.ReactElement {
  return (
    <button
      type="button"
      className={cn(
        'w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors duration-100 cursor-pointer',
        destructive
          ? 'text-status-error hover:bg-status-errorBg'
          : 'text-text-primary hover:bg-surface-muted hover:text-text-primary',
        className,
      )}
      role="menuitem"
      {...props}
    >
      {Icon && <Icon size={15} className={destructive ? 'text-status-error' : 'text-text-secondary'} />}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}

export function DropdownDivider(): React.ReactElement {
  return <div className="my-1 border-t border-surface-border" />;
}

export function DropdownHeader({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="px-3.5 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{children}</div>;
}
