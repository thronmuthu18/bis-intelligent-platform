// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Multilingual & Accessibility (i18n) Controller
// ─────────────────────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import {
  SUPPORTED_LANGUAGES,
  API_ERROR_CODES,
  type SupportedLanguage,
  type UpdateUserPreferenceRequest,
  type TranslateRequest,
} from '@bis/shared';
import { AppError } from '../utils/AppError.js';
import { TranslationService } from '../services/i18n/translation.service.js';
import { TerminologyService } from '../services/i18n/terminology.service.js';
import { UserPreferenceService } from '../services/i18n/user-preference.service.js';

export class I18nController {
  /**
   * GET /api/v1/i18n/languages
   * Public: List all supported languages.
   */
  public static async getLanguages(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          languages: SUPPORTED_LANGUAGES,
          defaultLanguage: 'en',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/i18n/preferences
   * Authenticated: Retrieve current user's preferences.
   */
  public static async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('Authentication required', 401, API_ERROR_CODES.UNAUTHORIZED);
      }

      const response = await UserPreferenceService.getUserPreference(userId);
      res.json({
        success: true,
        data: response,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/i18n/preferences
   * Authenticated: Update current user's preferences.
   */
  public static async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('Authentication required', 401, API_ERROR_CODES.UNAUTHORIZED);
      }

      const body = req.body as UpdateUserPreferenceRequest;
      const response = await UserPreferenceService.updateUserPreference(userId, body);

      res.json({
        success: true,
        data: response,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/i18n/translate
   * Public or Authenticated: Request source-preserving translation.
   */
  public static async translate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text, sourceLanguage, targetLanguage, sourceReference, preserveTerms } = req.body as TranslateRequest;

      if (!targetLanguage) {
        throw new AppError('targetLanguage is required', 400, API_ERROR_CODES.BAD_REQUEST);
      }

      const validLangs: SupportedLanguage[] = ['en', 'ta', 'hi'];
      if (!validLangs.includes(targetLanguage)) {
        throw new AppError(`Unsupported target language: ${targetLanguage}`, 400, API_ERROR_CODES.BAD_REQUEST);
      }

      const response = await TranslationService.translate({
        text: text || '',
        sourceLanguage: sourceLanguage || 'en',
        targetLanguage,
        sourceReference,
        preserveTerms,
      });

      res.json({
        success: true,
        data: response,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/i18n/terms
   * Public: List all registered BIS terminology.
   */
  public static async getAllTerms(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response = TerminologyService.getAllTerms();
      res.json({
        success: true,
        data: response,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/i18n/terms/:key
   * Public: Get single terminology item.
   */
  public static async getTermByKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const response = TerminologyService.getTerm(key);
      if (!response) {
        throw new AppError(`Terminology key not found: ${key}`, 404, API_ERROR_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        data: response,
      });
    } catch (err) {
      next(err);
    }
  }
}
