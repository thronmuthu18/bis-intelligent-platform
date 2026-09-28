import { apiClient } from './client';
import type { UserPublicProfile, LoginInput, CreateUserInput } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Frontend Auth Service
//  Calls backend /api/v1/auth endpoints via centralized apiClient.
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthUserData {
  user: UserPublicProfile;
}

export const authService = {
  /**
   * Registers a new enterprise or consumer user account.
   */
  async register(input: CreateUserInput): Promise<AuthUserData> {
    return apiClient.post<AuthUserData>('/auth/register', input);
  },

  /**
   * Authenticates user and establishes secure HttpOnly session cookie.
   */
  async login(input: LoginInput): Promise<AuthUserData> {
    return apiClient.post<AuthUserData>('/auth/login', input);
  },

  /**
   * Terminates active session and clears HttpOnly cookie.
   */
  async logout(): Promise<void> {
    await apiClient.post<{ message: string }>('/auth/logout', {});
  },

  /**
   * Verifies current session and retrieves authenticated user profile.
   */
  async getMe(): Promise<AuthUserData> {
    return apiClient.get<AuthUserData>('/auth/me');
  },
};
