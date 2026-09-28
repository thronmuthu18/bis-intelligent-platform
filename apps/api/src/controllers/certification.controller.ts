import { Request, Response, NextFunction } from 'express';
import { certificationIntelligenceService } from '../services/certification/certification-intelligence.service.js';
import { AppError } from '../utils/AppError.js';
import { API_ERROR_CODES } from '@bis/shared';

export class CertificationController {
  /**
   * POST /api/v1/products/:id/certification/analyze
   * Executes or returns cached certification intelligence analysis.
   */
  async analyze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.id;
      const userId = req.user!.id;
      const forceRefresh = Boolean(req.body?.forceRefresh);

      const analysis = await certificationIntelligenceService.analyzeProductCertification(
        productId,
        userId,
        forceRefresh
      );

      res.status(200).json({
        success: true,
        status: 'success',
        data: analysis,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/products/:id/certification
   * Retrieves latest completed certification intelligence analysis.
   */
  async getLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.id;
      const userId = req.user!.id;
      const analysis = await certificationIntelligenceService.getLatestCertificationAnalysis(
        productId,
        userId
      );

      res.status(200).json({
        success: true,
        status: 'success',
        data: analysis,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/products/:id/certification/schemes/:schemeId
   * Retrieves detailed breakdown of a specific scheme for the product.
   */
  async getSchemeDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: productId, schemeId } = req.params;
      const userId = req.user!.id;
      const detail = await certificationIntelligenceService.getSchemeDetail(
        productId,
        userId,
        schemeId
      );

      res.status(200).json({
        success: true,
        status: 'success',
        data: detail,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/products/:id/certification/reviews
   * Saves or updates a user scheme review decision.
   */
  async saveReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.id;
      const userId = req.user!.id;
      const { schemeId, decision, note } = req.body;

      if (!schemeId) {
        throw new AppError('schemeId is required', 400, API_ERROR_CODES.BAD_REQUEST);
      }

      if (!['CONFIRMED', 'REJECTED', 'NEEDS_REVIEW'].includes(decision)) {
        throw new AppError(
          'Invalid decision. Must be CONFIRMED, REJECTED, or NEEDS_REVIEW',
          400,
          API_ERROR_CODES.BAD_REQUEST
        );
      }

      const review = await certificationIntelligenceService.saveProductSchemeReview(
        productId,
        userId,
        schemeId,
        decision,
        note
      );

      res.status(200).json({
        success: true,
        status: 'success',
        data: review,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/products/:id/certification/reviews
   * Retrieves all scheme review decisions for a product.
   */
  async getReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.id;
      const userId = req.user!.id;
      const reviews = await certificationIntelligenceService.getProductSchemeReviews(
        productId,
        userId
      );

      res.status(200).json({
        success: true,
        status: 'success',
        data: reviews,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const certificationController = new CertificationController();
