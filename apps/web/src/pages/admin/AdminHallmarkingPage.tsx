// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Hallmarking Centres Management Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Gem, Plus, Search, MapPin, ShieldCheck, Mail, Phone, Globe } from 'lucide-react';
import { adminService } from '../../services/api';
import type { AdminHallmarkingCentreItem, CreateHallmarkingCentreInput } from '@bis/shared';

export const AdminHallmarkingPage: React.FC = () => {
  const [centres, setCentres] = useState<AdminHallmarkingCentreItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newCentre, setNewCentre] = useState<CreateHallmarkingCentreInput>({
    name: '',
    ahcCode: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    website: '',
    recognitionStatus: 'ACTIVE',
  });

  const fetchCentres = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getHallmarkingCentres({ search });
      setCentres(res.centres);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to load hallmarking centres:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCentres();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createHallmarkingCentre(newCentre);
      setIsModalOpen(false);
      setNewCentre({
        name: '',
        ahcCode: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        website: '',
        recognitionStatus: 'ACTIVE',
      });
      fetchCentres();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to create hallmarking centre');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Gem className="w-5 h-5 text-amber-400" />
            Assaying & Hallmarking Centres (AHCs)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative registry of BIS-recognized Assaying & Hallmarking Centres across Indian states.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Hallmarking Centre
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by centre name, AHC code, city, or state..."
          className="bg-transparent text-xs text-slate-200 placeholder-slate-500 flex-1 focus:outline-none"
        />
        <span className="text-[11px] font-mono text-slate-400">Total: {total}</span>
      </div>

      {/* Centres Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">AHC Code & Name</th>
              <th className="px-4 py-3">Location & Address</th>
              <th className="px-4 py-3">Contact Details</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  Loading hallmarking centres...
                </td>
              </tr>
            ) : centres.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  No hallmarking centres found matching your query.
                </td>
              </tr>
            ) : (
              centres.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono font-bold text-[11px] border border-amber-500/20">
                        {c.ahcCode}
                      </span>
                    </div>
                    <p className="font-semibold text-white mt-1">{c.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-1.5 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-200">{c.city}, {c.state} - {c.pincode}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{c.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 space-y-1">
                    {c.phone && (
                      <p className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {c.phone}
                      </p>
                    )}
                    {c.email && (
                      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {c.email}
                      </p>
                    )}
                    {c.website && (
                      <p className="flex items-center gap-1.5 text-[11px] text-blue-400">
                        <Globe className="w-3 h-3 text-blue-500" />
                        <a href={c.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Official Webpage
                        </a>
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.recognitionStatus === 'ACTIVE' || c.recognitionStatus === 'RECOGNIZED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {c.recognitionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>{c.sourceDocumentId ? 'BIS Directory' : 'Authoritative'}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Centre */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Register Assaying & Hallmarking Centre</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Centre Name *</label>
                <input
                  type="text"
                  required
                  value={newCentre.name}
                  onChange={(e) => setNewCentre({ ...newCentre, name: e.target.value })}
                  placeholder="e.g. National Assaying & Hallmarking Centre"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">AHC Code * (Unique)</label>
                  <input
                    type="text"
                    required
                    value={newCentre.ahcCode}
                    onChange={(e) => setNewCentre({ ...newCentre, ahcCode: e.target.value })}
                    placeholder="e.g. AHC-DL-001"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={newCentre.pincode}
                    onChange={(e) => setNewCentre({ ...newCentre, pincode: e.target.value })}
                    placeholder="e.g. 110001"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newCentre.city}
                    onChange={(e) => setNewCentre({ ...newCentre, city: e.target.value })}
                    placeholder="e.g. New Delhi"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={newCentre.state}
                    onChange={(e) => setNewCentre({ ...newCentre, state: e.target.value })}
                    placeholder="e.g. Delhi"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Full Address *</label>
                <textarea
                  required
                  rows={2}
                  value={newCentre.address}
                  onChange={(e) => setNewCentre({ ...newCentre, address: e.target.value })}
                  placeholder="Plot / Street / Area Details"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newCentre.phone}
                    onChange={(e) => setNewCentre({ ...newCentre, phone: e.target.value })}
                    placeholder="+91-11-2323xxxx"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={newCentre.email}
                    onChange={(e) => setNewCentre({ ...newCentre, email: e.target.value })}
                    placeholder="ahc@example.gov.in"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
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
                  Register Centre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
