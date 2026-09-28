import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FileText,
  Bot,
  BookOpen,
  Award,
  FlaskConical,
  Building2,
  GitMerge,
  Users,
  Sparkles,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSidebar } from '@/contexts/SidebarContext';
import { Tooltip } from '@/components/ui/Tooltip';

// ─────────────────────────────────────────────────────────────────────────────
//  Sidebar Navigation Item Structure
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { to: '/products', label: 'My Products', icon: Package },
      { to: '/products/demo-prod-1/documents', label: 'Documents', icon: FileText },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { to: '/products/demo-prod-1/assistant', label: 'AI Assistant', icon: Bot },
      { to: '/products/demo-prod-1/standards', label: 'Standards', icon: BookOpen },
      { to: '/products/demo-prod-1/certification', label: 'Certification', icon: Award },
      { to: '/products/demo-prod-1/testing', label: 'Testing', icon: FlaskConical },
      { to: '/products/demo-prod-1/laboratories', label: 'Laboratories', icon: Building2 },
    ],
  },
  {
    title: 'Compliance',
    items: [
      { to: '/products/demo-prod-1/compliance', label: 'Compliance Journey', icon: GitMerge },
    ],
  },
  {
    title: 'Services',
    items: [
      { to: '/consumer', label: 'Consumer Services', icon: Users },
      { to: '/hallmarking', label: 'Hallmarking', icon: Sparkles },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/activity', label: 'Activity', icon: History },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Sidebar(): React.ReactElement {
  const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } = useSidebar();
  const location = useLocation();

  const isItemActive = (to: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === to;
    }
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  const content = (
    <div className="flex h-full flex-col bg-white">
      {/* ── Brand Header ── */}
      <div className={cn(
        'flex h-16 items-center border-b border-surface-border px-4 transition-all duration-200',
        isCollapsed ? 'justify-center px-2' : 'justify-between',
      )}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Neutral Brand Icon */}
          <div className="w-8 h-8 rounded-lg bg-accent-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            <ShieldCheck size={18} />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <span className="block text-xs font-bold uppercase tracking-wider text-accent-600">
                BIS Intelligent
              </span>
              <span className="block text-sm font-semibold text-text-primary">
                Platform
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={closeMobile}
          className="md:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted cursor-pointer"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Navigation Items ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && !isCollapsed && (
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {section.title}
              </p>
            )}
            {section.title && isCollapsed && (
              <div className="my-1 border-t border-surface-border" />
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.to, item.exact);

                const linkElement = (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMobile}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-lg text-xs font-medium transition-all duration-100',
                      isCollapsed ? 'justify-center p-2' : 'px-2.5 py-2',
                      active
                        ? 'bg-accent-50 text-accent-600 font-semibold'
                        : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
                    )}
                  >
                    <Icon
                      size={17}
                      className={cn(
                        'shrink-0 transition-colors',
                        active ? 'text-accent-600' : 'text-text-secondary group-hover:text-text-primary',
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.to} content={item.label} position="right">
                      {linkElement}
                    </Tooltip>
                  );
                }

                return linkElement;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Sidebar Footer / Collapse Toggle ── */}
      <div className="border-t border-surface-border p-3">
        {!isCollapsed && (
          <div className="mb-2 px-2 py-1.5 bg-surface-page rounded-lg border border-surface-border">
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
              SIH26107 • DoCA
            </p>
            <p className="text-[11px] text-text-secondary font-medium truncate">
              Standard Compliance Portal
            </p>
          </div>
        )}

        {/* Desktop Collapse Button */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            'hidden md:flex w-full items-center gap-2 rounded-lg p-2 text-xs font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors cursor-pointer',
            isCollapsed && 'justify-center',
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col shrink-0 border-r border-surface-border bg-white transition-all duration-200 ease-in-out',
          isCollapsed ? 'w-16' : 'w-60',
        )}
      >
        {content}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl md:hidden transition-transform duration-200 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {content}
      </aside>
    </>
  );
}
