import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';
import { AppError } from '../utils/AppError.js';
import { ConsumerGuidanceService } from '../services/consumer/consumer-guidance.service.js';
import { ConsumerStandardSearchService } from '../services/consumer/consumer-standard-search.service.js';
import { HallmarkingCentreService } from '../services/consumer/hallmarking-centre.service.js';
import { HallmarkingKnowledgeService } from '../services/consumer/hallmarking-knowledge.service.js';
import { ConsumerVerificationService } from '../services/consumer/consumer-verification.service.js';
import { API_ERROR_CODES, type ConsumerServiceType } from '@bis/shared';

export class ConsumerController {
  /**
   * GET /api/v1/consumer/services
   */
  public static async getServices(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const services = ConsumerGuidanceService.getConsumerServices();
      res.json({
        success: true,
        data: { services },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/consumer/services/:serviceId
   */
  public static async getServiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { serviceId } = req.params;
      const service = ConsumerGuidanceService.getServiceById(serviceId);
      if (!service) {
        throw new AppError('Consumer service not found', 404, API_ERROR_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        data: { service },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/consumer/standards/search
   */
  public static async searchStandards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = (req.query.q as string) || '';
      const limit = Number(req.query.limit) || 10;
      const language = (req.query.language || req.query.lang) as any;
      const response = await ConsumerStandardSearchService.searchStandards({ q, limit, language });

      res.json({
        success: true,
        data: response,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/consumer/licence/verify
   */
  public static async verifyLicence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { licenceNumber, manufacturer, productName, standardNumber, saveHistory } = req.body;

      if (!licenceNumber || typeof licenceNumber !== 'string') {
        throw new AppError('licenceNumber is required', 400, API_ERROR_CODES.BAD_REQUEST);
      }

      // Audit Log: Verification Started
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'CONSUMER_LICENCE_VERIFICATION_STARTED',
            entityType: 'LICENCE',
            metadata: { licenceNumber },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          },
        }).catch(() => {});
      }

      const result = await ConsumerVerificationService.verifyLicence(
        { licenceNumber, manufacturer, productName, standardNumber, saveHistory },
        userId
      );

      // Audit Log: Verification Completed
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'CONSUMER_LICENCE_VERIFICATION_COMPLETED',
            entityType: 'LICENCE',
            metadata: { licenceNumber, status: result.verification.status },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          },
        }).catch(() => {});
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/consumer/hallmarking-centres
   */
  public static async getHallmarkingCentres(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, state, city, pincode, status, page, limit } = req.query;
      const response = await HallmarkingCentreService.searchCentres({
        search: search as string,
        state: state as string,
        city: city as string,
        pincode: pincode as string,
        status: status as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.json({
        success: true,
        data: response,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/consumer/hallmarking-centres/:id
   */
  public static async getHallmarkingCentreById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const centre = await HallmarkingCentreService.getCentreById(id);
      if (!centre) {
        throw new AppError('Hallmarking centre not found', 404, 'NOT_FOUND');
      }

      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'CONSUMER_HALLMARK_CENTRE_VIEWED',
            entityType: 'HALLMARKING_CENTRE',
            entityId: id,
            metadata: { centreCode: centre.code },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          },
        }).catch(() => {});
      }

      res.json({
        success: true,
        data: { centre },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/consumer/huid/verify
   */
  public static async verifyHuid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { huid, articleType, purityKarat, jewellerName, saveHistory } = req.body;

      if (!huid || typeof huid !== 'string') {
        throw new AppError('huid is required', 400, API_ERROR_CODES.BAD_REQUEST);
      }

      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'CONSUMER_HUID_VERIFICATION_STARTED',
            entityType: 'HUID',
            metadata: { huid },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          },
        }).catch(() => {});
      }

      const result = await ConsumerVerificationService.verifyHuid(
        { huid, articleType, purityKarat, jewellerName, saveHistory },
        userId
      );

      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'CONSUMER_HUID_VERIFICATION_COMPLETED',
            entityType: 'HUID',
            metadata: { huid, status: result.verification.verificationStatus },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          },
        }).catch(() => {});
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/consumer/verifications (Authenticated)
   */
  public static async getVerifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('Authentication required', 401, API_ERROR_CODES.UNAUTHORIZED);
      }

      const response = await ConsumerVerificationService.getUserVerifications(userId);
      res.json({
        success: true,
        data: response,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/consumer/verifications/:id (Authenticated)
   */
  public static async deleteVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('Authentication required', 401, API_ERROR_CODES.UNAUTHORIZED);
      }

      const { id } = req.params;
      const result = await ConsumerVerificationService.deleteUserVerification(id, userId);

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CONSUMER_VERIFICATION_DELETED',
          entityType: 'CONSUMER_VERIFICATION',
          entityId: id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      }).catch(() => {});

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/consumer/guidance/:serviceType
   */
  public static async getGuidance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { serviceType } = req.params;
      const guidance = ConsumerGuidanceService.getGuidance(serviceType as ConsumerServiceType);

      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'CONSUMER_GUIDANCE_GENERATED',
            entityType: 'GUIDANCE',
            metadata: { serviceType },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          },
        }).catch(() => {});
      }

      res.json({
        success: true,
        data: { guidance },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/consumer/hallmarking/education
   */
  public static async getHallmarkingEducation(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const concepts = HallmarkingKnowledgeService.getHallmarkingConcepts();
      const signs = HallmarkingKnowledgeService.getMandatoryHallmarkSigns();

      res.json({
        success: true,
        data: {
          concepts,
          mandatorySigns: signs,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
