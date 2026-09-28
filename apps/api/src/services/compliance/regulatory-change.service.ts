import { prisma } from '../../db/client.js';
import { logger } from '../../config/logger.js';
import type {
  RegulatoryChangeEventItem,
  RegulatoryImpactItem,
  RegulatoryImpactLevel,
  RegulatoryChangeType,
} from '@bis/shared';

export class RegulatoryChangeService {
  /**
   * Registers a source-grounded regulatory change event (e.g. Gazette notification, QCO release, Standard amendment).
   */
  async recordChangeEvent(input: {
    title: string;
    summary?: string;
    changeType: RegulatoryChangeType;
    affectedStandards?: string[];
    affectedProductCategories?: string[];
    effectiveDate?: Date | null;
    sourceDocumentId?: string | null;
    sourceUrl?: string | null;
    authorityLevel?: 'AUTHORITATIVE' | 'REFERENCE' | 'UNVERIFIED';
  }): Promise<RegulatoryChangeEventItem> {
    logger.info('Recording regulatory change event', { title: input.title, type: input.changeType });

    const event = await prisma.regulatoryChangeEvent.create({
      data: {
        title: input.title,
        summary: input.summary,
        changeType: input.changeType,
        affectedStandards: input.affectedStandards || [],
        affectedProductCategories: input.affectedProductCategories || [],
        effectiveDate: input.effectiveDate,
        sourceDocumentId: input.sourceDocumentId,
        sourceUrl: input.sourceUrl,
        authorityLevel: input.authorityLevel || 'AUTHORITATIVE',
        status: 'ACTIVE',
      },
    });

    // Automatically compute impacts for all affected products
    await this.evaluateImpactsForEvent(event.id);

    return {
      id: event.id,
      sourceDocumentId: event.sourceDocumentId,
      changeType: event.changeType as RegulatoryChangeType,
      title: event.title,
      summary: event.summary,
      affectedStandards: (event.affectedStandards as string[]) || [],
      affectedProductCategories: (event.affectedProductCategories as string[]) || [],
      effectiveDate: event.effectiveDate ? event.effectiveDate.toISOString() : null,
      detectedAt: event.detectedAt.toISOString(),
      sourceUrl: event.sourceUrl,
      authorityLevel: event.authorityLevel,
      status: event.status,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  /**
   * Evaluates and updates regulatory impact across all registered products for a given event.
   */
  async evaluateImpactsForEvent(eventId: string): Promise<void> {
    const event = await prisma.regulatoryChangeEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) return;

    const affectedStandardsList = (event.affectedStandards as string[]) || [];
    const affectedCategoriesList = (event.affectedProductCategories as string[]) || [];

    // Find all products that match these standards or categories
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { category: { in: affectedCategoriesList } },
          {
            standardReviews: {
              some: {
                standard: {
                  isNumber: { in: affectedStandardsList },
                },
                decision: { in: ['CONFIRMED', 'NEEDS_REVIEW'] },
              },
            },
          },
        ],
      },
      include: {
        complianceJourneys: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        standardReviews: {
          include: { standard: true },
        },
      },
    });

    for (const prod of products) {
      let impactLevel: RegulatoryImpactLevel = 'NEEDS_REVIEW';
      const requiredActions: string[] = [];
      const affectedReqs: string[] = [];

      const matchedStandards = prod.standardReviews
        .map((r: any) => r.standard.isNumber)
        .filter((isNo: string) => affectedStandardsList.includes(isNo));

      if (matchedStandards.length > 0) {
        impactLevel = 'HIGH';
        requiredActions.push(`Review updated gazette requirements for standard ${matchedStandards.join(', ')}.`);
        requiredActions.push('Re-run compliance journey recalculation to refresh testing and documentation checklist.');
        affectedReqs.push(...matchedStandards);
      } else if (affectedCategoriesList.includes(prod.category)) {
        impactLevel = 'MEDIUM';
        requiredActions.push(`Examine category-wide mandate changes for category: ${prod.category}.`);
      } else {
        impactLevel = 'LOW';
      }

      const journeyId = prod.complianceJourneys[0]?.id;

      await prisma.regulatoryImpact.upsert({
        where: {
          changeEventId_productId: {
            changeEventId: event.id,
            productId: prod.id,
          },
        },
        update: {
          impactLevel,
          affectedRequirements: affectedReqs,
          requiredActions,
          journeyId,
          evidence: {
            detectedAt: event.detectedAt,
            affectedStandards: matchedStandards,
            effectiveDate: event.effectiveDate,
          },
        },
        create: {
          changeEventId: event.id,
          productId: prod.id,
          journeyId,
          impactLevel,
          affectedRequirements: affectedReqs,
          requiredActions,
          evidence: {
            detectedAt: event.detectedAt,
            affectedStandards: matchedStandards,
            effectiveDate: event.effectiveDate,
          },
        },
      });

      // Create a compliance alert if high impact
      if (impactLevel === 'HIGH' || impactLevel === 'MEDIUM') {
        await prisma.complianceAlert.create({
          data: {
            productId: prod.id,
            journeyId,
            alertType: event.changeType.startsWith('QCO') ? 'QCO_CHANGE' : 'STANDARD_AMENDMENT',
            priority: impactLevel === 'HIGH' ? 'CRITICAL' : 'HIGH',
            title: `Regulatory Alert: ${event.title}`,
            reason: `Gazette update affects confirmed standard (${matchedStandards.join(', ') || prod.category}). Potential platform impact identified.`,
            source: event.sourceUrl || 'Official Gazette of India',
            recommendedAction: requiredActions.join(' '),
          },
        });
      }
    }
  }

  /**
   * Retrieves all regulatory impacts for a specific product.
   */
  async getProductImpacts(productId: string): Promise<RegulatoryImpactItem[]> {
    const impacts = await prisma.regulatoryImpact.findMany({
      where: { productId },
      include: {
        changeEvent: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return impacts.map((i: any) => ({
      id: i.id,
      changeEventId: i.changeEventId,
      productId: i.productId,
      journeyId: i.journeyId,
      impactLevel: i.impactLevel as RegulatoryImpactLevel,
      affectedRequirements: (i.affectedRequirements as string[]) || [],
      requiredActions: (i.requiredActions as string[]) || [],
      evidence: i.evidence,
      status: i.status,
      changeEvent: {
        id: i.changeEvent.id,
        sourceDocumentId: i.changeEvent.sourceDocumentId,
        changeType: i.changeEvent.changeType as RegulatoryChangeType,
        title: i.changeEvent.title,
        summary: i.changeEvent.summary,
        affectedStandards: (i.changeEvent.affectedStandards as string[]) || [],
        affectedProductCategories: (i.changeEvent.affectedProductCategories as string[]) || [],
        effectiveDate: i.changeEvent.effectiveDate ? i.changeEvent.effectiveDate.toISOString() : null,
        detectedAt: i.changeEvent.detectedAt.toISOString(),
        sourceUrl: i.changeEvent.sourceUrl,
        authorityLevel: i.changeEvent.authorityLevel,
        status: i.changeEvent.status,
        createdAt: i.changeEvent.createdAt.toISOString(),
        updatedAt: i.changeEvent.updatedAt.toISOString(),
      },
      createdAt: i.createdAt.toISOString(),
    }));
  }
}

export const regulatoryChangeService = new RegulatoryChangeService();
