import { prisma } from '../../db/client.js';
import type {
  LaboratoryMatchResult,
  LaboratoryItem,
  ProductTestRequirementItem,
  LaboratoryFilterParams,
} from '@bis/shared';

/**
 * Matches available registered laboratories against product test requirements and standards.
 */
export async function matchLaboratories(
  standards: any[],
  testRequirements: ProductTestRequirementItem[],
  filters?: LaboratoryFilterParams
): Promise<LaboratoryMatchResult[]> {
  const standardIds = standards.map((s) => s.id).filter(Boolean);
  const standardNumbers = standards.map((s) => s.isNumber || s.title || '');

  // 1. Build laboratory query with pagination and filters
  const whereClause: any = {
    isActive: true,
  };

  if (filters?.state && filters.state !== 'ALL') {
    whereClause.state = { contains: filters.state, mode: 'insensitive' };
  }

  if (filters?.city && filters.city !== 'ALL') {
    whereClause.city = { contains: filters.city, mode: 'insensitive' };
  }

  if (filters?.recognitionStatus) {
    if (filters.recognitionStatus === 'BIS_RECOGNIZED') {
      whereClause.OR = [
        { isBisLab: true },
        { organizationType: 'BIS_RECOGNIZED' },
        { organizationType: 'BIS_AND_NABL' },
      ];
    }
  }

  if (filters?.accreditationStatus) {
    if (filters.accreditationStatus === 'ACCREDITED') {
      whereClause.isNabl = true;
    }
  }

  // Load laboratories with capabilities
  const laboratories = await prisma.laboratory.findMany({
    where: whereClause,
    include: {
      sourceDocument: true,
      capabilities: {
        include: {
          standard: true,
          sourceDocument: true,
        },
      },
    },
    take: filters?.limit || 50,
  });

  const results: LaboratoryMatchResult[] = [];

  for (const lab of laboratories) {
    // Check matched standards
    const matchedStdSet = new Set<string>();
    const matchedTestSet = new Set<string>();

    let hasStandardMatch = false;

    for (const cap of lab.capabilities) {
      // Standard matching
      const capStdNumber = cap.standard?.isNumber || cap.scopeDescription || '';
      const isDirectStd = cap.standardId && standardIds.includes(cap.standardId);
      const isTextStd = standardNumbers.some((num) => {
        const canonicalNum = num.replace(/[^0-9]/g, '');
        return (
          canonicalNum.length > 2 &&
          (capStdNumber.includes(num) || capStdNumber.replace(/[^0-9]/g, '').includes(canonicalNum))
        );
      });

      if (isDirectStd || isTextStd) {
        hasStandardMatch = true;
        if (cap.standard?.isNumber) {
          matchedStdSet.add(cap.standard.isNumber);
        } else {
          matchedStdSet.add(capStdNumber);
        }

        if (cap.testName) {
          matchedTestSet.add(cap.testName);
        }
      }

      // Test name fuzzy matching against requirements
      for (const req of testRequirements) {
        if (
          cap.testName?.toLowerCase().includes(req.testName.toLowerCase()) ||
          cap.scopeDescription?.toLowerCase().includes(req.testName.toLowerCase())
        ) {
          matchedTestSet.add(req.testName);
        }
      }
    }

    // Match scoring calculation
    let matchScore = 0.0;
    if (hasStandardMatch) matchScore += 0.50;
    if (matchedTestSet.size > 0) matchScore += Math.min(0.30, matchedTestSet.size * 0.10);
    if (lab.isBisLab || lab.organizationType === 'BIS_RECOGNIZED' || lab.organizationType === 'BIS_AND_NABL') {
      matchScore += 0.15;
    }
    if (lab.isNabl) matchScore += 0.05;

    // Filter out labs with 0 score unless general browsing
    if (matchScore === 0 && standardIds.length > 0) {
      continue;
    }

    const capabilityMatch: 'HIGH' | 'PARTIAL' | 'UNVERIFIED' =
      matchScore >= 0.65 ? 'HIGH' : matchScore >= 0.35 ? 'PARTIAL' : 'UNVERIFIED';

    const labItem: LaboratoryItem = {
      id: lab.id,
      name: lab.name,
      code: lab.code,
      organizationType: lab.organizationType as any,
      address: lab.address,
      city: lab.city,
      state: lab.state,
      country: lab.country,
      pincode: lab.pincode,
      phone: lab.phone,
      email: lab.email,
      website: lab.website,
      status: lab.status,
      sourceDocumentId: lab.sourceDocumentId,
      sourceTitle: lab.sourceDocument?.title || 'BIS Official Directory',
      sourceUrl: lab.sourceUrl || lab.sourceDocument?.url || 'https://www.lims.bis.gov.in',
      authorityLevel: lab.authorityLevel,
      isVerified: lab.isVerified,
      lastVerifiedAt: lab.lastVerifiedAt?.toISOString() || null,
      capabilities: lab.capabilities.map((c) => ({
        id: c.id,
        laboratoryId: c.laboratoryId,
        standardId: c.standardId,
        standardNumber: c.standard?.isNumber || null,
        standardTitle: c.standard?.title || null,
        testName: c.testName,
        testMethod: c.testMethod,
        scopeDescription: c.scopeDescription,
        accreditationStatus: c.accreditationStatus as any,
        recognitionStatus: c.recognitionStatus as any,
        sourceTitle: c.sourceDocument?.title || null,
        sourceUrl: c.sourceUrl || c.sourceDocument?.url || null,
        verifiedAt: c.verifiedAt?.toISOString() || null,
      })),
    };

    results.push({
      laboratory: labItem,
      capabilityMatch,
      matchScore: Number(matchScore.toFixed(2)),
      matchedTests: Array.from(matchedTestSet),
      matchedStandards: Array.from(matchedStdSet),
      recognitionStatus:
        lab.isBisLab || lab.organizationType === 'BIS_RECOGNIZED' || lab.organizationType === 'BIS_AND_NABL'
          ? 'BIS_RECOGNIZED'
          : 'NOT_BIS_RECOGNIZED',
      accreditationStatus: lab.isNabl ? 'ACCREDITED' : 'NOT_ACCREDITED',
      source: {
        title: lab.sourceDocument?.title || 'BIS LIMS Laboratory Directory',
        url: lab.sourceUrl || 'https://www.lims.bis.gov.in',
        authorityLevel: lab.authorityLevel,
      },
    });
  }

  // Sort by matchScore descending
  return results.sort((a, b) => b.matchScore - a.matchScore);
}
