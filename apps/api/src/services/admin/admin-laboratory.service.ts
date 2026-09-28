// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Laboratory Management Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/AppError.js';
import { API_ERROR_CODES, type LabOrganizationType } from '@bis/shared';
import type { AdminLaboratoryItem, CreateLaboratoryInput, UpdateLaboratoryInput } from '@bis/shared';

export class AdminLaboratoryService {
  public static async getLaboratories(params: {
    search?: string;
    organizationType?: string;
    isNabl?: string;
    page?: number;
    limit?: number;
  }): Promise<{ laboratories: AdminLaboratoryItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
        { state: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.organizationType) {
      where.organizationType = params.organizationType as LabOrganizationType;
    }
    if (params.isNabl !== undefined) {
      where.isNabl = params.isNabl === 'true';
    }

    const [total, items] = await Promise.all([
      prisma.laboratory.count({ where }),
      prisma.laboratory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { capabilities: true } },
        },
      }),
    ]);

    const laboratories: AdminLaboratoryItem[] = items.map((l) => ({
      id: l.id,
      name: l.name,
      code: l.code,
      organizationType: l.organizationType,
      address: l.address,
      city: l.city,
      state: l.state,
      country: l.country,
      pincode: l.pincode,
      phone: l.phone,
      email: l.email,
      website: l.website,
      isNabl: l.isNabl,
      isBisLab: l.isBisLab,
      status: l.status,
      isVerified: l.isVerified,
      lastVerifiedAt: l.lastVerifiedAt ? l.lastVerifiedAt.toISOString() : null,
      sourceDocumentId: l.sourceDocumentId,
      sourceUrl: l.sourceUrl,
      capabilitiesCount: l._count.capabilities,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));

    return { laboratories, total, page, limit };
  }

  public static async createLaboratory(input: CreateLaboratoryInput, userId: string): Promise<AdminLaboratoryItem> {
    if (!input.name) {
      throw new AppError('Laboratory name is required', 400, API_ERROR_CODES.VALIDATION_ERROR);
    }

    const created = await prisma.laboratory.create({
      data: {
        name: input.name,
        code: input.code,
        organizationType: (input.organizationType as any) || 'BIS_RECOGNIZED',
        address: input.address,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        phone: input.phone,
        email: input.email,
        website: input.website,
        isNabl: input.isNabl ?? false,
        isBisLab: input.isBisLab ?? false,
        sourceUrl: input.sourceUrl,
        sourceDocumentId: input.sourceDocumentId,
        isVerified: true,
        lastVerifiedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_CREATE_LABORATORY',
        entityType: 'Laboratory',
        entityId: created.id,
        metadata: { name: created.name },
      },
    });

    return {
      id: created.id,
      name: created.name,
      code: created.code,
      organizationType: created.organizationType,
      address: created.address,
      city: created.city,
      state: created.state,
      country: created.country,
      pincode: created.pincode,
      phone: created.phone,
      email: created.email,
      website: created.website,
      isNabl: created.isNabl,
      isBisLab: created.isBisLab,
      status: created.status,
      isVerified: created.isVerified,
      lastVerifiedAt: created.lastVerifiedAt?.toISOString() || null,
      sourceDocumentId: created.sourceDocumentId,
      sourceUrl: created.sourceUrl,
      capabilitiesCount: 0,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  public static async updateLaboratory(id: string, input: UpdateLaboratoryInput, userId: string): Promise<AdminLaboratoryItem> {
    const existing = await prisma.laboratory.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Laboratory not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    const updated = await prisma.laboratory.update({
      where: { id },
      data: {
        name: input.name ?? existing.name,
        code: input.code ?? existing.code,
        organizationType: (input.organizationType as any) ?? existing.organizationType,
        address: input.address ?? existing.address,
        city: input.city ?? existing.city,
        state: input.state ?? existing.state,
        pincode: input.pincode ?? existing.pincode,
        phone: input.phone ?? existing.phone,
        email: input.email ?? existing.email,
        website: input.website ?? existing.website,
        isNabl: input.isNabl ?? existing.isNabl,
        isBisLab: input.isBisLab ?? existing.isBisLab,
        status: input.status ?? existing.status,
        isVerified: input.isVerified ?? existing.isVerified,
        sourceUrl: input.sourceUrl ?? existing.sourceUrl,
        sourceDocumentId: input.sourceDocumentId ?? existing.sourceDocumentId,
      },
      include: {
        _count: { select: { capabilities: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_UPDATE_LABORATORY',
        entityType: 'Laboratory',
        entityId: id,
        metadata: { changes: input as any },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      organizationType: updated.organizationType,
      address: updated.address,
      city: updated.city,
      state: updated.state,
      country: updated.country,
      pincode: updated.pincode,
      phone: updated.phone,
      email: updated.email,
      website: updated.website,
      isNabl: updated.isNabl,
      isBisLab: updated.isBisLab,
      status: updated.status,
      isVerified: updated.isVerified,
      lastVerifiedAt: updated.lastVerifiedAt ? updated.lastVerifiedAt.toISOString() : null,
      sourceDocumentId: updated.sourceDocumentId,
      sourceUrl: updated.sourceUrl,
      capabilitiesCount: updated._count.capabilities,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
