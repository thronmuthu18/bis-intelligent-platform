import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  BookOpen,
  ShieldCheck,
  FileText,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { useProduct } from '@/contexts/ProductContext';
import { standardService, productIntelligenceService } from '@/services/api';
import type {
  HybridSearchResultItem,
  StandardStatus,
  SearchMode,
  AuthorityLevel,
  ProductStandardAnalysisResponse,
  CandidateStandardMatchItem,
  ReviewDecision,
} from '@bis/shared';
import { SourceProvenanceCard } from '@/components/standards/SourceProvenanceCard';
import { StandardDetailModal } from '@/components/standards/StandardDetailModal';
import { useToast } from '@/components/ui/Toast';

// ─────────────────────────────────────────────────────────────────────────────
//  ProductStandardsPage — Standards Intelligence & Repository Explorer (Phase 6)
// ─────────────────────────────────────────────────────────────────────────────

type ActiveTab = 'intelligence' | 'explorer';

export function ProductStandardsPage(): React.ReactElement {
  const { product } = useProduct();
  const { showToast } = useToast();

  // Navigation & Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('intelligence');

  // Intelligence State (Phase 6)
  const [analysis, setAnalysis] = useState<ProductStandardAnalysisResponse | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [savingReview, setSavingReview] = useState<Record<string, boolean>>({});

  // Explorer State (Phase 4 & 5)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchMode, setSearchMode] = useState<SearchMode>('hybrid');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<StandardStatus | ''>('');
  const [selectedAuthority, setSelectedAuthority] = useState<AuthorityLevel | ''>('');
  const [standards, setStandards] = useState<HybridSearchResultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [explorerError, setExplorerError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [semanticFallback, setSemanticFallback] = useState<boolean>(false);
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);

  // 1. Fetch Product Intelligence Analysis
  const fetchAnalysis = useCallback(async (forceRefresh = false) => {
    if (!product?.id) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await productIntelligenceService.analyzeProduct(product.id, forceRefresh);
      setAnalysis(res);
      if (forceRefresh) {
        showToast({
          type: 'success',
          title: 'Intelligence Refreshed',
          message: `Found ${res.totalCandidates} candidate standards for ${product.name}.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze product standards.';
      setAnalysisError(msg);
    } finally {
      setAnalyzing(false);
    }
  }, [product?.id, product?.name, showToast]);

  // 2. Fetch Standards for Explorer Tab
  const fetchExplorerStandards = useCallback(async () => {
    setLoading(true);
    setExplorerError(null);
    setSemanticFallback(false);
    try {
      const res = await standardService.searchStandards({
        q: searchQuery.trim() || undefined,
        mode: searchMode,
        sector: selectedSector || undefined,
        status: (selectedStatus as StandardStatus) || undefined,
        authorityLevel: (selectedAuthority as AuthorityLevel) || undefined,
        limit: 20,
      });
      setStandards((res.results || []) as HybridSearchResultItem[]);
      setTotalCount(res.pagination?.total || 0);
      if (res.meta?.semanticFallbackUsed) {
        setSemanticFallback(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load Indian Standards knowledge base.';
      setExplorerError(msg);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchMode, selectedSector, selectedStatus, selectedAuthority]);

  useEffect(() => {
    fetchAnalysis(false);
  }, [fetchAnalysis]);

  useEffect(() => {
    if (activeTab === 'explorer') {
      fetchExplorerStandards();
    }
  }, [activeTab, fetchExplorerStandards]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExplorerStandards();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSearchMode('hybrid');
    setSelectedSector('');
    setSelectedStatus('');
    setSelectedAuthority('');
  };

  // User Review Action Handler
  const handleReviewDecision = async (
    standardId: string,
    decision: ReviewDecision
  ) => {
    if (!product?.id) return;
    setSavingReview((prev) => ({ ...prev, [standardId]: true }));
    try {
      const review = await productIntelligenceService.saveProductReview(product.id, {
        standardId,
        decision,
      });

      // Update in-memory state
      if (analysis) {
        setAnalysis({
          ...analysis,
          candidateStandards: analysis.candidateStandards.map((c) => {
            if (c.standardId === standardId) {
              return {
                ...c,
                userReview: {
                  decision: review.decision,
                  note: review.note,
                  updatedAt: review.updatedAt,
                },
              };
            }
            return c;
          }),
        });
      }

      const decisionLabels: Record<ReviewDecision, string> = {
        CONFIRMED: 'Marked as Confirmed Relevant',
        REJECTED: 'Marked as Not Relevant',
        NEEDS_REVIEW: 'Marked for Further Review',
      };

      showToast({
        type: 'success',
        title: 'Review Updated',
        message: decisionLabels[decision],
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update review status.';
      showToast({
        type: 'error',
        title: 'Review Failed',
        message: msg,
      });
    } finally {
      setSavingReview((prev) => ({ ...prev, [standardId]: false }));
    }
  };

  const toggleEvidence = (standardId: string) => {
    setExpandedEvidence((prev) => ({
      ...prev,
      [standardId]: !prev[standardId],
    }));
  };

  const statusBadge = (status: StandardStatus | string) => {
    const map: Record<string, { label: string; className: string }> = {
      CURRENT: { label: 'Current / In Force', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      SUPERSEDED: { label: 'Superseded', className: 'bg-amber-50 text-amber-700 border-amber-200' },
      WITHDRAWN: { label: 'Withdrawn', className: 'bg-rose-50 text-rose-700 border-rose-200' },
      DRAFT: { label: 'Draft', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      UNKNOWN: { label: 'Unknown', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    };
    const s = map[status] || map.UNKNOWN;
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${s.className}`}>
        {s.label}
      </span>
    );
  };

  const relevanceBadge = (score?: number, mode?: SearchMode) => {
    if (score === undefined) return null;
    const pct = Math.min(100, Math.round(score * 100));

    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
    if (pct >= 85) colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (pct >= 65) colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    else if (pct >= 40) colorClass = 'bg-amber-50 text-amber-700 border-amber-200';

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${colorClass}`}
        title={`Relevance Score: ${pct}% based on ${mode || 'hybrid'} retrieval`}
      >
        <Sparkles size={10} />
        {pct >= 95 ? 'Exact Match' : `${pct}% Relevance`}
      </span>
    );
  };

  const matchLevelBadge = (level: string) => {
    switch (level) {
      case 'HIGHLY_RELEVANT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 shadow-xs">
            <Sparkles size={11} className="text-emerald-600" />
            Highly Relevant Candidate
          </span>
        );
      case 'RELEVANT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 shadow-xs">
            <Zap size={11} className="text-blue-600" />
            Relevant Candidate
          </span>
        );
      case 'POTENTIALLY_RELEVANT':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 shadow-xs">
            <Layers size={11} className="text-amber-600" />
            Potentially Relevant Reference
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-surface-border">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600" />
            <span>Indian Standards (IS) Intelligence & Knowledge Base</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Automated candidate standard matching and authoritative BIS specifications for {product?.name || 'this product'}.
          </p>
        </div>

        {/* Top Tab Bar Switcher */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('intelligence')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-medium transition ${
              activeTab === 'intelligence'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={13} className={activeTab === 'intelligence' ? 'text-blue-600' : 'text-slate-400'} />
            <span>Standards Intelligence</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-medium transition ${
              activeTab === 'explorer'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search size={13} className={activeTab === 'explorer' ? 'text-blue-600' : 'text-slate-400'} />
            <span>Repository Explorer</span>
          </button>
        </div>
      </div>

      {/* ── Non-Compliance Legal Disclaimer ── */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-950">Source-Grounded Standards Matching Foundation</p>
          <p className="mt-0.5 text-blue-800/90 leading-relaxed">
            All candidate standards are retrieved from official Bureau of Indian Standards (BIS) publications and Ministry Quality Control Orders. This intelligence layer provides decision-support evidence; human verification and technical review remain required.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: STANDARDS INTELLIGENCE (PHASE 6)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          {/* Analysis Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target Product</span>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {product?.category || 'General'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{product?.name}</h3>
                {product?.intendedUse && (
                  <p className="text-xs text-slate-600 max-w-2xl">
                    <span className="font-semibold text-slate-700">Intended Application: </span>
                    {product.intendedUse}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fetchAnalysis(true)}
                  disabled={analyzing}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
                  title="Force refresh candidate standard matching"
                >
                  <RefreshCw size={13} className={analyzing ? 'animate-spin' : ''} />
                  <span>{analyzing ? 'Analyzing Standards...' : 'Re-Analyze Product'}</span>
                </button>
              </div>
            </div>

            {/* Analysis Metadata Footer */}
            {analysis && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Cpu size={12} className="text-slate-400" />
                    <span>Engine v{analysis.analysisVersion}</span>
                  </span>
                  <span>•</span>
                  <span>{analysis.fromCache ? 'Retrieved from cached analysis' : 'Fresh hybrid evaluation'}</span>
                  <span>•</span>
                  <span>Generated {new Date(analysis.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">{analysis.totalCandidates}</span> candidate standards evaluated
                </div>
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {analyzing && !analysis && (
            <div className="space-y-4 py-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="h-5 w-1/3 bg-slate-200 rounded"></div>
                  <div className="mt-3 h-4 w-2/3 bg-slate-200 rounded"></div>
                  <div className="mt-4 flex gap-2">
                    <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                    <div className="h-6 w-32 bg-slate-200 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Notice */}
          {analysisError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Analysis Failed</p>
                <p className="mt-0.5">{analysisError}</p>
                <button
                  type="button"
                  onClick={() => fetchAnalysis(true)}
                  className="mt-2 text-xs font-semibold text-rose-700 underline hover:text-rose-900"
                >
                  Retry Product Standards Analysis
                </button>
              </div>
            </div>
          )}

          {/* Empty Results Notice */}
          {!analyzing && !analysisError && analysis && analysis.candidateStandards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-400 mb-3" />
              <h4 className="text-sm font-bold text-slate-800">No sufficiently supported candidate standard was found</h4>
              <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                No standard in the current verified BIS knowledge repository directly matches this product&apos;s attributes. Further official verification on the BIS portal is recommended.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('explorer')}
                className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900 transition"
              >
                Browse Full Standards Repository
              </button>
            </div>
          )}

          {/* Candidate Standards List */}
          {!analyzing && analysis && analysis.candidateStandards.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                <span className="font-semibold text-slate-800">Ranked Candidate Standards ({analysis.totalCandidates})</span>
                <span>Sorted by attribute-to-standard relevance</span>
              </div>

              {analysis.candidateStandards.map((item: CandidateStandardMatchItem) => {
                const isExpanded = expandedEvidence[item.standardId] || false;
                const isSaving = savingReview[item.standardId] || false;

                return (
                  <div
                    key={item.standardId}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                  >
                    {/* Candidate Top Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-lg bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
                            #{item.rank}
                          </span>
                          <span className="font-mono text-sm font-bold text-blue-900">
                            {item.isNumber}
                          </span>
                          {matchLevelBadge(item.matchLevel)}
                          {statusBadge(item.status)}
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                        {item.sector && (
                          <p className="text-xs text-slate-500">
                            <span className="font-medium text-slate-700">Division: </span>
                            {item.sector} {item.department ? `(${item.department})` : ''}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-row sm:flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-700">
                            {Math.round(item.relevanceScore * 100)}% Match
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedStandardId(item.standardId)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                        >
                          <span>Full Specifications</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Scope & Description */}
                    {item.scope && (
                      <div className="mt-3 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        <span className="font-semibold text-slate-800">Standard Scope: </span>
                        {item.scope}
                      </div>
                    )}

                    {/* Why This Standard Matches (Explainability Section) */}
                    <div className="mt-3.5 space-y-1.5">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-blue-600" />
                        <span>Why this standard is relevant:</span>
                      </p>
                      <ul className="space-y-1 pl-1 text-xs text-slate-700">
                        {item.reasons.map((reason, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* QCO Order Callout if Present */}
                    {item.evidence?.qco && (
                      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 flex items-start gap-2.5">
                        <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-950">
                            Quality Control Order: {item.evidence.qco.name}
                          </p>
                          <p className="mt-0.5 text-blue-800/90">
                            Order Number: <span className="font-mono font-bold">{item.evidence.qco.orderNumber}</span>
                            {item.evidence.qco.ministry ? ` • ${item.evidence.qco.ministry}` : ''}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Collapsible Evidence Blocks */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleEvidence(item.standardId)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                      >
                        <FileText size={13} className="text-slate-400" />
                        <span>{isExpanded ? 'Hide Source Evidence' : 'View Source Evidence & Provenance'}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      {/* Source Link */}
                      {item.sourceDocument && (
                        <SourceProvenanceCard
                          sourceDocument={item.sourceDocument as any}
                          compact={true}
                        />
                      )}
                    </div>

                    {/* Expanded Evidence Details */}
                    {isExpanded && (
                      <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-700">
                        <p className="font-bold text-slate-900">Retrieval Evidence & Verifications</p>
                        {item.evidence?.chunks && item.evidence.chunks.length > 0 ? (
                          item.evidence.chunks.map((chk, cIdx) => (
                            <div key={cIdx} className="bg-white p-2.5 rounded-lg border border-slate-200">
                              <p className="font-semibold text-blue-900">{chk.sectionTitle || 'Knowledge Chunk'}</p>
                              <p className="mt-1 font-mono text-[11px] text-slate-600">{chk.contentSnippet}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-500">Directly matched from indexed standard specifications & official catalogue entry.</p>
                        )}
                      </div>
                    )}

                    {/* User Confirmation & Review Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">Your Review:</span>
                        {item.userReview && (
                          <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.userReview.decision === 'CONFIRMED' && '✓ Confirmed Relevant'}
                            {item.userReview.decision === 'REJECTED' && '✕ Rejected / Not Relevant'}
                            {item.userReview.decision === 'NEEDS_REVIEW' && '? Needs Technical Review'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleReviewDecision(item.standardId, 'CONFIRMED')}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                            item.userReview?.decision === 'CONFIRMED'
                              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                              : 'border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                          }`}
                        >
                          <CheckCircle2 size={13} />
                          <span>Confirm Relevant</span>
                        </button>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleReviewDecision(item.standardId, 'NEEDS_REVIEW')}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                            item.userReview?.decision === 'NEEDS_REVIEW'
                              ? 'bg-amber-600 text-white shadow-xs font-semibold'
                              : 'border border-slate-200 bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
                          }`}
                        >
                          <HelpCircle size={13} />
                          <span>Needs Review</span>
                        </button>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleReviewDecision(item.standardId, 'REJECTED')}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                            item.userReview?.decision === 'REJECTED'
                              ? 'bg-rose-600 text-white shadow-xs font-semibold'
                              : 'border border-slate-200 bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                          }`}
                        >
                          <XCircle size={13} />
                          <span>Not Relevant</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: REPOSITORY EXPLORER (PHASE 4 & 5)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'explorer' && (
        <div className="space-y-6">
          {/* Semantic Fallback Notice */}
          {semanticFallback && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800 flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-amber-600" />
              <span>
                Semantic vector search was temporarily unavailable; results were safely retrieved using indexed lexical keyword matching.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Search & Results Table */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen size={16} className="text-blue-600" />
                      <span>Search Indian Standards</span>
                    </CardTitle>
                    <span className="text-xs font-medium text-slate-500">
                      {totalCount} {totalCount === 1 ? 'standard' : 'standards'} registered
                    </span>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  {/* Search Input Bar */}
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by IS number (e.g. IS 10322), keyword, product name, or scope..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-24 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-xs"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                    >
                      Search
                    </button>
                  </form>

                  {/* Filter Controls & Search Mode Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Search Mode Toggle */}
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setSearchMode('hybrid')}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                            searchMode === 'hybrid'
                              ? 'bg-white text-blue-700 shadow-xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Combines exact keyword matching with semantic vector similarity"
                        >
                          <span className="flex items-center gap-1">
                            <Sparkles size={11} />
                            Hybrid
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSearchMode('keyword')}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                            searchMode === 'keyword'
                              ? 'bg-white text-blue-700 shadow-xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Pure keyword & exact IS number search"
                        >
                          Keyword
                        </button>
                        <button
                          type="button"
                          onClick={() => setSearchMode('semantic')}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                            searchMode === 'semantic'
                              ? 'bg-white text-blue-700 shadow-xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Vector semantic similarity search"
                        >
                          <span className="flex items-center gap-1">
                            <Zap size={11} />
                            Semantic
                          </span>
                        </button>
                      </div>

                      {/* Sector Filter */}
                      <select
                        aria-label="Filter by Sector"
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-hidden"
                      >
                        <option value="">All Sectors</option>
                        <option value="Electrotechnical">Electrotechnical (ETD)</option>
                        <option value="Electronics & IT">Electronics & IT (LITD)</option>
                        <option value="Chemical">Chemical (CHD)</option>
                        <option value="Mechanical">Mechanical (MED)</option>
                        <option value="Civil Engineering">Civil Engineering (CED)</option>
                      </select>

                      {/* Status Filter */}
                      <select
                        aria-label="Filter by Status"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as StandardStatus | '')}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-hidden"
                      >
                        <option value="">All Statuses</option>
                        <option value="CURRENT">Current / In Force</option>
                        <option value="SUPERSEDED">Superseded</option>
                        <option value="WITHDRAWN">Withdrawn</option>
                      </select>
                    </div>

                    {(searchQuery || selectedSector || selectedStatus || selectedAuthority) && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Error State */}
              {explorerError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Failed to Retrieve Standards</p>
                    <p className="mt-0.5">{explorerError}</p>
                  </div>
                </div>
              )}

              {/* Loading Skeleton */}
              {loading && (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="animate-pulse rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                      <div className="mt-2 h-3 w-3/4 bg-slate-200 rounded"></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && !explorerError && standards.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <h4 className="text-sm font-semibold text-slate-800">No matching Indian Standards found</h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    Try refining your search terms (e.g. &quot;IS 10322&quot; or &quot;luminaires&quot;) or adjust your search mode and filters.
                  </p>
                </div>
              )}

              {/* Standards Results List */}
              {!loading && standards.length > 0 && (
                <div className="space-y-3">
                  {standards.map((std) => (
                    <div
                      key={std.id}
                      className="group rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs transition hover:border-blue-300 hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-900">
                              {std.isNumber}
                            </span>
                            {statusBadge(std.status)}
                            {relevanceBadge(std.relevanceScore, std.searchMode)}
                            {std.sector && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                {std.sector}
                              </span>
                            )}
                          </div>
                          <h4 className="mt-1 text-sm font-semibold text-slate-800 group-hover:text-blue-900 transition">
                            {std.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedStandardId(std.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition shrink-0"
                        >
                          <span>View Details</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>

                      {std.scope && (
                        <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {std.scope}
                        </p>
                      )}

                      {/* Source Provenance Footer */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <SourceProvenanceCard
                          sourceDocument={std.sourceDocument as any}
                          compact={true}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Information & Registry Guidance */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">BIS Standardization Framework</CardTitle>
                </CardHeader>
                <CardBody className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <p>
                    Indian Standards (IS) are formulated by Technical Committees of the Bureau of Indian Standards in accordance with the BIS Act, 2016.
                  </p>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 space-y-1.5">
                    <p className="font-semibold text-slate-800">Standard Classifications:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                      <li><strong className="text-slate-700">Product Specification:</strong> Physical, mechanical & safety criteria.</li>
                      <li><strong className="text-slate-700">Code of Practice:</strong> Installation & design guidelines.</li>
                      <li><strong className="text-slate-700">Method of Test:</strong> Testing protocols & laboratory procedures.</li>
                    </ul>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Official Source Transparency</CardTitle>
                </CardHeader>
                <CardBody className="space-y-2 text-xs text-slate-600">
                  <p>
                    Every standard, amendment, and Quality Control Order in this platform links directly to its official source document on the BIS Connect Portal or The Gazette of India.
                  </p>
                  <a
                    href="https://www.services.bis.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold mt-1"
                  >
                    <span>Visit BIS Official Portal</span>
                    <ExternalLink size={12} />
                  </a>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ── Standard Detail Modal ── */}
      {selectedStandardId && (
        <StandardDetailModal
          standardId={selectedStandardId}
          onClose={() => setSelectedStandardId(null)}
        />
      )}
    </div>
  );
}
