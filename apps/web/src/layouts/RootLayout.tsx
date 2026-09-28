import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LiveAnnouncer } from '@/components/accessibility/LiveAnnouncer';

/**
 * RootLayout — Outermost Application Wrapper.
 * Provides global authentication and language/accessibility context to all child routes.
 */
export function RootLayout(): React.ReactElement {
  return (
    <AuthProvider>
      <LanguageProvider>
        <LiveAnnouncer />
        <Outlet />
      </LanguageProvider>
    </AuthProvider>
  );
}

