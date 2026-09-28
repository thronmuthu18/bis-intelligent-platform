import crypto from 'crypto';
import { prisma } from '../../db/client.js';
import { logger } from '../../config/logger.js';
import type {
  ComplianceRequirementType,
  ComplianceRequirementStatus,
  MandatoryStatus,
  RequirementPriority,
} from '@bis/shared';

export interface NormalizedRequirementInput {
  standardId?: string | null;
  requirementType: ComplianceRequirementType;
  sourceEntityType: string;
  sourceEntityId?: string | null;
  title: string;
  description?: string | null;
  mandatoryStatus: MandatoryStatus;
  priority: RequirementPriority;
  status: ComplianceRequirementStatus;
  evidenceRequired: boolean;
  sourceDocumentId?: string | null;
  sourceUrl?: string | null;
  sourceAuthority: 'AUTHORITATIVE' | 'REFERENCE' | 'UNVERIFIED';
  evidence?: any;
  prerequisiteKeys?: string[];
  dedupKey: string;
}

export interface OrchestrationResult {
  inputHash: string;
  requirements: NormalizedRequirementInput[];
  confirmedStandards: Array<{
    id: string;
    isNumber: string;
    title: string;
    status: string;
    schemeTitle?: string;
  }>;
}

export class MultiStandardOrchestratorService {
  /**
   * Orchestrates requirements across all confirmed / applicable standards for a product.
   */
  async orchestrateProductRequirements(productId: string): Promise<OrchestrationResult> {
    logger.info('Orchestrating multi-standard compliance requirements', { productId });

    const product: any = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        attributes: true,
        standardReviews: {
          include: {
            standard: {
              include: {
                amendments: true,
                qcoMappings: {
                  include: { qco: { include: { sourceDocument: true } } },
                },
                schemeMappings: {
                  include: { scheme: true },
                },
                sourceDocument: true,
              },
            },
          },
        },
        certificationAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            schemeRecommendations: {
              include: { scheme: true },
            },
            documentationChecklist: {
              include: { scheme: true },
            },
          },
        },
        testingAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            requirements: true,
          },
        },
        laboratoryReviews: {
          include: {
            laboratory: true,
          },
        },
        documents: {
          include: {
            testMatches: true,
            checklistMatches: true,
          },
        },
        documentCompletenessAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // 1. Identify relevant/confirmed standards
    const confirmedReviews = product.standardReviews.filter(
      (r: any) => r.decision === 'CONFIRMED'
    );

    const targetStandards = confirmedReviews.length > 0
      ? confirmedReviews.map((r: any) => r.standard)
      : product.standardReviews.map((r: any) => r.standard);

    const latestCertAnalysis = product.certificationAnalyses[0];
    const latestTestingAnalysis = product.testingAnalyses[0];
    const latestCompleteness = product.documentCompletenessAnalyses[0];
    const verifiedDocs = product.documents.filter((d: any) => d.verificationStatus === 'VERIFIED');

    const requirements: NormalizedRequirementInput[] = [];
    const requirementKeysMap = new Map<string, NormalizedRequirementInput>();

    // Helper to add or merge requirement
    const addRequirement = (req: NormalizedRequirementInput) => {
      const existing = requirementKeysMap.get(req.dedupKey);
      if (existing) {
        if (req.evidence && existing.evidence) {
          existing.evidence = {
            ...existing.evidence,
            sharedStandards: [
              ...(existing.evidence.sharedStandards || []),
              req.evidence.standardNumber || req.standardId,
            ].filter(Boolean),
          };
        }
      } else {
        requirementKeysMap.set(req.dedupKey, req);
        requirements.push(req);
      }
    };

    // 2. Base Product Information Requirement
    const hasAttributes = product.attributes.length > 0;
    addRequirement({
      requirementType: 'APPLICATION',
      sourceEntityType: 'Product',
      sourceEntityId: product.id,
      title: 'Complete Base Product Specifications & Attributes',
      description: `Provide technical specifications, manufacturer details, and operating parameters for ${product.name}.`,
      mandatoryStatus: 'MANDATORY',
      priority: 'HIGH',
      status: hasAttributes ? 'COMPLETED' : 'NOT_STARTED',
      evidenceRequired: true,
      sourceAuthority: 'AUTHORITATIVE',
      evidence: {
        productId: product.id,
        attributeCount: product.attributes.length,
      },
      dedupKey: 'REQ_BASE_PRODUCT_INFO',
    });

    // 3. Multi-Standard Requirements & QCOs
    for (const std of targetStandards) {
      const stdKey = `REQ_STD_${std.id}`;

      // A. Standard Confirmation Requirement
      addRequirement({
        standardId: std.id,
        requirementType: 'STANDARD',
        sourceEntityType: 'Standard',
        sourceEntityId: std.id,
        title: `Comply with Standard ${std.isNumber}: ${std.title}`,
        description: std.scope || `Mandatory or voluntary compliance for ${std.isNumber}`,
        mandatoryStatus: 'MANDATORY',
        priority: 'CRITICAL',
        status: 'COMPLETED',
        evidenceRequired: true,
        sourceDocumentId: std.sourceDocumentId,
        sourceUrl: std.sourceDocument?.url || std.bisUrl,
        sourceAuthority: 'AUTHORITATIVE',
        evidence: {
          isNumber: std.isNumber,
          standardTitle: std.title,
          status: std.status,
          amendmentsCount: std.amendments?.length || 0,
        },
        prerequisiteKeys: ['REQ_BASE_PRODUCT_INFO'],
        dedupKey: stdKey,
      });

      // B. QCO Requirements for this standard
      for (const qcoMap of std.qcoMappings || []) {
        const qco = qcoMap.qco;
        if (!qco) continue;
        const qcoKey = `REQ_QCO_${qco.id}`;
        addRequirement({
          standardId: std.id,
          requirementType: 'QCO',
          sourceEntityType: 'QCO',
          sourceEntityId: qco.id,
          title: `Statutory QCO: ${qco.title}`,
          description: qco.ministry
            ? `Order issued by ${qco.ministry}. Effective from ${qco.effectiveDate ? qco.effectiveDate.toISOString().split('T')[0] : 'Notified date'}. Mandatory BIS ISI/CRS marking.`
            : qco.title,
          mandatoryStatus: 'MANDATORY',
          priority: 'CRITICAL',
          status: qco.status === 'ACTIVE' ? 'IN_PROGRESS' : 'NEEDS_REVIEW',
          evidenceRequired: true,
          sourceDocumentId: qco.sourceDocumentId,
          sourceUrl: qco.sourceDocument?.url || qco.orderNumber,
          sourceAuthority: 'AUTHORITATIVE',
          evidence: {
            orderNumber: qco.orderNumber,
            ministry: qco.ministry,
            effectiveDate: qco.effectiveDate,
            isMandatory: true,
          },
          prerequisiteKeys: [stdKey],
          dedupKey: qcoKey,
        });
      }

      // C. Certification Scheme Requirements
      for (const schemeMap of std.schemeMappings || []) {
        const scheme = schemeMap.scheme;
        if (!scheme) continue;
        const schemeKey = `REQ_SCHEME_${scheme.id}`;
        addRequirement({
          standardId: std.id,
          requirementType: 'CERTIFICATION',
          sourceEntityType: 'Scheme',
          sourceEntityId: scheme.id,
          title: `Apply under BIS ${scheme.name} (${scheme.code})`,
          description: scheme.description || `Certification process according to BIS ${scheme.name}`,
          mandatoryStatus: 'MANDATORY',
          priority: 'HIGH',
          status: latestCertAnalysis ? 'COMPLETED' : 'IN_PROGRESS',
          evidenceRequired: true,
          sourceAuthority: 'AUTHORITATIVE',
          evidence: {
            schemeCode: scheme.code,
            schemeName: scheme.name,
          },
          prerequisiteKeys: [stdKey],
          dedupKey: schemeKey,
        });
      }
    }

    // 4. Certification Analysis Documentation Checklist
    if (latestCertAnalysis && latestCertAnalysis.documentationChecklist?.length > 0) {
      for (const item of latestCertAnalysis.documentationChecklist) {
        const docKey = `REQ_DOC_CHECKLIST_${item.id}`;
        const isDocPresent = product.documents.some(
          (d: any) => d.checklistMatches?.some((m: any) => m.checklistId === item.id)
        );
        const isDocVerified = product.documents.some(
          (d: any) => d.verificationStatus === 'VERIFIED' && d.checklistMatches?.some((m: any) => m.checklistId === item.id)
        );

        let itemStatus: ComplianceRequirementStatus = 'NOT_STARTED';
        if (isDocVerified) {
          itemStatus = 'COMPLETED';
        } else if (isDocPresent) {
          itemStatus = 'NEEDS_REVIEW';
        }

        const isMandatory = item.requiredStatus === 'REQUIRED';

        addRequirement({
          requirementType: item.category === 'FACTORY' ? 'FACTORY' : 'DOCUMENT',
          sourceEntityType: 'ProductDocumentationChecklistItem',
          sourceEntityId: item.id,
          title: item.documentName,
          description: item.reason,
          mandatoryStatus: isMandatory ? 'MANDATORY' : 'RECOMMENDED',
          priority: isMandatory ? 'HIGH' : 'MEDIUM',
          status: itemStatus,
          evidenceRequired: true,
          sourceAuthority: 'AUTHORITATIVE',
          evidence: {
            category: item.category,
            notes: item.notes,
            source: item.source,
          },
          prerequisiteKeys: targetStandards.map((s: any) => `REQ_STD_${s.id}`),
          dedupKey: docKey,
        });
      }
    }

    // 5. Testing Intelligence Requirements (STI & Essential Tests)
    if (latestTestingAnalysis && latestTestingAnalysis.requirements?.length > 0) {
      for (const test of latestTestingAnalysis.requirements) {
        const testKey = `REQ_TEST_${test.id}`;
        const isMatched = product.documents.some((d: any) =>
          d.testMatches?.some((m: any) => m.testRequirementId === test.id && m.passFailStatus === 'PASS')
        );

        const isMandatory = test.status === 'REQUIRED';

        addRequirement({
          standardId: test.standardId,
          requirementType: 'TEST',
          sourceEntityType: 'ProductTestRequirement',
          sourceEntityId: test.id,
          title: `Perform Test: ${test.testName} (${test.clause || 'STI'})`,
          description: `Test method: ${test.testMethod || 'Standard Clause'} - Specified limit: ${test.requirementValue || 'Conformity'}`,
          mandatoryStatus: isMandatory ? 'MANDATORY' : 'RECOMMENDED',
          priority: isMandatory ? 'CRITICAL' : 'HIGH',
          status: isMatched ? 'COMPLETED' : 'IN_PROGRESS',
          evidenceRequired: true,
          sourceAuthority: 'AUTHORITATIVE',
          evidence: {
            clause: test.clause,
            testMethod: test.testMethod,
            requirementValue: test.requirementValue,
            category: test.testCategory,
          },
          prerequisiteKeys: targetStandards.map((s: any) => `REQ_STD_${s.id}`),
          dedupKey: testKey,
        });
      }
    }

    // 6. Laboratory Selection Requirement
    const hasLabSelected = product.laboratoryReviews.some(
      (r: any) => r.decision === 'SELECTED' || r.decision === 'SHORTLISTED'
    );
    addRequirement({
      requirementType: 'LABORATORY',
      sourceEntityType: 'Laboratory',
      title: 'Select BIS-Recognized Testing Laboratory',
      description: 'Shortlist or select a BIS-recognized or NABL-accredited laboratory for independent sample testing and verification.',
      mandatoryStatus: 'MANDATORY',
      priority: 'HIGH',
      status: hasLabSelected ? 'COMPLETED' : 'IN_PROGRESS',
      evidenceRequired: true,
      sourceAuthority: 'AUTHORITATIVE',
      evidence: {
        selectedLabsCount: product.laboratoryReviews.length,
      },
      prerequisiteKeys: targetStandards.map((s: any) => `REQ_STD_${s.id}`),
      dedupKey: 'REQ_LAB_SELECTION',
    });

    // 7. Quality Control & In-House Testing Facility
    addRequirement({
      requirementType: 'QUALITY_CONTROL',
      sourceEntityType: 'ProductManual',
      title: 'Maintain In-House Scheme of Inspection and Testing (SIT)',
      description: 'Ensure in-house testing equipment is calibrated and operational per the BIS Scheme of Testing and Inspection (STI).',
      mandatoryStatus: 'MANDATORY',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      evidenceRequired: true,
      sourceAuthority: 'AUTHORITATIVE',
      evidence: {
        stiPrescribed: true,
      },
      prerequisiteKeys: ['REQ_LAB_SELECTION'],
      dedupKey: 'REQ_STI_COMPLIANCE',
    });

    // 8. Application Preparation Dossier Requirement
    addRequirement({
      requirementType: 'APPLICATION',
      sourceEntityType: 'ApplicationDossier',
      title: 'Compile & Review Complete Application Preparation Dossier',
      description: 'Ensure all mandatory test reports, factory layouts, quality manuals, and declarations are verified prior to official BIS submission.',
      mandatoryStatus: 'MANDATORY',
      priority: 'CRITICAL',
      status: latestCompleteness?.status === 'COMPLETE' ? 'COMPLETED' : 'NOT_STARTED',
      evidenceRequired: true,
      sourceAuthority: 'AUTHORITATIVE',
      evidence: {
        verifiedDocuments: verifiedDocs.length,
        completenessScore: latestCompleteness?.score || 0,
      },
      prerequisiteKeys: [
        'REQ_BASE_PRODUCT_INFO',
        'REQ_LAB_SELECTION',
        'REQ_STI_COMPLIANCE',
      ],
      dedupKey: 'REQ_DOSSIER_COMPILATION',
    });

    // Compute deterministic input hash
    const hashData = {
      productId: product.id,
      standards: targetStandards.map((s: any) => ({ id: s.id, isNumber: s.isNumber })),
      certAnalysisId: latestCertAnalysis?.id,
      testingAnalysisId: latestTestingAnalysis?.id,
      documentCount: product.documents.length,
      verifiedDocCount: verifiedDocs.length,
      reqCount: requirements.length,
    };
    const inputHash = crypto.createHash('sha256').update(JSON.stringify(hashData)).digest('hex');

    const confirmedStandards = targetStandards.map((s: any) => ({
      id: s.id,
      isNumber: s.isNumber,
      title: s.title,
      status: s.status,
      schemeTitle: s.schemeMappings?.[0]?.scheme?.name,
    }));

    return {
      inputHash,
      requirements,
      confirmedStandards,
    };
  }
}

export const multiStandardOrchestrator = new MultiStandardOrchestratorService();
