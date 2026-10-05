import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductDocumentsPage } from '../pages/product/ProductDocumentsPage';
import { documentService } from '../services/api';
import type {
  ProductDocumentItem,
  ProductDocumentCompletenessResponse,
} from '@bis/shared';

// Mock Services
vi.mock('@/services/api/document.service', () => ({
  documentService: {
    uploadDocument: vi.fn(),
    getDocuments: vi.fn(),
    getDocumentById: vi.fn(),
    verifyDocument: vi.fn(),
    deleteDocument: vi.fn(),
    getCompleteness: vi.fn(),
    getRequirementMappings: vi.fn(),
    getDocumentEvidence: vi.fn(),
    getDownloadUrl: vi.fn().mockReturnValue('http://localhost:5000/download'),
  },
}));

// Mock useProduct
vi.mock('@/contexts/ProductContext', () => ({
  useProduct: () => ({
    product: {
      id: 'prod-led-1',
      name: 'Industrial LED Luminaire 120W',
      category: 'LED Lighting',
    },
    loading: false,
    error: null,
    refreshProduct: vi.fn(),
    updateProductState: vi.fn(),
  }),
}));

const mockCompleteness: ProductDocumentCompletenessResponse = {
  score: 75,
  status: 'PARTIALLY_COMPLETE',
  totalRequired: 3,
  verifiedCount: 1,
  matchedCount: 2,
  needsReviewCount: 1,
  missingCount: 1,
  expiredCount: 0,
  missingDocumentTypes: [
    {
      category: 'Manufacturing',
      title: 'Factory Layout Plan',
      reason: 'Statutory factory verification',
      suggestedDocumentType: 'FACTORY_LAYOUT',
    },
  ],
  checklistBreakdown: [
    {
      id: 'check-1',
      category: 'Testing',
      title: 'Independent Test Report',
      requiredStatus: 'REQUIRED',
      matchStatus: 'VERIFIED',
      matchedDocumentId: 'doc-1',
      matchedDocumentName: 'NTH_Test_Report.pdf',
    },
    {
      id: 'check-2',
      category: 'Calibration',
      title: 'Calibration Certificate of High Voltage Tester',
      requiredStatus: 'REQUIRED',
      matchStatus: 'MATCHED',
      matchedDocumentId: 'doc-2',
      matchedDocumentName: 'HV_Tester_Cal_Cert.pdf',
    },
    {
      id: 'check-3',
      category: 'Manufacturing',
      title: 'Factory Layout Plan',
      requiredStatus: 'REQUIRED',
      matchStatus: 'MISSING',
    },
  ],
  blockers: ['Factory layout plan missing from compliance dossier.'],
  nextSteps: ['Upload factory layout plan to complete dossier.'],
  calculatedAt: new Date().toISOString(),
};

const mockDocuments: ProductDocumentItem[] = [
  {
    id: 'doc-1',
    productId: 'prod-led-1',
    uploadedByUserId: 'user-1',
    originalFileName: 'NTH_Test_Report.pdf',
    storedFileName: 'stored_nth_report.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 350,
    documentType: 'TEST_REPORT',
    classificationConfidence: 0.95,
    classificationReasons: ['Primary keyword match: "test report"'],
    processingStatus: 'ANALYZED',
    verificationStatus: 'VERIFIED',
    pageCount: 2,
    extractedText: 'Full extracted test report text...',
    version: 1,
    isCurrent: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    structuredExtraction: {
      id: 'str-1',
      documentId: 'doc-1',
      extractedType: 'TEST_REPORT',
      laboratoryName: 'National Test House, Kolkata',
      reportNumber: 'TR/NTH/2026/8842',
      standardNumber: 'IS 10322 (Part 5/Sec 1)',
      passFailStatus: 'PASS',
      extractedFields: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    pageEvidence: [
      {
        pageNumber: 1,
        claim: 'Laboratory Name: National Test House',
        sourceText: 'Issued by: National Test House, Kolkata',
        confidence: 0.95,
      },
    ],
    checklistMatches: [
      {
        id: 'cm-1',
        documentId: 'doc-1',
        documentFileName: 'NTH_Test_Report.pdf',
        documentType: 'TEST_REPORT',
        requirementTitle: 'Independent Test Report',
        matchStatus: 'MATCHED',
        createdAt: new Date().toISOString(),
      },
    ],
    testMatches: [
      {
        id: 'tm-1',
        documentId: 'doc-1',
        documentFileName: 'NTH_Test_Report.pdf',
        testName: 'Insulation Resistance Test',
        passFailStatus: 'PASS',
        matchStatus: 'MATCHED',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'doc-2',
    productId: 'prod-led-1',
    uploadedByUserId: 'user-1',
    originalFileName: 'HV_Tester_Cal_Cert.pdf',
    storedFileName: 'stored_hv_cal.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 180,
    documentType: 'CALIBRATION_CERTIFICATE',
    classificationConfidence: 0.92,
    processingStatus: 'ANALYZED',
    verificationStatus: 'NEEDS_REVIEW',
    pageCount: 1,
    extractedText: 'Calibration Certificate text...',
    version: 1,
    isCurrent: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('Phase 9 — Frontend Document Intelligence Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(documentService.getDocuments).mockResolvedValue(mockDocuments);
    vi.mocked(documentService.getCompleteness).mockResolvedValue(mockCompleteness);
  });

  it('1. Renders ProductDocumentsPage with header, completeness score, and document list', async () => {
    render(
      <MemoryRouter>
        <ProductDocumentsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Document Intelligence/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText(/Platform Document Readiness/i)).toBeInTheDocument();
      expect(screen.getByText('NTH_Test_Report.pdf')).toBeInTheDocument();
      expect(screen.getByText('HV_Tester_Cal_Cert.pdf')).toBeInTheDocument();
    });
  });

  it('2. Opens upload document modal when clicking "Upload Document"', async () => {
    render(
      <MemoryRouter>
        <ProductDocumentsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('NTH_Test_Report.pdf')).toBeInTheDocument();
    });

    const uploadButtons = screen.getAllByRole('button', { name: /Upload Document/i });
    fireEvent.click(uploadButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Upload Compliance Document')).toBeInTheDocument();
      expect(screen.getByText(/Supports PDF, PNG, JPG, TIFF/i)).toBeInTheDocument();
    });
  });

  it('3. Opens document inspection drawer with structured metadata and page evidence', async () => {
    render(
      <MemoryRouter>
        <ProductDocumentsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('NTH_Test_Report.pdf')).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByRole('button', { name: /Inspect/i });
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Automated Classification')).toBeInTheDocument();
      expect(screen.getAllByText('National Test House, Kolkata').length).toBeGreaterThan(0);
      expect(screen.getByText('TR/NTH/2026/8842')).toBeInTheDocument();
    });
  });

  it('4. Switches to Page Evidence tab in inspection drawer', async () => {
    render(
      <MemoryRouter>
        <ProductDocumentsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('NTH_Test_Report.pdf')).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByRole('button', { name: /Inspect/i });
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Page Evidence \(1\)/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Page Evidence \(1\)/i));

    await waitFor(() => {
      expect(screen.getByText(/Laboratory Name: National Test House/i)).toBeInTheDocument();
      expect(screen.getByText(/"Issued by: National Test House, Kolkata"/i)).toBeInTheDocument();
    });
  });

  it('5. Opens human verification modal from inspection drawer', async () => {
    render(
      <MemoryRouter>
        <ProductDocumentsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('NTH_Test_Report.pdf')).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByRole('button', { name: /Inspect/i });
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Verify \/ Review/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Verify \/ Review/i }));

    await waitFor(() => {
      expect(screen.getByText('Verify Document')).toBeInTheDocument();
      expect(screen.getByText(/VERIFIED — Official statutory compliance confirmed/i)).toBeInTheDocument();
    });
  });

  it('6. Displays empty state when product has no documents uploaded without error banner', async () => {
    vi.mocked(documentService.getDocuments).mockResolvedValue([]);
    vi.mocked(documentService.getCompleteness).mockResolvedValue({
      ...mockCompleteness,
      score: 0,
      status: 'MISSING_DOCUMENTS',
      totalRequired: 3,
      verifiedCount: 0,
      matchedCount: 0,
      needsReviewCount: 0,
      missingCount: 3,
    });

    render(
      <MemoryRouter>
        <ProductDocumentsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No compliance documents found/i)).toBeInTheDocument();
    });

    // Ensure no error alert banner is displayed
    expect(screen.queryByText(/Document Processing Alert/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Cannot read properties of undefined/i)).not.toBeInTheDocument();
  });

  it('7. Displays Document Processing Alert with real error message when document service fails', async () => {
    vi.mocked(documentService.getDocuments).mockRejectedValue(
      new Error('Unable to connect to the server. Please check your connection.')
    );

    render(
      <MemoryRouter>
        <ProductDocumentsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Document Processing Alert')).toBeInTheDocument();
      expect(
        screen.getByText('Unable to connect to the server. Please check your connection.')
      ).toBeInTheDocument();
    });
  });
});
