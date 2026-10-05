import { executeHybridSearch } from './hybridSearch.js';
import {
  RagRetrieveInput,
  RagContextResponse,
  RagContextEvidenceItem,
  RagContextCitation,
  AuthorityLevel,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  RAG Context Builder & Source Grounding Service (Phase 5)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MAX_CHARACTERS = 6000;
const DEFAULT_TOP_K = 5;

/**
 * Builds structured, source-grounded RAG context for a user or product query.
 * Prepares strict citation evidence blocks without generating synthetic AI answers.
 */
export async function buildRagContext(input: RagRetrieveInput): Promise<RagContextResponse> {
  const query = input.query ? input.query.trim() : '';
  const topK = input.topK || DEFAULT_TOP_K;
  const maxChars = input.maxCharacters || DEFAULT_MAX_CHARACTERS;

  // 1. Retrieve top standards using Hybrid Search
  let searchRes = await executeHybridSearch({
    q: query,
    mode: 'hybrid',
    sector: input.filters?.sector,
    department: input.filters?.department,
    status: input.filters?.status,
    authorityLevel: input.filters?.authorityLevel,
    limit: topK,
    page: 1,
  });

  // Fallback: If sector constraint returned zero results, retry without sector filter
  if (searchRes.results.length === 0 && input.filters?.sector) {
    searchRes = await executeHybridSearch({
      q: query,
      mode: 'hybrid',
      department: input.filters?.department,
      status: input.filters?.status,
      authorityLevel: input.filters?.authorityLevel,
      limit: topK,
      page: 1,
    });
  }

  const results: RagContextEvidenceItem[] = [];
  const citations: RagContextCitation[] = [];
  const textBlocks: string[] = [];

  let currentLength = 0;
  let truncated = false;
  let citationCounter = 1;

  for (const std of searchRes.results) {
    if (currentLength >= maxChars) {
      truncated = true;
      break;
    }

    const citationIndex = citationCounter++;
    const sourceDoc = std.sourceDocument;
    const authorityLevel: AuthorityLevel = sourceDoc?.authorityLevel || 'AUTHORITATIVE';

    const citation: RagContextCitation = {
      citationIndex,
      standardId: std.id,
      isNumber: std.isNumber,
      sourceTitle: sourceDoc?.title || 'Bureau of Indian Standards',
      sourceUrl: sourceDoc?.url || 'https://www.services.bis.gov.in',
      authorityLevel,
      documentType: sourceDoc?.documentType || 'Indian Standard',
      clauseOrSection: std.scope ? 'Scope & Requirements' : undefined,
    };

    citations.push(citation);

    // Build Evidence Text Block
    const evidenceHeader = `[Source ${citationIndex}] ${std.isNumber} — ${std.title}`;
    const evidenceMeta = `Sector: ${std.sector || 'General'} | Status: ${std.status} | Edition: ${std.currentEdition || 'Current'}`;
    const evidenceSource = `Official Source: ${citation.sourceTitle} (${citation.sourceUrl}) [Authority: ${citation.authorityLevel}]`;
    const evidenceBody = std.scope ? `Scope & Specifications:\n${std.scope}` : 'Technical specifications registered in official BIS catalogue.';

    const fullBlock = [
      '==================================================',
      evidenceHeader,
      evidenceMeta,
      evidenceSource,
      '--------------------------------------------------',
      evidenceBody,
      '==================================================',
    ].join('\n');

    if (currentLength + fullBlock.length > maxChars) {
      truncated = true;
      if (textBlocks.length === 0) {
        const sliced = fullBlock.slice(0, maxChars);
        textBlocks.push(sliced);
        currentLength += sliced.length;
        results.push({
          standardId: std.id,
          isNumber: std.isNumber,
          title: std.title,
          scope: std.scope,
          status: std.status,
          content: evidenceBody.slice(0, Math.max(0, maxChars - 100)),
          relevanceScore: std.relevanceScore,
          source: {
            title: citation.sourceTitle,
            url: citation.sourceUrl,
            authorityLevel: citation.authorityLevel,
          },
          citation,
        });
      }
      break;
    }

    textBlocks.push(fullBlock);
    currentLength += fullBlock.length;

    results.push({
      standardId: std.id,
      isNumber: std.isNumber,
      title: std.title,
      scope: std.scope,
      status: std.status,
      content: evidenceBody,
      relevanceScore: std.relevanceScore,
      source: {
        title: citation.sourceTitle,
        url: citation.sourceUrl,
        authorityLevel: citation.authorityLevel,
      },
      citation,
    });
  }

  const preamble = textBlocks.length > 0 ? '### APPLICABLE INDIAN STANDARDS (AUTHORITATIVE SEED CATALOG)\n\n' : '';
  const contextText = preamble + textBlocks.join('\n\n');

  return {
    query,
    topK,
    totalEvidenceChunks: results.length,
    contextText,
    results,
    citations,
    meta: {
      characterCount: contextText.length,
      truncated,
      generatedAt: new Date().toISOString(),
    },
  };
}
