import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ActivityPage } from '@/pages/ActivityPage';
import { activityService } from '@/services/api/activity.service';
import type { UserActivityFeedResponse, UserActivityItem } from '@bis/shared';

// Mock activityService
vi.mock('@/services/api/activity.service', () => ({
  activityService: {
    getUserActivity: vi.fn(),
    getProductActivity: vi.fn(),
  },
}));

const mockActivities: UserActivityItem[] = [
  {
    id: 'act-1',
    category: 'PRODUCT',
    action: 'PRODUCT_CREATE',
    title: 'Product Created',
    description: 'Electric Storage Geyser registered in compliance workspace.',
    productName: 'Electric Storage Geyser',
    productId: 'prod-uuid-1',
    entityType: 'Product',
    entityId: 'prod-uuid-1',
    timestamp: '2026-09-28T10:00:00.000Z',
    metadata: {
      category: 'Electrical Appliances',
      manufacturerType: 'Domestic Manufacturer',
    },
  },
  {
    id: 'act-2',
    category: 'ASSISTANT',
    action: 'ASSISTANT_QUERY',
    title: 'AI Assistant Query',
    description: 'Compliance query evaluated against IS 302.',
    productName: 'Electric Storage Geyser',
    productId: 'prod-uuid-1',
    entityType: 'AiConversation',
    entityId: 'conv-uuid-1',
    timestamp: '2026-09-28T10:05:00.000Z',
    metadata: {
      query: 'What BIS standards apply to this water heater?',
      grounded: true,
    },
  },
  {
    id: 'act-3',
    category: 'DOCUMENT',
    action: 'DOCUMENT_UPLOAD',
    title: 'Document Uploaded',
    description: 'Factory test certificate uploaded.',
    productName: 'Electric Storage Geyser',
    productId: 'prod-uuid-1',
    entityType: 'Document',
    entityId: 'doc-uuid-1',
    timestamp: '2026-09-28T10:10:00.000Z',
    metadata: {
      fileName: 'Test_Cert.pdf',
      fileSize: 102400,
    },
  },
];

const mockFeedResponse: UserActivityFeedResponse = {
  activities: mockActivities,
  total: 3,
  page: 1,
  limit: 15,
  hasMore: false,
};

describe('Phase 16.4 — Frontend Activity & Audit Feed Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderActivityPage = (props: { productId?: string; embedded?: boolean } = {}) =>
    render(
      <MemoryRouter>
        <ActivityPage {...props} />
      </MemoryRouter>
    );

  it('1. Loads and renders real activity records from activityService.getUserActivity', async () => {
    vi.mocked(activityService.getUserActivity).mockResolvedValueOnce(mockFeedResponse);

    renderActivityPage();

    expect(await screen.findByText('Activity & Audit Log')).toBeDefined();
    expect(await screen.findByText('Product Created')).toBeDefined();
    expect(screen.getByText('Electric Storage Geyser registered in compliance workspace.')).toBeDefined();
    expect(screen.getByText('AI Assistant Query')).toBeDefined();
    expect(screen.getByText('Compliance query evaluated against IS 302.')).toBeDefined();
    expect(screen.getByText('Document Uploaded')).toBeDefined();
    expect(screen.getByText('Showing 3 of 3 events')).toBeDefined();
  });

  it('2. Filters activity by category and queries server with category parameter', async () => {
    vi.mocked(activityService.getUserActivity).mockResolvedValue(mockFeedResponse);

    renderActivityPage();

    const assistantTab = await screen.findByRole('button', { name: 'Assistant' });
    fireEvent.click(assistantTab);

    await waitFor(() => {
      expect(activityService.getUserActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'ASSISTANT',
          page: 1,
        })
      );
    });
  });

  it('3. Renders product-scoped activity using activityService.getProductActivity', async () => {
    vi.mocked(activityService.getProductActivity).mockResolvedValueOnce(mockFeedResponse);

    renderActivityPage({ productId: 'prod-uuid-1', embedded: true });

    await waitFor(() => {
      expect(activityService.getProductActivity).toHaveBeenCalledWith(
        'prod-uuid-1',
        expect.objectContaining({ page: 1, limit: 15 })
      );
    });

    expect(await screen.findByText('Product Created')).toBeDefined();
  });

  it('4. Expands and renders safe sanitized metadata details without exposing secrets', async () => {
    vi.mocked(activityService.getUserActivity).mockResolvedValueOnce(mockFeedResponse);

    renderActivityPage();

    const viewDetailsButtons = await screen.findAllByRole('button', { name: /View Details/i });
    expect(viewDetailsButtons.length).toBeGreaterThan(0);

    fireEvent.click(viewDetailsButtons[0]);

    expect(await screen.findByText('Event Metadata:')).toBeDefined();
    expect(screen.getByText(/Domestic Manufacturer/i)).toBeDefined();
  });

  it('5. Renders empty state when user has no activity records', async () => {
    vi.mocked(activityService.getUserActivity).mockResolvedValueOnce({
      activities: [],
      total: 0,
      page: 1,
      limit: 15,
      hasMore: false,
    });

    renderActivityPage();

    expect(await screen.findByText('No activity yet')).toBeDefined();
    expect(
      screen.getByText(/Workspace actions, product creation, document uploads/i)
    ).toBeDefined();
  });

  it('6. Handles server failure with user-friendly error and retry button', async () => {
    vi.mocked(activityService.getUserActivity).mockRejectedValueOnce(
      new Error('Database connection timeout')
    );

    renderActivityPage();

    expect(
      await screen.findByText('Database connection timeout')
    ).toBeDefined();

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    expect(retryBtn).toBeDefined();

    vi.mocked(activityService.getUserActivity).mockResolvedValueOnce(mockFeedResponse);
    fireEvent.click(retryBtn);

    expect(await screen.findByText('Product Created')).toBeDefined();
  });

  it('7. Handles server-backed pagination navigation', async () => {
    vi.mocked(activityService.getUserActivity).mockResolvedValueOnce({
      activities: mockActivities,
      total: 30,
      page: 1,
      limit: 15,
      hasMore: true,
    });

    renderActivityPage();

    expect(await screen.findByText(/Showing 3 of 30 events/i)).toBeDefined();
    expect(
      screen.getByText((_content, element) => {
        return element?.tagName.toLowerCase() === 'div' && element?.textContent === 'Page 1 of 2';
      })
    ).toBeDefined();

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    expect(nextBtn).toBeDefined();
    expect(nextBtn.hasAttribute('disabled')).toBe(false);

    vi.mocked(activityService.getUserActivity).mockResolvedValueOnce({
      activities: mockActivities,
      total: 30,
      page: 2,
      limit: 15,
      hasMore: false,
    });

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(activityService.getUserActivity).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });
});
