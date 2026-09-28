// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Language & Accessibility Context
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SupportedLanguage } from '@bis/shared';
import { translateKey, getLocalizedTerm } from '../i18n';
import { i18nService } from '../services/api';
import { useAuth } from './AuthContext';

const STORAGE_KEY_LANG = 'bis_preferred_language';
const STORAGE_KEY_MOTION = 'bis_reduced_motion';
const STORAGE_KEY_CONTRAST = 'bis_high_contrast';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  term: (key: string) => string;
  announcement: string;
  announce: (message: string) => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Initialize from localStorage or default to 'en'
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    if (saved === 'ta' || saved === 'hi' || saved === 'en') {
      return saved;
    }
    return 'en';
  });

  const [announcement, setAnnouncement] = useState<string>('');
  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_MOTION) === 'true';
  });
  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_CONTRAST) === 'true';
  });

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    // Auto-clear after brief delay so repeat messages trigger screen reader changes
    setTimeout(() => {
      setAnnouncement('');
    }, 4000);
  }, []);

  // Sync user database preferences when logged in
  useEffect(() => {
    async function loadUserPreference() {
      if (user) {
        try {
          const res = await i18nService.getPreferences();
          if (res.preference?.language) {
            setLanguageState(res.preference.language);
            localStorage.setItem(STORAGE_KEY_LANG, res.preference.language);
          }
          if (res.preference?.reducedMotion !== undefined) {
            setReducedMotionState(res.preference.reducedMotion);
            localStorage.setItem(STORAGE_KEY_MOTION, String(res.preference.reducedMotion));
          }
          if (res.preference?.highContrast !== undefined) {
            setHighContrastState(res.preference.highContrast);
            localStorage.setItem(STORAGE_KEY_CONTRAST, String(res.preference.highContrast));
          }
        } catch {
          // Fallback gracefully if preference fetch fails
        }
      }
    }
    loadUserPreference();
  }, [user]);

  // Handle language change
  const setLanguage = useCallback(
    async (newLang: SupportedLanguage) => {
      setLanguageState(newLang);
      localStorage.setItem(STORAGE_KEY_LANG, newLang);

      // Accessibility Announcement
      const langNames = { en: 'English', ta: 'Tamil', hi: 'Hindi' };
      announce(`Language changed to ${langNames[newLang] || newLang}.`);

      // Persist to server if authenticated
      if (user) {
        try {
          await i18nService.updatePreferences({ language: newLang });
        } catch {
          // Keep local state
        }
      }
    },
    [user, announce]
  );

  const setReducedMotion = useCallback(
    (val: boolean) => {
      setReducedMotionState(val);
      localStorage.setItem(STORAGE_KEY_MOTION, String(val));
      if (user) {
        i18nService.updatePreferences({ reducedMotion: val }).catch(() => {});
      }
    },
    [user]
  );

  const setHighContrast = useCallback(
    (val: boolean) => {
      setHighContrastState(val);
      localStorage.setItem(STORAGE_KEY_CONTRAST, String(val));
      if (user) {
        i18nService.updatePreferences({ highContrast: val }).catch(() => {});
      }
    },
    [user]
  );

  // Translation helper
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translateKey(key, language, params);
    },
    [language]
  );

  // Terminology helper
  const term = useCallback(
    (key: string) => {
      return getLocalizedTerm(key, language);
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        term,
        announcement,
        announce,
        reducedMotion,
        setReducedMotion,
        highContrast,
        setHighContrast,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

const defaultContextValue: LanguageContextType = {
  language: 'en',
  setLanguage: async () => {},
  t: (key: string, params?: Record<string, string | number>) => translateKey(key, 'en', params),
  term: (key: string) => getLocalizedTerm(key, 'en'),
  announcement: '',
  announce: () => {},
  reducedMotion: false,
  setReducedMotion: () => {},
  highContrast: false,
  setHighContrast: () => {},
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    return defaultContextValue;
  }
  return context;
}

