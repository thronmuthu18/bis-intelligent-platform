// ─────────────────────────────────────────────────────────────────────────────
//  Phase 11 — Consumer Services Dashboard Hub
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Gem,
  MapPin,
  BookOpen,
  AlertTriangle,
  History,
  Info,
  ExternalLink,
  Search,
  Smartphone,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { consumerService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import type {
  ConsumerVerificationHistoryItem,
} from '@bis/shared';

export const ConsumerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [recentVerifications, setRecentVerifications] = useState<ConsumerVerificationHistoryItem[]>([]);

  // Quick verify inputs
  const [quickLicence, setQuickLicence] = useState<string>('');
  const [quickHuid, setQuickHuid] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        await consumerService.getServices().catch(() => {});
        if (user) {
          const verRes = await consumerService.getVerifications();
          setRecentVerifications(verRes.verifications?.slice(0, 3) || []);
        }
      } catch (err) {
        console.error('Failed to load consumer dashboard data:', err);
      }
    }
    loadData();
  }, [user]);

  const handleQuickLicenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickLicence.trim()) {
      navigate(`/consumer/licence?number=${encodeURIComponent(quickLicence.trim())}`);
    }
  };

  const handleQuickHuidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickHuid.trim()) {
      navigate(`/consumer/huid?huid=${encodeURIComponent(quickHuid.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Disclaimer Banner */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" />
                Citizen & Consumer Services Hub
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {t('consumer.hubTitle')}
              </h1>
              <p className="mt-1 text-sm text-slate-600 max-w-3xl">
                {t('consumer.hubSubtitle')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LanguageSwitcher />
              <a
                href="https://www.manakonline.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                BIS Manakonline
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.bis.mobileapp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" />
                BIS CARE App
              </a>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <span className="font-semibold">{t('common.notice')}:</span> {t('common.decisionSupportOnly')}
            </div>
          </div>
        </div>

        {/* Quick Verification Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Licence Verify */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-xl p-6 text-white shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-blue-800/80">
                <ShieldCheck className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Quick Verify BIS Licence</h2>
                <p className="text-xs text-blue-200">Check CM/L licence or CRS registration validity</p>
              </div>
            </div>
            <form onSubmit={handleQuickLicenceSubmit} className="mt-4 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. CM/L-1234567 or 1234567"
                  value={quickLicence}
                  onChange={(e) => setQuickLicence(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                <Search className="w-4 h-4" />
                Verify Licence
              </button>
            </form>
          </div>

          {/* Quick HUID Verify */}
          <div className="bg-gradient-to-br from-amber-900 to-yellow-950 rounded-xl p-6 text-white shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-amber-800/80">
                <Gem className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Quick Verify HUID Hallmark</h2>
                <p className="text-xs text-amber-200">Check 6-digit alphanumeric gold hallmark</p>
              </div>
            </div>
            <form onSubmit={handleQuickHuidSubmit} className="mt-4 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. AZ1234 or HUID-925-ABCD"
                  value={quickHuid}
                  onChange={(e) => setQuickHuid(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-amber-300 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                <Search className="w-4 h-4" />
                Verify HUID
              </button>
            </form>
          </div>
        </div>

        {/* Primary Consumer Services Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Official Consumer Services & Exploration</h2>
            <Link
              to="/consumer/services"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              View all services <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Licence Verification */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Verify BIS Licence</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Verify manufacturer name, product category, and operative validity of CM/L licence numbers.
                </p>
              </div>
              <Link
                to="/consumer/licence"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-2"
              >
                Open Licence Verifier <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2: HUID Verification */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <Gem className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Verify HUID Hallmark</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Confirm 6-digit laser markings on gold jewellery, certified karat fineness, and jeweller registration.
                </p>
              </div>
              <Link
                to="/consumer/huid"
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 mt-2"
              >
                Open HUID Verifier <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3: Hallmarking Centres */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Find Hallmarking Centres</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Locate recognized Assaying and Hallmarking Centres (AHC) across states for consumer jewellery testing.
                </p>
              </div>
              <Link
                to="/consumer/hallmarking-centres"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 mt-2"
              >
                Search Centres <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 4: Plain-language Standards Search */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Search Indian Standards</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Search safety standards for helmets, bottles, electronics, and LED lights in plain, non-technical language.
                </p>
              </div>
              <Link
                to="/consumer/standards"
                className="text-xs font-semibold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 mt-2"
              >
                Explore Standards <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 5: Hallmarking Education */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:border-yellow-300 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center mb-4">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Understand Hallmarking</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Learn the 3 mandatory marks, purity karat denominations (22K916, 18K750), and consumer testing rights.
                </p>
              </div>
              <Link
                to="/consumer/hallmarking"
                className="text-xs font-semibold text-yellow-800 hover:text-yellow-950 inline-flex items-center gap-1 mt-2"
              >
                Read Educational Guide <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 6: Consumer Grievance / Complaints */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Grievance & Complaints</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Step-by-step guidance on reporting fake hallmarks, substandard ISI products, and consumer redressal.
                </p>
              </div>
              <Link
                to="/consumer/services"
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 mt-2"
              >
                View Guidance <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Authenticated User Saved History Preview */}
        {user && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700" />
                <h3 className="text-lg font-bold text-slate-900">Your Saved Verifications</h3>
              </div>
              <Link
                to="/consumer/verifications"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                View full history <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentVerifications.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No saved verifications yet. Perform a licence or HUID search to save records.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentVerifications.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 uppercase tracking-wide">{item.verificationType}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          item.resultStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.resultStatus === 'NOT_FOUND'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.resultStatus}
                      </span>
                    </div>
                    <p className="font-mono text-slate-900 truncate">{item.summary}</p>
                    <p className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Consumer Helpline & Contact Box */}
        <div className="bg-slate-900 text-white rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold">Official BIS Citizen Helplines</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              For official complaints regarding substandard ISI marks, misleading quality claims, or hallmarking queries:
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <div>
                <span className="text-slate-400">Toll-Free:</span> <span className="font-bold text-amber-300">1800-11-1206</span>
              </div>
              <div>
                <span className="text-slate-400">Complaints Email:</span> <span className="font-bold text-blue-300">complaints@bis.gov.in</span>
              </div>
              <div>
                <span className="text-slate-400">Headquarters:</span> <span>+91-11-23230131</span>
              </div>
            </div>
          </div>
          <a
            href="https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/complaints"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2 shrink-0 shadow"
          >
            <ExternalLink className="w-4 h-4" />
            Official Complaint Portal
          </a>
        </div>
      </div>
    </div>
  );
};
