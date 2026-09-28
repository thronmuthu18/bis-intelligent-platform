// ─────────────────────────────────────────────────────────────────────────────
//  Phase 11 — BIS Licence Verification Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Info,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { consumerService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { LicenceVerificationItem } from '@bis/shared';

export const LicenceVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [licenceNumber, setLicenceNumber] = useState<string>(searchParams.get('number') || '');
  const [manufacturer, setManufacturer] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [standardNumber, setStandardNumber] = useState<string>('');
  const [saveHistory, setSaveHistory] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<LicenceVerificationItem | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const initialNum = searchParams.get('number');
    if (initialNum && initialNum.trim()) {
      handleVerify(initialNum.trim());
    }
  }, [searchParams]);

  const handleVerify = async (numToVerify?: string) => {
    const targetNum = (numToVerify || licenceNumber).trim();
    if (!targetNum) {
      setError('Please enter a BIS Licence (CM/L) or CRS Registration Number.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setVerificationResult(null);
    setSavedSuccess(false);

    try {
      const res = await consumerService.verifyLicence({
        licenceNumber: targetNum,
        manufacturer: manufacturer.trim() || undefined,
        productName: productName.trim() || undefined,
        standardNumber: standardNumber.trim() || undefined,
        saveHistory: user ? saveHistory : false,
      });

      setVerificationResult(res.verification);
      if (res.savedVerificationId) {
        setSavedSuccess(true);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Verification request failed.');
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
          <span className="text-slate-800 font-semibold">Verify BIS Licence</span>
        </div>

        {/* Header Box */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-700">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">BIS Licence Verification</h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Verify BIS CM/L licence numbers (ISI Mark) and CRS electronics registration numbers against authoritative records.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 leading-relaxed">
              <span className="font-semibold">How to find the licence number:</span> On certified products, the 7-digit or 8-digit
              CM/L number is printed directly beneath the triangular BIS standard mark (ISI logo), formatted like{' '}
              <span className="font-mono font-bold">CM/L-1234567</span> or <span className="font-mono font-bold">R-12345678</span>.
            </p>
          </div>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="licence-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Licence Number / Registration Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="licence-input"
                  type="text"
                  placeholder="e.g. CM/L-1234567, CM/L-8765432, CRS-9876543"
                  value={licenceNumber}
                  onChange={(e) => setLicenceNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Optional Filter Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Manufacturer (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Havells"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Product Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. LED Lamp"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Standard IS (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. IS 16102"
                  value={standardNumber}
                  onChange={(e) => setStandardNumber(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="save-history"
                  type="checkbox"
                  checked={saveHistory}
                  onChange={(e) => setSaveHistory(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="save-history" className="text-xs text-slate-600">
                  Save this verification attempt to my account history
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
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <span>Verifying with Authoritative Sources...</span>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Verify Licence
                </>
              )}
            </button>
          </form>
        </div>

        {/* Verification Result Card */}
        {verificationResult && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden space-y-0">
            {/* Status Header */}
            <div
              className={`p-6 border-b ${
                verificationResult.status === 'VERIFIED'
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : verificationResult.status === 'NOT_FOUND'
                  ? 'bg-amber-50/80 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {verificationResult.status === 'VERIFIED' ? (
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
                      <h2 className="text-lg font-bold text-slate-900">
                        {verificationResult.licenceNumber}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${
                          verificationResult.status === 'VERIFIED'
                            ? 'bg-emerald-200/80 text-emerald-900'
                            : verificationResult.status === 'NOT_FOUND'
                            ? 'bg-amber-200/80 text-amber-900'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {verificationResult.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{verificationResult.statusDetails}</p>
                  </div>
                </div>

                {savedSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded">
                    <Check className="w-3.5 h-3.5" /> Saved to History
                  </span>
                )}
              </div>
            </div>

            {/* Details Content */}
            <div className="p-6 space-y-6">
              {verificationResult.status === 'VERIFIED' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-semibold block mb-1">Manufacturer</span>
                    <span className="font-bold text-slate-900 text-sm">{verificationResult.manufacturer || '—'}</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-semibold block mb-1">Product Name / Scope</span>
                    <span className="font-bold text-slate-900">{verificationResult.productName || '—'}</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-semibold block mb-1">Applicable Indian Standard</span>
                    <span className="font-mono font-bold text-blue-700">{verificationResult.standardNumber || '—'}</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">{verificationResult.standardTitle}</p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-semibold block mb-1">Validity Period</span>
                    <span className="font-medium text-slate-800">
                      {verificationResult.validityStart
                        ? `${new Date(verificationResult.validityStart).toLocaleDateString()} to ${new Date(
                            verificationResult.validityEnd || ''
                          ).toLocaleDateString()}`
                        : 'Active in central register'}
                    </span>
                  </div>
                  {verificationResult.factoryAddress && (
                    <div className="sm:col-span-2 p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-semibold block mb-1">Factory Location</span>
                      <span className="text-slate-800">{verificationResult.factoryAddress}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Source Provenance Info */}
              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  <span className="font-semibold text-slate-700">Source:</span> {verificationResult.source} (
                  {verificationResult.sourceAuthority})
                </div>
                {verificationResult.sourceUrl && (
                  <a
                    href={verificationResult.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                  >
                    View Official Record <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Disclaimer */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-700">Platform Disclaimer:</span> {verificationResult.disclaimer}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
