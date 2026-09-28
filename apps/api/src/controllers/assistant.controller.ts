// ─────────────────────────────────────────────────────────────────────────────
//  Phase 16 — Assistant & Activity Controller
// ─────────────────────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { AssistantService } from '../services/assistant.service.js';
import { UserActivityService } from '../services/activity.service.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';
import { API_ERROR_CODES } from '@bis/shared';

export class AssistantController {
  /**
   * GET /api/v1/products/:id/assistant/conversations
   */
  public static async getProductConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, API_ERROR_CODES.UNAUTHORIZED);
      }
      const productId = req.params.id;
      const conversations = await AssistantService.getProductConversations(userId, productId);
      sendSuccess(res, conversations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/products/:id/assistant/conversations
   */
  public static async createProductConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, API_ERROR_CODES.UNAUTHORIZED);
      }
      const productId = req.params.id;
      const conversation = await AssistantService.createProductConversation(userId, productId, req.body);
      sendSuccess(res, conversation, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/products/:id/assistant/conversations/:conversationId
   */
  public static async getConversationDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, API_ERROR_CODES.UNAUTHORIZED);
      }
      const { id: productId, conversationId } = req.params;
      const conversation = await AssistantService.getConversationDetails(userId, productId, conversationId);
      sendSuccess(res, conversation);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/products/:id/assistant/conversations/:conversationId/messages
   */
  public static async sendAssistantMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, API_ERROR_CODES.UNAUTHORIZED);
      }
      const { id: productId, conversationId } = req.params;
      const result = await AssistantService.sendAssistantMessage(userId, productId, conversationId, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/products/:id/activity
   */
  public static async getProductActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, API_ERROR_CODES.UNAUTHORIZED);
      }
      const productId = req.params.id;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const category = req.query.category as any;

      const feed = await UserActivityService.getProductActivity(userId, productId, {
        page,
        limit,
        category,
      });
      sendSuccess(res, feed);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/activity
   */
  public static async getUserActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, API_ERROR_CODES.UNAUTHORIZED);
      }
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const category = req.query.category as any;
      const productId = req.query.productId as string | undefined;

      const feed = await UserActivityService.getUserActivityFeed(userId, {
        page,
        limit,
        category,
        productId,
      });
      sendSuccess(res, feed);
    } catch (error) {
      next(error);
    }
  }
}
