import { Request, Response, NextFunction } from 'express';
import {
  analyzeProductStandards,
  getProductStandardReviews,
  saveProductStandardReview,
  getProductAttributes,
  upsertProductAttributes,
  ProductIntelligenceError,
} from '../services/intelligence/product-intelligence.service.js';
import { logger } from '../config/logger.js';
import { ReviewDecision } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Product Intelligence Controller (Phase 6)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/products/:id/intelligence/analyze
 * Executes or retrieves candidate standard analysis for a product.
 */
export async function analyzeProductStandardsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params.id || req.params.productId;
    const userId = req.user!.id;
    const forceRefresh = Boolean(req.body?.forceRefresh);

    const result = await analyzeProductStandards(productId, userId, { forceRefresh });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    if (err instanceof ProductIntelligenceError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      });
      return;
    }
    logger.error(`Product standard analysis error: ${err}`);
    next(err);
  }
}

/**
 * GET /api/v1/products/:id/intelligence/analysis
 * Retrieves latest candidate standard analysis for a product.
 */
export async function getLatestAnalysisHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params.id || req.params.productId;
    const userId = req.user!.id;

    const result = await analyzeProductStandards(productId, userId, { forceRefresh: false });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    if (err instanceof ProductIntelligenceError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      });
      return;
    }
    next(err);
  }
}

/**
 * POST /api/v1/products/:id/intelligence/reviews
 * Creates or updates user confirmation review decision for a standard.
 */
export async function saveProductReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params.id || req.params.productId;
    const userId = req.user!.id;
    const { standardId, decision, note } = req.body;

    if (!standardId || !decision) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'standardId and decision are required.',
        },
      });
      return;
    }

    const validDecisions: ReviewDecision[] = ['CONFIRMED', 'REJECTED', 'NEEDS_REVIEW'];
    if (!validDecisions.includes(decision)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: `decision must be one of: ${validDecisions.join(', ')}`,
        },
      });
      return;
    }

    const review = await saveProductStandardReview(productId, userId, {
      standardId,
      decision,
      note,
    });

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (err: unknown) {
    if (err instanceof ProductIntelligenceError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      });
      return;
    }
    next(err);
  }
}

/**
 * GET /api/v1/products/:id/intelligence/reviews
 * Retrieves user review decisions for a product.
 */
export async function getProductReviewsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params.id || req.params.productId;
    const userId = req.user!.id;

    const reviews = await getProductStandardReviews(productId, userId);

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (err: unknown) {
    if (err instanceof ProductIntelligenceError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      });
      return;
    }
    next(err);
  }
}

/**
 * GET /api/v1/products/:id/attributes
 * Retrieves structured attributes for a product.
 */
export async function getProductAttributesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params.id || req.params.productId;
    const userId = req.user!.id;

    const attributes = await getProductAttributes(productId, userId);

    res.status(200).json({
      success: true,
      data: attributes,
    });
  } catch (err: unknown) {
    if (err instanceof ProductIntelligenceError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      });
      return;
    }
    next(err);
  }
}

/**
 * POST /api/v1/products/:id/attributes
 * Upserts structured attributes for a product.
 */
export async function upsertProductAttributesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params.id || req.params.productId;
    const userId = req.user!.id;
    const rawList = Array.isArray(req.body) ? req.body : [req.body];

    if (rawList.length === 0 || !rawList[0].attributeKey) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'attributeKey and attributeValue are required.',
        },
      });
      return;
    }

    const attributes = await upsertProductAttributes(productId, userId, rawList);

    res.status(200).json({
      success: true,
      data: attributes,
    });
  } catch (err: unknown) {
    if (err instanceof ProductIntelligenceError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      });
      return;
    }
    next(err);
  }
}
