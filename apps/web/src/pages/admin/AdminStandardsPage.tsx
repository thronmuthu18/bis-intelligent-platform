// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Indian Standards Management Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, CheckCircle, Archive, RefreshCw, ExternalLink } from 'lucide-react';
import { adminService } from '../../services/api';
import type { AdminStandardItem, CreateStandardInput, AdminSourceItem } from '@bis/shared';

export const AdminStandardsPage: React.FC = () => {
  const [standards, setStandards] = useState<AdminStandardItem[]>([]);
  const [sources, setSources] = useState<AdminSourceItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newStd, setNewStd] = useState<CreateStandardInput>({
    isNumber: '',
    title: '',
    scope: '',
    sourceDocumentId: '',
    sector: 'Consumer Electronics & Electrical',
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [stdRes, srcRes] = await Promise.all([
        adminService.getStandards({ search }),
        adminService.getSources({ limit: 100 }),
      ]);
      setStandards(stdRes.standards);
      setTotal(stdRes.total);
      setSources(srcRes.sources);
    } catch (err: any) {
      console.error('Failed to load standards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await adminService.createStandard(newStd);
      setIsModalOpen(false);
      setNewStd({ isNumber: '', title: '', scope: '', sourceDocumentId: '', sector: 'Consumer Electronics & Electrical' });
      fetchData();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || 'Failed to create standard');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await adminService.publishStandard(id);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to publish standard');
    }
  };

  const handleArchive = async (id: string) => {
    const reason = prompt('Enter reason for archiving this standard:');
    if (!reason) return;
    try {
      await adminService.archiveStandard(id, reason);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to archive standard');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Indian Standards Repository (IS)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative national standards, clauses, amendments, and lifecycle governance.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Indian Standard
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by IS Number (e.g. IS 10322) or title..."
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
                <th className="px-4 py-3">IS Number</th>
                <th className="px-4 py-3">Title & Scope</th>
                <th className="px-4 py-3">Lifecycle State</th>
                <th className="px-4 py-3">Source Provenance</th>
                <th className="px-4 py-3">Schemes / QCOs</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                    Loading standards...
                  </td>
                </tr>
              ) : standards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No standards matching query.
                  </td>
                </tr>
              ) : (
                standards.map((std) => (
                  <tr key={std.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">
                      {std.isNumber}
                    </td>
                    <td className="px-4 py-3 max-w-md truncate">
                      <div className="font-semibold text-slate-200 truncate">{std.title}</div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{std.scope || 'No scope specified'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          std.lifecycleStatus === 'PUBLISHED' || std.status === 'CURRENT'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : std.lifecycleStatus === 'DRAFT'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {std.lifecycleStatus || std.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px]">
                      {std.sourceDocument ? (
                        <a
                          href={std.sourceDocument.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-1 font-mono truncate max-w-[160px]"
                        >
                          <span className="truncate">{std.sourceDocument.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-rose-400 font-semibold text-[10px]">! Missing Source</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {std.schemesCount} Schemes • {std.qcosCount} QCOs
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {std.lifecycleStatus !== 'PUBLISHED' && (
                        <button
                          onClick={() => handlePublish(std.id)}
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded transition-colors"
                          title="Publish standard"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {std.lifecycleStatus !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleArchive(std.id)}
                          className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded transition-colors"
                          title="Archive standard"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Standard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-slate-100">
            <h3 className="text-base font-bold text-white">Create Indian Standard</h3>
            {actionError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
                {actionError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">IS Standard Number *</label>
                <input
                  type="text"
                  required
                  value={newStd.isNumber}
                  onChange={(e) => setNewStd({ ...newStd, isNumber: e.target.value })}
                  placeholder="e.g. IS 10322 (Part 5/Sec 1)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Standard Title *</label>
                <input
                  type="text"
                  required
                  value={newStd.title}
                  onChange={(e) => setNewStd({ ...newStd, title: e.target.value })}
                  placeholder="e.g. Luminaires - Particular Requirements - Floodlights"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Authoritative Source Document *</label>
                <select
                  required
                  value={newStd.sourceDocumentId}
                  onChange={(e) => setNewStd({ ...newStd, sourceDocumentId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Verified Source Document --</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.sourceType})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Mandatory: Every Indian Standard must reference a verified source document.
                </p>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Scope Summary</label>
                <textarea
                  rows={2}
                  value={newStd.scope}
                  onChange={(e) => setNewStd({ ...newStd, scope: e.target.value })}
                  placeholder="Summary of technical scope and applicability..."
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
                  Create Standard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
