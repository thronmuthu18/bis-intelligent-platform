// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Translation Service
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto';
import { prisma } from '../../db/client.js';
import type {
  SupportedLanguage,
  TranslateRequest,
  TranslateResponse,
} from '@bis/shared';
import { TranslationProviderFactory } from './providers/provider.factory.js';
import { TerminologyService } from './terminology.service.js';

export class TranslationService {
  /**
   * Generates a deterministic SHA-256 hash of the normalized source text.
   */
  public static hashSourceText(text: string, sourceLang: string): string {
    const normalized = text.trim().replace(/\r\n/g, '\n');
    return crypto
      .createHash('sha256')
      .update(`${sourceLang}:${normalized}`)
      .digest('hex');
  }

  /**
   * Translates text into target language while caching results and preserving technical identifiers.
   */
  public static async translate(req: TranslateRequest): Promise<TranslateResponse> {
    const text = (req.text || '').trim();
    const sourceLanguage: SupportedLanguage = req.sourceLanguage || 'en';
    const targetLanguage: SupportedLanguage = req.targetLanguage;

    if (!text) {
      return {
        sourceLanguage,
        targetLanguage,
        sourceTextHash: '',
        translatedText: '',
        preservedTerms: [],
        sourceReference: req.sourceReference,
        cached: false,
        generatedAt: new Date().toISOString(),
        disclaimer: 'Platform-generated translation. Original BIS source retains authoritative legal status.',
      };
    }

    // Identity translation
    if (sourceLanguage === targetLanguage) {
      return {
        sourceLanguage,
        targetLanguage,
        sourceTextHash: this.hashSourceText(text, sourceLanguage),
        translatedText: text,
        preservedTerms: [],
        sourceReference: req.sourceReference,
        cached: false,
        generatedAt: new Date().toISOString(),
        disclaimer: 'Authoritative source language.',
      };
    }

    const sourceTextHash = this.hashSourceText(text, sourceLanguage);

    // 1. Check database translation cache
    try {
      const cached = await prisma.translationCache.findUnique({
        where: {
          sourceTextHash_targetLanguage: {
            sourceTextHash,
            targetLanguage,
          },
        },
      });

      if (cached) {
        return {
          sourceLanguage,
          targetLanguage,
          sourceTextHash,
          translatedText: cached.translatedText,
          preservedTerms: cached.preservedTerms,
          sourceReference: cached.sourceReference || req.sourceReference,
          cached: true,
          generatedAt: cached.createdAt.toISOString(),
          disclaimer:
            'Platform-generated translation (cached). Original BIS source retains authoritative legal status.',
        };
      }
    } catch {
      // Cache lookup failure should not block translation
    }

    // 2. Identify technical terms to preserve
    const preservedTerms = TerminologyService.extractPreservedTerms(text, req.preserveTerms || []);

    // 3. Perform translation via provider
    const provider = TranslationProviderFactory.getProvider();
    let translatedText = text;
    let foundPreserved = preservedTerms;

    try {
      const result = await provider.translate({
        text,
        sourceLanguage,
        targetLanguage,
        preservedTerms,
      });
      translatedText = result.translatedText;
      foundPreserved = result.preservedTermsFound;
    } catch (err) {
      console.warn('Translation provider failed, falling back to source text:', err);
      translatedText = text; // Safe fallback
    }

    // 4. Save to cache asynchronously
    try {
      await prisma.translationCache.upsert({
        where: {
          sourceTextHash_targetLanguage: {
            sourceTextHash,
            targetLanguage,
          },
        },
        create: {
          sourceLanguage,
          targetLanguage,
          sourceTextHash,
          sourceText: text,
          translatedText,
          preservedTerms: foundPreserved,
          sourceReference: req.sourceReference,
        },
        update: {
          translatedText,
          preservedTerms: foundPreserved,
          sourceReference: req.sourceReference,
        },
      });
    } catch {
      // Cache write failure should not fail request
    }

    return {
      sourceLanguage,
      targetLanguage,
      sourceTextHash,
      translatedText,
      preservedTerms: foundPreserved,
      sourceReference: req.sourceReference,
      cached: false,
      generatedAt: new Date().toISOString(),
      disclaimer:
        'Platform-generated translation. Original BIS source retains authoritative legal status.',
    };
  }
}
