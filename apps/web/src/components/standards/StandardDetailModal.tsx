import React, { useState, useEffect } from 'react';
import type { StandardDetailResponse, StandardStatus } from '@bis/shared';
import { standardService } from '../../services/api';
import { SourceProvenanceCard } from './SourceProvenanceCard';

interface StandardDetailModalProps {
  standardId: string | null;
  onClose: () => void;
}

export const StandardDetailModal: React.FC<StandardDetailModalProps> = ({ standardId, onClose }) => {
  const [standard, setStandard] = useState<StandardDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'versions' | 'amendments' | 'qcos' | 'manuals'>('overview');

  useEffect(() => {
    if (!standardId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    standardService
      .getStandardById(standardId)
      .then((data) => {
        if (isMounted) {
          setStandard(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load Indian Standard details.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [standardId]);

  if (!standardId) return null;

  const statusBadge = (status?: StandardStatus) => {
    const map: Record<string, { label: string; className: string }> = {
      CURRENT: { label: 'Current / In Force', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      SUPERSEDED: { label: 'Superseded', className: 'bg-amber-50 text-amber-700 border-amber-200' },
      WITHDRAWN: { label: 'Withdrawn', className: 'bg-rose-50 text-rose-700 border-rose-200' },
      DRAFT: { label: 'Draft', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      UNKNOWN: { label: 'Unknown', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    };
    const s = (status && map[status]) || map.UNKNOWN;
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/70 p-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-slate-900">
                {standard?.isNumber || 'Indian Standard Details'}
              </span>
              {standard && statusBadge(standard.status)}
            </div>
            {standard?.shortTitle && (
              <p className="mt-1 text-sm font-medium text-slate-600">{standard.shortTitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close dialog"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        {standard && (
          <div className="border-b border-slate-200 bg-white px-6">
            <nav className="flex space-x-6">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`py-3 text-xs font-medium border-b-2 transition ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Overview & Scope
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('versions')}
                className={`py-3 text-xs font-medium border-b-2 transition ${
                  activeTab === 'versions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Editions ({standard.versions?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('amendments')}
                className={`py-3 text-xs font-medium border-b-2 transition ${
                  activeTab === 'amendments'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Amendments ({standard.amendments?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qcos')}
                className={`py-3 text-xs font-medium border-b-2 transition ${
                  activeTab === 'qcos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Quality Control Orders ({standard.qcoMappings?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manuals')}
                className={`py-3 text-xs font-medium border-b-2 transition ${
                  activeTab === 'manuals'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Product Manuals / STI ({standard.productManuals?.length || 0})
              </button>
            </nav>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <svg className="h-8 w-8 animate-spin text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-sm">Fetching verified standard data from BIS knowledge base...</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p className="font-semibold">Error Loading Standard Details</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {standard && !loading && (
            <>
              {/* Tab: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Title & Core Meta */}
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 leading-snug">
                      {standard.title}
                    </h3>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Sector</span>
                        <p className="mt-0.5 text-xs font-semibold text-slate-900">{standard.sector || 'Electrotechnical'}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Department</span>
                        <p className="mt-0.5 text-xs font-semibold text-slate-900">{standard.department || 'BIS Section'}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Current Edition</span>
                        <p className="mt-0.5 text-xs font-semibold text-slate-900">{standard.currentEdition || 'Latest'}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Language</span>
                        <p className="mt-0.5 text-xs font-semibold text-slate-900">{standard.language || 'English'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Scope */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Scope & Standardization Summary</h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                      {standard.scope || 'No detailed scope description recorded in official source repository.'}
                    </p>
                  </div>

                  {/* Certification Scheme Information */}
                  {standard.schemeMappings && standard.schemeMappings.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Applicable BIS Certification Schemes</h4>
                      <div className="space-y-2">
                        {standard.schemeMappings.map((sm) => (
                          <div key={sm.id} className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-900">{sm.scheme.name}</span>
                              <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-blue-800">
                                {sm.scheme.code}
                              </span>
                            </div>
                            {sm.scheme.description && (
                              <p className="mt-1 text-xs text-slate-600">{sm.scheme.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source Provenance */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Official Source & Data Provenance</h4>
                    <SourceProvenanceCard sourceDocument={standard.sourceDocument} />
                  </div>
                </div>
              )}

              {/* Tab: Versions */}
              {activeTab === 'versions' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Official edition history recorded from Bureau of Indian Standards archives. Older editions are retained for compliance audit trails.
                  </p>
                  {standard.versions && standard.versions.length > 0 ? (
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                      {standard.versions.map((ver) => (
                        <div key={ver.id} className="flex items-center justify-between p-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{ver.edition}</span>
                              {statusBadge(ver.status)}
                            </div>
                            {ver.publicationDate && (
                              <p className="mt-1 text-xs text-slate-500">
                                Published: {new Date(ver.publicationDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                          {ver.documentUrl && (
                            <a
                              href={ver.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                            >
                              Official Document
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400">No historical edition data available.</p>
                  )}
                </div>
              )}

              {/* Tab: Amendments */}
              {activeTab === 'amendments' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Officially notified amendments and errata sheets issued by BIS technical sectional committees.
                  </p>
                  {standard.amendments && standard.amendments.length > 0 ? (
                    <div className="space-y-3">
                      {standard.amendments.map((am) => (
                        <div key={am.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="inline-block rounded bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-800">
                                {am.amendmentNumber}
                              </span>
                              <p className="mt-2 text-xs font-semibold text-slate-900">{am.title || 'Official Committee Amendment'}</p>
                              {am.effectiveDate && (
                                <p className="mt-1 text-[11px] text-slate-500">
                                  Effective Date: {new Date(am.effectiveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                              )}
                            </div>
                            {am.documentUrl && (
                              <a
                                href={am.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline shrink-0"
                              >
                                View Amendment PDF
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                      No official amendments currently registered for this standard.
                    </div>
                  )}
                </div>
              )}

              {/* Tab: QCOs */}
              {activeTab === 'qcos' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Quality Control Orders (QCOs) notified under the BIS Act, making this Indian Standard mandatory for manufacturers and importers.
                  </p>
                  {standard.qcoMappings && standard.qcoMappings.length > 0 ? (
                    <div className="space-y-3">
                      {standard.qcoMappings.map((mapItem) => (
                        <div key={mapItem.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="inline-block rounded bg-amber-200 px-2 py-0.5 font-mono text-xs font-bold text-amber-900">
                                {mapItem.qco.orderNumber}
                              </span>
                              <h5 className="mt-2 text-sm font-semibold text-slate-900">{mapItem.qco.name}</h5>
                              <p className="mt-1 text-xs text-slate-600">
                                <span className="font-medium">Notifying Ministry:</span> {mapItem.qco.ministry || 'Government of India'}
                              </p>
                              {mapItem.productDescription && (
                                <p className="mt-1 text-xs text-slate-600">
                                  <span className="font-medium">Notified Product Scope:</span> {mapItem.productDescription}
                                </p>
                              )}
                              {mapItem.qco.effectiveDate && (
                                <p className="mt-1 text-[11px] text-amber-800 font-medium">
                                  In Force Since: {new Date(mapItem.qco.effectiveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                              )}
                            </div>
                            {mapItem.qco.documentUrl && (
                              <a
                                href={mapItem.qco.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 shadow-sm hover:bg-amber-50 shrink-0"
                              >
                                Gazette Order
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                      No mandatory Quality Control Order (QCO) currently registered for this standard.
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Manuals */}
              {activeTab === 'manuals' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Official BIS Product Manuals and Schemes of Testing & Inspection (STI) specifying factory testing equipment and sampling guidelines.
                  </p>
                  {standard.productManuals && standard.productManuals.length > 0 ? (
                    <div className="space-y-3">
                      {standard.productManuals.map((pm) => (
                        <div key={pm.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
                          <div>
                            <h5 className="text-xs font-semibold text-slate-900">{pm.title}</h5>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Version: {pm.version || 'Standard'} • Published: {pm.publicationDate ? new Date(pm.publicationDate).toLocaleDateString('en-IN') : 'Official BIS'}
                            </p>
                          </div>
                          {pm.documentUrl && (
                            <a
                              href={pm.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Download Manual
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                      No separate product manuals or STI documents registered.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Legal Disclaimer */}
        <div className="border-t border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p className="text-[11px] leading-tight text-slate-500">
              <strong className="text-slate-700">Reference Notice:</strong> This knowledge layer provides source-backed reference information. It does not itself determine BIS certification or legal compliance.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 shrink-0"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
