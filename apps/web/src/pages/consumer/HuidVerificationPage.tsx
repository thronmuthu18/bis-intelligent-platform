// ─────────────────────────────────────────────────────────────────────────────
//  Phase 11 — Hallmark & HUID Verification Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Gem,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Info,
  ArrowLeft,
  Check,
  Smartphone,
} from 'lucide-react';
import { consumerService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { HallmarkVerificationItem } from '@bis/shared';

export const HuidVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [huid, setHuid] = useState<string>(searchParams.get('huid') || '');
  const [articleType, setArticleType] = useState<string>('');
  const [purityKarat, setPurityKarat] = useState<string>('');
  const [jewellerName, setJewellerName] = useState<string>('');
  const [saveHistory, setSaveHistory] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<HallmarkVerificationItem | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const initialHuid = searchParams.get('huid');
    if (initialHuid && initialHuid.trim()) {
      handleVerify(initialHuid.trim());
    }
  }, [searchParams]);

  const handleVerify = async (huidToVerify?: string) => {
    const targetHuid = (huidToVerify || huid).trim();
    if (!targetHuid) {
      setError('Please enter a 6-digit Hallmark Unique Identification (HUID) code.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setVerificationResult(null);
    setSavedSuccess(false);

    try {
      const res = await consumerService.verifyHuid({
        huid: targetHuid,
        articleType: articleType.trim() || undefined,
        purityKarat: purityKarat.trim() || undefined,
        jewellerName: jewellerName.trim() || undefined,
        saveHistory: user ? saveHistory : false,
      });

      setVerificationResult(res.verification);
      if (res.savedVerificationId) {
        setSavedSuccess(true);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'HUID verification request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/consumer" className="hover:text-blue-600 inline-flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Consumer Hub
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Verify HUID Hallmark</span>
        </div>

        {/* Header Box */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
              <Gem className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Verify Hallmark Unique Identification (HUID)</h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Verify the 6-digit alphanumeric code laser-marked on gold jewellery articles at BIS-recognized Assaying Centres.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-semibold">3 Mandatory Marks on Gold Jewellery:</span>
              <span className="ml-1">
                (1) BIS Triangular Standard Logo, (2) Purity mark (e.g. 22K916, 18K750), and (3) 6-digit laser HUID code (e.g.{' '}
                <span className="font-mono font-bold">AZ1234</span>).
              </span>
            </div>
          </div>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="huid-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                6-Digit Alphanumeric HUID <span className="text-rose-500">*</span>
              </label>
              <input
                id="huid-input"
                type="text"
                placeholder="e.g. AZ1234, HUID-925-ABCD, SILV88"
                value={huid}
                onChange={(e) => setHuid(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono uppercase tracking-widest"
                required
              />
            </div>

            {/* Optional Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Article Type (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ring, Bangle, Chain"
                  value={articleType}
                  onChange={(e) => setArticleType(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Purity Karat (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 22K (916), 18K (750)"
                  value={purityKarat}
                  onChange={(e) => setPurityKarat(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jeweller Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Tanishq, Kalyan"
                  value={jewellerName}
                  onChange={(e) => setJewellerName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="save-huid-history"
                  type="checkbox"
                  checked={saveHistory}
                  onChange={(e) => setSaveHistory(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="save-huid-history" className="text-xs text-slate-600">
                  Save this HUID verification to my account
                </label>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <span>Verifying HUID Record...</span>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Verify HUID
                </>
              )}
            </button>
          </form>
        </div>

        {/* Verification Result Card */}
        {verificationResult && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div
              className={`p-6 border-b ${
                verificationResult.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : verificationResult.verificationStatus === 'NOT_FOUND'
                  ? 'bg-amber-50/80 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {verificationResult.verificationStatus === 'VERIFIED' ? (
                    <div className="p-2 rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-full bg-amber-100 text-amber-700">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-mono font-bold text-slate-900">
                        {verificationResult.huid}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${
                          verificationResult.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-200/80 text-emerald-900'
                            : verificationResult.verificationStatus === 'NOT_FOUND'
                            ? 'bg-amber-200/80 text-amber-900'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {verificationResult.verificationStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {verificationResult.verificationStatus === 'VERIFIED'
                        ? 'Authoritative hallmark registration found.'
                        : 'No authoritative hallmark record found in current repository.'}
                    </p>
                  </div>
                </div>

                {savedSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded">
                    <Check className="w-3.5 h-3.5" /> Saved to History
                  </span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-6">
              {verificationResult.verificationStatus === 'VERIFIED' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-semibold block mb-1">Article Description</span>
                    <span className="font-bold text-slate-900 text-sm">{verificationResult.articleType || 'Precious Metal Article'}</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-semibold block mb-1">Certified Purity & Karat</span>
                    <span className="font-bold text-amber-800 text-sm">
                      {verificationResult.purityKarat || `${verificationResult.purityPpm} ppt`}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-semibold block mb-1">Registered Jeweller</span>
                    <span className="font-bold text-slate-900">{verificationResult.jewellerName || '—'}</span>
                    {verificationResult.jewellerRegistrationNumber && (
                      <span className="text-[11px] text-slate-500 block font-mono">
                        Reg: {verificationResult.jewellerRegistrationNumber}
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-semibold block mb-1">Assaying & Hallmarking Centre</span>
                    <span className="font-bold text-slate-900">{verificationResult.hallmarkingCentreName || '—'}</span>
                    {verificationResult.hallmarkingCentreCode && (
                      <span className="text-[11px] text-slate-500 block font-mono">
                        Code: {verificationResult.hallmarkingCentreCode}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Source Provenance Info */}
              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  <span className="font-semibold text-slate-700">Authority:</span> {verificationResult.sourceAuthority}
                </div>
                {verificationResult.sourceUrl && (
                  <a
                    href={verificationResult.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:text-amber-900 font-semibold inline-flex items-center gap-1"
                  >
                    View Hallmarking Portal <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Disclaimer */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-700">Platform Disclaimer:</span> {verificationResult.disclaimer}
              </div>

              {/* Official BIS CARE Mobile recommendation */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-8 h-8 text-blue-600 shrink-0" />
                  <div className="text-xs">
                    <h4 className="font-bold text-slate-900">Official In-Person Verification via BIS CARE</h4>
                    <p className="text-slate-600">
                      Download the government app to scan QR codes and perform real-time verification at jewellery counters.
                    </p>
                  </div>
                </div>
                <a
                  href="https://play.google.com/store/apps/details?id=com.bis.mobileapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0 shadow-sm"
                >
                  Download App
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
