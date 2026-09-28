import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ExternalLink,
  MapPin,
  Check,
  Star,
  Search,
  RefreshCw,
  Phone,
  Globe,
  AlertTriangle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useProduct } from '@/contexts/ProductContext';
import { testingService } from '@/services/api';
import type {
  LaboratoryMatchResult,
  LabDecision,
} from '@bis/shared';

export function ProductLaboratoriesPage(): React.ReactElement {
  const { product } = useProduct();
  const navigate = useNavigate();

  const [laboratories, setLaboratories] = useState<LaboratoryMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedRecognition, setSelectedRecognition] = useState<string>('ALL');
  const [selectedAccreditation, setSelectedAccreditation] = useState<string>('ALL');

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [selectedLabForReview, setSelectedLabForReview] = useState<LaboratoryMatchResult | null>(null);
  const [reviewDecision, setReviewDecision] = useState<LabDecision>('SHORTLISTED');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [isSavingReview, setIsSavingReview] = useState<boolean>(false);

  const loadLaboratories = useCallback(async () => {
    if (!product) return;
    try {
      setIsLoading(true);
      setError(null);

      const filterParams: any = {};
      if (selectedState !== 'ALL') filterParams.state = selectedState;
      if (selectedRecognition !== 'ALL') filterParams.recognitionStatus = selectedRecognition;
      if (selectedAccreditation !== 'ALL') filterParams.accreditationStatus = selectedAccreditation;

      const data = await testingService.getLaboratories(product.id, filterParams);
      setLaboratories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load laboratory directory');
    } finally {
      setIsLoading(false);
    }
  }, [product, selectedState, selectedRecognition, selectedAccreditation]);

  useEffect(() => {
    loadLaboratories();
  }, [loadLaboratories]);

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
      await loadLaboratories();
    } catch (err: any) {
      alert(`Error saving review: ${err.message}`);
    } finally {
      setIsSavingReview(false);
    }
  };

  // Distinct states from loaded list
  const availableStates = Array.from(
    new Set(laboratories.map((l) => l.laboratory.state).filter(Boolean))
  ) as string[];

  // Filtered by Search Query
  const filteredLabs = laboratories.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.laboratory.name.toLowerCase().includes(q) ||
      l.laboratory.city?.toLowerCase().includes(q) ||
      l.laboratory.state?.toLowerCase().includes(q) ||
      l.matchedStandards.some((s) => s.toLowerCase().includes(q)) ||
      l.matchedTests.some((t) => t.toLowerCase().includes(q))
    );
  });

  const getCapabilityBadge = (match: string) => {
    switch (match) {
      case 'HIGH':
        return <Badge variant="green">High Capability Match</Badge>;
      case 'PARTIAL':
        return <Badge variant="yellow">Partial Scope Match</Badge>;
      default:
        return <Badge variant="grey">Unverified</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">Testing Laboratories</h1>
            <Badge variant="blue">BIS & NABL Directory</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            BIS Central, Regional, and recognized external testing laboratories mapped to your product standard parameters for {product?.name || 'this product'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadLaboratories()}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/products/${product?.id}/testing`)}
            className="flex items-center gap-1.5"
          >
            <span>Testing Requirements</span>
            <ChevronRight size={13} />
          </Button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-text-muted" />
            <input
              type="text"
              placeholder="Search by lab, city, or test name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-surface-border bg-surface-page focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* State Filter */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-surface-border bg-surface-page text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            >
              <option value="ALL">All States / UTs</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* BIS Recognition Filter */}
          <div>
            <select
              value={selectedRecognition}
              onChange={(e) => setSelectedRecognition(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-surface-border bg-surface-page text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            >
              <option value="ALL">All Recognition Types</option>
              <option value="BIS_RECOGNIZED">BIS Recognized Only</option>
            </select>
          </div>

          {/* NABL Accreditation Filter */}
          <div>
            <select
              value={selectedAccreditation}
              onChange={(e) => setSelectedAccreditation(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-surface-border bg-surface-page text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            >
              <option value="ALL">All Accreditation Status</option>
              <option value="ACCREDITED">NABL Accredited Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Laboratory Exploration Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => loadLaboratories()}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Laboratories List ── */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-40 bg-surface-muted/60 animate-pulse rounded-2xl border border-surface-border" />
          <div className="h-40 bg-surface-muted/40 animate-pulse rounded-2xl border border-surface-border" />
        </div>
      ) : filteredLabs.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center text-xs space-y-2 text-text-secondary">
            <Building2 size={36} className="mx-auto text-text-muted mb-2" />
            <p className="font-semibold text-text-primary text-sm">
              No matching laboratories found in the current knowledge repository.
            </p>
            <p className="max-w-md mx-auto text-text-muted">
              Try clearing filters or search terms. Further verification through official BIS LIMS and NABL portal directories is recommended.
            </p>
            <div className="pt-3">
              <a
                href="https://www.lims.bis.gov.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-primary-600 hover:underline font-medium"
              >
                <span>Search Official BIS LIMS Portal</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLabs.map((labMatch) => {
            const lab = labMatch.laboratory;
            const isShortlisted = lab.userReview?.decision === 'SHORTLISTED';
            const isSelected = lab.userReview?.decision === 'SELECTED';

            return (
              <div
                key={lab.id}
                className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                  isSelected
                    ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                    : isShortlisted
                    ? 'bg-amber-50/30 border-amber-200'
                    : 'bg-surface-card border-surface-border hover:border-primary-200 shadow-2xs'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-text-primary">{lab.name}</span>
                      {lab.code && (
                        <span className="text-[10px] font-mono bg-surface-muted px-1.5 py-0.5 rounded text-text-muted">
                          {lab.code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <MapPin size={12} />
                      <span>
                        {lab.address ? `${lab.address}, ` : ''}
                        {lab.city}, {lab.state} {lab.pincode ? `- ${lab.pincode}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">{getCapabilityBadge(labMatch.capabilityMatch)}</div>
                </div>

                {/* Badges & Recognition Tags */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {labMatch.recognitionStatus === 'BIS_RECOGNIZED' && (
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-[11px]">
                      BIS Recognized
                    </span>
                  )}
                  {labMatch.accreditationStatus === 'ACCREDITED' && (
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[11px]">
                      NABL Accredited
                    </span>
                  )}
                  {lab.isBisLab && (
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-200 text-[11px]">
                      BIS In-House Central/Regional Lab
                    </span>
                  )}
                </div>

                {/* Matched Standards & Test Scope */}
                <div className="p-3 bg-surface-page rounded-xl border border-surface-border text-xs space-y-1.5">
                  <div className="font-semibold text-text-secondary text-[11px] uppercase tracking-wider">
                    Matched Testing Scope ({labMatch.matchedTests.length} tests)
                  </div>
                  {labMatch.matchedTests.length > 0 ? (
                    <ul className="space-y-1 text-text-secondary list-disc list-inside">
                      {labMatch.matchedTests.slice(0, 3).map((test, i) => (
                        <li key={i} className="truncate">{test}</li>
                      ))}
                      {labMatch.matchedTests.length > 3 && (
                        <li className="text-text-muted italic list-none pt-0.5">
                          + {labMatch.matchedTests.length - 3} more verified parameters
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-text-muted italic">
                      Standard scope covered in laboratory general accreditation schedule.
                    </p>
                  )}
                </div>

                {/* Contact & Directory Links */}
                <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-surface-border">
                  <div className="flex items-center gap-3">
                    {lab.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={11} /> {lab.phone}
                      </span>
                    )}
                    {lab.website && (
                      <a
                        href={lab.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 hover:underline flex items-center gap-1"
                      >
                        <Globe size={11} /> Portal
                      </a>
                    )}
                  </div>

                  {/* Shortlist / Select Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => handleOpenReview(labMatch, 'SHORTLISTED')}
                      className="h-7 px-2.5"
                    >
                      <Star size={11} className={isShortlisted ? 'fill-current' : ''} />
                      <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
                    </Button>
                    <Button
                      variant={isSelected ? 'primary' : 'secondary'}
                      size="xs"
                      onClick={() => handleOpenReview(labMatch, 'SELECTED')}
                      className="h-7 px-2.5"
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
            <label className="text-xs font-semibold text-text-primary">Notes / Quotations</label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="e.g. Turnaround time 15 days, sample requirement 2 units..."
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
    </div>
  );
}
