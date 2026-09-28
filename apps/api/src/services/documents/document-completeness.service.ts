import type {
  ProductDocumentCompletenessResponse,
  DocumentCompletenessStatus,
  ChecklistMatchStatus,
  DocumentType,
} from '@bis/shared';

export class DocumentCompletenessService {
  /**
   * Calculates explainable document completeness and compliance readiness.
   */
  calculateCompleteness(
    documents: any[],
    checklistItems: any[],
    testRequirements: any[] = []
  ): ProductDocumentCompletenessResponse {
    const totalRequired = checklistItems.length > 0 ? checklistItems.length : 5;
    const activeDocs = documents.filter((d) => d.isCurrent !== false);

    // Map matched checklist items
    const matchedChecklistItemIds = new Set<string>();
    const verifiedChecklistItemIds = new Set<string>();
    const expiredChecklistItemIds = new Set<string>();
    const needsReviewChecklistItemIds = new Set<string>();

    const docMatchMap = new Map<string, any>();

    for (const doc of activeDocs) {
      if (doc.checklistMatches && Array.isArray(doc.checklistMatches)) {
        for (const match of doc.checklistMatches) {
          if (match.checklistItemId) {
            matchedChecklistItemIds.add(match.checklistItemId);
            docMatchMap.set(match.checklistItemId, { doc, match });

            if (doc.verificationStatus === 'VERIFIED') {
              verifiedChecklistItemIds.add(match.checklistItemId);
            } else if (doc.verificationStatus === 'NEEDS_REVIEW' || match.matchStatus === 'NEEDS_REVIEW') {
              needsReviewChecklistItemIds.add(match.checklistItemId);
            }

            if (match.matchStatus === 'EXPIRED') {
              expiredChecklistItemIds.add(match.checklistItemId);
            }
          }
        }
      }
    }

    const verifiedCount = verifiedChecklistItemIds.size;
    const matchedCount = matchedChecklistItemIds.size;
    const needsReviewCount = needsReviewChecklistItemIds.size + activeDocs.filter((d) => d.verificationStatus === 'UNVERIFIED').length;
    const expiredCount = expiredChecklistItemIds.size;
    const missingCount = Math.max(0, totalRequired - matchedCount);

    // Score calculation (0 - 100)
    let score = 0;
    if (totalRequired > 0) {
      const matchScore = (matchedCount / totalRequired) * 60;
      const verifyScore = (verifiedCount / totalRequired) * 40;
      score = Math.round(Math.min(100, matchScore + verifyScore));
      if (expiredCount > 0) {
        score = Math.max(0, score - expiredCount * 15);
      }
    }

    // Determine status
    let status: DocumentCompletenessStatus = 'INSUFFICIENT_EVIDENCE';
    if (activeDocs.length === 0) {
      status = 'INSUFFICIENT_EVIDENCE';
    } else if (missingCount === 0 && score >= 90 && needsReviewCount === 0) {
      status = 'COMPLETE';
    } else if (missingCount > 0 && score < 50) {
      status = 'MISSING_DOCUMENTS';
    } else if (needsReviewCount > 0 || expiredCount > 0) {
      status = 'NEEDS_REVIEW';
    } else {
      status = 'PARTIALLY_COMPLETE';
    }

    // Identify missing document items
    const missingDocumentTypes: {
      category: string;
      title: string;
      reason: string;
      suggestedDocumentType: DocumentType;
    }[] = [];

    const checklistBreakdown: {
      id: string;
      category: string;
      title: string;
      requiredStatus: string;
      matchStatus: ChecklistMatchStatus;
      matchedDocumentId?: string | null;
      matchedDocumentName?: string | null;
      evidenceSnippet?: string | null;
    }[] = [];

    for (const item of checklistItems) {
      const isMatched = matchedChecklistItemIds.has(item.id);
      const matchData = docMatchMap.get(item.id);

      let itemMatchStatus: ChecklistMatchStatus = 'MISSING';
      if (isMatched) {
        if (matchData?.doc?.verificationStatus === 'VERIFIED') {
          itemMatchStatus = 'VERIFIED';
        } else if (matchData?.match?.matchStatus === 'EXPIRED') {
          itemMatchStatus = 'EXPIRED';
        } else {
          itemMatchStatus = matchData?.match?.matchStatus || 'MATCHED';
        }
      } else {
        missingDocumentTypes.push({
          category: item.category || 'General',
          title: item.documentName || 'Required Compliance Document',
          reason: item.reason || 'Required as per BIS certification scheme checklist',
          suggestedDocumentType: this.inferSuggestedDocumentType(item.category, item.documentName),
        });
      }

      checklistBreakdown.push({
        id: item.id,
        category: item.category || 'General',
        title: item.documentName || 'Document Requirement',
        requiredStatus: item.requiredStatus || 'REQUIRED',
        matchStatus: itemMatchStatus,
        matchedDocumentId: matchData?.doc?.id || null,
        matchedDocumentName: matchData?.doc?.originalFileName || null,
        evidenceSnippet: matchData?.match?.evidenceSnippet || null,
      });
    }

    // Identify blockers & next steps
    const blockers: string[] = [];
    const nextSteps: string[] = [];

    if (activeDocs.length === 0) {
      blockers.push('No compliance documents uploaded yet.');
      nextSteps.push('Upload official laboratory test report and factory calibration certificates.');
    }

    if (expiredCount > 0) {
      blockers.push(`${expiredCount} document(s) detected as EXPIRED (e.g. calibration or validity due date passed).`);
      nextSteps.push('Obtain and upload renewed calibration certificates or test reports.');
    }

    if (missingCount > 0) {
      blockers.push(`${missingCount} mandatory document(s) missing from the compliance dossier.`);
      nextSteps.push('Complete the statutory document checklist before official BIS submission.');
    }

    if (needsReviewCount > 0) {
      nextSteps.push(`Review and verify ${needsReviewCount} document(s) marked for human verification.`);
    }

    if (testRequirements.length > 0 && !activeDocs.some((d) => d.documentType === 'TEST_REPORT')) {
      blockers.push('Independent test report from a BIS-recognized / NABL-accredited laboratory is missing.');
      nextSteps.push('Conduct required standard tests and attach valid laboratory report.');
    }

    if (blockers.length === 0 && score >= 90) {
      nextSteps.push('Dossier is complete. Proceed to official application submission on Manakonline / CRS portal.');
    }

    return {
      score,
      status,
      totalRequired,
      verifiedCount,
      matchedCount,
      needsReviewCount,
      missingCount,
      expiredCount,
      missingDocumentTypes,
      checklistBreakdown,
      blockers,
      nextSteps,
      calculatedAt: new Date().toISOString(),
    };
  }

  private inferSuggestedDocumentType(category: string, title: string): DocumentType {
    const text = `${category} ${title}`.toLowerCase();
    if (text.includes('test report') || text.includes('lab')) return 'TEST_REPORT';
    if (text.includes('calibration') || text.includes('equipment')) return 'CALIBRATION_CERTIFICATE';
    if (text.includes('layout') || text.includes('plant')) return 'FACTORY_LAYOUT';
    if (text.includes('quality') || text.includes('sti') || text.includes('inspection plan')) return 'QUALITY_CONTROL_DOCUMENT';
    if (text.includes('raw material') || text.includes('tc')) return 'RAW_MATERIAL_DOCUMENT';
    if (text.includes('declaration') || text.includes('undertaking')) return 'DECLARATION_OF_CONFORMITY';
    if (text.includes('incorporation') || text.includes('pan') || text.includes('gst') || text.includes('identity')) return 'IDENTITY_DOCUMENT';
    if (text.includes('manual') || text.includes('specification')) return 'TECHNICAL_SPECIFICATION';
    return 'OTHER';
  }
}
