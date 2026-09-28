// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Workspace Layout
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  FileText,
  Layers,
  Sparkles,
  Search,
  FlaskConical,
  Gem,
  Compass,
  AlertTriangle,
  Activity,
  History,
  ShieldAlert,
  Languages,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';

const adminNavItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/sources', label: 'Source Registry', icon: Database },
  { to: '/admin/standards', label: 'Indian Standards', icon: FileText },
  { to: '/admin/qcos', label: 'Quality Control Orders', icon: AlertTriangle },
  { to: '/admin/schemes', label: 'Certification Schemes', icon: Layers },
  { to: '/admin/knowledge', label: 'Knowledge Chunks', icon: Sparkles },
  { to: '/admin/embeddings', label: 'Search & Embeddings', icon: Search },
  { to: '/admin/ingestion', label: 'Ingestion Runs', icon: Activity },
  { to: '/admin/laboratories', label: 'Laboratories', icon: FlaskConical },
  { to: '/admin/hallmarking-centres', label: 'Hallmarking Centres', icon: Gem },
  { to: '/admin/consumer-services', label: 'Consumer Services', icon: Compass },
  { to: '/admin/regulatory-changes', label: 'Regulatory Events', icon: ShieldAlert },
  { to: '/admin/translations', label: 'Translations & Lexicon', icon: Languages },
  { to: '/admin/data-quality', label: 'Data Quality Center', icon: AlertTriangle },
  { to: '/admin/audit', label: 'Audit Trail', icon: History },
];

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h1 className="text-sm font-bold tracking-tight text-white uppercase">BIS Admin Console</h1>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Authoritative Knowledge Hub</p>
          </div>
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
            ADMIN
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 text-xs">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Manufacturer Hub</span>
          </Link>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
            <div className="truncate">
              <p className="font-semibold text-slate-200 truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-800 bg-slate-950/60 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-slate-500">PORTAL</span>
            <span>/</span>
            <span className="text-slate-200 font-semibold">Knowledge Governance & Audit Center</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact className="bg-slate-900 text-white border-slate-700 hover:bg-slate-800" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
