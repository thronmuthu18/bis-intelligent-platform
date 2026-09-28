// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin QCO Management Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Search, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { adminService } from '../../services/api';
import type { AdminQcoItem, CreateQcoInput, AdminSourceItem, AdminStandardItem } from '@bis/shared';

export const AdminQcosPage: React.FC = () => {
  const [qcos, setQcos] = useState<AdminQcoItem[]>([]);
  const [sources, setSources] = useState<AdminSourceItem[]>([]);
  const [standards, setStandards] = useState<AdminStandardItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newQco, setNewQco] = useState<CreateQcoInput>({
    name: '',
    orderNumber: '',
    ministry: 'Ministry of Commerce and Industry',
    sourceDocumentId: '',
    standardIds: [],
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [qcoRes, srcRes, stdRes] = await Promise.all([
        adminService.getQcos({ search }),
        adminService.getSources({ limit: 100 }),
        adminService.getStandards({ limit: 100 }),
      ]);
      setQcos(qcoRes.qcos);
      setTotal(qcoRes.total);
      setSources(srcRes.sources);
      setStandards(stdRes.standards);
    } catch (err: any) {
      console.error('Failed to load QCOs:', err);
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
      await adminService.createQco(newQco);
      setIsModalOpen(false);
      setNewQco({
        name: '',
        orderNumber: '',
        ministry: 'Ministry of Commerce and Industry',
        sourceDocumentId: '',
        standardIds: [],
      });
      fetchData();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || 'Failed to create QCO');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this QCO?')) return;
    try {
      await adminService.deleteQco(id);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to delete QCO');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Quality Control Orders (QCOs)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Statutory ministerial orders mandating compulsory BIS certification (ISI Mark / CRS).
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add QCO Order
        </button>
      </div>

      {/* Filter / Search */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order name, order number, or ministry..."
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
                <th className="px-4 py-3">Order Number</th>
                <th className="px-4 py-3">Order Name & Ministry</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source Provenance</th>
                <th className="px-4 py-3">Mapped Standards</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                    Loading QCOs...
                  </td>
                </tr>
              ) : qcos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No Quality Control Orders found.
                  </td>
                </tr>
              ) : (
                qcos.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">
                      {q.orderNumber}
                    </td>
                    <td className="px-4 py-3 max-w-sm truncate">
                      <div className="font-semibold text-slate-200 truncate">{q.name}</div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{q.ministry || 'Ministry of Commerce & Industry'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px]">
                      {q.sourceDocument ? (
                        <a
                          href={q.sourceDocument.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-1 font-mono truncate max-w-[160px]"
                        >
                          <span className="truncate">{q.sourceDocument.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-rose-400 font-semibold text-[10px]">! Missing Source</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {q.mappedStandards?.map((m) => m.isNumber).join(', ') || 'None'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors"
                        title="Delete QCO"
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

      {/* Create QCO Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-slate-100">
            <h3 className="text-base font-bold text-white">Add Quality Control Order (QCO)</h3>
            {actionError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
                {actionError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Order Number *</label>
                <input
                  type="text"
                  required
                  value={newQco.orderNumber}
                  onChange={(e) => setNewQco({ ...newQco, orderNumber: e.target.value })}
                  placeholder="e.g. S.O. 1234(E)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Order Name *</label>
                <input
                  type="text"
                  required
                  value={newQco.name}
                  onChange={(e) => setNewQco({ ...newQco, name: e.target.value })}
                  placeholder="e.g. Solar Photovoltaic Modules QCO 2026"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Authoritative Source Document *</label>
                <select
                  required
                  value={newQco.sourceDocumentId}
                  onChange={(e) => setNewQco({ ...newQco, sourceDocumentId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Gazette Notification Source --</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.sourceType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Mandated Indian Standards</label>
                <select
                  multiple
                  value={newQco.standardIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    setNewQco({ ...newQco, standardIds: selected });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 h-24"
                >
                  {standards.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.isNumber} - {std.title}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Hold Ctrl / Cmd to select multiple standards.</p>
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
                  Save QCO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
