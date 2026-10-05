// ─────────────────────────────────────────────────────────────────────────────
//  Phase 1.1 — Google Gemini Translation Provider
//  Deterministic, high-accuracy multilingual intelligence for BIS domain
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ITranslationProvider,
  ProviderTranslateParams,
  ProviderTranslateResult,
} from './translation-provider.interface.js';
import { logger } from '../../../config/logger.js';
import { AppError } from '../../../utils/AppError.js';
import { API_ERROR_CODES } from '@bis/shared';

export class GeminiTranslationProvider implements ITranslationProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
    this.model = process.env.AI_MODEL || 'gemini-2.5-flash';

    if (!this.apiKey) {
      throw new AppError(
        'Gemini API key is missing. Set GEMINI_API_KEY or AI_API_KEY in environment.',
        500,
        API_ERROR_CODES.INTERNAL_SERVER_ERROR
      );
    }
  }

  public async translate(params: ProviderTranslateParams): Promise<ProviderTranslateResult> {
    const { text, sourceLanguage, targetLanguage, preservedTerms } = params;

    if (!text || !text.trim()) {
      return {
        translatedText: text,
        preservedTermsFound: [],
      };
    }

    // Identity translation
    if (sourceLanguage === targetLanguage) {
      return {
        translatedText: text,
        preservedTermsFound: preservedTerms.filter((term) => text.includes(term)),
      };
    }

    const languageNames: Record<string, string> = {
      en: 'English',
      ta: 'Tamil',
      hi: 'Hindi',
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;
    const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;

    const preservedTermsDirective =
      preservedTerms.length > 0
        ? `\nPRESERVED TERMS (MUST RETAIN VERBATIM IN LATIN SCRIPT):\n${preservedTerms.map((t) => `- "${t}"`).join('\n')}`
        : '';

    const prompt = `You are the official translation engine for the Bureau of Indian Standards (BIS) technical and regulatory platform.
Accurately translate the following text from ${sourceLangName} to ${targetLangName}.

=== STRICT REGULATORY & TECHNICAL SAFETY RULES ===
1. NEVER translate, alter, or transliterate Indian Standard numbers (e.g. "IS 10322", "IS 10322 (Part 5/Sec 1) : 2012", "IS 1417", "IS 302-1", "IS/ISO 9001"). They MUST remain EXACTLY in Latin script with identical formatting.
2. NEVER alter certification scheme names (e.g. "Scheme I", "Scheme II", "Scheme IV", "CRS", "Compulsory Registration Scheme").
3. NEVER alter licence numbers (e.g. "CM/L-1234567"), HUID codes (e.g. "AZ1234"), laboratory names, or QCO identifiers.
4. NEVER alter URLs, email addresses, phone numbers, or numerical test measurements (e.g. "230V AC", "50Hz", "1,000 V").
5. Keep technical terminology natural, formal, and authoritative in ${targetLangName}.${preservedTermsDirective}
6. Output ONLY the raw translated text. Do NOT include markdown code fences, greetings, or translator notes.

=== SOURCE TEXT (${sourceLangName}) ===
${text}`;

    let activeModel = this.model;

    const makeRequest = async (m: string) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${this.apiKey}`;
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        }),
      });
    };

    let response: Response;
    try {
      response = await makeRequest(activeModel);
      if (!response.ok && (response.status === 404 || response.status === 503) && activeModel === 'gemini-2.5-flash') {
        try {
          const cloned = response.clone();
          const errPeek = await cloned.text();
          if (errPeek.includes('gemini-3.8-flash') || errPeek.includes('no longer available') || response.status === 503) {
            logger.info('Gemini translation model gemini-2.5-flash retired by Google or unavailable, falling back to gemini-3.8-flash');
            activeModel = 'gemini-3.8-flash';
            response = await makeRequest(activeModel);
            if (!response.ok && response.status === 503) {
              logger.info('Gemini translation model gemini-3.8-flash experiencing 503 high demand, falling back to gemini-flash-latest');
              activeModel = 'gemini-flash-latest';
              response = await makeRequest(activeModel);
            }
          }
        } catch {
          // ignore peek error and keep original response
        }
      }
    } catch (networkErr: unknown) {
      const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
      logger.error('Gemini translation network error', { error: msg });
      throw new AppError(
        `Gemini translation network failure: ${msg}`,
        502,
        API_ERROR_CODES.AI_SERVICE_UNAVAILABLE
      );
    }

    if (!response.ok) {
      const errBody = await response.text();
      let safeError = `Gemini translation API returned HTTP ${response.status}`;

      if (response.status === 400) {
        safeError = 'Gemini translation API error: Invalid request parameters or API key.';
      } else if (response.status === 403) {
        safeError = 'Gemini translation API error: Access forbidden or quota exceeded.';
      } else if (response.status === 404) {
        safeError = `Gemini translation model "${this.model}" not found or unsupported.`;
      } else if (response.status === 429) {
        safeError = 'Gemini translation API error: Rate limit or quota exceeded. Please retry later.';
      } else if (response.status >= 500) {
        safeError = 'Gemini translation API error: Google Gemini service is temporarily unavailable.';
      }

      logger.error('Gemini translation API call failed', {
        status: response.status,
        model: this.model,
        safeError,
        error: errBody,
      });

      throw new AppError(safeError, 502, API_ERROR_CODES.AI_SERVICE_UNAVAILABLE);
    }

    const json = (await response.json()) as any;
    let translatedText = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

    // Remove any accidental surrounding markdown code blocks if emitted by the model
    if (translatedText.startsWith('```') && translatedText.endsWith('```')) {
      translatedText = translatedText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    }

    // Safety verification: Verify that all preserved terms (especially standard numbers) remain in output
    const foundPreserved: string[] = [];
    for (const term of preservedTerms) {
      if (translatedText.includes(term)) {
        foundPreserved.push(term);
      }
    }

    return {
      translatedText,
      preservedTermsFound: foundPreserved,
    };
  }
}
