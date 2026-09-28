import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createProduct,
  getProductsByUser,
  getProductById,
  updateProduct,
  archiveProduct,
  getProductStats,
} from '../services/product.service.js';
import { sendSuccess } from '../utils/response.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(2, 'Product name must be at least 2 characters')
    .max(120, 'Product name must not exceed 120 characters'),
  category: z
    .string({ required_error: 'Product category is required' })
    .trim()
    .min(2, 'Category must be at least 2 characters')
    .max(100, 'Category must not exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  manufacturerType: z
    .string()
    .trim()
    .max(100, 'Manufacturer type must not exceed 100 characters')
    .optional(),
  intendedUse: z
    .string()
    .trim()
    .max(500, 'Intended use must not exceed 500 characters')
    .optional(),
  targetMarket: z
    .string()
    .trim()
    .max(100, 'Target market must not exceed 100 characters')
    .optional(),
  countryOfManufacture: z
    .string()
    .trim()
    .max(100, 'Country of manufacture must not exceed 100 characters')
    .optional(),
});

export const updateProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Product name must be at least 2 characters')
    .max(120, 'Product name must not exceed 120 characters')
    .optional(),
  category: z
    .string()
    .trim()
    .min(2, 'Category must be at least 2 characters')
    .max(100, 'Category must not exceed 100 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  manufacturerType: z
    .string()
    .trim()
    .max(100, 'Manufacturer type must not exceed 100 characters')
    .optional(),
  intendedUse: z
    .string()
    .trim()
    .max(500, 'Intended use must not exceed 500 characters')
    .optional(),
  targetMarket: z
    .string()
    .trim()
    .max(100, 'Target market must not exceed 100 characters')
    .optional(),
  countryOfManufacture: z
    .string()
    .trim()
    .max(100, 'Country of manufacture must not exceed 100 characters')
    .optional(),
  status: z
    .enum(['DRAFT', 'INFORMATION_COLLECTION', 'READY_FOR_ANALYSIS', 'ACTIVE', 'ARCHIVED'])
    .optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
//  Product Handlers
// ─────────────────────────────────────────────────────────────────────────────

export async function createProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const validated = createProductSchema.parse(req.body);
    const userId = req.user!.id;

    const product = await createProduct(userId, validated);
    sendSuccess(res, { product }, 201);
  } catch (err) {
    next(err);
  }
}

export async function getProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const includeArchived = req.query.includeArchived === 'true';

    const products = await getProductsByUser(userId, includeArchived);
    sendSuccess(res, { products }, 200);
  } catch (err) {
    next(err);
  }
}

export async function getProductByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const productId = req.params.id;

    const product = await getProductById(userId, productId);
    sendSuccess(res, { product }, 200);
  } catch (err) {
    next(err);
  }
}

export async function updateProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const validated = updateProductSchema.parse(req.body);
    const userId = req.user!.id;
    const productId = req.params.id;

    const product = await updateProduct(userId, productId, validated);
    sendSuccess(res, { product }, 200);
  } catch (err) {
    next(err);
  }
}

export async function archiveProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const productId = req.params.id;

    const product = await archiveProduct(userId, productId);
    sendSuccess(res, { product, message: 'Product archived successfully' }, 200);
  } catch (err) {
    next(err);
  }
}

export async function getProductStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const stats = await getProductStats(userId);
    sendSuccess(res, { stats }, 200);
  } catch (err) {
    next(err);
  }
}
