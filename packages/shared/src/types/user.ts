// ─────────────────────────────────────────────────────────────────────────────
//  User Domain Types
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'ADMIN' | 'DATA_MANAGER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublicProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationName?: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  organizationName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserPublicProfile;
  tokens: AuthTokens;
}
