import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductAssistantPage } from '@/pages/product/ProductAssistantPage';
import { productService } from '@/services/api/product.service';
import { assistantService } from '@/services/api/assistant.service';
import type {
  Product,
  AssistantConversation,
  AssistantQueryResponse,
} from '@bis/shared';

// Mock productService and assistantService
vi.mock('@/services/api/product.service', () => ({
  productService: {
    getProduct: vi.fn(),
  },
}));

vi.mock('@/services/api/assistant.service', () => ({
  assistantService: {
    getConversations: vi.fn(),
    createConversation: vi.fn(),
    getConversation: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock('@/contexts/ProductContext', () => ({
  useProduct: () => ({
    product: {
      id: 'prod-uuid-1234',
      userId: 'user-uuid-1111',
      name: 'Smart Electric Geyser 25L',
      category: 'Electrical Appliances',
      description: 'Instant storage water heater with digital controls.',
      manufacturerType: 'Domestic Manufacturer',
      status: 'ACTIVE',
      isActive: true,
      createdAt: '2026-09-24T10:00:00.000Z',
      updatedAt: '2026-09-24T10:00:00.000Z',
    },
    isLoading: false,
    error: null,
    refreshProduct: vi.fn(),
    updateProduct: vi.fn(),
    archiveProduct: vi.fn(),
  }),
}));

const mockProduct: Product = {
  id: 'prod-uuid-1234',
  userId: 'user-uuid-1111',
  name: 'Smart Electric Geyser 25L',
  category: 'Electrical Appliances',
  description: 'Instant storage water heater with digital controls.',
  manufacturerType: 'Domestic Manufacturer',
  status: 'ACTIVE',
  isActive: true,
  createdAt: '2026-09-24T10:00:00.000Z',
  updatedAt: '2026-09-24T10:00:00.000Z',
};

const mockConversation: AssistantConversation = {
  id: 'conv-uuid-1',
  productId: 'prod-uuid-1234',
  userId: 'user-uuid-1111',
  title: 'Geyser IS 302 Compliance Query',
  createdAt: '2026-09-28T10:00:00.000Z',
  updatedAt: '2026-09-28T10:00:00.000Z',
  messages: [
    {
      id: 'msg-1',
      conversationId: 'conv-uuid-1',
      role: 'USER',
      content: 'What BIS standards apply to this water heater?',
      grounded: true,
      createdAt: '2026-09-28T10:00:00.000Z',
    },
    {
      id: 'msg-2',
      conversationId: 'conv-uuid-1',
      role: 'ASSISTANT',
      content: 'Based on BIS Scheme I (ISI Mark), your electric storage water heater is governed by IS 302 (Part 2/Sec 21).',
      grounded: true,
      citations: [
        {
          citationIndex: 1,
          standardId: 'std-302',
          isNumber: 'IS 302-2-21',
          sourceTitle: 'Safety of Household and Similar Electrical Appliances: Particular Requirements for Storage Water Heaters',
          authorityLevel: 'AUTHORITATIVE',
          clauseOrSection: 'Clause 7: Safety Marking & Testing',
          sourceUrl: 'https://standardsbis.bsbedge.com/BIS_SearchStandard.aspx',
        },
      ],
      createdAt: '2026-09-28T10:00:05.000Z',
    },
  ],
};


describe('Phase 16.3 — Frontend Product AI Assistant Workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productService.getProduct).mockResolvedValue(mockProduct);
  });

  const renderAssistantPage = () =>
    render(
      <MemoryRouter>
        <ProductAssistantPage />
      </MemoryRouter>
    );


  it('renders ProductAssistantPage with scoped product context and empty conversation state', async () => {
    vi.mocked(assistantService.getConversations).mockResolvedValueOnce([]);

    renderAssistantPage();

    expect(await screen.findByText('AI Compliance Assistant')).toBeDefined();
    expect(screen.getAllByText('Smart Electric Geyser 25L').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Start a conversation about this product's BIS compliance/i).length).toBeGreaterThan(0);
    expect(screen.getByText('What BIS standards may apply to my product?')).toBeDefined();
  });


  it('loads and renders existing conversations and messages with citations', async () => {
    vi.mocked(assistantService.getConversations).mockResolvedValueOnce([mockConversation]);
    vi.mocked(assistantService.getConversation).mockResolvedValueOnce(mockConversation);

    renderAssistantPage();

    expect(await screen.findByText('Geyser IS 302 Compliance Query')).toBeDefined();
    expect(await screen.findByText('What BIS standards apply to this water heater?')).toBeDefined();
    expect(
      screen.getByText(/Based on BIS Scheme I \(ISI Mark\), your electric storage water heater is governed by IS 302/i)
    ).toBeDefined();

    // Verify citation badge rendered
    expect(screen.getByText(/\[1\] IS 302-2-21/i)).toBeDefined();
  });

  it('opens authoritative source evidence drawer when citation is clicked', async () => {
    vi.mocked(assistantService.getConversations).mockResolvedValueOnce([mockConversation]);
    vi.mocked(assistantService.getConversation).mockResolvedValueOnce(mockConversation);

    renderAssistantPage();

    const citationBadge = await screen.findByText(/\[1\] IS 302-2-21/i);
    fireEvent.click(citationBadge);

    expect(await screen.findByText('Authoritative Source Evidence')).toBeDefined();
    expect(
      screen.getByText(/Safety of Household and Similar Electrical Appliances: Particular Requirements for Storage Water Heaters/i)
    ).toBeDefined();
    expect(screen.getByText(/Clause 7: Safety Marking & Testing/i)).toBeDefined();
    expect(screen.getByText('AUTHORITATIVE')).toBeDefined();
  });


  it('sends message via real assistantService.sendMessage and appends response', async () => {
    vi.mocked(assistantService.getConversations).mockResolvedValueOnce([mockConversation]);
    vi.mocked(assistantService.getConversation).mockResolvedValueOnce(mockConversation);

    const mockResponse: AssistantQueryResponse = {
      conversationId: 'conv-uuid-1',
      message: {
        id: 'msg-3',
        conversationId: 'conv-uuid-1',
        role: 'ASSISTANT',
        content: 'Testing requires high voltage dielectric strength test as per Clause 13.',
        grounded: true,
        createdAt: '2026-09-28T10:01:00.000Z',
      },
      grounded: true,
      citations: [],
      evidenceCount: 0,
    };

    vi.mocked(assistantService.sendMessage).mockResolvedValueOnce(mockResponse);

    renderAssistantPage();

    const textarea = await screen.findByPlaceholderText(/Ask about IS standards, QCO mandates/i);
    fireEvent.change(textarea, { target: { value: 'What testing parameters are mandatory?' } });

    const sendBtn = screen.getByRole('button', { name: /Send message/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(assistantService.sendMessage).toHaveBeenCalledWith(
        'prod-uuid-1234',
        'conv-uuid-1',
        expect.objectContaining({ content: 'What testing parameters are mandatory?' })
      );
    });

    expect(
      await screen.findByText('Testing requires high voltage dielectric strength test as per Clause 13.')
    ).toBeDefined();
  });

  it('triggers quick prompt to create a new conversation and send query', async () => {
    vi.mocked(assistantService.getConversations).mockResolvedValueOnce([]);

    const newConv: AssistantConversation = {
      id: 'conv-uuid-new',
      productId: 'prod-uuid-1234',
      userId: 'user-uuid-1111',
      title: 'Is my product affected by a mandatory QCO?',
      createdAt: '2026-09-28T10:05:00.000Z',
      updatedAt: '2026-09-28T10:05:00.000Z',
    };

    vi.mocked(assistantService.createConversation).mockResolvedValueOnce(newConv);
    vi.mocked(assistantService.sendMessage).mockResolvedValueOnce({
      conversationId: 'conv-uuid-new',
      message: {
        id: 'msg-reply',
        conversationId: 'conv-uuid-new',
        role: 'ASSISTANT',
        content: 'Yes, electric water heaters are covered under mandatory QCO notification S.O. 1234(E).',
        grounded: true,
        createdAt: '2026-09-28T10:05:05.000Z',
      },
      grounded: true,
      citations: [],
      evidenceCount: 0,
    });

    renderAssistantPage();

    const quickPromptBtn = await screen.findByText('Is my product affected by a mandatory QCO?');
    fireEvent.click(quickPromptBtn);

    await waitFor(() => {
      expect(assistantService.createConversation).toHaveBeenCalledWith(
        'prod-uuid-1234',
        expect.objectContaining({ title: 'Is my product affected by a mandatory QCO?' })
      );
    });

    expect(
      await screen.findByText('Yes, electric water heaters are covered under mandatory QCO notification S.O. 1234(E).')
    ).toBeDefined();
  });

  it('handles API failure and shows user-friendly error state with retry', async () => {
    vi.mocked(assistantService.getConversations).mockRejectedValueOnce({
      statusCode: 500,
      message: 'Internal server error in RAG engine',
    });

    renderAssistantPage();

    expect(
      await screen.findByText(/Assistant is temporarily unavailable. Please try again./i)
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeDefined();
  });
});
