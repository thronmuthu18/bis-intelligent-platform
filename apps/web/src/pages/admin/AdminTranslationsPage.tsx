// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Multilingual Translation Resources Management Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Languages, ShieldCheck, CheckCircle, Search, Globe, Lock, BookOpen } from 'lucide-react';
import { BIS_TERMINOLOGY_DICTIONARY } from '@bis/shared';

export const AdminTranslationsPage: React.FC = () => {
  const [search, setSearch] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'ta' | 'hi' | 'all'>('all');

  const terms = Object.entries(BIS_TERMINOLOGY_DICTIONARY).filter(([term, data]) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      term.toLowerCase().includes(q) ||
      data.en.toLowerCase().includes(q) ||
      data.ta.toLowerCase().includes(q) ||
      data.hi.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Languages className="w-5 h-5 text-emerald-400" />
            Multilingual Translation & Terminology Governance
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative BIS Terminology Dictionaries, protected Indian Standard identifiers, and language resources.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono">
          <Lock className="w-3.5 h-3.5 text-blue-400" />
          <span>Canonical Identifiers Protected</span>
        </div>
      </div>

      {/* Protected Identifiers Notice */}
      <div className="bg-blue-950/20 border border-blue-800/40 p-4 rounded-xl text-xs text-blue-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-white">Canonical Technical Identifiers are Strictly Preserved</p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            The platform architecture guarantees that IS Numbers (e.g. <span className="font-mono text-white">IS 1293:2019</span>),
            CM/L Licence IDs, 6-digit HUID codes, Gazette S.O. numbers, NABL lab codes, and AHC codes are NEVER transliterated
            or corrupted across English, Tamil, and Hindi surfaces.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search standard terms, Tamil translation, or Hindi translation..."
            className="bg-transparent text-xs text-slate-200 placeholder-slate-500 flex-1 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400">View:</span>
          {(['all', 'ta', 'hi'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors uppercase ${
                selectedLanguage === lang
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {lang === 'all' ? 'All Languages' : lang === 'ta' ? 'Tamil (தமிழ்)' : 'Hindi (हिंदी)'}
            </button>
          ))}
        </div>
      </div>

      {/* Terminology Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Canonical English Term</th>
              {(selectedLanguage === 'all' || selectedLanguage === 'ta') && (
                <th className="px-4 py-3">Tamil Translation (தமிழ்)</th>
              )}
              {(selectedLanguage === 'all' || selectedLanguage === 'hi') && (
                <th className="px-4 py-3">Hindi Translation (हिंदी)</th>
              )}
              <th className="px-4 py-3">Governance Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {terms.map(([termKey, data]) => (
              <tr key={termKey} className="hover:bg-slate-900/40 transition-colors">
                <td className="px-4 py-3 font-semibold text-white">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>{data.en}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">[{data.key}]</span>
                </td>
                {(selectedLanguage === 'all' || selectedLanguage === 'ta') && (
                  <td className="px-4 py-3">
                    <p className="font-semibold text-emerald-300">{data.ta}</p>
                    <p className="text-[10px] text-slate-400 italic mt-0.5">{data.description}</p>
                  </td>
                )}
                {(selectedLanguage === 'all' || selectedLanguage === 'hi') && (
                  <td className="px-4 py-3">
                    <p className="font-semibold text-amber-300">{data.hi}</p>
                    <p className="text-[10px] text-slate-400 italic mt-0.5">{data.description}</p>
                  </td>
                )}
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3 h-3" />
                    Authoritative
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
