import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Search,
  Building,
  Phone,
  Mail,
  ExternalLink,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { consumerService } from '../../services/api';
import type { HallmarkingCentreItem } from '@bis/shared';

export const HallmarkingCentresPage: React.FC = () => {
  const [centres, setCentres] = useState<HallmarkingCentreItem[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [pincode, setPincode] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCentre, setSelectedCentre] = useState<HallmarkingCentreItem | null>(null);

  const fetchCentres = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const res = await consumerService.getHallmarkingCentres({
        search: search.trim() || undefined,
        state: selectedState !== 'ALL' ? selectedState : undefined,
        pincode: pincode.trim() || undefined,
        page: pageNum,
        limit: 9,
      });

      setCentres(res.centres || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setTotalPages(res.totalPages || 1);
      if (res.availableStates && res.availableStates.length > 0) {
        setAvailableStates(res.availableStates);
      }
    } catch (err) {
      console.error('Failed to load hallmarking centres:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCentres(1);
  }, [selectedState]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCentres(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/consumer" className="hover:text-blue-600 inline-flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Consumer Hub
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Hallmarking Centres</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
              <MapPin className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Assaying & Hallmarking Centres (AHC) Directory</h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Discover official BIS-recognized precious metal assaying laboratories for gold and silver testing.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-semibold">Consumer Testing Facility:</span> Any citizen can have gold jewellery tested
              at any recognized Assaying & Hallmarking Centre by paying the statutory fee (approx. ₹45 per item).
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Keyword Search */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Search Centre Name or Code
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Apex, AHC-DL-001, Karol Bagh"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* State Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Filter by State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="ALL">All States</option>
                  {availableStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  placeholder="e.g. 110005"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                <Search className="w-3.5 h-3.5" /> Apply Filters
              </button>
            </div>
          </form>
        </div>

        {/* Centres Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800">
              Found {total} Assaying & Hallmarking {total === 1 ? 'Centre' : 'Centres'}
            </h2>
            {selectedState !== 'ALL' && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded">
                State: <span className="font-bold text-slate-800">{selectedState}</span>
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-xs text-slate-500">
              Loading recognized Assaying & Hallmarking Centres...
            </div>
          ) : centres.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 space-y-2">
              <Building className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Hallmarking Centres Found</p>
              <p className="text-xs text-slate-500">
                Try broadening your search term or selecting "All States".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {centres.map((centre) => (
                <div
                  key={centre.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1">
                          {centre.code}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">{centre.name}</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                        {centre.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{centre.address}</p>

                    <div className="text-xs text-slate-700 font-medium">
                      {centre.city}, {centre.state} - <span className="font-mono">{centre.pincode}</span>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      {centre.phone && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{centre.phone}</span>
                        </div>
                      )}
                      {centre.email && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{centre.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">
                      Verified: {centre.lastVerifiedAt ? new Date(centre.lastVerifiedAt).toLocaleDateString() : 'Active'}
                    </span>
                    <button
                      onClick={() => setSelectedCentre(centre)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => fetchCentres(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchCentres(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedCentre && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block mb-1">
                    {selectedCentre.code}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedCentre.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedCentre(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">Address</span>
                  <p>{selectedCentre.address}</p>
                  <p className="font-medium mt-0.5">
                    {selectedCentre.city}, {selectedCentre.state} - {selectedCentre.pincode}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Contact Phone</span>
                    <p className="font-mono">{selectedCentre.phone || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Email</span>
                    <p className="truncate">{selectedCentre.email || '—'}</p>
                  </div>
                </div>

                {selectedCentre.website && (
                  <div className="pt-1">
                    <span className="text-slate-500 font-semibold block mb-0.5">Website</span>
                    <a
                      href={selectedCentre.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      {selectedCentre.website} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-800">Source:</span> Bureau of Indian Standards Recognized Assaying Facility Register.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedCentre(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
