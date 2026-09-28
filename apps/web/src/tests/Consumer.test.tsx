import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ConsumerDashboardPage } from '@/pages/consumer/ConsumerDashboardPage';
import { LicenceVerificationPage } from '@/pages/consumer/LicenceVerificationPage';
import { HuidVerificationPage } from '@/pages/consumer/HuidVerificationPage';
import { HallmarkingEducationPage } from '@/pages/consumer/HallmarkingEducationPage';
import { HallmarkingCentresPage } from '@/pages/consumer/HallmarkingCentresPage';
import { ConsumerStandardsPage } from '@/pages/consumer/ConsumerStandardsPage';
import { ConsumerServicesPage } from '@/pages/consumer/ConsumerServicesPage';
import { ConsumerVerificationsPage } from '@/pages/consumer/ConsumerVerificationsPage';
import { consumerService } from '@/services/api/consumer.service';

// Mock consumerService
vi.mock('@/services/api/consumer.service', () => ({
  consumerService: {
    getServices: vi.fn(),
    getServiceById: vi.fn(),
    searchStandards: vi.fn(),
    verifyLicence: vi.fn(),
    getHallmarkingCentres: vi.fn(),
    getHallmarkingCentreById: vi.fn(),
    getHallmarkingEducation: vi.fn(),
    verifyHuid: vi.fn(),
    getVerifications: vi.fn(),
    deleteVerification: vi.fn(),
    getGuidance: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'consumer-user-1',
      name: 'Alice Consumer',
      email: 'alice@example.com',
      role: 'USER',
    },
    isAuthenticated: true,
  }),
}));

const mockServicesList = [
  {
    id: 'srv-licence-verify',
    serviceType: 'LICENCE_VERIFICATION' as const,
    title: 'Verify BIS ISI Mark / CRS Licence',
    description: 'Verify the operational validity of CM/L licence numbers.',
    officialUrl: 'https://www.manakonline.in',
    sourceAuthority: 'Bureau of Indian Standards (BIS)',
    status: 'ACTIVE',
  },
  {
    id: 'srv-huid-verify',
    serviceType: 'HUID_VERIFICATION' as const,
    title: 'Verify Hallmark Unique Identification (HUID)',
    description: 'Check 6-digit laser-marked HUID numbers on gold jewellery.',
    officialUrl: 'https://www.manakonline.in',
    sourceAuthority: 'Bureau of Indian Standards (BIS)',
    status: 'ACTIVE',
  },
  {
    id: 'srv-complaints',
    serviceType: 'CONSUMER_COMPLAINT' as const,
    title: 'Consumer Grievance & Complaint Redressal',
    description: 'Step-by-step guidance on reporting fake hallmarks.',
    officialUrl: 'https://www.services.bis.gov.in',
    sourceAuthority: 'Bureau of Indian Standards (BIS)',
    status: 'ACTIVE',
  },
];

const mockEducationData = {
  concepts: [
    {
      id: 'concept-huid',
      topic: 'HUID',
      title: 'Understanding 6-Digit Alphanumeric HUID',
      summary: 'HUID is laser-marked on gold jewellery articles.',
      details: ['Mandatory from April 2023.', 'Enables consumer tracking.'],
      applicableStandard: 'IS 1417:2016',
      officialSource: 'BIS Hallmarking Regulations',
      sourceUrl: 'https://www.manakonline.in',
      authority: 'Bureau of Indian Standards (BIS)',
      isVerified: true,
    },
  ],
  mandatorySigns: [
    {
      signNumber: 1,
      name: 'BIS Standard Mark (Triangle Logo)',
      description: 'Official triangular logo.',
      visualGuidance: 'Stylized triangle.',
      officialReference: 'BIS Clause 4.1',
    },
    {
      signNumber: 2,
      name: 'Purity / Fineness Grade',
      description: '22K916, 18K750, etc.',
      visualGuidance: 'Numbers stamped.',
      officialReference: 'IS 1417 Clause 5.2',
    },
    {
      signNumber: 3,
      name: '6-Digit Alphanumeric HUID',
      description: 'Unique laser code.',
      visualGuidance: '6 characters.',
      officialReference: 'Gazette S.O. 1541(E)',
    },
  ],
};

describe('Phase 11 — Frontend Consumer Services & Hallmarking Intelligence Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(consumerService.getServices).mockResolvedValue({
      services: mockServicesList,
    });

    vi.mocked(consumerService.getVerifications).mockResolvedValue({
      verifications: [
        {
          id: 'ver-1',
          userId: 'consumer-user-1',
          verificationType: 'LICENCE',
          query: { licenceNumber: 'CM/L-1234567' },
          resultStatus: 'VERIFIED',
          summary: 'Licence: CM/L-1234567',
          source: 'BIS Manakonline',
          createdAt: '2026-09-25T10:00:00.000Z',
        },
      ],
      total: 1,
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Consumer Dashboard
  // ───────────────────────────────────────────────────────────────────────────
  it('1. Renders ConsumerDashboardPage with header, quick verify cards, and primary services', async () => {
    render(
      <MemoryRouter>
        <ConsumerDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Citizen & Consumer Services Hub')).toBeInTheDocument();
    expect(screen.getByText('BIS Consumer Intelligence & Verification')).toBeInTheDocument();
    expect(screen.getByText('Quick Verify BIS Licence')).toBeInTheDocument();
    expect(screen.getByText('Quick Verify HUID Hallmark')).toBeInTheDocument();
    expect(screen.getByText('Official BIS Citizen Helplines')).toBeInTheDocument();
    expect(screen.getByText('1800-11-1206')).toBeInTheDocument();

    await waitFor(() => {
      expect(consumerService.getServices).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Licence Verification Page (Verified)
  // ───────────────────────────────────────────────────────────────────────────
  it('2. LicenceVerificationPage submits licence number and renders VERIFIED result', async () => {
    vi.mocked(consumerService.verifyLicence).mockResolvedValue({
      verification: {
        licenceNumber: 'CM/L-1234567',
        manufacturer: 'Havells India Limited',
        productName: 'Self-Ballasted LED Lamps',
        standardNumber: 'IS 16102 (Part 1)',
        standardTitle: 'Safety Requirements for LED Lamps',
        status: 'VERIFIED',
        statusDetails: 'Licence operative and active in central registry.',
        source: 'BIS Manakonline Portal',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        retrievedAt: '2026-09-25T12:00:00.000Z',
        disclaimer: 'This information does not replace official certificates.',
      },
      savedVerificationId: 'ver-saved-1',
    });

    render(
      <MemoryRouter>
        <LicenceVerificationPage />
      </MemoryRouter>
    );

    expect(screen.getByText('BIS Licence Verification')).toBeInTheDocument();

    const input = screen.getByLabelText(/Licence Number/i);
    fireEvent.change(input, { target: { value: 'CM/L-1234567' } });

    const submitBtn = screen.getByRole('button', { name: /Verify Licence/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(consumerService.verifyLicence).toHaveBeenCalledWith(
        expect.objectContaining({ licenceNumber: 'CM/L-1234567' })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Havells India Limited')).toBeInTheDocument();
      expect(screen.getByText('IS 16102 (Part 1)')).toBeInTheDocument();
      expect(screen.getByText('VERIFIED')).toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Licence Verification Page (Not Found)
  // ───────────────────────────────────────────────────────────────────────────
  it('3. LicenceVerificationPage renders NOT_FOUND result with non-invalidity disclaimer', async () => {
    vi.mocked(consumerService.verifyLicence).mockResolvedValue({
      verification: {
        licenceNumber: 'CM/L-9999999',
        status: 'NOT_FOUND',
        statusDetails: 'No matching record was found in authoritative register.',
        source: 'BIS Central Register',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        retrievedAt: '2026-09-25T12:00:00.000Z',
        disclaimer: 'A NOT FOUND result does not constitute a legal declaration of invalidity.',
      },
    });

    render(
      <MemoryRouter>
        <LicenceVerificationPage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/Licence Number/i);
    fireEvent.change(input, { target: { value: 'CM/L-9999999' } });

    const submitBtn = screen.getByRole('button', { name: /Verify Licence/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('NOT_FOUND')).toBeInTheDocument();
      expect(screen.getByText(/does not constitute a legal declaration of invalidity/i)).toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. HUID Verification Page
  // ───────────────────────────────────────────────────────────────────────────
  it('4. HuidVerificationPage submits HUID code and renders purity karat and jeweller info', async () => {
    vi.mocked(consumerService.verifyHuid).mockResolvedValue({
      verification: {
        huid: 'AZ1234',
        verificationStatus: 'VERIFIED',
        articleType: 'Gold Ring',
        purityKarat: '22K (916)',
        purityPpm: 916,
        jewellerName: 'Tanishq Jewellers Ltd',
        jewellerRegistrationNumber: 'JW-DL-9821',
        hallmarkingCentreName: 'Apex Assaying Centre',
        hallmarkingCentreCode: 'AHC-DL-001',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        retrievedAt: '2026-09-25T12:00:00.000Z',
        disclaimer: 'Verification result is based on authoritative repository records.',
      },
      savedVerificationId: 'huid-saved-1',
    });

    render(
      <MemoryRouter>
        <HuidVerificationPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Verify Hallmark Unique Identification/i)).toBeInTheDocument();

    const input = screen.getByLabelText(/6-Digit Alphanumeric HUID/i);
    fireEvent.change(input, { target: { value: 'AZ1234' } });

    const submitBtn = screen.getByRole('button', { name: /Verify HUID/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(consumerService.verifyHuid).toHaveBeenCalledWith(
        expect.objectContaining({ huid: 'AZ1234' })
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText('AZ1234').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('22K (916)')).toBeInTheDocument();
      expect(screen.getByText('Tanishq Jewellers Ltd')).toBeInTheDocument();
      expect(screen.getByText('Apex Assaying Centre')).toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Hallmarking Educational Page
  // ───────────────────────────────────────────────────────────────────────────
  it('5. HallmarkingEducationPage renders 3 mandatory signs and fineness tables', async () => {
    vi.mocked(consumerService.getHallmarkingEducation).mockResolvedValue(mockEducationData);

    render(
      <MemoryRouter>
        <HallmarkingEducationPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Indian Gold & Silver Hallmarking Intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/The 3 Mandatory Marks on Gold Jewellery/i)).toBeInTheDocument();
    expect(screen.getByText(/BIS Triangular Logo/i)).toBeInTheDocument();
    expect(screen.getByText(/Purity & Fineness Grade/i)).toBeInTheDocument();
    expect(screen.getAllByText(/6-Digit HUID Code/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Permissible Gold & Silver Fineness Grades/i)).toBeInTheDocument();
    expect(screen.getByText(/Nominal ₹45 Testing Fee/i)).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Hallmarking Centres Directory Page
  // ───────────────────────────────────────────────────────────────────────────
  it('6. HallmarkingCentresPage renders centres list and triggers filter query', async () => {
    vi.mocked(consumerService.getHallmarkingCentres).mockResolvedValue({
      centres: [
        {
          id: 'ahc-1',
          name: 'Apex Assaying & Hallmarking Centre',
          code: 'AHC-DL-001',
          address: '24/1, Karol Bagh Jewellery Market',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110005',
          phone: '+91 11 2875 4421',
          email: 'contact@apexassaying.in',
          status: 'ACTIVE',
          authorityLevel: 'AUTHORITATIVE' as const,
          isVerified: true,
          lastVerifiedAt: '2026-01-15T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 9,
      totalPages: 1,
      availableStates: ['Delhi', 'Maharashtra', 'Tamil Nadu'],
    });

    render(
      <MemoryRouter>
        <HallmarkingCentresPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Assaying & Hallmarking Centres \(AHC\) Directory/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Apex Assaying & Hallmarking Centre')).toBeInTheDocument();
      expect(screen.getByText('AHC-DL-001')).toBeInTheDocument();
      expect(screen.getByText(/110005/i)).toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Consumer Standards Plain Language Search
  // ───────────────────────────────────────────────────────────────────────────
  it('7. ConsumerStandardsPage searches standards and renders 5-part consumer explanation', async () => {
    vi.mocked(consumerService.searchStandards).mockResolvedValue({
      query: 'Luminaires',
      results: [
        {
          standardNumber: 'IS 10322 (Part 5/Sec 1)',
          title: 'Fixed General Purpose Luminaires',
          scope: 'Safety and performance requirements.',
          status: 'CURRENT',
          publicationYear: 2012,
          isMandatoryQco: true,
          qcoName: 'Luminaires QCO 2024',
          consumerExplanation: {
            whatThisMeans: 'Indian Standard IS 10322 sets safety requirements for luminaires.',
            whyItMatters: 'Protects from electrical shock and fire hazards.',
            whatYouCanCheck: ['Look for authentic ISI mark.', 'Verify CM/L number.'],
            officialSource: 'Bureau of Indian Standards',
            nextStep: 'Check product label before purchase.',
          },
        },
      ],
      total: 1,
      sourceCount: 1,
    });

    render(
      <MemoryRouter initialEntries={['/consumer/standards?q=Luminaires']}>
        <Routes>
          <Route path="/consumer/standards" element={<ConsumerStandardsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(consumerService.searchStandards).toHaveBeenCalledWith({ q: 'Luminaires' });
    });

    await waitFor(() => {
      expect(screen.getByText('IS 10322 (Part 5/Sec 1)')).toBeInTheDocument();
      expect(screen.getByText(/Mandatory under QCO/i)).toBeInTheDocument();
      expect(screen.getByText(/What this means/i)).toBeInTheDocument();
      expect(screen.getByText(/Why it matters to you/i)).toBeInTheDocument();
      expect(screen.getByText(/What you can check before buying/i)).toBeInTheDocument();
      expect(screen.getByText(/Look for authentic ISI mark/i)).toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Saved Verifications History Page
  // ───────────────────────────────────────────────────────────────────────────
  it('8. ConsumerVerificationsPage renders saved records and deletes item on action', async () => {
    vi.mocked(consumerService.getVerifications).mockResolvedValue({
      verifications: [
        {
          id: 'ver-to-delete',
          userId: 'consumer-user-1',
          verificationType: 'LICENCE',
          query: { licenceNumber: 'CM/L-1234567' },
          resultStatus: 'VERIFIED',
          summary: 'Licence: CM/L-1234567',
          source: 'BIS Manakonline',
          createdAt: '2026-09-25T10:00:00.000Z',
        },
      ],
      total: 1,
    });

    vi.mocked(consumerService.deleteVerification).mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <ConsumerVerificationsPage />
      </MemoryRouter>
    );

    const deleteBtn = await waitFor(() => screen.getByTitle('Delete verification'));
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(consumerService.deleteVerification).toHaveBeenCalledWith('ver-to-delete');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Consumer Services & Grievance Guidance Page
  // ───────────────────────────────────────────────────────────────────────────
  it('9. ConsumerServicesPage renders official complaint guidance and helpline contacts', async () => {
    vi.mocked(consumerService.getGuidance).mockResolvedValue({
      guidance: {
        serviceType: 'CONSUMER_COMPLAINT',
        title: 'How to File a Complaint with BIS',
        summary: 'Step-by-step guidance for lodging product quality and misuse complaints.',
        guidanceStatus: 'GUIDANCE_ONLY',
        officialPortalUrl: 'https://www.manakonline.in/MANAK/complaintHome',
        steps: [
          {
            stepNumber: 1,
            title: 'Gather Purchase Proof & ISI/Hallmark Details',
            description: 'Collect your retail tax invoice and product photographs.',
            requiredDocuments: ['Tax Invoice / Cash Memo', 'Photographs of ISI Mark & CM/L Number'],
          },
        ],
        tips: ['Always ask for a computerized tax invoice.'],
        contacts: [{ label: 'BIS Consumer Affairs Helpline', value: '1800-11-1404' }],
        disclaimers: ['Guidance is advisory only.'],
      },
    });

    render(
      <MemoryRouter>
        <ConsumerServicesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(consumerService.getGuidance).toHaveBeenCalledWith('CONSUMER_COMPLAINT');
    });

    await waitFor(() => {
      expect(screen.getByText('How to File a Complaint with BIS')).toBeInTheDocument();
      expect(screen.getByText('Gather Purchase Proof & ISI/Hallmark Details')).toBeInTheDocument();
      expect(screen.getByText(/1800-11-1404/i)).toBeInTheDocument();
    });
  });
});
