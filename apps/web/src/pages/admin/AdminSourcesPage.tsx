// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Source Registry Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Database, Plus, Search, ExternalLink, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { adminService } from '../../services/api';
import type { AdminSourceItem, CreateSourceInput } from '@bis/shared';

export const AdminSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<AdminSourceItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newSource, setNewSource] = useState<CreateSourceInput>({
    title: '',
    url: '',
    sourceType: 'BIS_OFFICIAL',
    authorityLevel: 'AUTHORITATIVE',
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getSources({ search });
      setSources(res.sources);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to load sources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await adminService.createSource(newSource);
      setIsModalOpen(false);
      setNewSource({ title: '', url: '', sourceType: 'BIS_OFFICIAL', authorityLevel: 'AUTHORITATIVE' });
      fetchSources();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || 'Failed to create source document');
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await adminService.verifySource(id);
      fetchSources();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to verify source');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this source? This action is irreversible.')) return;
    try {
      await adminService.deleteSource(id);
      fetchSources();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to delete source');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Source Registry & Provenance
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative documents, official gazette notifications, and verified portal repositories.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Source Document
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by document title or official URL..."
          className="bg-transparent text-xs text-slate-200 placeholder-slate-500 flex-1 focus:outline-none"
        />
        <span className="text-[11px] font-mono text-slate-400">Total: {total}</span>
      </div>

      {/* Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Document Title</th>
                <th className="px-4 py-3">Source Type</th>
                <th className="px-4 py-3">Authority Level</th>
                <th className="px-4 py-3">Freshness</th>
                <th className="px-4 py-3">Standards Linked</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                    Loading sources...
                  </td>
                </tr>
              ) : sources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No source documents found in registry.
                  </td>
                </tr>
              ) : (
                sources.map((src) => (
                  <tr key={src.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white max-w-xs truncate">
                      <div className="flex flex-col">
                        <span>{src.title}</span>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 font-mono truncate mt-0.5"
                        >
                          {src.url}
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {src.sourceType}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          src.authorityLevel === 'AUTHORITATIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {(src.authorityLevel || (src as any).authority)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] font-semibold ${
                          src.isFresh ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {src.isFresh ? '✓ Fresh' : `! ${src.freshnessDays}d ago`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {src.standardsCount || 0}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleVerify(src.id)}
                        className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded transition-colors"
                        title="Re-verify source freshness"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(src.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors"
                        title="Delete source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-slate-100">
            <h3 className="text-base font-bold text-white">Add Authoritative Source Document</h3>
            {actionError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
                {actionError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newSource.title}
                  onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                  placeholder="e.g. Gazette Notification S.O. 1234(E)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Official URL *</label>
                <input
                  type="url"
                  required
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  placeholder="https://egazette.gov.in/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Source Type</label>
                  <select
                    value={newSource.sourceType}
                    onChange={(e) => setNewSource({ ...newSource, sourceType: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="BIS_OFFICIAL">BIS Official</option>
                    <option value="GOVERNMENT_GAZETTE">Government Gazette</option>
                    <option value="BIS_DOCUMENT">BIS Document</option>
                    <option value="OTHER_REFERENCE">Other Official</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Authority Level</label>
                  <select
                    value={newSource.authorityLevel}
                    onChange={(e) => setNewSource({ ...newSource, authorityLevel: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="AUTHORITATIVE">Authoritative</option>
                    <option value="REFERENCE">Reference</option>
                    <option value="UNVERIFIED">Unverified</option>
                  </select>
                </div>
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
                  Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
