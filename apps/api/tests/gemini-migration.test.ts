// ─────────────────────────────────────────────────────────────────────────────
//  Phase 1.1 — Google Gemini-Only AI Provider & Multilingual Verification Tests
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getEmbeddingProvider,
  setEmbeddingProvider,
} from '../src/services/ai/embedding/factory.js';
import { GeminiEmbeddingProvider } from '../src/services/ai/embedding/gemini.provider.js';
import {
  AssistantService,
  detectQueryLanguage,
  GroundedAnswerParams,
} from '../src/services/assistant.service.js';
import { TranslationProviderFactory } from '../src/services/i18n/providers/provider.factory.js';
import { GeminiTranslationProvider } from '../src/services/i18n/providers/gemini-translation.provider.js';
import { TerminologyService } from '../src/services/i18n/terminology.service.js';
import { validateEnv } from '../src/config/env.js';

describe('Phase 1.1 — Gemini-Only AI Provider & Multilingual Suite', () => {
  const originalEnv = { ...process.env };

  const sampleEvidence: GroundedAnswerParams['ragEvidence'] = [
    {
      isNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
      title: 'Luminaires - Particular Requirements - Fixed General Purpose Luminaires',
      scope: 'Specifies safety requirements for fixed general purpose luminaires for use with tungsten filament, tubular fluorescent and other discharge lamps on supply voltages not exceeding 1 000 V.',
      status: 'MANDATORY_QCO',
      source: {
        title: 'Bureau of Indian Standards',
        url: 'https://services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails/10322',
        authorityLevel: 'AUTHORITATIVE',
      },
      citation: {
        citationIndex: 1,
        sourceTitle: 'Bureau of Indian Standards Official Portal',
        sourceUrl: 'https://services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails/10322',
        authorityLevel: 'AUTHORITATIVE',
      },
    },
  ];

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.AI_API_KEY;
    setEmbeddingProvider(null);
    TranslationProviderFactory.setProvider(null);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    setEmbeddingProvider(null);
    TranslationProviderFactory.setProvider(null);
    vi.restoreAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Gemini Provider Selection
  // ───────────────────────────────────────────────────────────────────────────
  it('1. should select GeminiEmbeddingProvider when AI_PROVIDER=gemini', () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.AI_API_KEY = 'test_gemini_key_for_selection';

    const provider = getEmbeddingProvider();
    expect(provider).toBeInstanceOf(GeminiEmbeddingProvider);
    expect(provider.name).toBe('gemini');
    expect(provider.dimension).toBe(768);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Gemini API Key Validation (Both AI_API_KEY and GEMINI_API_KEY)
  // ───────────────────────────────────────────────────────────────────────────
  it('2. should accept either AI_API_KEY or GEMINI_API_KEY when AI_PROVIDER=gemini', () => {
    // Case A: AI_API_KEY set
    process.env.AI_PROVIDER = 'gemini';
    process.env.AI_API_KEY = 'unified_ai_api_key';
    delete process.env.GEMINI_API_KEY;
    const providerA = getEmbeddingProvider();
    expect(providerA.name).toBe('gemini');

    // Case B: GEMINI_API_KEY set
    setEmbeddingProvider(null);
    delete process.env.AI_API_KEY;
    process.env.GEMINI_API_KEY = 'explicit_gemini_api_key';
    const providerB = getEmbeddingProvider();
    expect(providerB.name).toBe('gemini');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Gemini Model Configuration
  // ───────────────────────────────────────────────────────────────────────────
  it('3. should accept AI_MODEL=gemini-2.5-flash without breaking embedding defaults', () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.AI_API_KEY = 'test_gemini_key_model_check';
    process.env.AI_MODEL = 'gemini-2.5-flash';

    const provider = getEmbeddingProvider();
    expect(provider.name).toBe('gemini');
    // Embedding model must use standard text embedding, not generative chat model
    expect(provider.model).toBe('text-embedding-004');
    expect(provider.dimension).toBe(768);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. OpenAI Not Required in Gemini Mode
  // ───────────────────────────────────────────────────────────────────────────
  it('4. should not require OPENAI_API_KEY when AI_PROVIDER=gemini in production', () => {
    delete process.env.OPENAI_API_KEY;

    const prodEnv = {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://postgres:password@localhost:5432/bis_compliance?schema=public',
      FRONTEND_URL: 'http://localhost:5173',
      API_BASE_URL: 'http://localhost:5000/api/v1',
      JWT_SECRET: 'a_very_secure_production_jwt_secret_key_minimum_32_characters_long_for_auth',
      AI_PROVIDER: 'gemini',
      AI_API_KEY: 'test_gemini_key_valid',
      TRANSLATION_PROVIDER: 'mock',
    };

    const parsed = validateEnv(prodEnv);
    expect(parsed.success).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Gemini Assistant Response Synthesis
  // ───────────────────────────────────────────────────────────────────────────
  it('5. should synthesize assistant response using Gemini API endpoint', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.AI_API_KEY = 'test_gemini_key_for_assistant';
    process.env.AI_MODEL = 'gemini-2.5-flash';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'According to [Source 1] IS 10322 (Part 5/Sec 1) : 2012, fixed general purpose luminaires are mandated to comply with safety requirements.',
                },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await AssistantService.generateGroundedAnswer({
      query: 'What standard applies to my LED luminaire?',
      productName: 'LED Ceiling Luminaire',
      productCategory: 'Electrical Equipment & Luminaires',
      productSector: 'Electrotechnical',
      ragEvidence: sampleEvidence,
    });

    expect(result.grounded).toBe(true);
    expect(result.content).toContain('IS 10322 (Part 5/Sec 1) : 2012');
    expect(result.citations).toHaveLength(1);
    expect(result.citations[0].isNumber).toBe('IS 10322 (Part 5/Sec 1) : 2012');

    // Verify correct Google Gemini endpoint was targeted with gemini-2.5-flash
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('generativelanguage.googleapis.com');
    expect(calledUrl).toContain('gemini-2.5-flash:generateContent');
    expect(calledUrl).toContain('key=test_gemini_key_for_assistant');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. RAG Context Passed to Gemini Prompt
  // ───────────────────────────────────────────────────────────────────────────
  it('6. should pass authenticated product specifications and RAG evidence into Gemini prompt', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.AI_API_KEY = 'test_gemini_key_rag_test';

    let capturedPrompt = '';
    const mockFetch = vi.fn().mockImplementation(async (_url: string, opts: any) => {
      const body = JSON.parse(opts.body);
      capturedPrompt = body.contents[0].parts[0].text;
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Grounded response grounded in [Source 1].' }],
              },
            },
          ],
        }),
      };
    });
    vi.stubGlobal('fetch', mockFetch);

    await AssistantService.generateGroundedAnswer({
      query: 'What are the insulation requirements?',
      productName: 'Commercial LED Downlight',
      productCategory: 'Electrical Equipment & Luminaires',
      productSector: 'Electrotechnical',
      technicalSpecifications: { voltage: '230V AC', wattage: '18W' },
      ragEvidence: sampleEvidence,
      certificationContext: { schemeName: 'Scheme I (ISI Mark)' },
      testingContext: { tests: ['Insulation Resistance', 'High Voltage'] },
    });

    expect(capturedPrompt).toContain('Commercial LED Downlight');
    expect(capturedPrompt).toContain('IS 10322 (Part 5/Sec 1) : 2012');
    expect(capturedPrompt).toContain('230V AC');
    expect(capturedPrompt).toContain('Scheme I (ISI Mark)');
    expect(capturedPrompt).toContain('Insulation Resistance');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Grounded Standards Response
  // ───────────────────────────────────────────────────────────────────────────
  it('7. should produce grounded response referencing verified standards without inventing unverified claims', async () => {
    process.env.AI_PROVIDER = 'mock'; // Deterministic engine test

    const result = await AssistantService.generateGroundedAnswer({
      query: 'Which standard covers this luminaire?',
      productName: 'LED Surface Panel',
      productCategory: 'Electrical Equipment & Luminaires',
      ragEvidence: sampleEvidence,
    });

    expect(result.grounded).toBe(true);
    expect(result.content).toContain('IS 10322 (Part 5/Sec 1) : 2012');
    expect(result.citations[0].sourceUrl).toContain('services.bis.gov.in');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Tamil Language Support
  // ───────────────────────────────────────────────────────────────────────────
  it('8. should detect Tamil query and respond in Tamil while preserving official standard identifier', async () => {
    const tamilQuery = 'இந்த LED light fittingக்கு எந்த BIS standard தேவை?';
    expect(detectQueryLanguage(tamilQuery)).toBe('ta');

    process.env.AI_PROVIDER = 'mock';

    const result = await AssistantService.generateGroundedAnswer({
      query: tamilQuery,
      productName: 'LED Light Fitting',
      productCategory: 'Electrical Equipment & Luminaires',
      ragEvidence: sampleEvidence,
    });

    expect(result.grounded).toBe(true);
    // Response should be in Tamil
    expect(result.content).toContain('அதிகாரப்பூர்வ இந்திய தர நிர்ணய பணியகம்');
    // IS number MUST remain in exact Latin script
    expect(result.content).toContain('IS 10322 (Part 5/Sec 1) : 2012');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Hindi Language Support
  // ───────────────────────────────────────────────────────────────────────────
  it('9. should detect Hindi query and respond in Hindi while preserving official standard identifier', async () => {
    const hindiQuery = 'इस LED light fitting के लिए कौन सा BIS standard लागू है?';
    expect(detectQueryLanguage(hindiQuery)).toBe('hi');

    process.env.AI_PROVIDER = 'mock';

    const result = await AssistantService.generateGroundedAnswer({
      query: hindiQuery,
      productName: 'LED Light Fitting',
      productCategory: 'Electrical Equipment & Luminaires',
      ragEvidence: sampleEvidence,
    });

    expect(result.grounded).toBe(true);
    // Response should be in Hindi
    expect(result.content).toContain('भारतीय मानक ब्यूरो');
    // IS number MUST remain in exact Latin script
    expect(result.content).toContain('IS 10322 (Part 5/Sec 1) : 2012');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 10. English Language Support
  // ───────────────────────────────────────────────────────────────────────────
  it('10. should detect English query and respond in English with official standard details', async () => {
    const englishQuery = 'What are the document requirements for this product?';
    expect(detectQueryLanguage(englishQuery)).toBe('en');

    process.env.AI_PROVIDER = 'mock';

    const result = await AssistantService.generateGroundedAnswer({
      query: englishQuery,
      productName: 'LED Light Fitting',
      productCategory: 'Electrical Equipment & Luminaires',
      ragEvidence: sampleEvidence,
    });

    expect(result.grounded).toBe(true);
    expect(result.content).toContain('Required Compliance Documents for');
    expect(result.content).toContain('IS 10322 (Part 5/Sec 1) : 2012');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 11. Translation Provider Selection
  // ───────────────────────────────────────────────────────────────────────────
  it('11. should select GeminiTranslationProvider when TRANSLATION_PROVIDER=gemini', () => {
    process.env.TRANSLATION_PROVIDER = 'gemini';
    process.env.AI_API_KEY = 'test_gemini_translation_selection';

    const provider = TranslationProviderFactory.getProvider();
    expect(provider).toBeInstanceOf(GeminiTranslationProvider);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 12. Missing Gemini Key Fail-Fast Behavior
  // ───────────────────────────────────────────────────────────────────────────
  it('12. should fail fast with explicit error when Gemini key is missing', async () => {
    process.env.AI_PROVIDER = 'gemini';
    delete process.env.GEMINI_API_KEY;
    delete process.env.AI_API_KEY;

    // Fail-fast in AssistantService
    await expect(
      AssistantService.generateGroundedAnswer({
        query: 'What standard is required?',
        productName: 'LED Lamp',
        productCategory: 'Electrical Equipment & Luminaires',
        ragEvidence: sampleEvidence,
      })
    ).rejects.toThrow(
      'Gemini API key is required when AI_PROVIDER=gemini. Set GEMINI_API_KEY or AI_API_KEY in environment.'
    );

    // Fail-fast in TranslationProviderFactory
    process.env.TRANSLATION_PROVIDER = 'gemini';
    TranslationProviderFactory.setProvider(null);
    expect(() => TranslationProviderFactory.getProvider()).toThrow(
      'Gemini API key is missing. Set GEMINI_API_KEY or AI_API_KEY in environment.'
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 13. Gemini API Failure & Error Sanitization
  // ───────────────────────────────────────────────────────────────────────────
  it('13. should handle Gemini API failure gracefully without exposing secret key', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.AI_API_KEY = 'secret_gemini_key_never_leak_this_value';

    // Mock 429 rate limit error
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'RESOURCE_EXHAUSTED: Rate limit exceeded for quota group default',
      })
    );

    try {
      await AssistantService.generateGroundedAnswer({
        query: 'What standard is required?',
        productName: 'LED Lamp',
        productCategory: 'Electrical Equipment & Luminaires',
        ragEvidence: sampleEvidence,
      });
      expect.unreachable('Should have thrown an error');
    } catch (err: any) {
      expect(err.message).toContain('rate limit exceeded');
      // Verify secret key is never leaked in the error message
      expect(err.message).not.toContain('secret_gemini_key_never_leak_this_value');
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 14. Multilingual Safety: Preservation of Technical Identifiers
  // ───────────────────────────────────────────────────────────────────────────
  it('14. should preserve standard numbers, schemes, and licence codes verbatim in TerminologyService', () => {
    const mixedTechnicalText = `Product must comply with IS 10322 (Part 5/Sec 1) : 2012 under Scheme I with licence CM/L-7654321 and hallmark AZ1234.`;

    const preserved = TerminologyService.extractPreservedTerms(mixedTechnicalText);

    expect(preserved).toContain('IS 10322 (Part 5/Sec 1) : 2012');
    expect(preserved).toContain('Scheme I');
    expect(preserved).toContain('CM/L-7654321');
    expect(preserved).toContain('AZ1234');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 15. Bidirectional Translation with Gemini Provider Stub
  // ───────────────────────────────────────────────────────────────────────────
  it('15. should execute translation through GeminiTranslationProvider preserving technical identifiers', async () => {
    process.env.TRANSLATION_PROVIDER = 'gemini';
    process.env.AI_API_KEY = 'test_key_gemini_translate';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'தயாரிப்பு IS 10322 (Part 5/Sec 1) : 2012 இன் கீழ் Scheme I உரிமத்திற்கு தகுதி பெற வேண்டும்.',
                },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const provider = new GeminiTranslationProvider();
    const result = await provider.translate({
      text: 'Product must qualify under IS 10322 (Part 5/Sec 1) : 2012 for Scheme I license.',
      sourceLanguage: 'en',
      targetLanguage: 'ta',
      preservedTerms: ['IS 10322 (Part 5/Sec 1) : 2012', 'Scheme I'],
    });

    expect(result.translatedText).toContain('IS 10322 (Part 5/Sec 1) : 2012');
    expect(result.translatedText).toContain('Scheme I');
    expect(result.preservedTermsFound).toContain('IS 10322 (Part 5/Sec 1) : 2012');
    expect(result.preservedTermsFound).toContain('Scheme I');
  });
});
