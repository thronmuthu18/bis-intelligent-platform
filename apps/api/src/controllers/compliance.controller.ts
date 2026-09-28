import type { Request, Response, NextFunction } from 'express';
import { complianceOrchestratorService } from '../services/compliance/compliance-orchestrator.service.js';
import { complianceReadinessService } from '../services/compliance/compliance-readiness.service.js';
import { complianceAlertService } from '../services/compliance/compliance-alert.service.js';
import { regulatoryChangeService } from '../services/compliance/regulatory-change.service.js';
import { prisma } from '../db/client.js';

export class ComplianceController {
  /**
   * POST /api/v1/products/:productId/compliance/initialize
   */
  async initializeJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const userId = (req as any).user.id;

      const overview = await complianceOrchestratorService.initializeJourney(productId, userId);
      return res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({ success: false, message: err.message });
      }
      if (err.message.includes('not found')) {
        return res.status(404).json({ success: false, message: err.message });
      }
      return next(err);
    }
  }

  /**
   * GET /api/v1/products/:productId/compliance
   */
  async getJourneyOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const userId = (req as any).user.id;

      const overview = await complianceOrchestratorService.getJourneyOverview(productId, userId);
      return res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({ success: false, message: err.message });
      }
      if (err.message.includes('not found')) {
        return res.status(404).json({ success: false, message: err.message });
      }
      return next(err);
    }
  }

  /**
   * POST /api/v1/products/:productId/compliance/recalculate
   */
  async recalculateJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const userId = (req as any).user.id;
      const { reason } = req.body;

      const overview = await complianceOrchestratorService.recalculateJourney(productId, userId, reason);
      return res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({ success: false, message: err.message });
      }
      if (err.message.includes('not found')) {
        return res.status(404).json({ success: false, message: err.message });
      }
      return next(err);
    }
  }

  /**
   * GET /api/v1/products/:productId/compliance/tasks
   */
  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const userId = (req as any).user.id;

      const tasks = await complianceOrchestratorService.getTasks(productId, userId);
      return res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({ success: false, message: err.message });
      }
      return next(err);
    }
  }

  /**
   * POST /api/v1/products/:productId/compliance/tasks/:taskId/complete
   */
  async completeTask(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const taskId = req.params.taskId;
      const userId = (req as any).user.id;
      const { evidenceNotes } = req.body;

      const task = await complianceOrchestratorService.completeTask(productId, taskId, userId, { evidenceNotes });
      return res.status(200).json({
        success: true,
        data: task,
      });
    } catch (err: any) {
      if (err.message.includes('prerequisite requirement(s) are unresolved') || err.message.includes('Cannot complete task')) {
        return res.status(400).json({ success: false, message: err.message });
      }
      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({ success: false, message: err.message });
      }
      if (err.message.includes('not found')) {
        return res.status(404).json({ success: false, message: err.message });
      }
      return next(err);
    }
  }

  /**
   * POST /api/v1/products/:productId/compliance/tasks/:taskId/reopen
   */
  async reopenTask(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const taskId = req.params.taskId;
      const userId = (req as any).user.id;

      const task = await complianceOrchestratorService.reopenTask(productId, taskId, userId);
      return res.status(200).json({
        success: true,
        data: task,
      });
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({ success: false, message: err.message });
      }
      if (err.message.includes('not found')) {
        return res.status(404).json({ success: false, message: err.message });
      }
      return next(err);
    }
  }

  /**
   * GET /api/v1/products/:productId/compliance/readiness
   */
  async getReadiness(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const userId = (req as any).user.id;

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { complianceJourneys: { take: 1, orderBy: { createdAt: 'desc' } } },
      });

      if (!product || product.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized or product not found' });
      }

      let journeyId = product.complianceJourneys[0]?.id;
      if (!journeyId) {
        const init = await complianceOrchestratorService.initializeJourney(productId, userId);
        journeyId = init.journey.id;
      }

      const readiness = await complianceReadinessService.calculateReadiness(journeyId);
      return res.status(200).json({
        success: true,
        data: readiness,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/v1/products/:productId/compliance/timeline
   */
  async getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const userId = (req as any).user.id;

      const timeline = await complianceOrchestratorService.getTimeline(productId, userId);
      return res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({ success: false, message: err.message });
      }
      return next(err);
    }
  }

  /**
   * GET /api/v1/products/:productId/compliance/dossier
   */
  async getDossier(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const userId = (req as any).user.id;

      const dossier = await complianceOrchestratorService.compileDossier(productId, userId);
      return res.status(200).json({
        success: true,
        data: dossier,
      });
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({ success: false, message: err.message });
      }
      return next(err);
    }
  }

  /**
   * POST /api/v1/products/:productId/compliance/dossier/compile
   */
  async compileDossier(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const userId = (req as any).user.id;
      const { title, notes } = req.body;

      const dossier = await complianceOrchestratorService.compileDossier(productId, userId, { title, notes });
      return res.status(200).json({
        success: true,
        data: dossier,
      });
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({ success: false, message: err.message });
      }
      return next(err);
    }
  }

  /**
   * POST /api/v1/products/:productId/compliance/dossier/validate
   */
  async validateDossier(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const userId = (req as any).user.id;

      const validation = await complianceOrchestratorService.validateDossier(productId, userId);
      return res.status(200).json({
        success: true,
        data: validation,
      });
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({ success: false, message: err.message });
      }
      return next(err);
    }
  }

  /**
   * GET /api/v1/products/:productId/compliance/alerts
   */
  async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const userId = (req as any).user.id;

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product || product.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized or product not found' });
      }

      const alerts = await complianceAlertService.getProductAlerts(productId);
      return res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/v1/products/:productId/compliance/alerts/:alertId/read
   */
  async markAlertRead(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const alertId = req.params.alertId;
      const userId = (req as any).user.id;

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product || product.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized or product not found' });
      }

      await complianceAlertService.markAlertRead(alertId);
      return res.status(200).json({
        success: true,
        message: 'Alert marked as read',
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/v1/products/:productId/compliance/regulatory-impact
   */
  async getRegulatoryImpact(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const userId = (req as any).user.id;

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product || product.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized or product not found' });
      }

      const impacts = await regulatoryChangeService.getProductImpacts(productId);
      return res.status(200).json({
        success: true,
        data: impacts,
      });
    } catch (err) {
      return next(err);
    }
  }
}

export const complianceController = new ComplianceController();
