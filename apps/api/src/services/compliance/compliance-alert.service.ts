import { prisma } from '../../db/client.js';
import { logger } from '../../config/logger.js';
import type {
  ComplianceAlertItem,
  ComplianceAlertType,
  RequirementPriority,
} from '@bis/shared';

export class ComplianceAlertService {
  /**
   * Evaluates product documents, testing records, and requirements to generate fresh explainable alerts.
   */
  async syncJourneyAlerts(journeyId: string, productId: string): Promise<ComplianceAlertItem[]> {
    logger.info('Syncing compliance journey alerts', { journeyId, productId });

    const product: any = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        documents: true,
        standardReviews: {
          include: { standard: true },
        },
        testingAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { requirements: true },
        },
        documentCompletenessAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const journey: any = await prisma.complianceJourney.findUnique({
      where: { id: journeyId },
      include: {
        requirements: true,
      },
    });

    if (!journey) {
      throw new Error(`Compliance journey ${journeyId} not found`);
    }

    // 1. Scan for Document Expiry & Calibration Dates (from Phase 9 extracted metadata)
    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const doc of product.documents || []) {
      const extracted = (doc.extractedData as any) || {};
      const expiryDateStr = extracted.expiryDate || extracted.validUntil || extracted.calibrationDueDate || extracted.nextCalibrationDate;

      if (expiryDateStr) {
        const expDate = new Date(expiryDateStr);
        if (!isNaN(expDate.getTime())) {
          const alertSource = `Document ID: ${doc.id}`;
          const existingExpAlert = await prisma.complianceAlert.findFirst({
            where: { productId: product.id, alertType: 'DOCUMENT_EXPIRING', source: alertSource, isResolved: false },
          });

          if (expDate <= now) {
            const reasonText = `Document "${doc.originalFileName}" indicates an expiry or calibration due date of ${expDate.toISOString().split('T')[0]}. Verification or renewed certificate required.`;
            if (existingExpAlert) {
              await prisma.complianceAlert.update({
                where: { id: existingExpAlert.id },
                data: { reason: reasonText, priority: 'HIGH' },
              });
            } else {
              await prisma.complianceAlert.create({
                data: {
                  productId: product.id,
                  journeyId,
                  alertType: 'DOCUMENT_EXPIRING',
                  priority: 'HIGH',
                  title: `Calibration/Document Expiry: ${doc.originalFileName}`,
                  reason: reasonText,
                  source: alertSource,
                  recommendedAction: 'Upload updated calibration report or renewed document evidence.',
                },
              });
            }
          } else if (expDate <= thirtyDaysAhead) {
            const reasonText = `Document "${doc.originalFileName}" is scheduled for calibration review / renewal on ${expDate.toISOString().split('T')[0]}.`;
            if (existingExpAlert) {
              await prisma.complianceAlert.update({
                where: { id: existingExpAlert.id },
                data: { reason: reasonText, priority: 'MEDIUM' },
              });
            } else {
              await prisma.complianceAlert.create({
                data: {
                  productId: product.id,
                  journeyId,
                  alertType: 'DOCUMENT_EXPIRING',
                  priority: 'MEDIUM',
                  title: `Upcoming Review: ${doc.originalFileName}`,
                  reason: reasonText,
                  source: alertSource,
                  recommendedAction: 'Review calibration status with the accredited testing laboratory.',
                },
              });
            }
          }
        }
      }
    }

    // 2. Check for Missing Mandatory Documents
    const completeness = product.documentCompletenessAnalyses?.[0];
    if (completeness && completeness.missingCount > 0) {
      const missingTypes = (completeness.missingDocumentTypes as string[]) || [];
      const reasonText = `Product has ${completeness.missingCount} mandatory compliance document(s) pending: ${missingTypes.join(', ')}.`;
      const existingMissingAlert = await prisma.complianceAlert.findFirst({
        where: { productId: product.id, alertType: 'DOCUMENT_MISSING', isResolved: false },
      });

      if (existingMissingAlert) {
        await prisma.complianceAlert.update({
          where: { id: existingMissingAlert.id },
          data: { reason: reasonText },
        });
      } else {
        await prisma.complianceAlert.create({
          data: {
            productId: product.id,
            journeyId,
            alertType: 'DOCUMENT_MISSING',
            priority: 'HIGH',
            title: 'Mandatory Compliance Documents Missing',
            reason: reasonText,
            source: 'Document Completeness Analysis',
            recommendedAction: 'Upload required documentation (Factory Layout, Quality Manual, or Declarations).',
          },
        });
      }
    }

    // 3. Check for Journey Blockers
    const blockedReqs = (journey.requirements || []).filter((r: any) => r.status === 'BLOCKED');
    if (blockedReqs.length > 0) {
      const reasonText = `${blockedReqs.length} compliance requirement(s) are currently marked as blocked by dependencies.`;
      const existingBlockedAlert = await prisma.complianceAlert.findFirst({
        where: { productId: product.id, alertType: 'JOURNEY_BLOCKED', isResolved: false },
      });

      if (existingBlockedAlert) {
        await prisma.complianceAlert.update({
          where: { id: existingBlockedAlert.id },
          data: { reason: reasonText },
        });
      } else {
        await prisma.complianceAlert.create({
          data: {
            productId: product.id,
            journeyId,
            alertType: 'JOURNEY_BLOCKED',
            priority: 'CRITICAL',
            title: 'Compliance Journey Tasks Blocked',
            reason: reasonText,
            source: 'Compliance Workflow Engine',
            recommendedAction: 'Resolve prerequisite standard reviews and essential document uploads.',
          },
        });
      }
    }

    return this.getProductAlerts(productId);
  }

  /**
   * Retrieves all compliance alerts for a product.
   */
  async getProductAlerts(productId: string): Promise<ComplianceAlertItem[]> {
    const alerts = await prisma.complianceAlert.findMany({
      where: { productId },
      include: { product: true },
      orderBy: [{ isResolved: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });

    return alerts.map((a: any) => ({
      id: a.id,
      productId: a.productId,
      productName: a.product.name,
      journeyId: a.journeyId,
      alertType: a.alertType as ComplianceAlertType,
      priority: a.priority as RequirementPriority,
      title: a.title,
      reason: a.reason,
      source: a.source,
      recommendedAction: a.recommendedAction,
      isRead: a.isRead,
      isResolved: a.isResolved,
      readAt: a.readAt ? a.readAt.toISOString() : null,
      resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  }

  /**
   * Marks an alert as read.
   */
  async markAlertRead(alertId: string): Promise<void> {
    await prisma.complianceAlert.update({
      where: { id: alertId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Resolves an alert.
   */
  async resolveAlert(alertId: string): Promise<void> {
    await prisma.complianceAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }
}

export const complianceAlertService = new ComplianceAlertService();
