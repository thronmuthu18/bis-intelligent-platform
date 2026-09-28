// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Ingestion Runs Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Activity, Plus, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/api';
import type { AdminIngestionRunItem, TriggerIngestionInput } from '@bis/shared';

export const AdminIngestionPage: React.FC = () => {
  const [runs, setRuns] = useState<AdminIngestionRunItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newRun, setNewRun] = useState<TriggerIngestionInput>({
    sourceName: '',
    sourceUrl: '',
    sourceType: 'BIS_OFFICIAL',
  });

  const fetchRuns = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getIngestionRuns();
      setRuns(res.runs);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to load runs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.triggerIngestionRun(newRun);
      setIsModalOpen(false);
      setNewRun({ sourceName: '', sourceUrl: '', sourceType: 'BIS_OFFICIAL' });
      fetchRuns();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to trigger ingestion');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Ingestion Pipeline Runs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Execution logs for authoritative data scrapers, ETL processors, and gazette ingestion runs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            Total Runs: {total}
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Trigger Ingestion Run
          </button>
        </div>
      </div>

      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Source Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Started At</th>
              <th className="px-4 py-3">Records Processed</th>
              <th className="px-4 py-3">Created / Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                  Loading ingestion runs...
                </td>
              </tr>
            ) : runs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  No ingestion runs recorded.
                </td>
              </tr>
            ) : (
              runs.map((r) => (
                <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{r.sourceName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : r.status === 'RUNNING'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                    {new Date(r.startedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-200">{r.recordsProcessed}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                    +{r.recordsCreated} / ~{r.recordsUpdated}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-slate-100">
            <h3 className="text-base font-bold text-white">Trigger Ingestion Pipeline</h3>
            <form onSubmit={handleTrigger} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Source Pipeline Name *</label>
                <input
                  type="text"
                  required
                  value={newRun.sourceName}
                  onChange={(e) => setNewRun({ ...newRun, sourceName: e.target.value })}
                  placeholder="e.g. BIS Manakonline Standards Sync"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Source Endpoint / URL</label>
                <input
                  type="url"
                  value={newRun.sourceUrl || ''}
                  onChange={(e) => setNewRun({ ...newRun, sourceUrl: e.target.value })}
                  placeholder="https://www.services.bis.gov.in/..."
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
                  Trigger Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
