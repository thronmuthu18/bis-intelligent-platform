import { prisma } from '../db/client.js';
import { AppError } from '../utils/AppError.js';
import {
  API_ERROR_CODES,
  type Product,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductStats,
  type ProductStatus,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Product Service — Business Logic & Database Interaction
//  Strictly enforces user ownership and data isolation.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new product for the authenticated user.
 * Automatically initializes status to DRAFT and timestamps.
 */
export async function createProduct(
  userId: string,
  input: CreateProductInput,
): Promise<Product> {
  const now = new Date();

  const created = await prisma.product.create({
    data: {
      userId,
      name: input.name.trim(),
      category: input.category.trim(),
      description: input.description?.trim() || null,
      manufacturerType: input.manufacturerType?.trim() || null,
      intendedUse: input.intendedUse?.trim() || null,
      targetMarket: input.targetMarket?.trim() || null,
      countryOfManufacture: input.countryOfManufacture?.trim() || null,
      status: 'DRAFT',
      isActive: true,
      lastActivityAt: now,
    },
  });

  return {
    id: created.id,
    userId: created.userId,
    name: created.name,
    category: created.category,
    description: created.description || undefined,
    manufacturerType: created.manufacturerType || undefined,
    intendedUse: created.intendedUse || undefined,
    targetMarket: created.targetMarket || undefined,
    countryOfManufacture: created.countryOfManufacture || undefined,
    status: created.status as ProductStatus,
    workflowStage: created.workflowStage,
    isActive: created.isActive,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
    lastActivityAt: created.lastActivityAt?.toISOString(),
  };
}

/**
 * Retrieves all active products owned by the authenticated user.
 * Orders by updatedAt descending (latest updated first).
 */
export async function getProductsByUser(
  userId: string,
  includeArchived = false,
): Promise<Product[]> {
  const whereClause: { userId: string; isActive: boolean; status?: { not: 'ARCHIVED' } } = {
    userId,
    isActive: true,
  };

  if (!includeArchived) {
    whereClause.status = { not: 'ARCHIVED' };
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: { updatedAt: 'desc' },
  });

  return products.map((p) => ({
    id: p.id,
    userId: p.userId,
    name: p.name,
    category: p.category,
    description: p.description || undefined,
    manufacturerType: p.manufacturerType || undefined,
    intendedUse: p.intendedUse || undefined,
    targetMarket: p.targetMarket || undefined,
    countryOfManufacture: p.countryOfManufacture || undefined,
    status: p.status as ProductStatus,
    workflowStage: p.workflowStage,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    lastActivityAt: p.lastActivityAt?.toISOString(),
  }));
}

/**
 * Retrieves a single product by ID for the authenticated owner.
 * Returns 404 NOT_FOUND if the product does not exist or is owned by another user.
 * Prevents account enumeration and cross-user data leakage (IDOR).
 */
export async function getProductById(
  userId: string,
  productId: string,
): Promise<Product> {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId,
      isActive: true,
    },
  });

  if (!product) {
    throw new AppError(
      'Product not found or access denied.',
      404,
      API_ERROR_CODES.PRODUCT_NOT_FOUND,
    );
  }

  return {
    id: product.id,
    userId: product.userId,
    name: product.name,
    category: product.category,
    description: product.description || undefined,
    manufacturerType: product.manufacturerType || undefined,
    intendedUse: product.intendedUse || undefined,
    targetMarket: product.targetMarket || undefined,
    countryOfManufacture: product.countryOfManufacture || undefined,
    status: product.status as ProductStatus,
    workflowStage: product.workflowStage,
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    lastActivityAt: product.lastActivityAt?.toISOString(),
  };
}

/**
 * Updates an existing product owned by the authenticated user.
 * Validates ownership before performing the update.
 */
export async function updateProduct(
  userId: string,
  productId: string,
  input: UpdateProductInput,
): Promise<Product> {
  // 1. Verify existence & ownership
  const existing = await prisma.product.findFirst({
    where: {
      id: productId,
      userId,
      isActive: true,
    },
  });

  if (!existing) {
    throw new AppError(
      'Product not found or access denied.',
      404,
      API_ERROR_CODES.PRODUCT_NOT_FOUND,
    );
  }

  const now = new Date();

  // 2. Perform safe update
  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.category !== undefined && { category: input.category.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() || null }),
      ...(input.manufacturerType !== undefined && { manufacturerType: input.manufacturerType.trim() || null }),
      ...(input.intendedUse !== undefined && { intendedUse: input.intendedUse.trim() || null }),
      ...(input.targetMarket !== undefined && { targetMarket: input.targetMarket.trim() || null }),
      ...(input.countryOfManufacture !== undefined && { countryOfManufacture: input.countryOfManufacture.trim() || null }),
      ...(input.status !== undefined && { status: input.status }),
      lastActivityAt: now,
    },
  });

  return {
    id: updated.id,
    userId: updated.userId,
    name: updated.name,
    category: updated.category,
    description: updated.description || undefined,
    manufacturerType: updated.manufacturerType || undefined,
    intendedUse: updated.intendedUse || undefined,
    targetMarket: updated.targetMarket || undefined,
    countryOfManufacture: updated.countryOfManufacture || undefined,
    status: updated.status as ProductStatus,
    workflowStage: updated.workflowStage,
    isActive: updated.isActive,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    lastActivityAt: updated.lastActivityAt?.toISOString(),
  };
}

/**
 * Safely archives a product owned by the user (soft archive).
 * Does not physically delete data to preserve audit history.
 */
export async function archiveProduct(
  userId: string,
  productId: string,
): Promise<Product> {
  const existing = await prisma.product.findFirst({
    where: {
      id: productId,
      userId,
      isActive: true,
    },
  });

  if (!existing) {
    throw new AppError(
      'Product not found or access denied.',
      404,
      API_ERROR_CODES.PRODUCT_NOT_FOUND,
    );
  }

  const now = new Date();

  const archived = await prisma.product.update({
    where: { id: productId },
    data: {
      status: 'ARCHIVED',
      lastActivityAt: now,
    },
  });

  return {
    id: archived.id,
    userId: archived.userId,
    name: archived.name,
    category: archived.category,
    description: archived.description || undefined,
    manufacturerType: archived.manufacturerType || undefined,
    intendedUse: archived.intendedUse || undefined,
    targetMarket: archived.targetMarket || undefined,
    countryOfManufacture: archived.countryOfManufacture || undefined,
    status: archived.status as ProductStatus,
    workflowStage: archived.workflowStage,
    isActive: archived.isActive,
    createdAt: archived.createdAt.toISOString(),
    updatedAt: archived.updatedAt.toISOString(),
    lastActivityAt: archived.lastActivityAt?.toISOString(),
  };
}

/**
 * Returns genuine product metric counts for the user dashboard.
 */
export async function getProductStats(userId: string): Promise<ProductStats> {
  const [total, active, draft, infoCollection, readyAnalysis, archived] = await Promise.all([
    prisma.product.count({
      where: { userId, isActive: true, status: { not: 'ARCHIVED' } },
    }),
    prisma.product.count({
      where: { userId, isActive: true, status: 'ACTIVE' },
    }),
    prisma.product.count({
      where: { userId, isActive: true, status: 'DRAFT' },
    }),
    prisma.product.count({
      where: { userId, isActive: true, status: 'INFORMATION_COLLECTION' },
    }),
    prisma.product.count({
      where: { userId, isActive: true, status: 'READY_FOR_ANALYSIS' },
    }),
    prisma.product.count({
      where: { userId, status: 'ARCHIVED' },
    }),
  ]);

  return {
    total,
    active,
    draft,
    informationCollection: infoCollection,
    readyForAnalysis: readyAnalysis,
    archived,
  };
}
