import { prisma } from '../../db/client.js';
import { logger } from '../../config/logger.js';
import type {
  ComplianceReadinessResponse,
  DomainReadinessScore,
} from '@bis/shared';

export class ComplianceReadinessService {
  /**
   * Calculates explainable, deterministic Platform Compliance Readiness for a product journey.
   */
  async calculateReadiness(journeyId: string): Promise<ComplianceReadinessResponse> {
    logger.info('Calculating platform compliance readiness', { journeyId });

    const journey = await prisma.complianceJourney.findUnique({
      where: { id: journeyId },
      include: {
        product: {
          include: {
            documents: true,
            laboratoryReviews: true,
            testingAnalyses: {
              include: { requirements: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            certificationAnalyses: {
              include: { schemeRecommendations: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        requirements: {
          include: {
            dependencies: true,
            dependedBy: true,
          },
        },
        tasks: true,
        alerts: {
          where: { isResolved: false },
        },
      },
    });

    if (!journey) {
      throw new Error(`Compliance Journey ${journeyId} not found`);
    }

    const { requirements, product, alerts } = journey;

    // 1. Group requirements by domain
    const stdReqs = requirements.filter((r: any) => r.requirementType === 'STANDARD' || r.requirementType === 'QCO');
    const certReqs = requirements.filter((r: any) => r.requirementType === 'CERTIFICATION');
    const testReqs = requirements.filter((r: any) => r.requirementType === 'TEST' || r.requirementType === 'QUALITY_CONTROL');
    const labReqs = requirements.filter((r: any) => r.requirementType === 'LABORATORY');
    const docReqs = requirements.filter((r: any) => r.requirementType === 'DOCUMENT' || r.requirementType === 'FACTORY');

    // Helper to score domain
    const evalDomain = (
      domainName: 'STANDARDS' | 'CERTIFICATION' | 'TESTING' | 'LABORATORY' | 'DOCUMENTS',
      reqs: typeof requirements
    ): DomainReadinessScore => {
      const total = reqs.length;
      if (total === 0) {
        return {
          domain: domainName,
          score: 100,
          status: 'COMPLETE',
          totalRequirements: 0,
          completedRequirements: 0,
          pendingRequirements: 0,
          details: 'No specific requirements identified in this domain.',
        };
      }

      const completed = reqs.filter((r: any) => r.status === 'COMPLETED' || r.status === 'WAIVED').length;
      const score = Math.round((completed / total) * 100);

      let status: 'COMPLETE' | 'IN_PROGRESS' | 'NEEDS_REVIEW' | 'BLOCKED' = 'IN_PROGRESS';
      if (score === 100) {
        status = 'COMPLETE';
      } else if (reqs.some((r: any) => r.status === 'BLOCKED')) {
        status = 'BLOCKED';
      } else if (reqs.some((r: any) => r.status === 'NEEDS_REVIEW')) {
        status = 'NEEDS_REVIEW';
      }

      return {
        domain: domainName,
        score,
        status,
        totalRequirements: total,
        completedRequirements: completed,
        pendingRequirements: total - completed,
        details: `${completed} of ${total} requirements satisfied (${score}%).`,
      };
    };

    const standardsDomain = evalDomain('STANDARDS', stdReqs);
    const certDomain = evalDomain('CERTIFICATION', certReqs);
    const testingDomain = evalDomain('TESTING', testReqs);
    const labDomain = evalDomain('LABORATORY', labReqs);
    const documentsDomain = evalDomain('DOCUMENTS', docReqs);

    // 2. Compute Weighted Overall Score (Weights: STD 20%, CERT 20%, TEST 25%, LAB 15%, DOC 20%)
    const overallScore = Math.round(
      standardsDomain.score * 0.2 +
      certDomain.score * 0.2 +
      testingDomain.score * 0.25 +
      labDomain.score * 0.15 +
      documentsDomain.score * 0.2
    );

    // 3. Count granular metrics
    const totalRequirements = requirements.length;
    const completedRequirements = requirements.filter((r: any) => r.status === 'COMPLETED' || r.status === 'WAIVED').length;
    const incompleteRequirements = totalRequirements - completedRequirements;
    const blockedRequirements = requirements.filter((r: any) => r.status === 'BLOCKED').length;

    const unverifiedDocs = product.documents.filter((d: any) => d.verificationStatus === 'NEEDS_REVIEW' || d.verificationStatus === 'UNVERIFIED');
    const documentsNeedingReview = unverifiedDocs.length;

    const latestTesting = product.testingAnalyses[0];
    const missingTests = latestTesting
      ? latestTesting.requirements.filter((t: any) => t.status === 'REQUIRED').length -
        testReqs.filter((r: any) => r.requirementType === 'TEST' && r.status === 'COMPLETED').length
      : 0;

    const selectedLabs = product.laboratoryReviews.filter((r: any) => r.decision === 'SELECTED');
    const missingLaboratoryActions = selectedLabs.length === 0 ? 1 : 0;

    const certAnalysis = product.certificationAnalyses[0];
    const missingCertificationActions = !certAnalysis ? 1 : 0;

    const qcoBlockers = alerts.filter((a: any) => a.alertType === 'QCO_CHANGE' || a.alertType === 'JOURNEY_BLOCKED').length;

    // 4. Determine Critical Next Actions
    const criticalNextActions: string[] = [];
    if (standardsDomain.score < 100) {
      criticalNextActions.push('Review and confirm all matched Indian Standards and applicable QCO gazettes.');
    }
    if (documentsNeedingReview > 0) {
      criticalNextActions.push(`Verify ${documentsNeedingReview} uploaded compliance documents.`);
    }
    if (missingTests > 0) {
      criticalNextActions.push(`Execute and document ${Math.max(1, missingTests)} mandatory STI test requirements.`);
    }
    if (missingLaboratoryActions > 0) {
      criticalNextActions.push('Select a BIS-recognized or NABL-accredited laboratory for sample verification.');
    }
    if (certDomain.score < 100) {
      criticalNextActions.push('Complete certification scheme analysis and STI checklist review.');
    }
    if (overallScore >= 90 && criticalNextActions.length === 0) {
      criticalNextActions.push('Compile and validate Application Preparation Dossier for official submission review.');
    }

    let readinessStatus = 'IN_PROGRESS';
    if (overallScore === 100) {
      readinessStatus = 'READY_FOR_OFFICIAL_ACTION';
    } else if (overallScore >= 80) {
      readinessStatus = 'HIGH_READINESS';
    } else if (overallScore >= 50) {
      readinessStatus = 'MODERATE_READINESS';
    } else {
      readinessStatus = 'EARLY_STAGE';
    }

    // Explanatory breakdown
    const explanation = `Platform Compliance Readiness is ${overallScore}%. Standards: ${standardsDomain.score}%, Certification: ${certDomain.score}%, Testing: ${testingDomain.score}%, Laboratory: ${labDomain.score}%, Documents: ${documentsDomain.score}%. Completed: ${completedRequirements}/${totalRequirements} requirements.`;

    const domainScores: DomainReadinessScore[] = [
      standardsDomain,
      certDomain,
      testingDomain,
      labDomain,
      documentsDomain,
    ];

    // 5. Update the journey record with the new readiness score
    await prisma.complianceJourney.update({
      where: { id: journeyId },
      data: {
        readinessScore: overallScore,
        readinessStatus,
      },
    });

    return {
      overallScore,
      readinessStatus,
      domainScores,
      completedRequirements,
      incompleteRequirements,
      blockedRequirements,
      documentsNeedingReview,
      missingTests: Math.max(0, missingTests),
      missingLaboratoryActions,
      missingCertificationActions,
      qcoBlockers,
      criticalNextActions,
      explanation,
      calculatedAt: new Date().toISOString(),
    };
  }
}

export const complianceReadinessService = new ComplianceReadinessService();
