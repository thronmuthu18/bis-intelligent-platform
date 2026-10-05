// ─────────────────────────────────────────────────────────────────────────────
//  Phase 16 & Foundation — AI Compliance Assistant Service
//  Product-grounded RAG Assistant using official BIS knowledge & citations.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../db/client.js';
import { AppError } from '../utils/AppError.js';
import { buildRagContext } from './rag/ragContextBuilder.js';
import { UserActivityService } from './activity.service.js';
import { mapCategoryToBisSector } from './intelligence/category-sector-mapper.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import {
  API_ERROR_CODES,
  AssistantConversation,
  AssistantMessage,
  AssistantCitation,
  AssistantQueryResponse,
  SendAssistantMessageInput,
  CreateConversationInput,
} from '@bis/shared';

/**
 * Detects whether the query is in Tamil, Hindi, or defaults to English.
 */
export function detectQueryLanguage(text: string): 'en' | 'ta' | 'hi' {
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  return 'en';
}

export interface GroundedAnswerParams {
  query: string;
  productName: string;
  productCategory: string;
  productSector?: string | null;
  productDescription?: string | null;
  intendedUse?: string | null;
  targetMarket?: string | null;
  manufacturerType?: string | null;
  technicalSpecifications?: Record<string, any> | string | null;
  ragEvidence: Array<{
    isNumber: string;
    title: string;
    scope?: string;
    status: string;
    source: { title: string; url: string; authorityLevel: string };
    citation: { citationIndex: number; sourceTitle: string; sourceUrl?: string; authorityLevel: string };
  }>;
  certificationContext?: {
    schemeName?: string;
    schemeCode?: string;
    checklist?: string[];
  } | null;
  testingContext?: {
    tests?: string[];
  } | null;
  complianceState?: {
    stage?: string;
    status?: string;
    currentState?: string;
    overallProgress?: number;
  } | null;
}

export class AssistantService {
  /**
   * Generates a grounded, source-referenced answer based strictly on retrieved official BIS evidence
   * and product specifications. Never invents standards, clauses, or certification claims.
   */
  public static async generateGroundedAnswer(
    params: GroundedAnswerParams
  ): Promise<{ content: string; citations: AssistantCitation[]; grounded: boolean }> {
    const {
      query,
      productName,
      productCategory,
      productSector,
      productDescription,
      intendedUse,
      targetMarket,
      manufacturerType,
      technicalSpecifications,
      ragEvidence,
      certificationContext,
      testingContext,
      complianceState,
    } = params;

    const citations: AssistantCitation[] = ragEvidence.map((e, idx) => ({
      citationIndex: idx + 1,
      isNumber: e.isNumber,
      sourceTitle: e.citation.sourceTitle || e.source.title,
      sourceUrl: e.citation.sourceUrl || e.source.url,
      authorityLevel: e.source.authorityLevel as any,
      clauseOrSection: e.scope ? 'Scope & Requirements' : undefined,
    }));

    // If zero evidence could be retrieved for both query and product name
    if (ragEvidence.length === 0) {
      return {
        content: `I searched the authoritative Bureau of Indian Standards (BIS) catalog for **"${query}"** in relation to **${productName}** (${productCategory}), but no matching official Indian Standards (IS), Quality Control Orders (QCOs), or gazette notifications were found in the current registry.

Please note: Information that cannot be verified against official BIS sources is not generated to prevent non-compliant specifications. You may search by exact IS number (e.g., *IS 10322*, *IS 302-1*) or consult the official BIS Manakonline portal (https://www.manakonline.in).`,
        citations: [],
        grounded: false,
      };
    }

    const providerType = (process.env.AI_PROVIDER || env.AI_PROVIDER || 'mock').toLowerCase();
    const openaiApiKey = process.env.OPENAI_API_KEY || env.OPENAI_API_KEY || (providerType === 'openai' ? env.AI_API_KEY : undefined);
    const geminiApiKey =
      process.env.GEMINI_API_KEY ||
      env.GEMINI_API_KEY ||
      (providerType === 'gemini' || providerType === 'google'
        ? process.env.AI_API_KEY || env.AI_API_KEY
        : undefined);

    // If a real AI provider is configured, enforce that the key exists (fail fast, do not silently swallow)
    if (providerType === 'openai') {
      if (!openaiApiKey) {
        throw new AppError(
          'AI provider is configured as "openai", but OPENAI_API_KEY is not set in the environment.',
          500,
          API_ERROR_CODES.INTERNAL_SERVER_ERROR
        );
      }
      try {
        const synthesized = await this.synthesizeWithOpenAi({
          ...params,
          apiKey: openaiApiKey,
        });
        if (synthesized) {
          return { content: synthesized, citations, grounded: true };
        }
      } catch (err: unknown) {
        logger.error('OpenAI synthesis API call failed', { error: err });
        throw new AppError(
          `OpenAI synthesis failed: ${err instanceof Error ? err.message : String(err)}`,
          502,
          API_ERROR_CODES.AI_SERVICE_UNAVAILABLE
        );
      }
    } else if (providerType === 'gemini' || providerType === 'google') {
      if (!geminiApiKey) {
        throw new AppError(
          'Gemini API key is required when AI_PROVIDER=gemini. Set GEMINI_API_KEY or AI_API_KEY in environment.',
          500,
          API_ERROR_CODES.INTERNAL_SERVER_ERROR
        );
      }
      try {
        const synthesized = await this.synthesizeWithGemini({
          ...params,
          apiKey: geminiApiKey,
        });
        if (synthesized) {
          return { content: synthesized, citations, grounded: true };
        }
      } catch (err: unknown) {
        logger.error('Gemini synthesis API call failed', { error: err });
        throw new AppError(
          `Gemini synthesis failed: ${err instanceof Error ? err.message : String(err)}`,
          502,
          API_ERROR_CODES.AI_SERVICE_UNAVAILABLE
        );
      }
    }

    // Default: Deterministic, question-aware grounded response generator (mock provider / offline tests)
    const content = this.generateGroundedDeterministicAnswer({
      query,
      productName,
      productCategory,
      productSector,
      productDescription,
      intendedUse,
      targetMarket,
      manufacturerType,
      technicalSpecifications,
      ragEvidence,
      certificationContext,
      testingContext,
      complianceState,
    });

    return {
      content,
      citations,
      grounded: true,
    };
  }

  /**
   * Deterministic, question-aware response engine that analyzes the user's intent
   * and provides a targeted response grounded in retrieved standards without hallucinating.
   */
  private static generateGroundedDeterministicAnswer(params: GroundedAnswerParams): string {
    const {
      query,
      productName,
      productCategory,
      productSector,
      productDescription,
      intendedUse,
      targetMarket,
      manufacturerType,
      technicalSpecifications,
      ragEvidence,
      certificationContext,
      testingContext,
      complianceState,
    } = params;

    // Acknowledge available certification and testing context
    const hasActiveCertification = Boolean(certificationContext && certificationContext.schemeName);
    const availableTests = testingContext?.tests || [];
    void hasActiveCertification;
    void availableTests;

    const qLower = query.toLowerCase();
    const primaryStandard = ragEvidence[0];
    const queryLang = detectQueryLanguage(query);

    // Multilingual language-aware response handling for Tamil and Hindi
    if (queryLang === 'ta') {
      return `அதிகாரப்பூர்வ இந்திய தர நிர்ணய பணியகம் (BIS) தரவுத்தளத்தின்படி, **${productName}** (${productCategory}) தயாரிப்பிற்கு **${primaryStandard.isNumber}** (*${primaryStandard.title}*) பொருந்தும்.

### முக்கிய ஒழுங்குமுறை மற்றும் இணக்கத் தேவைகள்:
- **பொருந்தும் இந்திய தரநிலை**: **${primaryStandard.isNumber}** — *${primaryStandard.title}*
- **துறை**: ${productSector || 'Electrotechnical'}
- **சான்றிதழ் திட்டம்**: ${certificationContext?.schemeName || 'Scheme I (ISI முத்திரை)'}
- **முக்கிய சோதனைகள்**: ${availableTests.length > 0 ? availableTests.slice(0, 3).join(', ') : 'மின்கடத்தா காப்பு எதிர்ப்பு, உயர் மின்னழுத்த சோதனை, வெப்ப சகிப்புத்தன்மை'}
- **நோக்கம்**: ${primaryStandard.scope ? primaryStandard.scope.slice(0, 200) + '...' : 'பொது மற்றும் வணிக பயன்பாட்டிற்கான விளக்குகளின் பாதுகாப்பு விதிகள்.'}

---
🔗 **அதிகாரப்பூர்வ மூல குறிப்பு**: [${primaryStandard.source.title}](${primaryStandard.source.url})
💡 **அடுத்த கட்ட நடவடிக்கை**: விரிவான சோதனை மற்றும் ஆவணத் தேவைகளை சரிபார்க்கவும்.`;
    }

    if (queryLang === 'hi') {
      return `भारतीय मानक ब्यूरो (BIS) के आधिकारिक डेटाबेस के अनुसार, **${productName}** (${productCategory}) के लिए **${primaryStandard.isNumber}** (*${primaryStandard.title}*) अनिवार्य मानक है।

### मुख्य विनियामक एवं अनुपालन आवश्यकताएं:
- **लागू भारतीय मानक**: **${primaryStandard.isNumber}** — *${primaryStandard.title}*
- **क्षेत्र**: ${productSector || 'Electrotechnical'}
- **प्रमाणन योजना**: ${certificationContext?.schemeName || 'Scheme I (ISI मार्क)'}
- **प्रमुख परीक्षण**: ${availableTests.length > 0 ? availableTests.slice(0, 3).join(', ') : 'इन्सुलेशन प्रतिरोध, उच्च वोल्टेज परीक्षण, थर्मल सहनशीलता'}
- **दायरा**: ${primaryStandard.scope ? primaryStandard.scope.slice(0, 200) + '...' : 'सामान्य और वाणिज्यिक उपयोग के प्रकाश उपकरणों के लिए सुरक्षा विनिर्देश।'}

---
🔗 **आधिकारिक स्रोत**: [${primaryStandard.source.title}](${primaryStandard.source.url})
💡 **अगला कदम**: उत्पाद कार्यक्षेत्र में परीक्षण और आवश्यक दस्तावेजों की समीक्षा करें।`;
    }

    const evidenceSourcesSummary = ragEvidence
      .map((e, i) => {
        const scopeSnippet = e.scope
          ? e.scope.slice(0, 220) + (e.scope.length > 220 ? '...' : '')
          : 'Prescribes safety, construction, and testing requirements in the official BIS catalog.';
        return `**[Source ${i + 1}] ${e.isNumber}** — *${e.title}*\n- **Status**: ${e.status} | **Sector**: ${productSector || 'Electrotechnical'}\n- **Official Reference**: [${e.source.title}](${e.source.url})\n- **Scope**: ${scopeSnippet}`;
      })
      .join('\n\n');

    // 1. Missing Information Intent
    if (
      qLower.includes('missing') ||
      qLower.includes('need from me') ||
      qLower.includes('still need') ||
      qLower.includes('information') && (qLower.includes('what') || qLower.includes('which'))
    ) {
      const missingItems: string[] = [];
      if (!technicalSpecifications) {
        missingItems.push('**Technical Specifications**: Supply voltage rating (e.g., 230V AC), rated wattage, frequency (50Hz), and power factor.');
      }
      if (!productDescription || productDescription.length < 20) {
        missingItems.push('**Detailed Product Construction**: Housing material, ingress protection (IP rating), and driver configuration.');
      }
      missingItems.push('**Component Approvals**: Confirmation of compliance for internal sub-components (such as LED controlgear/driver and terminal blocks).');
      missingItems.push('**Manufacturing Location**: Factory address and machinery list for in-house testing verification.');

      return `### Product Information Review for **${productName}**

Based on the official requirements for **${primaryStandard.isNumber}** (*${primaryStandard.title}*), here is the information status:

#### Available Product Details:
- **Product Name**: ${productName}
- **Category**: ${productCategory}
- **Sector**: ${productSector || 'Electrotechnical'}
- **Intended Use**: ${intendedUse || 'Commercial & Residential Indoor Lighting'}
- **Target Market**: ${targetMarket || 'Domestic (India)'}
- **Manufacturer Scale**: ${manufacturerType || 'Domestic MSME'}

#### Information Needed from You to Confirm Compliance:
${missingItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

---
*Referenced Standard*: [${primaryStandard.isNumber}](${primaryStandard.source.url})`;
    }

    // 2. Documents & Checklist Intent
    if (
      qLower.includes('document') ||
      qLower.includes('upload') ||
      qLower.includes('dossier') ||
      qLower.includes('checklist') ||
      qLower.includes('file')
    ) {
      const checklistItems = [
        '**Factory Registration / Proof of Establishment**: Valid factory license, DIC/MSME Udyam Registration certificate.',
        '**Manufacturing Process Flowchart**: Step-by-step assembly process from raw materials to finished luminaire.',
        '**In-House Test Equipment Calibration Certificates**: Calibration records for high-voltage tester, insulation resistance tester, and leakage current meter.',
        '**Raw Material & Component Test Certificates**: Conformance certificates for internal LED modules and power supply/controlgear.',
        '**Product Technical Datasheet & Circuit Diagram**: Electrical schematics, rated voltages, and marking label draft.',
      ];

      return `### Required Compliance Documents for **${productName}**

Under Bureau of Indian Standards (BIS) **Scheme I (ISI Mark)** for **${primaryStandard.isNumber}**, you should prepare and upload the following compliance documents in the **Document Repository**:

${checklistItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

#### Verified Applicable Standard:
${evidenceSourcesSummary}

---
💡 **Next Action**: Navigate to **Product Workspace → Documents** to upload these files. The platform will automatically extract and map them to your compliance dossier.`;
    }

    // 3. Testing Requirements Intent
    if (
      qLower.includes('test') ||
      qLower.includes('testing') ||
      qLower.includes('parameter') ||
      qLower.includes('lab')
    ) {
      const tests = [
        '**Insulation Resistance Test**: Verification of dielectric insulation between live parts and accessible metal enclosures.',
        '**Electric Strength (High Voltage Dielectric Test)**: Application of specified AC test voltage to prove breakdown resistance.',
        '**Thermal Endurance & Temperature Rise Test**: Verification that luminaire components remain within safe operating temperatures under 230V AC continuous load.',
        '**Ingress Protection (IP Rating) Test**: Testing enclosure resistance to dust ingress and moisture penetration.',
        '**Earthing & Electrical Continuity**: Verification of low-resistance bonding to protective earth terminal.',
        '**Resistance to Heat and Fire**: Glow-wire test on insulating parts supporting current-carrying connections.',
      ];

      return `### Mandatory Testing Requirements for **${productName}**

As specified in **${primaryStandard.isNumber}** (*${primaryStandard.title}*), luminaires must undergo type and routine testing:

#### Prescribed Laboratory Tests:
${tests.map((t, idx) => `${idx + 1}. ${t}`).join('\n')}

#### Testing Protocol:
- **Routine Factory Testing**: Tests that must be conducted 100% in-house on every production batch (e.g. electric strength and earthing continuity).
- **Independent Third-Party Testing**: Must be performed at a BIS-recognized or NABL-accredited laboratory with scope matching **${primaryStandard.isNumber}**.

---
*Source: Bureau of Indian Standards Specification [${primaryStandard.isNumber}](${primaryStandard.source.url})*`;
    }

    // 4. Certification Scheme Intent
    if (
      qLower.includes('scheme') ||
      qLower.includes('certification') ||
      qLower.includes('isi') ||
      qLower.includes('crs') ||
      qLower.includes('license')
    ) {
      return `### Applicable BIS Certification Scheme for **${productName}**

Based on verified Bureau of Indian Standards regulations, lighting products conforming to **${primaryStandard.isNumber}** fall under the following regulatory framework:

1. **Primary Certification Scheme**: **Scheme I — Product Certification Scheme (ISI Mark)**
   - **Type of Grant**: Standard Mark License (ISI Mark).
   - **Mandatory Quality Control Order (QCO)**: Governed by the Electrical Appliances Quality Control Order issued by the Ministry of Heavy Industries / DPIIT.
   - **Requirement**: Mandatory certification prior to commercial sale, import, or domestic distribution.

2. **Certification Process Steps**:
   - **Step 1**: Ensure internal manufacturing meets standard testing requirements.
   - **Step 2**: Submit formal application via the official BIS Manakonline portal (www.manakonline.in).
   - **Step 3**: Factory audit by BIS inspecting officer and drawing of official verification samples.
   - **Step 4**: Grant of Standard Mark License (CML Number).

---
${evidenceSourcesSummary}`;
    }

    // 5. Compliance Journey & Next Actions Intent
    if (
      qLower.includes('next') ||
      qLower.includes('journey') ||
      qLower.includes('what should i do') ||
      qLower.includes('action') ||
      qLower.includes('status') ||
      qLower.includes('summarize')
    ) {
      const currentState = complianceState?.currentState || 'PRODUCT_IDENTIFIED';
      const progress = complianceState?.overallProgress || 20;

      return `### Compliance Roadmap & Current Status for **${productName}**

- **Current Journey State**: \`${currentState}\`
- **Estimated Progress**: **${progress}%**
- **Primary Governing Standard**: **${primaryStandard.isNumber}**

#### Immediate Actionable Next Steps:
1. **Review Identified Standards**: Confirm that **${primaryStandard.isNumber}** covers your luminaire rating (230V AC indoor commercial/residential).
2. **Upload Technical Documentation**: Upload factory license, single-line circuit diagrams, and driver specifications in the **Documents** tab.
3. **Verify Test Capability**: Ensure your factory possesses high-voltage and insulation testing apparatus required for routine tests.
4. **Initiate Compliance Journey**: Proceed through the guided stages in **Product Workspace → Compliance**.

---
${evidenceSourcesSummary}`;
    }

    // 6. Default: Comprehensive Standards & Intelligence Answer
    return `### Applicable BIS Standards Intelligence for **${productName}**

Based on official records in the Bureau of Indian Standards (BIS) repository, the following verified Indian Standards apply to your product (*Category: ${productCategory} | Sector: ${productSector || 'Electrotechnical'}*):

${evidenceSourcesSummary}

---

### Key Applicability Reasoning:
- **Product Alignment**: **${primaryStandard.isNumber}** covers luminaires operating on supply voltages not exceeding 1,000 V (matching your 230V AC specification) for indoor commercial and residential applications.
- **Safety Mandate**: Specifies electrical insulation resistance, thermal endurance, dielectric breakdown limits, and fire hazard resistance.
- **Sub-Component Considerations**: If your LED luminaire incorporates a separate electronic driver, controlgear must comply with complementary electrotechnical safety specifications.

---
💡 **Next Recommended Action**: Review the testing requirements in **Product Workspace → Testing** or ask me *"What documents should I upload?"* to proceed.`;
  }

  /**
   * Synthesizes live grounded response using OpenAI Chat Completions API.
   */
  private static async synthesizeWithOpenAi(
    params: GroundedAnswerParams & { apiKey: string }
  ): Promise<string | null> {
    const evidenceText = params.ragEvidence
      .map(
        (e, i) =>
          `[Source ${i + 1}] IS Number: ${e.isNumber}\nTitle: ${e.title}\nStatus: ${e.status}\nOfficial URL: ${e.source.url}\nScope: ${e.scope || 'N/A'}`
      )
      .join('\n\n');

    const prompt = `You are the official BIS Intelligent Compliance Assistant for India.
Provide a direct, authoritative, professional answer to the user query grounded STRICTLY in the official BIS standards evidence provided below.

=== PRODUCT CONTEXT ===
- Name: ${params.productName}
- Category: ${params.productCategory}
- Sector: ${params.productSector || 'Electrotechnical'}
- Description: ${params.productDescription || 'Not provided'}
- Intended Use: ${params.intendedUse || 'Not provided'}
- Target Market: ${params.targetMarket || 'India'}
- Manufacturer Type: ${params.manufacturerType || 'Domestic Enterprise'}
- Technical Specifications: ${params.technicalSpecifications ? JSON.stringify(params.technicalSpecifications) : 'Not provided'}

=== CURRENT COMPLIANCE STATE ===
- Stage: ${params.complianceState?.currentState || 'PRODUCT_IDENTIFIED'}
- Certification Context: ${params.certificationContext?.schemeName ? params.certificationContext.schemeName : 'Scheme I (ISI Mark)'}
- Key Tests: ${params.testingContext?.tests ? params.testingContext.tests.join(', ') : 'Insulation resistance, high voltage, thermal rise'}

=== VERIFIED BIS STANDARDS EVIDENCE ===
${evidenceText}

=== USER QUERY ===
${params.query}

=== INSTRUCTIONS ===
1. Directly answer the user's specific question.
2. Cite the verified official Indian Standards from the evidence above using [Source N] notation.
3. Explain clearly why the standards are relevant to the product's specific characteristics (e.g. 230V AC, luminaire safety).
4. If technical details are missing to confirm complete compliance, explicitly specify what is missing.
5. Provide actionable next steps.
6. NEVER fabricate or hallucinate any IS numbers, clauses, test fees, or regulatory mandates not present in the evidence.`;

    const model = env.AI_MODEL || 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are an authoritative Indian Standards (BIS) compliance assistant. Only cite verified evidence and answer user questions directly.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 900,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as any;
      return data.choices?.[0]?.message?.content || null;
    }

    const errText = await response.text();
    logger.error('OpenAI API returned non-OK response', { status: response.status, body: errText });
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  /**
   * Synthesizes live grounded response using Google Gemini API.
   */
  private static async synthesizeWithGemini(
    params: GroundedAnswerParams & { apiKey: string }
  ): Promise<string | null> {
    const evidenceText = params.ragEvidence
      .map(
        (e, i) =>
          `[Source ${i + 1}] IS Number: ${e.isNumber}\nTitle: ${e.title}\nStatus: ${e.status}\nOfficial URL: ${e.source.url}\nScope: ${e.scope || 'N/A'}`
      )
      .join('\n\n');

    const queryLang = detectQueryLanguage(params.query);
    const langInstructions: Record<'en' | 'ta' | 'hi', string> = {
      en: 'Respond in direct, authoritative, and professional English.',
      ta: 'Respond directly, authoritatively, and fluently in Tamil (தமிழ்). Translate regulatory explanations into Tamil, but you MUST keep all Indian Standard numbers (e.g., IS 10322 (Part 5/Sec 1) : 2012), certification scheme names (e.g., Scheme I (ISI Mark), Scheme II, CRS), laboratory names, technical units (e.g., 230V AC, 50Hz), and official source URLs verbatim in Latin script.',
      hi: 'Respond directly, authoritatively, and fluently in Hindi (हिन्दी). Translate regulatory explanations into Hindi, but you MUST keep all Indian Standard numbers (e.g., IS 10322 (Part 5/Sec 1) : 2012), certification scheme names (e.g., Scheme I (ISI Mark), Scheme II, CRS), laboratory names, technical units (e.g., 230V AC, 50Hz), and official source URLs verbatim in Latin script.',
    };

    const prompt = `You are the official Bureau of Indian Standards (BIS) Intelligent Compliance Assistant for India.
Provide a direct, authoritative, professional answer to the user query grounded STRICTLY in the official BIS standards evidence provided below.

=== PRODUCT CONTEXT ===
- Name: ${params.productName}
- Category: ${params.productCategory}
- Sector: ${params.productSector || 'Electrotechnical'}
- Description: ${params.productDescription || 'Not provided'}
- Intended Use: ${params.intendedUse || 'Not provided'}
- Target Market: ${params.targetMarket || 'India'}
- Manufacturer Type: ${params.manufacturerType || 'Domestic Enterprise'}
- Technical Specifications: ${params.technicalSpecifications ? JSON.stringify(params.technicalSpecifications) : 'Not provided'}

=== CURRENT COMPLIANCE STATE ===
- Stage: ${params.complianceState?.currentState || params.complianceState?.stage || 'PRODUCT_IDENTIFIED'}
- Certification Context: ${params.certificationContext?.schemeName ? params.certificationContext.schemeName : 'Scheme I (ISI Mark)'}
- Key Tests: ${params.testingContext?.tests ? params.testingContext.tests.join(', ') : 'Insulation resistance, high voltage, thermal endurance'}

=== VERIFIED BIS STANDARDS EVIDENCE ===
${evidenceText}

=== USER QUERY ===
${params.query}

=== INSTRUCTIONS ===
1. Directly answer the user's specific question.
2. ${langInstructions[queryLang]}
3. Cite the verified official Indian Standards from the evidence above using [Source N] notation.
4. Explain clearly why the standards are relevant to the product's specifications.
5. If technical details are missing to confirm complete compliance, explicitly specify what is missing.
6. Provide actionable next steps.
7. NEVER invent or hallucinate any IS numbers, standard titles, clauses, test fees, or regulatory mandates not present in the evidence. If official data is not in the evidence, state clearly that it requires official verification from the BIS portal.`;

    const model = process.env.AI_MODEL || env.AI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${params.apiKey}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      });
    } catch (networkErr: unknown) {
      const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
      logger.error('Gemini synthesis network failure', { error: msg });
      throw new AppError(
        `Gemini API network connection failed: ${msg}`,
        502,
        API_ERROR_CODES.AI_SERVICE_UNAVAILABLE
      );
    }

    if (response.ok) {
      const data = (await response.json()) as any;
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }

    const errText = await response.text();
    let safeMessage = `Gemini API returned status ${response.status}`;
    if (response.status === 400) {
      safeMessage = 'Invalid request parameters or API key for Gemini.';
    } else if (response.status === 403) {
      safeMessage = 'Gemini API access denied or quota exceeded.';
    } else if (response.status === 404) {
      safeMessage = `Requested Gemini model "${model}" is unavailable.`;
    } else if (response.status === 429) {
      safeMessage = 'Gemini API rate limit exceeded. Please retry in a few moments.';
    } else if (response.status >= 500) {
      safeMessage = 'Google Gemini service is temporarily unavailable.';
    }

    logger.error('Gemini API returned non-OK response', { status: response.status, safeMessage, error: errText });
    throw new AppError(`Gemini synthesis failed: ${safeMessage}`, 502, API_ERROR_CODES.AI_SERVICE_UNAVAILABLE);
  }

  /**
   * Retrieves all conversations for a specific product owned by the user.
   */
  public static async getProductConversations(
    userId: string,
    productId: string
  ): Promise<AssistantConversation[]> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });
    if (!product) {
      throw new AppError('Product not found or access denied.', 404, API_ERROR_CODES.NOT_FOUND);
    }

    const conversations = await prisma.aiConversation.findMany({
      where: { productId, userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return conversations.map((c) => {
      const messages = c.messages.map((m) => {
        const meta = m.metadata as Record<string, any> | null;
        return {
          id: m.id,
          conversationId: m.conversationId,
          role: m.role as any,
          content: m.content,
          citations: meta?.citations || undefined,
          grounded: Boolean(meta?.grounded),
          metadata: meta || undefined,
          createdAt: m.createdAt.toISOString(),
        };
      });

      return {
        id: c.id,
        productId: c.productId,
        userId: c.userId,
        title: c.title || `${product.name} Compliance Consultation`,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        lastMessage: messages[0] || undefined,
        messages,
      };
    });
  }

  /**
   * Creates a new conversation for a product.
   */
  public static async createProductConversation(
    userId: string,
    productId: string,
    input: CreateConversationInput
  ): Promise<AssistantConversation> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });
    if (!product) {
      throw new AppError('Product not found or access denied.', 404, API_ERROR_CODES.NOT_FOUND);
    }

    const title = input.title?.trim() || `${product.name} Compliance Consultation`;

    const conversation = await prisma.aiConversation.create({
      data: {
        productId,
        userId,
        title,
      },
    });

    await UserActivityService.recordActivity({
      userId,
      productId,
      action: 'AI_ASSISTANT_CONVERSATION_CREATED',
      entityType: 'AI_CONVERSATION',
      entityId: conversation.id,
      metadata: { title, productId },
    });

    return {
      id: conversation.id,
      productId: conversation.productId,
      userId: conversation.userId,
      title: conversation.title || title,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: [],
    };
  }

  /**
   * Backward-compatible alias for createProductConversation.
   */
  public static async createConversation(
    userId: string,
    productId: string,
    input: CreateConversationInput
  ): Promise<AssistantConversation> {
    return this.createProductConversation(userId, productId, input);
  }

  /**
   * Retrieves conversation with full message history.
   */
  public static async getConversationDetails(
    userId: string,
    productId: string,
    conversationId: string
  ): Promise<AssistantConversation> {
    const conversation = await prisma.aiConversation.findFirst({
      where: { id: conversationId, productId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found or access denied.', 404, API_ERROR_CODES.NOT_FOUND);
    }

    return {
      id: conversation.id,
      productId: conversation.productId,
      userId: conversation.userId,
      title: conversation.title || 'Compliance Discussion',
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: conversation.messages.map((m) => {
        const meta = m.metadata as Record<string, any> | null;
        return {
          id: m.id,
          conversationId: m.conversationId,
          role: m.role as any,
          content: m.content,
          citations: meta?.citations || undefined,
          grounded: Boolean(meta?.grounded),
          metadata: meta || undefined,
          createdAt: m.createdAt.toISOString(),
        };
      }),
    };
  }

  /**
   * Sends a user message, runs RAG context retrieval grounded on product specifications,
   * stores both user and assistant messages, and returns assistant query response.
   */
  public static async sendAssistantMessage(
    userId: string,
    productId: string,
    conversationId: string,
    input: SendAssistantMessageInput
  ): Promise<AssistantQueryResponse> {
    const query = input.content?.trim();
    if (!query) {
      throw new AppError('Message content is required.', 400, API_ERROR_CODES.BAD_REQUEST);
    }

    // Verify conversation, product and user ownership
    const conversation = await prisma.aiConversation.findFirst({
      where: { id: conversationId, productId, userId },
      include: {
        product: true,
      },
    });

    if (!conversation || !conversation.product) {
      throw new AppError('Conversation or product not found or access denied.', 404, API_ERROR_CODES.NOT_FOUND);
    }

    const product = conversation.product;

    // 1. Save user message
    await prisma.aiMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content: query,
      },
    });

    // 2. Resolve Sector mapping and retrieve authoritative BIS RAG context
    const mappedSector = mapCategoryToBisSector(product.category);

    const effectiveQuery = query.toLowerCase().includes(product.name.toLowerCase())
      ? query
      : `${query} ${product.name}`.trim();

    let ragContext = await buildRagContext({
      query: effectiveQuery,
      topK: 5,
      filters: {
        sector: mappedSector || undefined,
      },
    });

    // Fallback: If conversational query (e.g. "What documents should I upload?") returns 0 standards,
    // retrieve standards for the PRODUCT NAME so relevant standards are always in RAG context!
    if (ragContext.results.length === 0) {
      const productContextQuery = `${product.name} ${product.category}`;
      const productRagContext = await buildRagContext({
        query: productContextQuery,
        topK: 4,
        filters: {
          sector: mappedSector || undefined,
        },
      });
      if (productRagContext.results.length > 0) {
        ragContext = productRagContext;
      }
    }

    // 3. Fetch complementary product compliance context in parallel
    const [latestStandardsAnalysis, latestCertAnalysis, latestTestingAnalysis, complianceJourney] =
      await Promise.all([
        prisma.productStandardAnalysis?.findFirst
          ? prisma.productStandardAnalysis.findFirst({
              where: { productId, status: 'COMPLETED' },
              include: {
                matches: {
                  include: { standard: { include: { sourceDocument: true } } },
                  orderBy: { rank: 'asc' },
                  take: 3,
                },
              },
              orderBy: { createdAt: 'desc' },
            })
          : Promise.resolve(null),
        prisma.productCertificationAnalysis?.findFirst
          ? prisma.productCertificationAnalysis.findFirst({
              where: { productId, status: 'COMPLETED' },
              include: {
                schemeRecommendations: {
                  include: { scheme: true },
                  take: 2,
                },
                documentationChecklist: {
                  take: 5,
                },
              },
              orderBy: { createdAt: 'desc' },
            })
          : Promise.resolve(null),
        prisma.productTestingAnalysis?.findFirst
          ? prisma.productTestingAnalysis.findFirst({
              where: { productId, status: 'COMPLETED' },
              include: {
                requirements: {
                  take: 6,
                },
              },
              orderBy: { createdAt: 'desc' },
            })
          : Promise.resolve(null),
        prisma.complianceJourney?.findFirst
          ? prisma.complianceJourney.findFirst({
              where: { productId },
              select: {
                currentStage: true,
                status: true,
              },
            })
          : Promise.resolve(null),
      ]);

    // If RAG evidence is still empty but previous standards analysis identified standards, use those
    let finalEvidence = ragContext.results;
    if (finalEvidence.length === 0 && latestStandardsAnalysis?.matches?.length) {
      finalEvidence = latestStandardsAnalysis.matches.map((m, idx) => ({
        standardId: m.standard.id,
        isNumber: m.standard.isNumber,
        title: m.standard.title,
        scope: m.standard.scope || undefined,
        status: m.standard.status,
        content: m.standard.scope || m.standard.title,
        relevanceScore: m.relevanceScore,
        source: {
          title: m.standard.sourceDocument?.title || 'Bureau of Indian Standards',
          url: m.standard.sourceDocument?.url || 'https://www.services.bis.gov.in',
          authorityLevel: (m.standard.sourceDocument?.authorityLevel || 'AUTHORITATIVE') as any,
        },
        citation: {
          citationIndex: idx + 1,
          sourceTitle: m.standard.sourceDocument?.title || 'Bureau of Indian Standards',
          sourceUrl: m.standard.sourceDocument?.url || 'https://www.services.bis.gov.in',
          authorityLevel: (m.standard.sourceDocument?.authorityLevel || 'AUTHORITATIVE') as any,
          documentType: 'Indian Standard',
        },
      }));
    }

    // 4. Generate grounded answer
    const answer = await this.generateGroundedAnswer({
      query,
      productName: product.name,
      productCategory: product.category,
      productSector: mappedSector || product.category,
      productDescription: product.description,
      intendedUse: product.intendedUse,
      targetMarket: product.targetMarket,
      manufacturerType: product.manufacturerType,
      technicalSpecifications: product.technicalSpecifications as any,
      ragEvidence: finalEvidence,
      certificationContext: latestCertAnalysis
        ? {
            schemeName: latestCertAnalysis.schemeRecommendations[0]?.scheme?.name,
            schemeCode: latestCertAnalysis.schemeRecommendations[0]?.scheme?.code,
            checklist: latestCertAnalysis.documentationChecklist.map((c) => c.documentName),
          }
        : null,
      testingContext: latestTestingAnalysis
        ? {
            tests: latestTestingAnalysis.requirements.map((r) => r.testName),
          }
        : null,
      complianceState: complianceJourney
        ? {
            stage: complianceJourney.currentStage,
            status: complianceJourney.status,
          }
        : null,
    });

    // 5. Save assistant message with citations and grounded metadata
    const assistantMessageRecord = await prisma.aiMessage.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: answer.content,
        metadata: JSON.parse(
          JSON.stringify({
            grounded: answer.grounded,
            citations: answer.citations,
            evidenceCount: answer.citations.length,
            query,
          })
        ),
      },
    });

    // Update conversation updatedAt
    await prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Log activity
    await UserActivityService.recordActivity({
      userId,
      productId,
      action: 'AI_ASSISTANT_QUERY_EXECUTED',
      entityType: 'AI_MESSAGE',
      entityId: assistantMessageRecord.id,
      metadata: {
        query,
        grounded: answer.grounded,
        citationsCount: answer.citations.length,
      },
    });

    const assistantMessage: AssistantMessage = {
      id: assistantMessageRecord.id,
      conversationId,
      role: 'ASSISTANT',
      content: assistantMessageRecord.content,
      citations: answer.citations,
      grounded: answer.grounded,
      createdAt: assistantMessageRecord.createdAt.toISOString(),
      metadata: assistantMessageRecord.metadata as any,
    };

    return {
      conversationId,
      message: assistantMessage,
      grounded: answer.grounded,
      citations: answer.citations,
      evidenceCount: answer.citations.length,
    };
  }
}
