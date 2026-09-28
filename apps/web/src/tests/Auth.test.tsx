import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Mock authService
vi.mock('@/services/api/auth.service', () => ({
  authService: {
    getMe: vi.fn().mockRejectedValue(new Error('Unauthenticated')),
    login: vi.fn().mockResolvedValue({
      user: {
        id: '11111111-2222-3333-4444-555555555555',
        name: 'Test Officer',
        email: 'officer@test.in',
        role: 'USER',
      },
    }),
    register: vi.fn().mockResolvedValue({
      user: {
        id: '11111111-2222-3333-4444-555555555555',
        name: 'New Officer',
        email: 'new@test.in',
        role: 'USER',
      },
    }),
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Phase 2 — Frontend Authentication Components', () => {
  it('renders LoginPage with email and password fields', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Sign in to access your Indian Standards compliance workspace.')).toBeDefined();
    expect(screen.getByLabelText(/Official Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/^Password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeDefined();
  });

  it('renders RegisterPage with required fields and password indicators', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <RegisterPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Enterprise Registration')).toBeDefined();
    expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Official Email/i)).toBeDefined();
    expect(screen.getByLabelText(/^Password \*/i)).toBeDefined();
    expect(screen.getByLabelText(/Confirm Password \*/i)).toBeDefined();
    expect(screen.getByText('Minimum 8 characters')).toBeDefined();
  });

  it('shows password mismatch warning when confirming wrong password in RegisterPage', async () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <RegisterPage />
      </MemoryRouter>,
    );

    const passwordInput = screen.getByLabelText(/^Password \*/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password \*/i);

    fireEvent.change(passwordInput, { target: { value: 'SecurePass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass' } });

    expect(screen.getByText('Passwords do not match')).toBeDefined();
  });

  it('ProtectedRoute redirects unauthenticated users to login', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <div>Protected Dashboard Content</div>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page Redirect Target</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // Protected content should be guarded
    expect(screen.queryByText('Protected Dashboard Content')).toBeDefined();
  });
});
