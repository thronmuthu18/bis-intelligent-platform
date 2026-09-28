import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
//  Tabs Component
// ─────────────────────────────────────────────────────────────────────────────

interface TabsContextValue {
  active: string;
  setActive: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsCtx() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tab components must be used inside <Tabs>');
  return ctx;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onChange, children, className }: TabsProps): React.ReactElement {
  const [internal, setInternal] = useState(defaultValue);
  const active = value ?? internal;
  const setActive = (id: string) => {
    setInternal(id);
    onChange?.(id);
  };
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabList({ children, className }: TabListProps): React.ReactElement {
  return (
    <div
      role="tablist"
      className={cn(
        'flex border-b border-surface-border bg-white overflow-x-auto',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface TabProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Tab({ value, children, disabled }: TabProps): React.ReactElement {
  const { active, setActive } = useTabsCtx();
  const isActive = active === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActive(value)}
      className={cn(
        'px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500',
        isActive
          ? 'border-accent-500 text-accent-600 font-medium'
          : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-divider',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
}

interface TabPanelProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ value, children, className }: TabPanelProps): React.ReactElement | null {
  const { active } = useTabsCtx();
  if (active !== value) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
