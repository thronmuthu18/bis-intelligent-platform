// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Laboratories Management Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { FlaskConical, Plus, Search, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/api';
import type { AdminLaboratoryItem, CreateLaboratoryInput } from '@bis/shared';

export const AdminLaboratoriesPage: React.FC = () => {
  const [labs, setLabs] = useState<AdminLaboratoryItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newLab, setNewLab] = useState<CreateLaboratoryInput>({
    name: '',
    city: '',
    state: '',
    isNabl: false,
    isBisLab: false,
  });

  const fetchLabs = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getLaboratories({ search });
      setLabs(res.laboratories);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to load labs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createLaboratory(newLab);
      setIsModalOpen(false);
      setNewLab({ name: '', city: '', state: '', isNabl: false, isBisLab: false });
      fetchLabs();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to create laboratory');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-400" />
            Testing Laboratories & Recognition
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            BIS-recognized and NABL-accredited testing laboratories, testing scopes, and addresses.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Laboratory
        </button>
      </div>

      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by laboratory name, city, or state..."
          className="bg-transparent text-xs text-slate-200 placeholder-slate-500 flex-1 focus:outline-none"
        />
        <span className="text-[11px] font-mono text-slate-400">Total: {total}</span>
      </div>

      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Laboratory Name</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Recognition Type</th>
              <th className="px-4 py-3">Accreditation</th>
              <th className="px-4 py-3">Capabilities</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                  Loading laboratories...
                </td>
              </tr>
            ) : labs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  No laboratories found.
                </td>
              </tr>
            ) : (
              labs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{l.name}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {l.city ? `${l.city}, ${l.state || 'India'}` : l.state || 'India'}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{l.organizationType}</td>
                  <td className="px-4 py-3 space-x-1">
                    {l.isNabl && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        NABL
                      </span>
                    )}
                    {l.isBisLab && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        BIS
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{l.capabilitiesCount || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-slate-100">
            <h3 className="text-base font-bold text-white">Add Recognized Laboratory</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Laboratory Name *</label>
                <input
                  type="text"
                  required
                  value={newLab.name}
                  onChange={(e) => setNewLab({ ...newLab, name: e.target.value })}
                  placeholder="e.g. Central Power Research Institute (CPRI)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">City</label>
                  <input
                    type="text"
                    value={newLab.city || ''}
                    onChange={(e) => setNewLab({ ...newLab, city: e.target.value })}
                    placeholder="e.g. Bengaluru"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">State</label>
                  <input
                    type="text"
                    value={newLab.state || ''}
                    onChange={(e) => setNewLab({ ...newLab, state: e.target.value })}
                    placeholder="e.g. Karnataka"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={newLab.isNabl}
                    onChange={(e) => setNewLab({ ...newLab, isNabl: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-blue-600"
                  />
                  NABL Accredited (ISO/IEC 17025)
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={newLab.isBisLab}
                    onChange={(e) => setNewLab({ ...newLab, isBisLab: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-blue-600"
                  />
                  BIS Central / Regional Lab
                </label>
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
                  Save Laboratory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
