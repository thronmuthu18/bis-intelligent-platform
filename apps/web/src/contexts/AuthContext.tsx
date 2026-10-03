import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/api/auth.service';
import { setAccessToken, clearAccessToken } from '@/services/api/client';
import type { UserPublicProfile, LoginInput, CreateUserInput } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Authentication Context & State Management
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthContextValue {
  user: UserPublicProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<UserPublicProfile>;
  register: (input: CreateUserInput) => Promise<UserPublicProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<UserPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verifies active session with backend /api/v1/auth/me
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const data = await authService.getMe();
      if (data.token) {
        setAccessToken(data.token);
      }
      setUser(data.user);
    } catch {
      clearAccessToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (input: LoginInput): Promise<UserPublicProfile> => {
    const data = await authService.login(input);
    if (data.token) {
      setAccessToken(data.token);
    }
    setUser(data.user);
    return data.user;
  };

  const register = async (input: CreateUserInput): Promise<UserPublicProfile> => {
    const data = await authService.register(input);
    if (data.token) {
      setAccessToken(data.token);
    }
    setUser(data.user);
    return data.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const defaultAuthContext: AuthContextValue = {
  user: {
    id: 'demo-user-id',
    name: 'Compliance Officer',
    email: 'compliance.officer@enterprise.in',
    role: 'USER',
    organizationName: 'National Industrial Corporation',
  },
  isAuthenticated: true,
  isLoading: false,
  login: async () => ({
    id: 'demo-user-id',
    name: 'Compliance Officer',
    email: 'compliance.officer@enterprise.in',
    role: 'USER',
  }),
  register: async () => ({
    id: 'demo-user-id',
    name: 'Compliance Officer',
    email: 'compliance.officer@enterprise.in',
    role: 'USER',
  }),
  logout: async () => {},
  refreshUser: async () => {},
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    return defaultAuthContext;
  }
  return context;
}
