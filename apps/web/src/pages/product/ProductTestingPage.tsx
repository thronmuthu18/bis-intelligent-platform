import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  Sliders,
  Check,
  Star,
  Info,
  Layers,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useProduct } from '@/contexts/ProductContext';
import { testingService } from '@/services/api';
import type {
  ProductTestingAnalysisResponse,
  LaboratoryMatchResult,
  LabDecision,
  TestCategory,
} from '@bis/shared';

export function ProductTestingPage(): React.ReactElement {
  const { product } = useProduct();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState<ProductTestingAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Category Filter for Test Requirements
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [selectedLabForReview, setSelectedLabForReview] = useState<LaboratoryMatchResult | null>(null);
  const [reviewDecision, setReviewDecision] = useState<LabDecision>('SHORTLISTED');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [isSavingReview, setIsSavingReview] = useState<boolean>(false);

  // Evidence Drawer
  const [evidenceModalOpen, setEvidenceModalOpen] = useState<boolean>(false);
  const [selectedEvidence, setSelectedEvidence] = useState<{
    title: string;
    text: string;
    sourceTitle?: string;
    sourceUrl?: string;
    clause?: string;
  } | null>(null);

  const loadAnalysis = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!product) return;
      try {
        if (forceRefresh) {
          setIsAnalyzing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const data = await testingService.analyzeTesting(product.id, { forceRefresh });
        setAnalysis(data);
      } catch (err: any) {
        setError(err.message || 'Failed to execute testing intelligence analysis');
      } finally {
        setIsLoading(false);
        setIsAnalyzing(false);
      }
    },
    [product]
  );

  useEffect(() => {
    loadAnalysis(false);
  }, [loadAnalysis]);

  const handleOpenReview = (labMatch: LaboratoryMatchResult, defaultDecision: LabDecision = 'SHORTLISTED') => {
    setSelectedLabForReview(labMatch);
    setReviewDecision(defaultDecision);
    setReviewNote(labMatch.laboratory.userReview?.note || '');
    setReviewModalOpen(true);
  };

  const handleSaveReview = async () => {
    if (!product || !selectedLabForReview) return;
    try {
      setIsSavingReview(true);
      await testingService.createLaboratoryReview(product.id, {
        laboratoryId: selectedLabForReview.laboratory.id,
        decision: reviewDecision,
        note: reviewNote.trim() || undefined,
      });
      setReviewModalOpen(false);
      await loadAnalysis(false);
    } catch (err: any) {
      alert(`Error saving review: ${err.message}`);
    } finally {
      setIsSavingReview(false);
    }
  };

  // Readiness styling helpers
  const getReadinessBadge = (status: string) => {
    switch (status) {
      case 'TESTING_READY':
        return <Badge variant="green">Testing Pathway Ready</Badge>;
      case 'MISSING_LAB_REPORT':
        return <Badge variant="yellow">External Lab Required</Badge>;
      case 'MISSING_CALIBRATION':
        return <Badge variant="yellow">Calibration Verification Pending</Badge>;
      case 'INSUFFICIENT_EVIDENCE':
        return <Badge variant="red">Insufficient Source Evidence</Badge>;
      default:
        return <Badge variant="grey">Review Required</Badge>;
    }
  };

  const getCapabilityBadge = (match: string) => {
    switch (match) {
      case 'HIGH':
        return <Badge variant="green">High Match</Badge>;
      case 'PARTIAL':
        return <Badge variant="yellow">Partial Match</Badge>;
      default:
        return <Badge variant="grey">Unverified Scope</Badge>;
    }
  };

  const getCategoryIcon = (category: TestCategory) => {
    switch (category) {
      case 'SAFETY':
        return <ShieldCheck size={14} className="text-emerald-500" />;
      case 'ELECTRICAL':
        return <FlaskConical size={14} className="text-amber-500" />;
      case 'THERMAL':
        return <Sparkles size={14} className="text-rose-500" />;
      default:
        return <Layers size={14} className="text-primary-500" />;
    }
  };

  // Filter requirements by category
  const filteredRequirements =
    selectedCategory === 'ALL'
      ? analysis?.requirements || []
      : (analysis?.requirements || []).filter((r) => r.testCategory === selectedCategory);

  const categories = Array.from(
    new Set((analysis?.requirements || []).map((r) => r.testCategory))
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">Testing & Laboratory Intelligence</h1>
            <Badge variant="blue">Phase 8</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Source-grounded Scheme of Testing & Inspection (STI) parameters, factory test equipment, and BIS recognized laboratory capability matching.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadAnalysis(true)}
            disabled={isLoading || isAnalyzing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={isAnalyzing ? 'animate-spin' : ''} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Recompute'}</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/products/${product?.id}/laboratories`)}
            className="flex items-center gap-1.5"
          >
            <Building2 size={13} />
            <span>Explore All Labs</span>
          </Button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Testing Intelligence Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => loadAnalysis(true)}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {isLoading && !analysis && (
        <div className="space-y-4">
          <div className="h-32 bg-surface-muted/60 animate-pulse rounded-2xl border border-surface-border" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-surface-muted/40 animate-pulse rounded-2xl border border-surface-border" />
            <div className="h-96 bg-surface-muted/40 animate-pulse rounded-2xl border border-surface-border" />
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && !analysis && !error && (
        <Card>
          <CardBody>
            <EmptyState
              icon={FlaskConical}
              title="No testing intelligence generated yet"
              description="Extract testing requirements, factory test equipment checklists, and accredited laboratories based on your matched Indian Standards."
              actionLabel="Run Testing Analysis"
              onAction={() => loadAnalysis(true)}
            />
          </CardBody>
        </Card>
      )}

      {/* ── Active Analysis Dashboard ── */}
      {analysis && (
        <div className="space-y-6">
          {/* 1. Readiness Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-surface-card via-surface-page to-surface-card border border-surface-border shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Testing Workflow Readiness
                  </span>
                  {getReadinessBadge(analysis.readiness.status)}
                </div>
                <p className="text-sm font-medium text-text-primary">
                  {analysis.readiness.summary}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 bg-surface-page/80 p-3 rounded-xl border border-surface-border">
                <div className="text-right">
                  <div className="text-[11px] text-text-muted font-medium">Readiness Score</div>
                  <div className="text-xl font-black text-primary-600">
                    {analysis.readiness.score}
                    <span className="text-xs font-normal text-text-muted">/100</span>
                  </div>
                </div>
                <div className="w-16 bg-surface-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${analysis.readiness.score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Blockers & Next Steps */}
            {(analysis.readiness.blockers.length > 0 || analysis.readiness.nextSteps.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-surface-border text-xs">
                {analysis.readiness.blockers.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-amber-700 flex items-center gap-1.5">
                      <AlertTriangle size={13} />
                      Actionable Requirements ({analysis.readiness.blockers.length})
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-text-secondary">
                      {analysis.readiness.blockers.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.readiness.nextSteps.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      Recommended Next Actions
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-text-secondary">
                      {analysis.readiness.nextSteps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. User Selected Laboratory Callout (If Any) */}
          {analysis.userSelectedLaboratory && (
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 mt-0.5">
                  <Check size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                      User Selected Testing Laboratory
                    </span>
                    <Badge variant="green">Active Choice</Badge>
                  </div>
                  <p className="text-sm font-bold text-emerald-950 mt-0.5">
                    {analysis.userSelectedLaboratory.laboratory.name}
                  </p>
                  <p className="text-xs text-emerald-800">
                    {analysis.userSelectedLaboratory.laboratory.city}, {analysis.userSelectedLaboratory.laboratory.state} • {analysis.userSelectedLaboratory.matchedTests.length} tests supported
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenReview(analysis.userSelectedLaboratory!, 'SELECTED')}
                className="shrink-0 bg-white"
              >
                Manage Selection
              </Button>
            </div>
          )}

          {/* 3. Main Workspace Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Test Requirements & Factory Equipment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Test Requirements Section */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                      <FlaskConical size={16} className="text-primary-600" />
                      <span>Required Test Parameters</span>
                      <span className="text-xs font-normal text-text-muted">
                        ({filteredRequirements.length} parameters)
                      </span>
                    </CardTitle>

                    {/* Category Filter Pills */}
                    {categories.length > 1 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        <Button
                          variant={selectedCategory === 'ALL' ? 'primary' : 'ghost'}
                          size="xs"
                          onClick={() => setSelectedCategory('ALL')}
                          className="h-7"
                        >
                          All
                        </Button>
                        {categories.map((cat) => (
                          <Button
                            key={cat}
                            variant={selectedCategory === cat ? 'primary' : 'ghost'}
                            size="xs"
                            onClick={() => setSelectedCategory(cat)}
                            className="h-7 whitespace-nowrap"
                          >
                            {cat}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="space-y-4 pt-2">
                  {filteredRequirements.length === 0 ? (
                    <div className="p-6 text-center text-xs text-text-muted">
                      No test parameters found for the selected category.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredRequirements.map((req) => {
                        const appBadgeVariant: BadgeVariant =
                          req.applicability === 'FACTORY'
                            ? 'blue'
                            : req.applicability === 'EXTERNAL_LAB'
                            ? 'orange'
                            : 'green';

                        return (
                          <div
                            key={req.id}
                            className="p-4 rounded-xl bg-surface-page border border-surface-border hover:border-primary-200 transition-all space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="p-1 rounded-md bg-surface-muted inline-flex">
                                    {getCategoryIcon(req.testCategory)}
                                  </span>
                                  <span className="text-xs font-bold text-text-primary">
                                    {req.testName}
                                  </span>
                                  <Badge variant="grey">
                                    {req.testCategory}
                                  </Badge>
                                  {req.applicability && (
                                    <Badge variant={appBadgeVariant}>
                                      {req.applicability === 'BOTH'
                                        ? 'Factory & Lab'
                                        : req.applicability === 'FACTORY'
                                        ? 'Factory Routine'
                                        : 'External Lab'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-text-secondary">
                                  <span className="font-semibold text-text-primary">Standard Method:</span> {req.testMethod || 'Indian Standard Specification'}
                                  {req.clause && <span className="text-text-muted"> • ({req.clause})</span>}
                                </p>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEvidence({
                                    title: req.testName,
                                    text: req.evidence?.excerpt || 'Source evidence derived from official BIS standard.',
                                    sourceTitle: req.sourceTitle || undefined,
                                    sourceUrl: req.sourceUrl || undefined,
                                    clause: req.clause || undefined,
                                  });
                                  setEvidenceModalOpen(true);
                                }}
                                className="text-xs shrink-0 text-primary-600 hover:text-primary-700"
                              >
                                Evidence
                              </Button>
                            </div>

                            {/* Parameter Value / Acceptance Criteria */}
                            <div className="p-2.5 rounded-lg bg-surface-muted/60 border border-surface-border/80 text-xs">
                              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                                Acceptance Limit / Specification
                              </div>
                              <div className="font-medium text-text-primary mt-0.5">
                                {req.requirementValue ? (
                                  req.requirementValue
                                ) : (
                                  <span className="italic text-text-muted">
                                    Limit available in official test standard/source.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Factory Test Equipment & Calibration Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sliders size={16} className="text-primary-600" />
                    <span>Factory Testing Equipment & Calibration</span>
                    <span className="text-xs font-normal text-text-muted">
                      ({analysis.equipment.length} items)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardBody className="space-y-4 pt-2">
                  {analysis.equipment.length === 0 ? (
                    <div className="p-6 text-center text-xs text-text-muted">
                      No specific factory testing equipment required for this standard.
                    </div>
                  ) : (
                    <div className="divide-y divide-surface-border">
                      {analysis.equipment.map((equip) => {
                        const calReq = analysis.calibration.find(
                          (c) => c.equipmentName === equip.equipmentName
                        );
                        return (
                          <div key={equip.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-text-primary">
                                    {equip.equipmentName}
                                  </span>
                                  <Badge variant="blue">
                                    Required in In-House Lab
                                  </Badge>
                                </div>
                                <p className="text-xs text-text-secondary">{equip.purpose}</p>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  Cal Interval: {equip.calibrationInterval || '12 Months'}
                                </div>
                              </div>
                            </div>

                            {calReq && (
                              <div className="text-[11px] text-text-muted bg-surface-muted/40 p-2 rounded-md">
                                <span className="font-semibold text-text-secondary">Traceability:</span>{' '}
                                {calReq.traceabilityStandard}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Right Column: External Lab Requirements, Potential Matches, & Sources */}
            <div className="space-y-6">
              {/* External Laboratory Pathway Notice */}
              {analysis.laboratoryRequirements.map((labReq) => (
                <Card key={labReq.id} className="border-primary-200 bg-primary-50/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-primary-900">
                      <Building2 size={15} className="text-primary-600" />
                      <span>External Lab Protocol</span>
                    </CardTitle>
                  </CardHeader>
                  <CardBody className="space-y-2.5 text-xs text-text-secondary pt-0">
                    <p className="font-medium text-text-primary">{labReq.reason}</p>
                    {labReq.sampleSize && (
                      <div className="p-2 bg-white rounded-lg border border-surface-border">
                        <span className="font-semibold text-text-primary">Sample Size:</span>{' '}
                        {labReq.sampleSize}
                      </div>
                    )}
                    {labReq.testingDuration && (
                      <div className="p-2 bg-white rounded-lg border border-surface-border">
                        <span className="font-semibold text-text-primary">Turnaround:</span>{' '}
                        {labReq.testingDuration}
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}

              {/* Potential Laboratory Matches */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 size={16} className="text-primary-600" />
                      <span>Potential Laboratory Matches</span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => navigate(`/products/${product?.id}/laboratories`)}
                      className="text-xs text-primary-600"
                    >
                      Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4 pt-2">
                  {analysis.laboratories.length === 0 ? (
                    <div className="p-6 text-center text-xs text-text-muted">
                      No verified matching laboratories currently recorded for this standard.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analysis.laboratories.slice(0, 4).map((labMatch) => {
                        const isShortlisted =
                          labMatch.laboratory.userReview?.decision === 'SHORTLISTED';
                        const isSelected =
                          labMatch.laboratory.userReview?.decision === 'SELECTED';

                        return (
                          <div
                            key={labMatch.laboratory.id}
                            className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                              isSelected
                                ? 'bg-emerald-50/50 border-emerald-300'
                                : isShortlisted
                                ? 'bg-amber-50/30 border-amber-200'
                                : 'bg-surface-page border-surface-border hover:border-primary-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-xs font-bold text-text-primary">
                                  {labMatch.laboratory.name}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-0.5">
                                  <MapPin size={11} />
                                  <span>
                                    {labMatch.laboratory.city}, {labMatch.laboratory.state}
                                  </span>
                                </div>
                              </div>
                              {getCapabilityBadge(labMatch.capabilityMatch)}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                              {labMatch.recognitionStatus === 'BIS_RECOGNIZED' && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                  BIS Recognized
                                </span>
                              )}
                              {labMatch.accreditationStatus === 'ACCREDITED' && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                  NABL Accredited
                                </span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-surface-border/80">
                              <span className="text-[11px] text-text-muted">
                                {labMatch.matchedTests.length} tests matched
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="secondary"
                                  size="xs"
                                  onClick={() => handleOpenReview(labMatch, 'SHORTLISTED')}
                                  className="h-7 px-2"
                                >
                                  <Star size={11} className={isShortlisted ? 'fill-current' : ''} />
                                  <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
                                </Button>
                                <Button
                                  variant={isSelected ? 'primary' : 'secondary'}
                                  size="xs"
                                  onClick={() => handleOpenReview(labMatch, 'SELECTED')}
                                  className="h-7 px-2"
                                >
                                  <Check size={11} />
                                  <span>{isSelected ? 'Selected' : 'Select'}</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Official Sources Provenance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info size={15} className="text-primary-600" />
                    <span>Official Source References</span>
                  </CardTitle>
                </CardHeader>
                <CardBody className="space-y-2 pt-0 text-xs">
                  {analysis.sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-lg bg-surface-page border border-surface-border hover:border-primary-300 flex items-center justify-between gap-2 text-text-secondary hover:text-text-primary transition-all group"
                    >
                      <div className="truncate flex-1">
                        <div className="font-medium truncate">{src.title}</div>
                        <div className="text-[10px] text-text-muted truncate">{src.url}</div>
                      </div>
                      <ExternalLink size={12} className="text-text-muted group-hover:text-primary-600 shrink-0" />
                    </a>
                  ))}
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Decision Modal ── */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Review Laboratory: ${selectedLabForReview?.laboratory.name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Set your testing partner review decision for this product workflow. (This is for your internal compliance planning; it does not constitute official BIS allocation).
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-primary">Decision</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={reviewDecision === 'SHORTLISTED' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setReviewDecision('SHORTLISTED')}
                className="justify-start gap-2"
              >
                <Star size={13} />
                <span>Shortlist</span>
              </Button>
              <Button
                variant={reviewDecision === 'SELECTED' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setReviewDecision('SELECTED')}
                className="justify-start gap-2"
              >
                <Check size={13} />
                <span>Select as Primary</span>
              </Button>
              <Button
                variant={reviewDecision === 'NEEDS_REVIEW' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setReviewDecision('NEEDS_REVIEW')}
                className="justify-start gap-2"
              >
                <HelpCircle size={13} />
                <span>Needs Review</span>
              </Button>
              <Button
                variant={reviewDecision === 'REJECTED' ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => setReviewDecision('REJECTED')}
                className="justify-start gap-2"
              >
                <AlertTriangle size={13} />
                <span>Reject / Ineligible</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-primary">Notes / Comments (Optional)</label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="e.g. Quotation received ₹45,000, 15 days turnaround time, sample dispatch scheduled..."
              className="w-full text-xs p-3 rounded-lg border border-surface-border bg-surface-page focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-border">
            <Button variant="secondary" size="sm" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveReview}
              disabled={isSavingReview}
            >
              {isSavingReview ? 'Saving...' : 'Save Decision'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Evidence Drawer Modal ── */}
      <Modal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        title={selectedEvidence?.title || 'Source Evidence'}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-surface-muted/60 rounded-xl border border-surface-border space-y-2">
            <div className="font-semibold text-text-primary">Authoritative Specification Text:</div>
            <blockquote className="italic text-text-secondary border-l-2 border-primary-500 pl-3">
              "{selectedEvidence?.text}"
            </blockquote>
          </div>

          {selectedEvidence?.sourceUrl && (
            <div className="p-3 rounded-xl bg-surface-page border border-surface-border space-y-1">
              <div className="text-[11px] font-semibold text-text-muted">Source Document:</div>
              <a
                href={selectedEvidence.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary-600 hover:underline flex items-center gap-1 font-medium"
              >
                <span>{selectedEvidence.sourceTitle || selectedEvidence.sourceUrl}</span>
                <ExternalLink size={11} />
              </a>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button size="sm" variant="secondary" onClick={() => setEvidenceModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
