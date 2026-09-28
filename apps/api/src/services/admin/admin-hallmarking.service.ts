// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Hallmarking Centres Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/AppError.js';
import { API_ERROR_CODES } from '@bis/shared';
import type { AdminHallmarkingCentreItem, CreateHallmarkingCentreInput, UpdateHallmarkingCentreInput } from '@bis/shared';

export class AdminHallmarkingService {
  public static async getCentres(params: {
    search?: string;
    state?: string;
    city?: string;
    page?: number;
    limit?: number;
  }): Promise<{ centres: AdminHallmarkingCentreItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { ahcCode: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.state) {
      where.state = params.state;
    }
    if (params.city) {
      where.city = params.city;
    }

    const [total, items] = await Promise.all([
      prisma.hallmarkingCentre.count({ where }),
      prisma.hallmarkingCentre.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const centres: AdminHallmarkingCentreItem[] = items.map((c) => ({
      id: c.id,
      name: c.name,
      ahcCode: c.code,
      address: c.address,
      city: c.city,
      state: c.state,
      pincode: c.pincode,
      phone: c.phone,
      email: c.email,
      website: c.website,
      recognitionStatus: c.status,
      sourceUrl: c.sourceUrl,
      sourceDocumentId: c.sourceDocumentId,
      lastVerifiedAt: c.lastVerifiedAt ? c.lastVerifiedAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return { centres, total, page, limit };
  }

  public static async createCentre(input: CreateHallmarkingCentreInput, userId: string): Promise<AdminHallmarkingCentreItem> {
    if (!input.name || !input.ahcCode || !input.city || !input.state) {
      throw new AppError('Name, AHC Code, City, and State are required', 400, API_ERROR_CODES.VALIDATION_ERROR);
    }

    const existing = await prisma.hallmarkingCentre.findUnique({ where: { code: input.ahcCode } });
    if (existing) {
      throw new AppError(`Hallmarking centre with AHC Code "${input.ahcCode}" already exists`, 409, API_ERROR_CODES.CONFLICT);
    }

    const created = await prisma.hallmarkingCentre.create({
      data: {
        name: input.name,
        code: input.ahcCode,
        address: input.address || `${input.city}, ${input.state}`,
        city: input.city,
        state: input.state,
        pincode: input.pincode || '000000',
        phone: input.phone,
        email: input.email,
        website: input.website,
        status: input.recognitionStatus || 'ACTIVE',
        sourceUrl: input.sourceUrl || 'https://www.manakonline.in',
        sourceDocumentId: input.sourceDocumentId,
        lastVerifiedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_CREATE_AHC',
        entityType: 'HallmarkingCentre',
        entityId: created.id,
        metadata: { ahcCode: created.code, name: created.name },
      },
    });

    return {
      id: created.id,
      name: created.name,
      ahcCode: created.code,
      address: created.address,
      city: created.city,
      state: created.state,
      pincode: created.pincode,
      phone: created.phone,
      email: created.email,
      website: created.website,
      recognitionStatus: created.status,
      sourceUrl: created.sourceUrl,
      sourceDocumentId: created.sourceDocumentId,
      lastVerifiedAt: created.lastVerifiedAt?.toISOString() || null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  public static async updateCentre(id: string, input: UpdateHallmarkingCentreInput, userId: string): Promise<AdminHallmarkingCentreItem> {
    const existing = await prisma.hallmarkingCentre.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Hallmarking centre not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    const updated = await prisma.hallmarkingCentre.update({
      where: { id },
      data: {
        name: input.name ?? existing.name,
        code: input.ahcCode ?? existing.code,
        address: input.address ?? existing.address,
        city: input.city ?? existing.city,
        state: input.state ?? existing.state,
        pincode: input.pincode ?? existing.pincode,
        phone: input.phone ?? existing.phone,
        email: input.email ?? existing.email,
        website: input.website ?? existing.website,
        status: input.recognitionStatus ?? existing.status,
        sourceUrl: input.sourceUrl ?? existing.sourceUrl,
        sourceDocumentId: input.sourceDocumentId ?? existing.sourceDocumentId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_UPDATE_AHC',
        entityType: 'HallmarkingCentre',
        entityId: id,
        metadata: { changes: input as any },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      ahcCode: updated.code,
      address: updated.address,
      city: updated.city,
      state: updated.state,
      pincode: updated.pincode,
      phone: updated.phone,
      email: updated.email,
      website: updated.website,
      recognitionStatus: updated.status,
      sourceUrl: updated.sourceUrl,
      sourceDocumentId: updated.sourceDocumentId,
      lastVerifiedAt: updated.lastVerifiedAt ? updated.lastVerifiedAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
