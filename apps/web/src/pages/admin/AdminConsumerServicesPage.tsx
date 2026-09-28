// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Consumer Services Management Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Compass, Plus, Search, ExternalLink, ShieldCheck } from 'lucide-react';
import { adminService } from '../../services/api';
import type { AdminConsumerServiceItem, CreateConsumerServiceInput } from '@bis/shared';

const SERVICE_TYPES = [
  'CONSUMER_COMPLAINT',
  'HUID_VERIFICATION',
  'LICENCE_VERIFICATION',
  'HALLMARKING',
  'STANDARD_SEARCH',
  'CERTIFICATION_INFORMATION',
  'LABORATORY_INFORMATION',
];

export const AdminConsumerServicesPage: React.FC = () => {
  const [services, setServices] = useState<AdminConsumerServiceItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newService, setNewService] = useState<CreateConsumerServiceInput>({
    serviceType: 'CONSUMER_COMPLAINT',
    title: '',
    description: '',
    officialUrl: '',
    sourceAuthority: 'Bureau of Indian Standards (BIS)',
    status: 'ACTIVE',
  });

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getConsumerServices({
        search,
        serviceType: serviceTypeFilter || undefined,
      });
      setServices(res.services);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to load consumer services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [search, serviceTypeFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createConsumerService(newService);
      setIsModalOpen(false);
      setNewService({
        serviceType: 'CONSUMER_COMPLAINT',
        title: '',
        description: '',
        officialUrl: '',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        status: 'ACTIVE',
      });
      fetchServices();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to create consumer service');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            BIS Consumer Services Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative registry of citizen services, grievance portals, license verifiers, and HUID verification workflows.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Consumer Service
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or service description..."
            className="bg-transparent text-xs text-slate-200 placeholder-slate-500 flex-1 focus:outline-none"
          />
        </div>

        <select
          value={serviceTypeFilter}
          onChange={(e) => setServiceTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
        >
          <option value="">All Service Categories</option>
          {SERVICE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <span className="text-[11px] font-mono text-slate-400">Total: {total}</span>
      </div>

      {/* Services Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Service Name & Scope</th>
              <th className="px-4 py-3">Official Link</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Provenance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  Loading consumer services...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  No consumer services found matching your criteria.
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono font-bold text-[10px] border border-indigo-500/20">
                      {s.serviceType}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    <p className="font-semibold text-white">{s.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{s.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    {s.officialUrl ? (
                      <a
                        href={s.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Official URL
                      </a>
                    ) : (
                      <span className="text-slate-600 text-[11px]">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>{s.sourceDocumentId ? 'Source-backed' : 'Verified'}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Consumer Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add BIS Consumer Service</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Service Type *</label>
                <select
                  value={newService.serviceType}
                  onChange={(e) => setNewService({ ...newService, serviceType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {SERVICE_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newService.title}
                  onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                  placeholder="e.g. BIS Care Grievance & Complaint Portal"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Comprehensive description of citizen assistance and resolution process..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Official Portal URL</label>
                <input
                  type="url"
                  value={newService.officialUrl}
                  onChange={(e) => setNewService({ ...newService, officialUrl: e.target.value })}
                  placeholder="https://www.bis.gov.in/consumer-engagement/"
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
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
