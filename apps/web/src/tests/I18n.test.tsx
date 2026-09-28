// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Multilingual & Accessibility Intelligence Frontend Test Suite
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { translateKey, getLocalizedTerm } from '../i18n';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { AccessibleStatus } from '../components/accessibility/AccessibleStatus';
import { LiveAnnouncer } from '../components/accessibility/LiveAnnouncer';

// Mock i18nService
vi.mock('../services/api/i18n.service', () => ({
  i18nService: {
    getPreferences: vi.fn().mockResolvedValue({ preference: null }),
    updatePreferences: vi.fn().mockResolvedValue({ success: true }),
    translateText: vi.fn(),
    getTerms: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-1', email: 'test@example.com', role: 'MANUFACTURER' },
    isAuthenticated: true,
  }),
}));

describe('Phase 12 — I18n Core Translation & Terminology Engine', () => {
  it('translates top-level and nested keys in English', () => {
    expect(translateKey('common.appName', 'en')).toBe('BIS Intelligent Platform');
    expect(translateKey('consumer.hubTitle', 'en')).toBe('BIS Consumer Intelligence & Verification');
    expect(translateKey('status.verified', 'en')).toBe('Verified');
  });

  it('translates keys in Tamil correctly', () => {
    expect(translateKey('common.appName', 'ta')).toBe('BIS நுண்ணறிவு தளம்');
    expect(translateKey('consumer.hubTitle', 'ta')).toBe('BIS நுகர்வோர் நுண்ணறிவு & சரிபார்ப்பு மையம்');
    expect(translateKey('status.verified', 'ta')).toBe('சரிபார்க்கப்பட்டது');
  });

  it('translates keys in Hindi correctly', () => {
    expect(translateKey('common.appName', 'hi')).toBe('बीआईएस इंटेलिजेंट प्लेटफॉर्म');
    expect(translateKey('consumer.hubTitle', 'hi')).toBe('बीआईएस उपभोक्ता इंटेलिजेंस और सत्यापन हब');
    expect(translateKey('status.verified', 'hi')).toBe('सत्यापित');
  });

  it('falls back to key when missing in all locales', () => {
    expect(translateKey('nonexistent.key', 'ta')).toBe('nonexistent.key');
  });

  it('interpolates dynamic parameters into translation strings', () => {
    const rendered = translateKey('common.languageChanged', 'en', { lang: 'Tamil' });
    expect(rendered).toBe('Language changed to Tamil.');
  });

  it('preserves canonical BIS technical terms in all languages', () => {
    expect(getLocalizedTerm('HUID', 'en')).toBe('Hallmark Unique Identification (HUID)');
    expect(getLocalizedTerm('HUID', 'ta')).toBe('தனித்துவ ஹால்மார்க் அடையாள எண் (HUID)');
    expect(getLocalizedTerm('HUID', 'hi')).toBe('हॉलमार्क विशिष्ट पहचान संख्या (HUID)');

    expect(getLocalizedTerm('ISI_MARK', 'en')).toBe('ISI Mark');
    expect(getLocalizedTerm('ISI_MARK', 'ta')).toBe('ஐஎஸ்ஐ முத்திரை (ISI Mark)');
    expect(getLocalizedTerm('ISI_MARK', 'hi')).toBe('आईएसआई मार्क (ISI Mark)');
  });
});

describe('Phase 12 — LanguageContext & Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('bis_preferred_language', 'en');
    vi.clearAllMocks();
  });

  const TestConsumerComponent: React.FC = () => {
    const { language, setLanguage, t, announce } = useLanguage();
    return (
      <div>
        <span data-testid="current-lang">{language}</span>
        <span data-testid="translated-title">{t('consumer.hubTitle')}</span>
        <button data-testid="switch-to-ta" onClick={() => setLanguage('ta')}>
          Switch to Tamil
        </button>
        <button data-testid="switch-to-hi" onClick={() => setLanguage('hi')}>
          Switch to Hindi
        </button>
        <button data-testid="trigger-announce" onClick={() => announce('Document uploaded successfully.')}>
          Announce
        </button>
      </div>
    );
  };

  it('initializes with default English and switches language reactively', async () => {
    render(
      <LanguageProvider>
        <LiveAnnouncer />
        <TestConsumerComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang').textContent).toBe('en');
    expect(screen.getByTestId('translated-title').textContent).toBe('BIS Consumer Intelligence & Verification');

    // Switch to Tamil
    fireEvent.click(screen.getByTestId('switch-to-ta'));

    await waitFor(() => {
      expect(screen.getByTestId('current-lang').textContent).toBe('ta');
      expect(screen.getByTestId('translated-title').textContent).toBe('BIS நுகர்வோர் நுண்ணறிவு & சரிபார்ப்பு மையம்');
      expect(localStorage.getItem('bis_preferred_language')).toBe('ta');
    });

    // Switch to Hindi
    fireEvent.click(screen.getByTestId('switch-to-hi'));

    await waitFor(() => {
      expect(screen.getByTestId('current-lang').textContent).toBe('hi');
      expect(screen.getByTestId('translated-title').textContent).toBe('बीआईएस उपभोक्ता इंटेलिजेंस और सत्यापन हब');
      expect(localStorage.getItem('bis_preferred_language')).toBe('hi');
    });
  });

  it('triggers screen reader announcements on events', async () => {
    render(
      <LanguageProvider>
        <LiveAnnouncer />
        <TestConsumerComponent />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByTestId('trigger-announce'));

    const liveRegion = screen.getByRole('status');
    expect(liveRegion.textContent).toBe('Document uploaded successfully.');
  });
});

describe('Phase 12 — Accessible LanguageSwitcher UI Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('bis_preferred_language', 'en');
    vi.clearAllMocks();
  });

  it('renders language selector button with current native label', () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByRole('button', { name: /change language/i });
    expect(button).toBeDefined();
    expect(button.textContent).toContain('English');
  });

  it('opens accessible options list on click and selects a new language', async () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByRole('button', { name: /change language/i });
    fireEvent.click(button);

    const optionsList = screen.getByRole('listbox');
    expect(optionsList).toBeDefined();

    const tamilOption = screen.getByText('தமிழ்');
    expect(tamilOption).toBeDefined();

    fireEvent.click(tamilOption);

    await waitFor(() => {
      expect(button.textContent).toContain('தமிழ்');
    });
  });

  it('closes dropdown on Escape key', () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByRole('button', { name: /change language/i });
    fireEvent.click(button);
    expect(screen.getByRole('listbox')).toBeDefined();

    fireEvent.keyDown(button, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

describe('Phase 12 — WCAG 2.1 AA AccessibleStatus Indicators', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('bis_preferred_language', 'en');
    vi.clearAllMocks();
  });

  it('renders VERIFIED state with checkmark symbol and localized label', () => {
    render(
      <LanguageProvider>
        <AccessibleStatus status="VERIFIED" />
      </LanguageProvider>
    );

    const statusBadge = screen.getByRole('status');
    expect(statusBadge.textContent).toContain('✓');
    expect(statusBadge.textContent).toContain('Verified');
    expect(statusBadge.getAttribute('aria-label')).toBe('Status: Verified');
  });

  it('renders NOT_FOUND state with bullet symbol and localized label', () => {
    render(
      <LanguageProvider>
        <AccessibleStatus status="NOT_FOUND" />
      </LanguageProvider>
    );

    const statusBadge = screen.getByRole('status');
    expect(statusBadge.textContent).toContain('●');
    expect(statusBadge.textContent).toContain('Not Found');
  });

  it('renders NEEDS_REVIEW state with exclamation symbol and localized label', () => {
    render(
      <LanguageProvider>
        <AccessibleStatus status="NEEDS_REVIEW" />
      </LanguageProvider>
    );

    const statusBadge = screen.getByRole('status');
    expect(statusBadge.textContent).toContain('!');
    expect(statusBadge.textContent).toContain('Needs Review');
  });

  it('renders SOURCE_UNAVAILABLE state with dash symbol', () => {
    render(
      <LanguageProvider>
        <AccessibleStatus status="SOURCE_UNAVAILABLE" />
      </LanguageProvider>
    );

    const statusBadge = screen.getByRole('status');
    expect(statusBadge.textContent).toContain('—');
    expect(statusBadge.textContent).toContain('Source Unavailable');
  });

  it('renders UNKNOWN fallback state with question mark symbol', () => {
    render(
      <LanguageProvider>
        <AccessibleStatus status="INVALID_STATUS" />
      </LanguageProvider>
    );

    const statusBadge = screen.getByRole('status');
    expect(statusBadge.textContent).toContain('?');
    expect(statusBadge.textContent).toContain('Unknown');
  });
});
