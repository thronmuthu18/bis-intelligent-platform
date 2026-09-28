import { Request, Response, NextFunction } from 'express';
import { testingIntelligenceService } from '../services/testing/testing-intelligence.service.js';
import { AppError } from '../utils/AppError.js';
import type { LabDecision } from '@bis/shared';

/**
 * POST /api/v1/products/:id/testing/analyze
 * Executes or returns cached testing intelligence analysis for a product.
 */
export async function analyzeTesting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: productId } = req.params;
    const userId = (req as any).user?.id;
    const forceRefresh = req.body.forceRefresh === true;

    if (!userId) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!productId) {
      throw AppError.badRequest('Product ID is required');
    }

    const analysis = await testingIntelligenceService.analyzeProductTesting(
      productId,
      userId,
      forceRefresh
    );

    res.status(200).json({
      status: 'success',
      data: analysis,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/products/:id/testing
 * Retrieves latest completed testing intelligence analysis.
 */
export async function getTestingAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: productId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const analysis = await testingIntelligenceService.getLatestTestingAnalysis(productId, userId);

    if (!analysis) {
      res.status(200).json({
        status: 'success',
        data: null,
        message: 'No testing analysis has been run for this product yet.',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: analysis,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/products/:id/testing/requirements
 * Retrieves test requirements with optional category/status filters.
 */
export async function getTestRequirements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: productId } = req.params;
    const userId = (req as any).user?.id;
    const { standardId, schemeId, category, status } = req.query;

    if (!userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const requirements = await testingIntelligenceService.getTestRequirements(productId, userId, {
      standardId: standardId as string,
      schemeId: schemeId as string,
      category: category as any,
      status: status as any,
    });

    res.status(200).json({
      status: 'success',
      data: requirements,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/products/:id/testing/laboratories
 * Retrieves capability-matched laboratories with optional location/recognition filters.
 */
export async function getLaboratories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: productId } = req.params;
    const userId = (req as any).user?.id;
    const { state, city, standardId, testName, recognitionStatus, accreditationStatus, limit } =
      req.query;

    if (!userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const laboratories = await testingIntelligenceService.getLaboratories(productId, userId, {
      state: state as string,
      city: city as string,
      standardId: standardId as string,
      testName: testName as string,
      recognitionStatus: recognitionStatus as any,
      accreditationStatus: accreditationStatus as any,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });

    res.status(200).json({
      status: 'success',
      data: laboratories,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/products/:id/testing/laboratories/reviews
 * Submits user laboratory review decision (SHORTLISTED, SELECTED, REJECTED, NEEDS_REVIEW).
 */
export async function createLaboratoryReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: productId } = req.params;
    const userId = (req as any).user?.id;
    const { laboratoryId, decision, note } = req.body;

    if (!userId) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!laboratoryId) {
      throw AppError.badRequest('laboratoryId is required');
    }

    const validDecisions: LabDecision[] = ['SHORTLISTED', 'SELECTED', 'REJECTED', 'NEEDS_REVIEW'];
    if (!decision || !validDecisions.includes(decision)) {
      throw AppError.badRequest(
        `Invalid decision. Must be one of: ${validDecisions.join(', ')}`
      );
    }

    const review = await testingIntelligenceService.saveProductLaboratoryReview(productId, userId, {
      laboratoryId,
      decision,
      note,
    });

    res.status(201).json({
      status: 'success',
      data: review,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/products/:id/testing/laboratories/reviews
 * Retrieves all laboratory review decisions for a product.
 */
export async function getLaboratoryReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: productId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const reviews = await testingIntelligenceService.getProductLaboratoryReviews(productId, userId);

    res.status(200).json({
      status: 'success',
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
}
