// ─────────────────────────────────────────────────────────────────────────────
//  Phase 11 — Plain-Language Consumer Indian Standards Search Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { consumerService } from '../../services/api';
import type { ConsumerStandardSearchResult } from '@bis/shared';

export const ConsumerStandardsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState<string>(searchParams.get('q') || 'Luminaires');
  const [results, setResults] = useState<ConsumerStandardSearchResult[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const executeSearch = async (qText: string) => {
    if (!qText.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await consumerService.searchStandards({ q: qText.trim() });
      setResults(res.results || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to search standards for consumer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam && qParam.trim()) {
      setQuery(qParam.trim());
      executeSearch(qParam.trim());
    } else {
      executeSearch('Luminaires');
    }
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      executeSearch(query.trim());
    }
  };

  const sampleKeywords = ['LED Luminaire', 'Protective Helmet', 'Gold Hallmarking', 'Water Bottle', 'Pressure Cooker'];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/consumer" className="hover:text-blue-600 inline-flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Consumer Hub
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Search Indian Standards</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-700">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Search Indian Standards (Plain Language)</h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Understand safety and quality standards for everyday products without complex technical jargon.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <form onSubmit={onSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by product name, keyword, or IS number (e.g. helmet, IS 10322, gold)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shrink-0"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Quick Keywords */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-500">Popular searches:</span>
            {sampleKeywords.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => {
                  setQuery(kw);
                  setSearchParams({ q: kw });
                  executeSearch(kw);
                }}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 transition-colors"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              {hasSearched ? `Found ${total} Indian Standard${total === 1 ? '' : 's'}` : 'Suggested Standards'}
            </h2>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-xs text-slate-500">
              Searching BIS knowledge repository...
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Indian Standards Found</p>
              <p className="text-xs text-slate-500">
                Try searching for broader product terms such as "lighting", "helmet", "steel", or "gold".
              </p>
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.standardNumber}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-purple-300 transition-all space-y-5"
              >
                {/* Standard Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded">
                        {item.standardNumber}
                      </span>
                      {item.isMandatoryQco && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded">
                          <ShieldAlert className="w-3.5 h-3.5" /> Mandatory under QCO
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500">Status: {item.status}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  </div>

                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 shrink-0"
                    >
                      Official Standard <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* 5-Part Consumer Explanation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider text-purple-800">
                      What this means
                    </span>
                    <p className="text-slate-700 leading-relaxed">{item.consumerExplanation.whatThisMeans}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider text-purple-800">
                      Why it matters to you
                    </span>
                    <p className="text-slate-700 leading-relaxed">{item.consumerExplanation.whyItMatters}</p>
                  </div>

                  <div className="md:col-span-2 p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                    <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider text-purple-800">
                      What you can check before buying
                    </span>
                    <ul className="space-y-1.5 text-slate-700">
                      {item.consumerExplanation.whatYouCanCheck.map((checkItem, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{checkItem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Next Step Box */}
                <div className="p-3.5 rounded-lg bg-purple-50/70 border border-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-purple-900">Recommended Consumer Action: </span>
                    <span className="text-purple-950">{item.consumerExplanation.nextStep}</span>
                  </div>
                  <Link
                    to={`/consumer/licence?number=&standard=${encodeURIComponent(item.standardNumber)}`}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded text-[11px] shrink-0 text-center"
                  >
                    Verify a Licence for this Standard
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
