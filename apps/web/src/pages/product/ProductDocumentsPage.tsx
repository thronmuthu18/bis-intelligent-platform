import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Search,
  Eye,
  Trash2,
  ShieldCheck,
  RefreshCw,
  FileCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProduct } from '@/contexts/ProductContext';
import { documentService } from '@/services/api';
import type {
  ProductDocumentItem,
  ProductDocumentCompletenessResponse,
  DocumentType,
  DocumentVerificationStatus,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  ProductDocumentsPage — Phase 9 Document Intelligence Workspace
// ─────────────────────────────────────────────────────────────────────────────

export function ProductDocumentsPage(): React.ReactElement {
  const { product } = useProduct();
  const [documents, setDocuments] = useState<ProductDocumentItem[]>([]);
  const [completeness, setCompleteness] = useState<ProductDocumentCompletenessResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<ProductDocumentItem | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'METADATA' | 'EVIDENCE' | 'REQUIREMENTS' | 'TESTS' | 'RAW_TEXT'>('METADATA');

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState<DocumentType>('UNKNOWN');
  const [uploadNotes, setUploadNotes] = useState<string>('');

  // Verification Form State
  const [verifyStatus, setVerifyStatus] = useState<DocumentVerificationStatus>('VERIFIED');
  const [verifyDocType, setVerifyDocType] = useState<DocumentType>('TEST_REPORT');
  const [verifyNotes, setVerifyNotes] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!product?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [docsData, completenessData] = await Promise.all([
        documentService.getDocuments(product.id),
        documentService.getCompleteness(product.id),
      ]);
      setDocuments(docsData);
      setCompleteness(completenessData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load product documents');
    } finally {
      setLoading(false);
    }
  }, [product?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Document Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?.id || !uploadFile) return;

    setUploading(true);
    setError(null);
    try {
      await documentService.uploadDocument(product.id, {
        file: uploadFile,
        documentType: uploadDocType !== 'UNKNOWN' ? uploadDocType : undefined,
        notes: uploadNotes || undefined,
      });
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadDocType('UNKNOWN');
      setUploadNotes('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Document upload and processing failed.');
    } finally {
      setUploading(false);
    }
  };

  // Handle Document Verification
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?.id || !selectedDocument) return;

    setVerifying(true);
    try {
      const updated = await documentService.verifyDocument(product.id, selectedDocument.id, {
        verificationStatus: verifyStatus,
        documentType: verifyDocType,
        verificationNotes: verifyNotes || undefined,
      });
      setSelectedDocument(updated);
      setShowVerificationModal(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Verification update failed.');
    } finally {
      setVerifying(false);
    }
  };

  // Handle Document Delete
  const handleDeleteDocument = async (docId: string) => {
    if (!product?.id) return;
    if (!window.confirm('Are you sure you want to delete this document from the compliance dossier?')) return;

    try {
      await documentService.deleteDocument(product.id, docId);
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null);
      }
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete document.');
    }
  };

  // Format Helper Badges
  const getVerificationBadge = (status: DocumentVerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge variant="green">Verified</Badge>;
      case 'NEEDS_REVIEW':
        return <Badge variant="yellow">Needs Review</Badge>;
      case 'REJECTED':
        return <Badge variant="red">Rejected</Badge>;
      default:
        return <Badge variant="grey">Unverified</Badge>;
    }
  };

  const getProcessingBadge = (status: string) => {
    switch (status) {
      case 'ANALYZED':
      case 'PROCESSED':
        return <Badge variant="blue">Analyzed</Badge>;
      case 'EXTRACTING':
      case 'CLASSIFYING':
        return <Badge variant="yellow">Processing</Badge>;
      case 'FAILED':
        return <Badge variant="red">Failed</Badge>;
      default:
        return <Badge variant="grey">{status}</Badge>;
    }
  };

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.extractedText && doc.extractedText.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'ALL' || doc.documentType === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-text-primary">Document Intelligence</h2>
            <Badge variant="blue">Phase 9</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Secure multi-format ingestion, OCR extraction, classification, and requirement mapping for{' '}
            <span className="font-semibold text-text-primary">{product?.name || 'this product'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5"
          >
            <Upload size={14} />
            Upload Document
          </Button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-3.5 bg-status-danger/10 border border-status-danger/20 rounded-xl flex items-start gap-2.5 text-xs text-status-danger">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Document Processing Alert</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-status-danger hover:opacity-75">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Document Readiness & Completeness Banner ── */}
      {completeness && (
        <Card className="bg-gradient-to-r from-surface-card to-surface-page border border-surface-border overflow-hidden">
          <CardBody className="p-5">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex flex-col items-center justify-center text-accent-600 font-bold shrink-0">
                  <span className="text-2xl leading-none">{completeness.score}</span>
                  <span className="text-[10px] text-text-muted mt-0.5">/ 100</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-text-primary">Platform Document Readiness</h3>
                    <Badge
                      variant={
                        completeness.status === 'COMPLETE'
                          ? 'green'
                          : completeness.status === 'PARTIALLY_COMPLETE'
                          ? 'blue'
                          : completeness.status === 'NEEDS_REVIEW'
                          ? 'yellow'
                          : 'red'
                      }
                    >
                      {completeness.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 max-w-2xl">
                    {completeness.status === 'COMPLETE'
                      ? 'All mandatory statutory documents uploaded and verified. Dossier is prepared for application filing.'
                      : completeness.status === 'MISSING_DOCUMENTS'
                      ? 'Essential laboratory test reports or factory calibration records are missing from the compliance dossier.'
                      : 'Documents ingested. Human verification of extracted parameters and evidence citations is required.'}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1.5 flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-accent-500" />
                    <span>
                      Notice: Platform analysis only. Does NOT constitute official statutory approval by the Bureau of Indian Standards.
                    </span>
                  </p>
                </div>
              </div>

              {/* Stat Chips */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full lg:w-auto text-center shrink-0">
                <div className="p-2.5 rounded-lg bg-surface-muted/50 border border-surface-border">
                  <p className="text-[11px] text-text-muted font-medium">Required</p>
                  <p className="text-base font-bold text-text-primary mt-0.5">{completeness.totalRequired}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-status-success/10 border border-status-success/20">
                  <p className="text-[11px] text-status-success font-medium">Verified</p>
                  <p className="text-base font-bold text-status-success mt-0.5">{completeness.verifiedCount}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-accent-500/10 border border-accent-500/20">
                  <p className="text-[11px] text-accent-600 font-medium">Matched</p>
                  <p className="text-base font-bold text-accent-600 mt-0.5">{completeness.matchedCount}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-status-warning/10 border border-status-warning/20">
                  <p className="text-[11px] text-status-warning font-medium">Review</p>
                  <p className="text-base font-bold text-status-warning mt-0.5">{completeness.needsReviewCount}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-status-danger/10 border border-status-danger/20">
                  <p className="text-[11px] text-status-danger font-medium">Missing</p>
                  <p className="text-base font-bold text-status-danger mt-0.5">{completeness.missingCount}</p>
                </div>
              </div>
            </div>

            {/* Blockers & Next Steps */}
            {((completeness.blockers && completeness.blockers.length > 0) ||
              (completeness.nextSteps && completeness.nextSteps.length > 0)) && (
              <div className="mt-4 pt-4 border-t border-surface-border grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {completeness.blockers.length > 0 && (
                  <div>
                    <p className="font-semibold text-status-danger flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle size={13} />
                      Compliance Blockers
                    </p>
                    <ul className="space-y-1">
                      {completeness.blockers.map((b, idx) => (
                        <li key={idx} className="text-text-secondary flex items-start gap-1.5">
                          <span className="text-status-danger">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {completeness.nextSteps.length > 0 && (
                  <div>
                    <p className="font-semibold text-accent-600 flex items-center gap-1.5 mb-1.5">
                      <Sparkles size={13} />
                      Actionable Next Steps
                    </p>
                    <ul className="space-y-1">
                      {completeness.nextSteps.map((s, idx) => (
                        <li key={idx} className="text-text-secondary flex items-start gap-1.5">
                          <span className="text-accent-500">→</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ── Category Filters & Search ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'ALL', label: 'All Documents' },
            { id: 'TEST_REPORT', label: 'Test Reports' },
            { id: 'CALIBRATION_CERTIFICATE', label: 'Calibration' },
            { id: 'QUALITY_CONTROL_DOCUMENT', label: 'Quality / STI' },
            { id: 'FACTORY_LAYOUT', label: 'Factory Layout' },
            { id: 'IDENTITY_DOCUMENT', label: 'Identity' },
            { id: 'DECLARATION_OF_CONFORMITY', label: 'Declarations' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategoryFilter === cat.id
                  ? 'bg-accent-500 text-white shadow-sm'
                  : 'bg-surface-card hover:bg-surface-hover text-text-secondary border border-surface-border'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64 shrink-0">
          <Input
            placeholder="Search documents or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
          />
        </div>
      </div>

      {/* ── Document List & Repository ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ingested Documents Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Compliance Dossier ({filteredDocs.length})</CardTitle>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Source-grounded documents parsed with OCR and mapped to statutory requirements
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {loading ? (
                <div className="p-8 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-accent-500" />
                  <span>Loading compliance documents...</span>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={FileText}
                    title="No compliance documents found"
                    description="Upload technical datasheets, component test reports, and quality manuals to build your product compliance dossier."
                    action={{
                      label: 'Upload Document',
                      onClick: () => setShowUploadModal(true),
                    }}
                  />
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 hover:bg-surface-hover/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-600 shrink-0 mt-0.5">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-text-primary truncate">
                              {doc.originalFileName}
                            </p>
                            <Badge variant="blue">{doc.documentType.replace(/_/g, ' ')}</Badge>
                            {doc.version > 1 && (
                              <Badge variant="grey">v{doc.version}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-text-muted mt-1 flex-wrap">
                            <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{doc.pageCount} page(s)</span>
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                            {doc.structuredExtraction?.laboratoryName && (
                              <>
                                <span>•</span>
                                <span className="text-text-secondary font-medium">
                                  {doc.structuredExtraction.laboratoryName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {getVerificationBadge(doc.verificationStatus)}
                        {getProcessingBadge(doc.processingStatus)}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setActiveTab('METADATA');
                          }}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Eye size={13} />
                          Inspect
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-status-danger hover:bg-status-danger/10 p-1.5"
                          title="Delete Document"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Missing Documents Checklist */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCheck size={16} className="text-accent-500" />
                <CardTitle>Mandatory Checklist ({completeness?.checklistBreakdown.length || 0})</CardTitle>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Statutory documents required for Scheme certification
              </p>
            </CardHeader>
            <CardBody className="p-3 space-y-2">
              {completeness?.checklistBreakdown.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-lg border text-xs transition-colors ${
                    item.matchStatus === 'VERIFIED'
                      ? 'bg-status-success/5 border-status-success/30'
                      : item.matchStatus === 'MATCHED'
                      ? 'bg-accent-500/5 border-accent-500/30'
                      : item.matchStatus === 'EXPIRED'
                      ? 'bg-status-danger/5 border-status-danger/30'
                      : 'bg-surface-page border-surface-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary truncate">{item.title}</p>
                      <p className="text-[11px] text-text-muted mt-0.5">{item.category}</p>
                    </div>
                    <Badge
                      variant={
                        item.matchStatus === 'VERIFIED'
                          ? 'green'
                          : item.matchStatus === 'MATCHED'
                          ? 'blue'
                          : item.matchStatus === 'EXPIRED'
                          ? 'red'
                          : 'grey'
                      }
                    >
                      {item.matchStatus}
                    </Badge>
                  </div>
                  {item.matchedDocumentName ? (
                    <p className="text-[11px] text-accent-600 font-medium mt-1 truncate">
                      Mapped to: {item.matchedDocumentName}
                    </p>
                  ) : (
                    <button
                      onClick={() => {
                        setShowUploadModal(true);
                      }}
                      className="text-[11px] text-accent-500 hover:underline mt-1 font-medium flex items-center gap-1"
                    >
                      <Upload size={11} /> Upload document
                    </button>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ── Document Detail / Evidence Drawer ── */}
      {selectedDocument && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-3xl bg-surface-card h-full shadow-2xl flex flex-col border-l border-surface-border animate-slide-in-right overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-page shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-600 shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {selectedDocument.originalFileName}
                  </p>
                  <p className="text-xs text-text-muted">
                    {selectedDocument.documentType.replace(/_/g, ' ')} • {selectedDocument.pageCount} page(s)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setVerifyDocType(selectedDocument.documentType);
                    setVerifyStatus(selectedDocument.verificationStatus || 'VERIFIED');
                    setVerifyNotes(selectedDocument.verificationNotes || '');
                    setShowVerificationModal(true);
                  }}
                  className="flex items-center gap-1 text-xs"
                >
                  <CheckCircle2 size={13} />
                  Verify / Review
                </Button>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-surface-border bg-surface-muted/30 px-4 shrink-0 overflow-x-auto">
              {[
                { id: 'METADATA', label: 'Structured Data' },
                { id: 'EVIDENCE', label: `Page Evidence (${selectedDocument.pageEvidence?.length || 0})` },
                { id: 'REQUIREMENTS', label: `Checklist (${selectedDocument.checklistMatches?.length || 0})` },
                { id: 'TESTS', label: `Test Matches (${selectedDocument.testMatches?.length || 0})` },
                { id: 'RAW_TEXT', label: 'Extracted Text' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-accent-500 text-accent-600 font-semibold'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Tab 1: Structured Data */}
              {activeTab === 'METADATA' && (
                <div className="space-y-4">
                  {/* Automated Classification Card */}
                  <Card className="bg-surface-page">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-accent-500" />
                          <CardTitle>Automated Classification</CardTitle>
                        </div>
                        <Badge variant="blue">
                          Confidence: {Math.round((selectedDocument.classificationConfidence || 0.9) * 100)}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardBody className="text-xs space-y-2">
                      <p className="font-semibold text-text-primary">
                        Classified Document Type: <span className="text-accent-600">{selectedDocument.documentType}</span>
                      </p>
                      {selectedDocument.classificationReasons && selectedDocument.classificationReasons.length > 0 && (
                        <div className="mt-2">
                          <p className="text-text-muted font-medium mb-1">Detected Classification Signals:</p>
                          <ul className="space-y-1">
                            {selectedDocument.classificationReasons.map((r, idx) => (
                              <li key={idx} className="text-text-secondary flex items-start gap-1.5">
                                <span className="text-accent-500">✓</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardBody>
                  </Card>

                  {/* Extracted Structured Technical Fields */}
                  {selectedDocument.structuredExtraction && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Extracted Compliance Metadata</CardTitle>
                      </CardHeader>
                      <CardBody className="p-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-surface-border text-xs">
                          <div className="p-3 space-y-2.5">
                            {selectedDocument.structuredExtraction.laboratoryName && (
                              <div>
                                <p className="text-[11px] text-text-muted font-medium">Testing / Cal Laboratory</p>
                                <p className="font-semibold text-text-primary mt-0.5">
                                  {selectedDocument.structuredExtraction.laboratoryName}
                                </p>
                              </div>
                            )}
                            {selectedDocument.structuredExtraction.reportNumber && (
                              <div>
                                <p className="text-[11px] text-text-muted font-medium">Report Number</p>
                                <p className="font-mono text-text-primary mt-0.5">
                                  {selectedDocument.structuredExtraction.reportNumber}
                                </p>
                              </div>
                            )}
                            {selectedDocument.structuredExtraction.certificateNumber && (
                              <div>
                                <p className="text-[11px] text-text-muted font-medium">Certificate Number</p>
                                <p className="font-mono text-text-primary mt-0.5">
                                  {selectedDocument.structuredExtraction.certificateNumber}
                                </p>
                              </div>
                            )}
                            {selectedDocument.structuredExtraction.standardNumber && (
                              <div>
                                <p className="text-[11px] text-text-muted font-medium">Indian Standard Number</p>
                                <p className="font-semibold text-accent-600 mt-0.5">
                                  {selectedDocument.structuredExtraction.standardNumber}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="p-3 space-y-2.5">
                            {selectedDocument.structuredExtraction.calibrationDate && (
                              <div>
                                <p className="text-[11px] text-text-muted font-medium">Calibration Date</p>
                                <p className="text-text-primary mt-0.5">
                                  {new Date(selectedDocument.structuredExtraction.calibrationDate).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            {selectedDocument.structuredExtraction.calibrationDueDate && (
                              <div>
                                <p className="text-[11px] text-text-muted font-medium">Calibration Due Date</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-text-primary">
                                    {new Date(selectedDocument.structuredExtraction.calibrationDueDate).toLocaleDateString()}
                                  </p>
                                  {selectedDocument.structuredExtraction.validityStatus === 'EXPIRED' ? (
                                    <Badge variant="red">Expired</Badge>
                                  ) : (
                                    <Badge variant="green">Valid</Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            {selectedDocument.structuredExtraction.passFailStatus && (
                              <div>
                                <p className="text-[11px] text-text-muted font-medium">Test Outcome Status</p>
                                <div className="mt-0.5">
                                  <Badge
                                    variant={
                                      selectedDocument.structuredExtraction.passFailStatus === 'PASS'
                                        ? 'green'
                                        : 'red'
                                    }
                                  >
                                    {selectedDocument.structuredExtraction.passFailStatus}
                                  </Badge>
                                </div>
                              </div>
                            )}
                            {selectedDocument.structuredExtraction.traceability && (
                              <div>
                                <p className="text-[11px] text-text-muted font-medium">Traceability Standard</p>
                                <p className="text-text-secondary mt-0.5">
                                  {selectedDocument.structuredExtraction.traceability}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {/* Verification Status Card */}
                  <Card className="bg-surface-page">
                    <CardHeader>
                      <CardTitle>Human Verification Status</CardTitle>
                    </CardHeader>
                    <CardBody className="text-xs space-y-2">
                      <div className="flex items-center gap-2">
                        {getVerificationBadge(selectedDocument.verificationStatus)}
                        {selectedDocument.verifiedAt && (
                          <span className="text-text-muted">
                            Verified on {new Date(selectedDocument.verifiedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {selectedDocument.verificationNotes && (
                        <p className="text-text-secondary mt-2 p-2.5 rounded-lg bg-surface-muted border border-surface-border">
                          <span className="font-semibold text-text-primary">Reviewer Note: </span>
                          {selectedDocument.verificationNotes}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                </div>
              )}

              {/* Tab 2: Page-Level Evidence */}
              {activeTab === 'EVIDENCE' && (
                <div className="space-y-3">
                  <p className="text-xs text-text-secondary">
                    Every compliance-relevant claim extracted from the document preserves its source page and text snippet:
                  </p>
                  {selectedDocument.pageEvidence && selectedDocument.pageEvidence.length > 0 ? (
                    selectedDocument.pageEvidence.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-surface-border bg-surface-page text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="blue">Page {ev.pageNumber}</Badge>
                            <span className="font-semibold text-text-primary">{ev.claim}</span>
                          </div>
                          {ev.confidence && (
                            <span className="text-[11px] text-text-muted">
                              {Math.round(ev.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-muted font-mono text-[11px] text-text-secondary leading-relaxed border border-surface-border">
                          "{ev.sourceText}"
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      icon={FileText}
                      title="No page evidence extracted"
                      description="Page evidence citations will be extracted during document analysis."
                    />
                  )}
                </div>
              )}

              {/* Tab 3: Checklist Matches */}
              {activeTab === 'REQUIREMENTS' && (
                <div className="space-y-3">
                  <p className="text-xs text-text-secondary">
                    Phase 7 Statutory Documentation Checklist items satisfied by this document:
                  </p>
                  {selectedDocument.checklistMatches && selectedDocument.checklistMatches.length > 0 ? (
                    selectedDocument.checklistMatches.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-surface-border bg-surface-page text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-text-primary">{m.requirementTitle}</p>
                            <p className="text-[11px] text-text-muted mt-0.5">{m.checklistCategory}</p>
                          </div>
                          <Badge
                            variant={
                              m.matchStatus === 'VERIFIED'
                                ? 'green'
                                : m.matchStatus === 'MATCHED'
                                ? 'blue'
                                : 'yellow'
                            }
                          >
                            {m.matchStatus}
                          </Badge>
                        </div>
                        {m.matchReason && (
                          <p className="text-text-secondary text-[11px]">{m.matchReason}</p>
                        )}
                        {m.evidenceSnippet && (
                          <div className="p-2 rounded bg-surface-muted text-[11px] text-text-secondary font-mono">
                            Page {m.evidencePage || 1}: "{m.evidenceSnippet}"
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      icon={FileText}
                      title="No checklist matches mapped"
                      description="This document has not been automatically mapped to a specific statutory checklist requirement."
                    />
                  )}
                </div>
              )}

              {/* Tab 4: Test Requirement Matches */}
              {activeTab === 'TESTS' && (
                <div className="space-y-3">
                  <p className="text-xs text-text-secondary">
                    Phase 8 Testing Requirements confirmed by this test report:
                  </p>
                  {selectedDocument.testMatches && selectedDocument.testMatches.length > 0 ? (
                    selectedDocument.testMatches.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-surface-border bg-surface-page text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-text-primary">{t.testName}</p>
                            <p className="text-[11px] text-text-muted mt-0.5">
                              {t.standardNumber || 'IS Standard'} • Method: {t.testMethod || 'Standard Clause'}
                            </p>
                          </div>
                          <Badge
                            variant={
                              t.passFailStatus === 'PASS'
                                ? 'green'
                                : t.passFailStatus === 'FAIL'
                                ? 'red'
                                : 'yellow'
                            }
                          >
                            {t.passFailStatus || t.matchStatus}
                          </Badge>
                        </div>
                        {t.extractedResult && (
                          <p className="text-text-secondary text-[11px]">
                            <span className="font-semibold text-text-primary">Extracted Result: </span>
                            {t.extractedResult}
                          </p>
                        )}
                        {t.evidenceSnippet && (
                          <div className="p-2 rounded bg-surface-muted text-[11px] text-text-secondary font-mono">
                            Page {t.evidencePage || 1}: "{t.evidenceSnippet}"
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      icon={FileText}
                      title="No test matches found"
                      description="Only laboratory test reports with matching testing parameters will display test requirement mappings."
                    />
                  )}
                </div>
              )}

              {/* Tab 5: Raw Text */}
              {activeTab === 'RAW_TEXT' && (
                <div className="space-y-2">
                  <p className="text-xs text-text-muted">
                    Full normalized text extracted from document via PDF parser / OCR:
                  </p>
                  <pre className="p-4 rounded-xl bg-surface-page border border-surface-border text-[11px] font-mono text-text-secondary whitespace-pre-wrap leading-relaxed max-h-[450px] overflow-y-auto">
                    {selectedDocument.extractedText || 'No text extracted.'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Modal ── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface-card rounded-2xl shadow-2xl border border-surface-border p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-accent-500" />
                <h3 className="text-base font-bold text-text-primary">Upload Compliance Document</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              {/* File Input */}
              <div className="space-y-1.5">
                <label className="font-semibold text-text-primary">Select File *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.docx,.txt"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full p-2.5 rounded-lg border border-surface-border bg-surface-page text-text-primary file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-accent-500 file:text-white hover:file:bg-accent-600"
                />
                <p className="text-[11px] text-text-muted">
                  Supports PDF, PNG, JPG, TIFF, DOCX, TXT up to 25MB.
                </p>
              </div>

              {/* Optional Category Override */}
              <div className="space-y-1.5">
                <label className="font-semibold text-text-primary">Document Type (Optional Override)</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value as DocumentType)}
                  className="w-full p-2.5 rounded-lg border border-surface-border bg-surface-page text-text-primary text-xs"
                >
                  <option value="UNKNOWN">Auto-Detect via Document AI</option>
                  <option value="TEST_REPORT">Test Report (from Lab)</option>
                  <option value="CALIBRATION_CERTIFICATE">Calibration Certificate</option>
                  <option value="PRODUCT_MANUAL">Product Manual / STI</option>
                  <option value="TECHNICAL_SPECIFICATION">Technical Specification / Datasheet</option>
                  <option value="FACTORY_LAYOUT">Factory Layout Plan</option>
                  <option value="QUALITY_CONTROL_DOCUMENT">Quality Control Plan / QA</option>
                  <option value="RAW_MATERIAL_DOCUMENT">Raw Material Test Certificate</option>
                  <option value="DECLARATION_OF_CONFORMITY">Declaration of Conformity</option>
                  <option value="IDENTITY_DOCUMENT">Identity / Incorporation Proof</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-semibold text-text-primary">Notes / Comments</label>
                <textarea
                  rows={2}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="e.g. In-house test report for 120W LED model batch #4"
                  className="w-full p-2.5 rounded-lg border border-surface-border bg-surface-page text-text-primary text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!uploadFile || uploading}
                  className="flex items-center gap-1.5"
                >
                  {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? 'Processing Document...' : 'Upload & Analyze'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Verification Modal ── */}
      {showVerificationModal && selectedDocument && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-card rounded-2xl shadow-2xl border border-surface-border p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-accent-500" />
                <h3 className="text-base font-bold text-text-primary">Verify Document</h3>
              </div>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-text-primary">Verification Decision *</label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value as DocumentVerificationStatus)}
                  className="w-full p-2.5 rounded-lg border border-surface-border bg-surface-page text-text-primary text-xs"
                >
                  <option value="VERIFIED">VERIFIED — Official statutory compliance confirmed</option>
                  <option value="NEEDS_REVIEW">NEEDS_REVIEW — Further inspection required</option>
                  <option value="REJECTED">REJECTED — Non-conforming or invalid document</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-text-primary">Document Type Confirmation</label>
                <select
                  value={verifyDocType}
                  onChange={(e) => setVerifyDocType(e.target.value as DocumentType)}
                  className="w-full p-2.5 rounded-lg border border-surface-border bg-surface-page text-text-primary text-xs"
                >
                  <option value="TEST_REPORT">Test Report</option>
                  <option value="CALIBRATION_CERTIFICATE">Calibration Certificate</option>
                  <option value="PRODUCT_MANUAL">Product Manual / STI</option>
                  <option value="TECHNICAL_SPECIFICATION">Technical Specification</option>
                  <option value="FACTORY_LAYOUT">Factory Layout</option>
                  <option value="QUALITY_CONTROL_DOCUMENT">Quality Control Document</option>
                  <option value="RAW_MATERIAL_DOCUMENT">Raw Material Certificate</option>
                  <option value="DECLARATION_OF_CONFORMITY">Declaration of Conformity</option>
                  <option value="IDENTITY_DOCUMENT">Identity Document</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-text-primary">Verification Notes</label>
                <textarea
                  rows={3}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Record justification or compliance observations..."
                  className="w-full p-2.5 rounded-lg border border-surface-border bg-surface-page text-text-primary text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowVerificationModal(false)}
                  disabled={verifying}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={verifying}
                  className="flex items-center gap-1.5"
                >
                  {verifying ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {verifying ? 'Saving...' : 'Save Decision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
