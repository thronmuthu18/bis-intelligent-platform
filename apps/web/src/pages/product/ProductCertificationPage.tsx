import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Clock,
  Building2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProduct } from '@/contexts/ProductContext';
import { certificationService } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import type {
  ProductCertificationAnalysisResponse,
  ReviewDecision,
  DocumentRequiredStatus,
  FeeStatus,
  CertificationReadinessStatus,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Helper Badge Functions
// ─────────────────────────────────────────────────────────────────────────────

function getRelevanceBadge(level: string) {
  switch (level) {
    case 'RELEVANT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          Relevant Scheme
        </span>
      );
    case 'POTENTIALLY_RELEVANT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
          Potentially Relevant
        </span>
      );
    case 'NEEDS_REVIEW':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          Needs Review
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          Insufficient Evidence
        </span>
      );
  }
}

function getRequiredStatusBadge(status: DocumentRequiredStatus) {
  switch (status) {
    case 'REQUIRED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 border border-red-200">
          <CheckCircle2 size={11} className="text-red-700" />
          Mandatory
        </span>
      );
    case 'CONDITIONALLY_REQUIRED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle size={11} className="text-amber-700" />
          Conditional
        </span>
      );
    case 'REFERENCE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <FileText size={11} className="text-blue-700" />
          Reference
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <HelpCircle size={11} className="text-slate-600" />
          Unknown
        </span>
      );
  }
}

function getFeeStatusBadge(status: FeeStatus) {
  switch (status) {
    case 'OFFICIAL_FEE':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          Officially Published
        </span>
      );
    case 'ESTIMATED_FEE':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
          Estimated
        </span>
      );
    case 'VARIABLE':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          Variable / Lab-Dependent
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          Not Available
        </span>
      );
  }
}

function getReadinessBanner(status: CertificationReadinessStatus, score: number, summary: string) {
  let bg = 'bg-slate-50 border-slate-200 text-slate-900';
  let badge = 'bg-slate-200 text-slate-800';
  let label = 'Review In Progress';

  if (status === 'READY_FOR_DOCUMENT_REVIEW') {
    bg = 'bg-emerald-50 border-emerald-200 text-emerald-950';
    badge = 'bg-emerald-200 text-emerald-900';
    label = 'Ready for Document Review';
  } else if (status === 'MISSING_DOCUMENTATION') {
    bg = 'bg-amber-50 border-amber-200 text-amber-950';
    badge = 'bg-amber-200 text-amber-900';
    label = 'Missing Documentation';
  } else if (status === 'MISSING_PRODUCT_INFORMATION') {
    bg = 'bg-orange-50 border-orange-200 text-orange-950';
    badge = 'bg-orange-200 text-orange-900';
    label = 'Missing Product Details';
  } else if (status === 'INSUFFICIENT_BIS_EVIDENCE') {
    bg = 'bg-rose-50 border-rose-200 text-rose-950';
    badge = 'bg-rose-200 text-rose-900';
    label = 'Insufficient BIS Evidence';
  }

  return (
    <div className={`p-4 rounded-xl border ${bg} flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge}`}>
            {label}
          </span>
          <span className="text-xs text-text-muted font-medium">Readiness Score: {score}%</span>
        </div>
        <p className="text-xs leading-relaxed font-medium">{summary}</p>
      </div>

      <div className="w-full md:w-48">
        <div className="flex justify-between text-[11px] text-text-muted mb-1 font-semibold">
          <span>Dossier Readiness</span>
          <span>{score}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              score >= 80 ? 'bg-emerald-600' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main Component: ProductCertificationPage
// ─────────────────────────────────────────────────────────────────────────────

export function ProductCertificationPage(): React.ReactElement {
  const { product } = useProduct();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [analysis, setAnalysis] = useState<ProductCertificationAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [reviewingSchemeId, setReviewingSchemeId] = useState<string | null>(null);

  // Load certification intelligence analysis
  const loadAnalysis = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!product?.id) return;

      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await certificationService.analyzeProduct(product.id, forceRefresh);
        setAnalysis(data);
        if (forceRefresh) {
          showToast({
            type: 'success',
            title: 'Certification Analysis Refreshed',
            message: 'Latest candidate scheme and statutory requirements calculated.',
          });
        }
      } catch (err: any) {
        const msg = err.message || 'Failed to load certification analysis.';
        setError(msg);
        showToast({
          type: 'error',
          title: 'Analysis Error',
          message: msg,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [product?.id, showToast]
  );

  useEffect(() => {
    loadAnalysis(false);
  }, [loadAnalysis]);

  const toggleEvidence = (schemeId: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [schemeId]: !prev[schemeId] }));
  };

  // Handle user review
  const handleReview = async (schemeId: string, decision: ReviewDecision) => {
    if (!product?.id) return;
    setReviewingSchemeId(schemeId);

    try {
      const review = await certificationService.saveSchemeReview(product.id, {
        schemeId,
        decision,
      });

      // Update in-memory state
      if (analysis) {
        setAnalysis({
          ...analysis,
          schemes: analysis.schemes.map((s) =>
            s.schemeId === schemeId
              ? {
                  ...s,
                  userReview: {
                    decision: review.decision,
                    note: review.note || null,
                    updatedAt: review.updatedAt,
                  },
                }
              : s
          ),
        });
      }

      showToast({
        type: 'success',
        title: 'Review Saved',
        message: `Scheme marked as ${decision.replace('_', ' ')}.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Review Failed',
        message: err.message || 'Could not record your review decision.',
      });
    } finally {
      setReviewingSchemeId(null);
    }
  };

  if (loading && !analysis) {
    return (
      <div className="py-16 text-center space-y-4">
        <RefreshCw size={28} className="animate-spin text-accent-600 mx-auto" />
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Analyzing BIS Conformity Assessment Schemes...
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Evaluating matched Indian Standards, QCO gazettes, and official product manuals for {product?.name}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary">
              BIS Certification Schemes & Conformity Intelligence
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
              Phase 7 Intelligence
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Source-grounded BIS Conformity Assessment schemes, statutory documentation checklists, application requirements, and fee estimates for{' '}
            <strong className="text-text-primary">{product?.name || 'this product'}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => loadAnalysis(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-card border border-surface-border text-text-primary hover:bg-surface-page transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-accent-600' : ''} />
            <span>{refreshing ? 'Re-Analyzing...' : 'Re-Analyze Certification'}</span>
          </button>
        </div>
      </div>

      {/* ── Compliance / Decision-Support Notice ── */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-950">Statutory Decision-Support Notice</p>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            This module provides explainable scheme recommendations and statutory preparation checklists grounded in authoritative BIS standards and product manuals. It does <strong>not</strong> grant BIS certification or guarantee regulatory approval. All applications require formal filing on the official BIS portal (Manakonline / CRS).
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadAnalysis(true)}
            className="underline font-semibold ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Workflow Readiness Banner ── */}
      {analysis && (
        getReadinessBanner(
          analysis.readiness.status,
          analysis.readiness.score,
          analysis.readiness.summary
        )
      )}

      {/* ── Main 2-Column Content ── */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Schemes, Documentation, Application Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Candidate Schemes Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <Award size={16} className="text-accent-600" />
                  <span>Candidate BIS Conformity Assessment Schemes</span>
                  <span className="text-xs text-text-muted font-normal">
                    ({analysis.schemes.length} Identified)
                  </span>
                </h3>
              </div>

              {analysis.schemes.length === 0 ? (
                <Card>
                  <CardBody>
                    <EmptyState
                      icon={Award}
                      title="No candidate scheme mapping found in repository"
                      description="No authoritative BIS scheme mapping was established for the current matched standards. Please verify product standards in the Standards tab."
                      actionLabel="Go to Standards Workspace"
                      onAction={() => product && navigate(`/products/${product.id}/standards`)}
                    />
                  </CardBody>
                </Card>
              ) : (
                analysis.schemes.map((scheme) => {
                  const isExpanded = expandedEvidence[scheme.schemeId];
                  const userDecision = scheme.userReview?.decision;

                  return (
                    <Card key={scheme.id} className="border-l-4 border-l-accent-500 overflow-hidden">
                      <CardBody className="p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-500 font-mono">
                                #{scheme.rank}
                              </span>
                              <h4 className="text-sm font-bold text-text-primary">
                                {scheme.schemeName}
                              </h4>
                              {getRelevanceBadge(scheme.relevanceLevel)}
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {Math.round(scheme.confidenceScore * 100)}% Confidence
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary font-medium mt-1">
                              Associated Indian Standard:{' '}
                              <strong className="text-text-primary">{scheme.standardIsNumber}</strong>{' '}
                              — {scheme.standardTitle}
                            </p>
                          </div>

                          {userDecision && (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold self-start ${
                                userDecision === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : userDecision === 'REJECTED'
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              User Decision: {userDecision.replace('_', ' ')}
                            </span>
                          )}
                        </div>

                        {scheme.schemeDescription && (
                          <p className="text-xs text-text-muted leading-relaxed">
                            {scheme.schemeDescription}
                          </p>
                        )}

                        {/* Reasons Checklist */}
                        <div className="p-3 bg-surface-page rounded-lg border border-surface-border space-y-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                            Why this scheme applies to this product:
                          </p>
                          <ul className="space-y-1">
                            {scheme.reasons.map((r, i) => (
                              <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Collapsible Evidence */}
                        {scheme.evidence && (
                          <div>
                            <button
                              type="button"
                              onClick={() => toggleEvidence(scheme.schemeId)}
                              className="text-xs font-semibold text-accent-600 hover:text-accent-700 inline-flex items-center gap-1"
                            >
                              <span>{isExpanded ? 'Hide Evidence & Manual Details' : 'View Source Evidence & Product Manual'}</span>
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>

                            {isExpanded && (
                              <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                                {scheme.evidence.productManual && (
                                  <div>
                                    <span className="font-semibold text-text-primary">Product Manual / STI: </span>
                                    <span>{scheme.evidence.productManual.title}</span>
                                    {scheme.evidence.productManual.documentUrl && (
                                      <a
                                        href={scheme.evidence.productManual.documentUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 hover:underline inline-flex items-center gap-1 ml-2 font-medium"
                                      >
                                        <span>Download Manual</span>
                                        <ExternalLink size={11} />
                                      </a>
                                    )}
                                  </div>
                                )}

                                {scheme.evidence.sourceDocument && (
                                  <div>
                                    <span className="font-semibold text-text-primary">Authoritative Source: </span>
                                    <a
                                      href={scheme.evidence.sourceDocument.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                    >
                                      <span>{scheme.evidence.sourceDocument.title}</span>
                                      <ExternalLink size={11} />
                                    </a>
                                    <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                                      {scheme.evidence.sourceDocument.authorityLevel}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* User Review Action Bar */}
                        <div className="pt-2 border-t border-surface-border flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-text-muted font-medium">
                            Confirm applicability for compliance roadmap:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleReview(scheme.schemeId, 'CONFIRMED')}
                              disabled={reviewingSchemeId === scheme.schemeId}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                                userDecision === 'CONFIRMED'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                              }`}
                            >
                              Confirm Relevant
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReview(scheme.schemeId, 'NEEDS_REVIEW')}
                              disabled={reviewingSchemeId === scheme.schemeId}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                                userDecision === 'NEEDS_REVIEW'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100'
                              }`}
                            >
                              Needs Review
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReview(scheme.schemeId, 'REJECTED')}
                              disabled={reviewingSchemeId === scheme.schemeId}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                                userDecision === 'REJECTED'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'
                              }`}
                            >
                              Not Applicable
                            </button>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })
              )}
            </div>

            {/* 2. Statutory Documentation Checklist */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileCheck2 size={16} className="text-accent-600" />
                    <span>Statutory Documentation & Dossier Checklist</span>
                  </span>
                  <span className="text-xs text-text-muted font-normal">
                    {analysis.documentation.length} Required Items
                  </span>
                </CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-surface-border">
                  {analysis.documentation.map((doc) => (
                    <div key={doc.id} className="p-4 space-y-1.5 hover:bg-surface-page/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-primary">
                            {doc.documentName}
                          </span>
                          {getRequiredStatusBadge(doc.requiredStatus)}
                        </div>
                        <span className="text-[11px] font-semibold text-text-muted px-2 py-0.5 bg-slate-100 rounded self-start sm:self-auto">
                          {doc.category}
                        </span>
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed font-medium">
                        {doc.reason}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-muted pt-1">
                        {doc.source && (
                          <span>
                            <strong>Authority Source:</strong> {doc.source}
                          </span>
                        )}
                        {doc.notes && (
                          <span>
                            <strong>Notes:</strong> {doc.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* 3. Statutory Application & Form Requirements */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <FileText size={16} className="text-accent-600" />
                  <span>Statutory Application Forms & Official Portals</span>
                </CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {analysis.applicationRequirements.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 bg-surface-page rounded-lg border border-surface-border space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-text-primary">
                        {req.formName}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-100 text-accent-800 self-start sm:self-auto">
                        {req.applicableScheme}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {req.formPurpose}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-surface-border text-xs">
                      <span className="text-[11px] text-text-muted">
                        Authority: <strong>{req.source}</strong>
                      </span>
                      {req.officialUrl && (
                        <a
                          href={req.officialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-accent-600 hover:text-accent-800 font-semibold"
                        >
                          <span>Open Portal Form</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          {/* Right Column (1 Col): Fee Estimate, QCO Info, Official Sources */}
          <div className="space-y-6">
            {/* 1. Fee Estimation Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <IndianRupee size={16} className="text-accent-600" />
                  <span>Statutory & Estimated Fees</span>
                </CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="space-y-2">
                  {analysis.fees.map((fee) => (
                    <div
                      key={fee.id}
                      className="p-2.5 bg-surface-page rounded-lg border border-surface-border space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-primary">
                          {fee.feeType.replace('_', ' ')}
                        </span>
                        {getFeeStatusBadge(fee.status)}
                      </div>

                      <div className="text-sm font-bold text-text-primary">
                        {fee.amount !== null && fee.amount !== undefined ? (
                          <span>₹{fee.amount.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-xs text-text-secondary font-semibold">
                            Variable (Prescribed by Lab/STI)
                          </span>
                        )}
                      </div>

                      {fee.notes && (
                        <p className="text-[11px] text-text-muted leading-tight">
                          {fee.notes}
                        </p>
                      )}

                      {fee.source && (
                        <p className="text-[10px] text-slate-500 pt-0.5">
                          Source: {fee.source}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Fee Notice:</p>
                  <p>
                    Fees displayed are derived from published BIS regulations. Testing charges are paid directly to designated test laboratories and annual marking fees vary with production volume.
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* 2. Mandatory QCO Order Card */}
            {analysis.qcoInformation.length > 0 && (
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-red-900 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-red-600" />
                    <span>Quality Control Orders (QCO)</span>
                  </CardTitle>
                </CardHeader>
                <CardBody className="space-y-3">
                  {analysis.qcoInformation.map((qco) => (
                    <div
                      key={qco.id}
                      className="p-3 bg-red-50/50 rounded-lg border border-red-200 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-red-950">
                          {qco.qcoTitle}
                        </h4>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-200 text-red-900 shrink-0">
                          Mandatory QCO
                        </span>
                      </div>

                      <p className="text-xs text-red-900">
                        <strong>Gazette Order:</strong> {qco.orderNumber}
                      </p>

                      {qco.issuingAuthority && (
                        <p className="text-[11px] text-red-800">
                          <strong>Ministry:</strong> {qco.issuingAuthority}
                        </p>
                      )}

                      {qco.effectiveDate && (
                        <p className="text-[11px] text-red-800 flex items-center gap-1">
                          <Clock size={11} />
                          <span>Effective Date: {new Date(qco.effectiveDate).toLocaleDateString('en-IN')}</span>
                        </p>
                      )}

                      {qco.sourceUrl && (
                        <div className="pt-1">
                          <a
                            href={qco.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 underline"
                          >
                            <span>View Official Gazette Notification</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}

            {/* 3. Official Source Citations */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <ExternalLink size={16} className="text-accent-600" />
                  <span>Authoritative BIS Sources</span>
                </CardTitle>
              </CardHeader>
              <CardBody className="space-y-2">
                {analysis.sources.map((src, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-surface-page rounded-lg border border-surface-border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {src.authorityLevel}
                      </span>
                    </div>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>{src.title}</span>
                      <ExternalLink size={11} className="shrink-0" />
                    </a>
                  </div>
                ))}

                <div className="pt-2 border-t border-surface-border text-center">
                  <a
                    href="https://www.services.bis.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent-600 hover:text-accent-800"
                  >
                    <Building2 size={13} />
                    <span>Visit Official BIS Services Portal</span>
                  </a>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
