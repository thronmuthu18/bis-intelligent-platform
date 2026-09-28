// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Regulatory Change Events Management Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Search, Calendar } from 'lucide-react';
import { adminService } from '../../services/api';
import type { AdminRegulatoryChangeEventItem, CreateRegulatoryChangeEventInput } from '@bis/shared';

const EVENT_TYPES = ['QCO_ISSUED', 'STANDARD_REVISED', 'AMENDMENT_PUBLISHED', 'FEE_STRUCTURE_REVISED', 'SCHEME_MODIFIED', 'OTHER'];
const IMPACT_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const AdminRegulatoryPage: React.FC = () => {
  const [changes, setChanges] = useState<AdminRegulatoryChangeEventItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newChange, setNewChange] = useState<CreateRegulatoryChangeEventInput>({
    title: '',
    description: '',
    eventType: 'QCO_ISSUED',
    impactLevel: 'HIGH',
    publicationDate: new Date().toISOString().split('T')[0],
    effectiveDate: '',
    gazetteNumber: '',
  });

  const fetchChanges = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getRegulatoryChanges({
        search,
        eventType: eventTypeFilter || undefined,
      });
      setChanges(res.changes);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to load regulatory events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
  }, [search, eventTypeFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createRegulatoryChange(newChange);
      setIsModalOpen(false);
      setNewChange({
        title: '',
        description: '',
        eventType: 'QCO_ISSUED',
        impactLevel: 'HIGH',
        publicationDate: new Date().toISOString().split('T')[0],
        effectiveDate: '',
        gazetteNumber: '',
      });
      fetchChanges();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to create regulatory change event');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Regulatory Change Events & Impact Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative regulatory amendments, QCO notifications, enforcement dates, and downstream compliance impact.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Regulatory Event
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description, or gazette order..."
            className="bg-transparent text-xs text-slate-200 placeholder-slate-500 flex-1 focus:outline-none"
          />
        </div>

        <select
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
        >
          <option value="">All Event Types</option>
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <span className="text-[11px] font-mono text-slate-400">Total: {total}</span>
      </div>

      {/* Events Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Event Type</th>
              <th className="px-4 py-3">Notification Title & Gazette</th>
              <th className="px-4 py-3">Dates (Pub / Eff)</th>
              <th className="px-4 py-3">Impact Level</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  Loading regulatory events...
                </td>
              </tr>
            ) : changes.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  No regulatory change events found.
                </td>
              </tr>
            ) : (
              changes.map((ch) => (
                <tr key={ch.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono font-bold text-[10px] border border-blue-500/20">
                      {ch.eventType}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    <p className="font-semibold text-white">{ch.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{ch.description}</p>
                    {ch.gazetteNumber && (
                      <p className="text-[10px] font-mono text-slate-500 mt-1">
                        Gazette: {ch.gazetteNumber}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Pub: {ch.publicationDate ? new Date(ch.publicationDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    {ch.effectiveDate && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-300">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>Eff: {new Date(ch.effectiveDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        ch.impactLevel === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : ch.impactLevel === 'HIGH'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                      }`}
                    >
                      {ch.impactLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        ch.reviewStatus === 'PUBLISHED' || ch.reviewStatus === 'RESOLVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {ch.reviewStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Regulatory Event */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Register Regulatory Event</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Event Type *</label>
                  <select
                    value={newChange.eventType}
                    onChange={(e) => setNewChange({ ...newChange, eventType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {EVENT_TYPES.map((et) => (
                      <option key={et} value={et}>
                        {et.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Impact Level *</label>
                  <select
                    value={newChange.impactLevel}
                    onChange={(e) => setNewChange({ ...newChange, impactLevel: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {IMPACT_LEVELS.map((il) => (
                      <option key={il} value={il}>
                        {il}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newChange.title}
                  onChange={(e) => setNewChange({ ...newChange, title: e.target.value })}
                  placeholder="e.g. Mandatory BIS Certification on Electrical Accessories QCO 2026"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={newChange.description}
                  onChange={(e) => setNewChange({ ...newChange, description: e.target.value })}
                  placeholder="Detailed regulatory summary, enforcement directives, and industry requirements..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Publication Date</label>
                  <input
                    type="date"
                    value={newChange.publicationDate}
                    onChange={(e) => setNewChange({ ...newChange, publicationDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={newChange.effectiveDate}
                    onChange={(e) => setNewChange({ ...newChange, effectiveDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Gazette Order Number</label>
                <input
                  type="text"
                  value={newChange.gazetteNumber}
                  onChange={(e) => setNewChange({ ...newChange, gazetteNumber: e.target.value })}
                  placeholder="e.g. S.O. 1234(E)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  Register Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
