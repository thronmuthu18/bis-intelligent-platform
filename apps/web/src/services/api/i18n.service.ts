// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Multilingual & Accessibility (i18n) API Client
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from './client';
import type {
  LanguagesListResponse,
  TerminologyListResponse,
  TerminologyResponse,
  TranslateRequest,
  TranslateResponse,
  UserPreferenceResponse,
  UpdateUserPreferenceRequest,
} from '@bis/shared';

export const i18nService = {
  /**
   * Get supported languages list.
   */
  async getLanguages(): Promise<LanguagesListResponse> {
    return apiClient.get<LanguagesListResponse>('/i18n/languages');
  },

  /**
   * Get user preferences.
   */
  async getPreferences(): Promise<UserPreferenceResponse> {
    return apiClient.get<UserPreferenceResponse>('/i18n/preferences');
  },

  /**
   * Update user preferences.
   */
  async updatePreferences(data: UpdateUserPreferenceRequest): Promise<UserPreferenceResponse> {
    return apiClient.put<UserPreferenceResponse>('/i18n/preferences', data);
  },

  /**
   * Request translation for text with term preservation.
   */
  async translate(data: TranslateRequest): Promise<TranslateResponse> {
    return apiClient.post<TranslateResponse>('/i18n/translate', data);
  },

  /**
   * Get all registered terminology entries.
   */
  async getTerms(): Promise<TerminologyListResponse> {
    return apiClient.get<TerminologyListResponse>('/i18n/terms');
  },

  /**
   * Get single terminology entry.
   */
  async getTerm(key: string): Promise<TerminologyResponse> {
    return apiClient.get<TerminologyResponse>(`/i18n/terms/${key}`);
  },
};
