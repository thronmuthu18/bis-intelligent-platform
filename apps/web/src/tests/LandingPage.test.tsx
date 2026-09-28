import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';

// Mock the API call so tests don't need a running server
vi.mock('@/services/api', () => ({
  checkApiHealth: vi.fn().mockRejectedValue(new Error('Not connected in tests')),
}));

describe('LandingPage', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
  });

  it('renders the platform name', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    // The page contains multiple elements with 'BIS' — verify at least one exists
    const bisElements = screen.getAllByText(/BIS/);
    expect(bisElements.length).toBeGreaterThan(0);
  });

  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Sign in')).toBeDefined();
    expect(screen.getByText('Get started')).toBeDefined();
  });
});
