// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — OpenAI Translation Provider
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ITranslationProvider,
  ProviderTranslateParams,
  ProviderTranslateResult,
} from './translation-provider.interface.js';

export class OpenAITranslationProvider implements ITranslationProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || '';
    this.model = process.env.AI_MODEL || 'gpt-4o-mini';
  }

  public async translate(params: ProviderTranslateParams): Promise<ProviderTranslateResult> {
    const { text, sourceLanguage, targetLanguage, preservedTerms } = params;

    if (!this.apiKey) {
      throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY in environment.');
    }

    const languageNames: Record<string, string> = {
      en: 'English',
      ta: 'Tamil',
      hi: 'Hindi',
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;
    const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;

    const systemPrompt = `You are a certified, high-accuracy translation assistant for the Bureau of Indian Standards (BIS) technical and regulatory domain.
Your task is to accurately translate text from ${sourceLangName} to ${targetLangName}.

STRICT DOMAIN RULES:
1. NEVER translate, alter, or transliterate standard numbers (e.g. IS 10322, IS 1417, IS/ISO 9001).
2. NEVER alter technical identifiers, licence numbers (e.g. CM/L-1234567), HUID codes (e.g. AZ1234), QCO identifiers, or scheme names.
3. NEVER alter URLs, email addresses, phone numbers, or numerical test parameters.
4. Keep the terminology natural, formal, and accurate in ${targetLangName}.
5. Preserved terms list to retain verbatim: ${preservedTerms.join(', ')}.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI translation API error (${response.status}): ${errText}`);
    }

    const json = (await response.json()) as any;
    const translatedText = json.choices?.[0]?.message?.content?.trim() || text;

    const foundPreserved = preservedTerms.filter((t) => translatedText.includes(t));

    return {
      translatedText,
      preservedTermsFound: foundPreserved,
    };
  }
}
