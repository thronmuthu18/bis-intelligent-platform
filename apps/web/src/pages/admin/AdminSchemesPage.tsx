// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Schemes Management Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/api';
import type { AdminSchemeItem, CreateSchemeInput } from '@bis/shared';

export const AdminSchemesPage: React.FC = () => {
  const [schemes, setSchemes] = useState<AdminSchemeItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newScheme, setNewScheme] = useState<CreateSchemeInput>({
    name: '',
    code: '',
    description: '',
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchSchemes = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getSchemes({ search });
      setSchemes(res.schemes);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to load schemes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await adminService.createScheme(newScheme);
      setIsModalOpen(false);
      setNewScheme({ name: '', code: '', description: '' });
      fetchSchemes();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || 'Failed to create scheme');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Certification Schemes
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            BIS Conformity Assessment Schemes under BIS (Conformity Assessment) Regulations 2018.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Scheme
        </button>
      </div>

      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search schemes by name or code..."
          className="bg-transparent text-xs text-slate-200 placeholder-slate-500 flex-1 focus:outline-none"
        />
        <span className="text-[11px] font-mono text-slate-400">Total: {total}</span>
      </div>

      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Scheme Code</th>
              <th className="px-4 py-3">Scheme Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Standards Mapped</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                  Loading schemes...
                </td>
              </tr>
            ) : schemes.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  No schemes registered.
                </td>
              </tr>
            ) : (
              schemes.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">{s.code}</td>
                  <td className="px-4 py-3 font-semibold text-slate-200">{s.name}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-sm truncate">{s.description || '—'}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{s.standardsCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-slate-100">
            <h3 className="text-base font-bold text-white">Add Certification Scheme</h3>
            {actionError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
                {actionError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Scheme Code *</label>
                <input
                  type="text"
                  required
                  value={newScheme.code}
                  onChange={(e) => setNewScheme({ ...newScheme, code: e.target.value })}
                  placeholder="e.g. SCHEME_I"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Scheme Name *</label>
                <input
                  type="text"
                  required
                  value={newScheme.name}
                  onChange={(e) => setNewScheme({ ...newScheme, name: e.target.value })}
                  placeholder="e.g. Scheme-I (ISI Mark)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Description</label>
                <textarea
                  rows={3}
                  value={newScheme.description || ''}
                  onChange={(e) => setNewScheme({ ...newScheme, description: e.target.value })}
                  placeholder="Conformity assessment details..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors"
                >
                  Save Scheme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
