// ─────────────────────────────────────────────────────────────────────────────
//  ConsumerStandardSearchService — Consumer-friendly Indian Standards search
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import type {
  ConsumerStandardsQuery,
  ConsumerStandardsResponse,
  ConsumerStandardSearchResult,
  SupportedLanguage,
} from '@bis/shared';
import { ConsumerExplanationService } from './consumer-explanation.service.js';

export class ConsumerStandardSearchService {
  // Multilingual term expansion map
  private static readonly MULTILINGUAL_SYNONYMS: Record<string, string[]> = {
    தலைக்கவசம்: ['helmet', 'protective', 'IS 4151'],
    ஹெல்மெட்: ['helmet', 'protective', 'IS 4151'],
    हेलमेट: ['helmet', 'protective', 'IS 4151'],
    தங்கம்: ['gold', 'hallmark', 'IS 1417', 'jewellery'],
    நகை: ['jewellery', 'gold', 'IS 1417'],
    सोना: ['gold', 'hallmark', 'IS 1417', 'jewellery'],
    आभूषण: ['jewellery', 'gold', 'IS 1417'],
    விளக்கு: ['luminaire', 'lighting', 'lamp', 'IS 10322', 'led'],
    விளக்குகள்: ['luminaire', 'lighting', 'lamp', 'IS 10322', 'led'],
    प्रकाश: ['luminaire', 'lighting', 'lamp', 'IS 10322', 'led'],
    லைட்: ['luminaire', 'lighting', 'lamp', 'IS 10322', 'led'],
    பாட்டில்: ['bottle', 'container', 'flask'],
    बोतल: ['bottle', 'container', 'flask'],
    எஃகு: ['steel', 'stainless', 'bar'],
    इस्पात: ['steel', 'stainless', 'bar'],
    சிமெண்ட்: ['cement', 'concrete'],
    सीमेंट: ['cement', 'concrete'],
  };

  /**
   * Search Indian Standards for consumers and enrich with plain-language explanations.
   */
  public static async searchStandards(
    query: ConsumerStandardsQuery & { language?: SupportedLanguage }
  ): Promise<ConsumerStandardsResponse> {
    const rawQuery = (query.q || '').trim();
    if (!rawQuery) {
      return {
        query: rawQuery,
        results: [],
        total: 0,
        sourceCount: 0,
      };
    }

    const limit = Math.min(20, Math.max(1, Number(query.limit) || 10));
    const language: SupportedLanguage = query.language || 'en';

    // Expand query with multilingual synonyms
    const queryTerms = [rawQuery];
    for (const [key, synonyms] of Object.entries(this.MULTILINGUAL_SYNONYMS)) {
      if (rawQuery.includes(key) || key.includes(rawQuery)) {
        queryTerms.push(...synonyms);
      }
    }

    const orConditions: any[] = [];
    for (const term of queryTerms) {
      orConditions.push(
        { isNumber: { contains: term, mode: 'insensitive' } },
        { canonicalNumber: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
        { scope: { contains: term, mode: 'insensitive' } },
        { sector: { contains: term, mode: 'insensitive' } },
        { department: { contains: term, mode: 'insensitive' } }
      );
    }

    // Search standards table with QCO mappings and source documents
    const standards = await prisma.standard.findMany({
      where: {
        OR: orConditions,
        isActive: true,
      },
      include: {
        sourceDocument: true,
        qcoMappings: {
          include: {
            qco: true,
          },
        },
      },
      take: limit,
      orderBy: { isNumber: 'asc' },
    });

    const results: ConsumerStandardSearchResult[] = standards.map((std: any) => {
      const activeQco = std.qcoMappings?.find(
        (m: any) => m.qco?.status === 'ACTIVE' || m.qco?.status === 'ENFORCED'
      );
      const isMandatoryQco = Boolean(activeQco);
      const qcoName =
        activeQco?.qco?.title || (isMandatoryQco ? 'Mandatory Quality Control Order' : null);

      const standardNumber = std.isNumber || std.standardNumber || 'IS';
      const sourceUrl = std.sourceDocument?.url || 'https://www.standardsbis.in';

      const explanation = ConsumerExplanationService.generateExplanation({
        standardNumber,
        title: std.title,
        scope: std.scope,
        isMandatoryQco,
        qcoName,
        sourceUrl,
        language,
      });

      const publicationYear = std.publicationDate
        ? new Date(std.publicationDate).getFullYear()
        : std.publicationYear || null;

      return {
        standardNumber,
        title: std.title,
        scope: std.scope,
        status: std.status,
        publicationYear,
        isMandatoryQco,
        qcoName,
        sourceUrl,
        consumerExplanation: explanation,
      };
    });

    return {
      query: rawQuery,
      results,
      total: results.length,
      sourceCount: results.filter((r) => r.sourceUrl).length,
    };
  }
}
