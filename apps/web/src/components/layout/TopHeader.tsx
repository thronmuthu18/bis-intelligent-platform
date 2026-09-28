import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  User,
  Settings as SettingsIcon,
  LogOut,
  ExternalLink,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb';
import { Dropdown, DropdownItem, DropdownDivider, DropdownHeader } from '@/components/ui/Dropdown';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { SearchModal } from './SearchModal';
import { DEMO_PRODUCTS } from '@/mocks/mockProducts';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

// ─────────────────────────────────────────────────────────────────────────────
//  TopHeader Component — Application Top Navigation Bar
// ─────────────────────────────────────────────────────────────────────────────

export function TopHeader(): React.ReactElement {
  const { openMobile } = useSidebar();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Keyboard shortcut Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute breadcrumbs from current location
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;

    if (path === '/dashboard') {
      return [{ label: 'Dashboard' }];
    }
    if (path === '/products') {
      return [{ label: 'My Products' }];
    }
    if (path === '/products/new') {
      return [{ label: 'My Products', href: '/products' }, { label: 'Create Product' }];
    }
    if (path.startsWith('/products/')) {
      const parts = path.split('/');
      const productId = parts[2];
      const subpage = parts[3] || 'Overview';
      const product = DEMO_PRODUCTS.find((p) => p.id === productId);
      const productName = product ? product.name : 'Product Workspace';

      const subpageLabels: Record<string, string> = {
        assistant: 'AI Assistant',
        documents: 'Documents',
        standards: 'Standards',
        certification: 'Certification',
        testing: 'Testing',
        laboratories: 'Laboratories',
        compliance: 'Compliance Journey',
      };

      const items: BreadcrumbItem[] = [
        { label: 'My Products', href: '/products' },
        { label: productName, href: `/products/${productId}` },
      ];

      if (subpage && subpage !== 'Overview') {
        items.push({ label: subpageLabels[subpage] || subpage });
      }
      return items;
    }
    if (path === '/consumer') {
      return [{ label: 'Consumer Services' }];
    }
    if (path === '/hallmarking') {
      return [{ label: 'Hallmarking' }];
    }
    if (path === '/activity') {
      return [{ label: 'Activity' }];
    }
    if (path === '/settings') {
      return [{ label: 'Settings' }];
    }

    return [{ label: 'Workspace' }];
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-surface-border bg-white px-4 md:px-6 shadow-xs">
        {/* ── Left Side: Mobile Menu Button & Breadcrumb ── */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={openMobile}
            className="md:hidden p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0 overflow-hidden">
            <Breadcrumb items={getBreadcrumbs()} />
          </div>
        </div>

        {/* ── Right Side: Search, Notifications, Help, User ── */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Search Trigger Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-page px-3 py-1.5 text-xs text-text-muted hover:border-surface-divider hover:bg-surface-muted transition-colors"
            aria-label="Search"
          >
            <Search size={14} className="text-text-secondary" />
            <span className="hidden sm:inline">Search products, documents...</span>
            <kbd className="hidden md:inline-block rounded border border-surface-border bg-white px-1.5 py-0.5 text-[10px] font-mono text-text-muted shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Notifications Dropdown */}
          <Dropdown
            align="right"
            width="w-80"
            trigger={
              <button
                type="button"
                className="relative rounded-lg p-2 text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
                aria-label="View notifications"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-500 ring-2 ring-white" />
              </button>
            }
          >
            <DropdownHeader>Notifications</DropdownHeader>
            <div className="px-3 py-2 border-b border-surface-border flex items-center justify-between text-xs text-text-secondary">
              <span>Recent activity & alerts</span>
              <Badge variant="blue">2 New</Badge>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-surface-border">
              <div className="p-3 hover:bg-surface-page transition-colors cursor-pointer">
                <div className="flex items-start gap-2">
                  <FileText size={15} className="text-accent-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      Document uploaded
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      Technical specification added for LED Light Fitting.
                    </p>
                    <span className="text-[10px] text-text-muted mt-1 block">2 hours ago</span>
                  </div>
                </div>
              </div>
              <div className="p-3 hover:bg-surface-page transition-colors cursor-pointer">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={15} className="text-status-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      Review product details
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      Intended use field requires confirmation before standards analysis.
                    </p>
                    <span className="text-[10px] text-text-muted mt-1 block">Yesterday</span>
                  </div>
                </div>
              </div>
            </div>
            <DropdownDivider />
            <div className="p-1.5 text-center">
              <button
                type="button"
                onClick={() => navigate('/activity')}
                className="text-xs font-medium text-accent-600 hover:text-accent-700"
              >
                View all notifications
              </button>
            </div>
          </Dropdown>

          {/* Help Menu Dropdown */}
          <Dropdown
            align="right"
            width="w-64"
            trigger={
              <button
                type="button"
                className="rounded-lg p-2 text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
                aria-label="Help and resources"
              >
                <HelpCircle size={18} />
              </button>
            }
          >
            <DropdownHeader>Help & Resources</DropdownHeader>
            <DropdownItem
              icon={HelpCircle}
              onClick={() => window.open('https://www.bis.gov.in', '_blank')}
            >
              Official BIS Portal
              <ExternalLink size={12} className="inline ml-1 opacity-60" />
            </DropdownItem>
            <DropdownItem
              icon={CheckCircle2}
              onClick={() => navigate('/consumer')}
            >
              Consumer Services Guide
            </DropdownItem>
            <DropdownItem
              icon={FileText}
              onClick={() => navigate('/hallmarking')}
            >
              Hallmarking Information
            </DropdownItem>
            <DropdownDivider />
            <div className="p-2.5 bg-surface-muted/40 rounded-b-xl text-[11px] text-text-muted">
              <p className="font-semibold text-text-primary">SIH26107 Platform</p>
              <p className="mt-0.5">Assisting industries & consumers with Indian Standards.</p>
            </div>
          </Dropdown>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* User Profile Menu */}
          <Dropdown
            align="right"
            width="w-56"
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-surface-muted transition-colors"
                aria-label="User menu"
              >
                <Avatar name={user?.name || 'Compliance Officer'} size="sm" status="online" />
                <div className="hidden lg:block text-left text-xs leading-tight">
                  <span className="block font-semibold text-text-primary">
                    {user?.name || 'Compliance Officer'}
                  </span>
                  <span className="block text-[10px] text-text-muted">
                    {user?.organizationName || 'Enterprise Workspace'}
                  </span>
                </div>
              </button>
            }
          >
            <DropdownHeader>User Account</DropdownHeader>
            <div className="px-3.5 py-2 border-b border-surface-border">
              <p className="text-xs font-semibold text-text-primary">
                {user?.name || 'User'}
                <span className="ml-1 text-[10px] font-normal text-text-muted">
                  ({user?.role || 'USER'})
                </span>
              </p>
              <p className="text-[11px] text-text-muted truncate">
                {user?.email || 'user@enterprise.in'}
              </p>
            </div>
            <DropdownItem icon={User} onClick={() => navigate('/settings')}>
              Profile
            </DropdownItem>
            <DropdownItem icon={SettingsIcon} onClick={() => navigate('/settings')}>
              Settings
            </DropdownItem>
            {((user as any)?.role === 'ADMIN' || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'DATA_MANAGER') && (
              <DropdownItem
                icon={AlertTriangle}
                onClick={() => navigate('/admin/dashboard')}
                className="text-amber-600 dark:text-amber-400 font-semibold"
              >
                Admin Knowledge Console
              </DropdownItem>
            )}
            <DropdownDivider />
            <DropdownItem
              icon={LogOut}
              destructive
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            >
              Sign out
            </DropdownItem>
          </Dropdown>
        </div>
      </header>

      {/* Global Search Palette */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
