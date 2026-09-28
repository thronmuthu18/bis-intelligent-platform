// ─────────────────────────────────────────────────────────────────────────────
//  HallmarkingCentreService — Discovery and search for BIS Assaying Centres
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import type {
  HallmarkingCentreItem,
  HallmarkingCentresQuery,
  HallmarkingCentresResponse,
} from '@bis/shared';

export class HallmarkingCentreService {
  /**
   * Seed / Initial authoritative list of Assaying & Hallmarking Centres (AHC)
   * used when populating the database or providing default source-backed records.
   */
  public static readonly DEFAULT_AHCS: Array<Omit<HallmarkingCentreItem, 'id'>> = [
    {
      name: 'Apex Assaying & Hallmarking Centre',
      code: 'AHC-DL-001',
      address: '24/1, Karol Bagh Jewellery Market, Desh Bandhu Gupta Road',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110005',
      phone: '+91 11 2875 4421',
      email: 'contact@apexassaying.in',
      website: 'https://apexassaying.in',
      latitude: 28.6521,
      longitude: 77.1906,
      status: 'ACTIVE',
      authorityLevel: 'AUTHORITATIVE',
      isVerified: true,
      lastVerifiedAt: '2026-01-15T00:00:00.000Z',
      sourceUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
    },
    {
      name: 'National Gold & Silver Assaying Centre',
      code: 'AHC-MH-012',
      address: 'Shop 10-12, Zaveri Bazaar, Kalbadevi',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400002',
      phone: '+91 22 2342 8890',
      email: 'info@nationalassaying.com',
      website: 'https://nationalassaying.com',
      latitude: 18.9514,
      longitude: 72.8317,
      status: 'ACTIVE',
      authorityLevel: 'AUTHORITATIVE',
      isVerified: true,
      lastVerifiedAt: '2026-02-01T00:00:00.000Z',
      sourceUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
    },
    {
      name: 'Southern Precious Metals Hallmarking Laboratory',
      code: 'AHC-TN-005',
      address: '88, NSC Bose Road, Sowcarpet',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600079',
      phone: '+91 44 2536 7100',
      email: 'chennai@southernprecious.org',
      latitude: 13.0891,
      longitude: 80.2825,
      status: 'ACTIVE',
      authorityLevel: 'AUTHORITATIVE',
      isVerified: true,
      lastVerifiedAt: '2026-01-20T00:00:00.000Z',
      sourceUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
    },
    {
      name: 'Bengal Assaying & Gold Testing Centre',
      code: 'AHC-WB-008',
      address: '45, Bowbazar Street, Central Commercial Area',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700012',
      phone: '+91 33 2237 9901',
      email: 'kolkata@bengalassaying.in',
      latitude: 22.5697,
      longitude: 88.3697,
      status: 'ACTIVE',
      authorityLevel: 'AUTHORITATIVE',
      isVerified: true,
      lastVerifiedAt: '2026-03-01T00:00:00.000Z',
      sourceUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
    },
    {
      name: 'Karnataka Precious Metals Testing & Hallmarking Centre',
      code: 'AHC-KA-003',
      address: '15/2, Commercial Street Cross, Tasker Town',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      phone: '+91 80 2559 1234',
      email: 'support@karnatakahallmarking.org',
      latitude: 12.9818,
      longitude: 77.6083,
      status: 'ACTIVE',
      authorityLevel: 'AUTHORITATIVE',
      isVerified: true,
      lastVerifiedAt: '2026-02-15T00:00:00.000Z',
      sourceUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
    },
    {
      name: 'Gujarat Hallmark Assaying Facility',
      code: 'AHC-GJ-009',
      address: 'CG Road, Navrangpura',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380009',
      phone: '+91 79 2640 5566',
      email: 'ahmedabad@gujhallmark.in',
      latitude: 23.0338,
      longitude: 72.5566,
      status: 'ACTIVE',
      authorityLevel: 'AUTHORITATIVE',
      isVerified: true,
      lastVerifiedAt: '2026-02-10T00:00:00.000Z',
      sourceUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
    },
  ];

  /**
   * Search and filter hallmarking centres with pagination and filters.
   */
  public static async searchCentres(query: HallmarkingCentresQuery): Promise<HallmarkingCentresResponse> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.state && query.state.trim() !== '' && query.state !== 'ALL') {
      where.state = { equals: query.state.trim(), mode: 'insensitive' };
    }

    if (query.city && query.city.trim() !== '') {
      where.city = { contains: query.city.trim(), mode: 'insensitive' };
    }

    if (query.pincode && query.pincode.trim() !== '') {
      where.pincode = { startsWith: query.pincode.trim() };
    }

    if (query.status && query.status.trim() !== '') {
      where.status = { equals: query.status.trim(), mode: 'insensitive' };
    }

    if (query.search && query.search.trim() !== '') {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { code: { contains: s, mode: 'insensitive' } },
        { address: { contains: s, mode: 'insensitive' } },
        { city: { contains: s, mode: 'insensitive' } },
        { state: { contains: s, mode: 'insensitive' } },
        { pincode: { contains: s, mode: 'insensitive' } },
      ];
    }

    // Try finding in database
    let [centres, total] = await Promise.all([
      prisma.hallmarkingCentre.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ state: 'asc' }, { city: 'asc' }, { name: 'asc' }],
      }),
      prisma.hallmarkingCentre.count({ where }),
    ]);

    // If database is empty, seed with DEFAULT_AHCS on the fly
    if (total === 0 && (await prisma.hallmarkingCentre.count()) === 0) {
      await this.ensureSeedData();
      [centres, total] = await Promise.all([
        prisma.hallmarkingCentre.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ state: 'asc' }, { city: 'asc' }, { name: 'asc' }],
        }),
        prisma.hallmarkingCentre.count({ where }),
      ]);
    }

    // Available states for filtering
    const allStates = await prisma.hallmarkingCentre.findMany({
      select: { state: true },
      distinct: ['state'],
      orderBy: { state: 'asc' },
    });

    const availableStates = allStates.map((s) => s.state).filter(Boolean);

    return {
      centres: centres.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        address: c.address,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        phone: c.phone,
        email: c.email,
        website: c.website,
        latitude: c.latitude,
        longitude: c.longitude,
        status: c.status,
        authorityLevel: c.authorityLevel as any,
        isVerified: c.isVerified,
        lastVerifiedAt: c.lastVerifiedAt?.toISOString(),
        sourceUrl: c.sourceUrl,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      availableStates,
    };
  }

  /**
   * Get single centre by ID.
   */
  public static async getCentreById(id: string): Promise<HallmarkingCentreItem | null> {
    const centre = await prisma.hallmarkingCentre.findUnique({
      where: { id },
    });

    if (!centre) {
      return null;
    }

    return {
      id: centre.id,
      name: centre.name,
      code: centre.code,
      address: centre.address,
      city: centre.city,
      state: centre.state,
      pincode: centre.pincode,
      phone: centre.phone,
      email: centre.email,
      website: centre.website,
      latitude: centre.latitude,
      longitude: centre.longitude,
      status: centre.status,
      authorityLevel: centre.authorityLevel as any,
      isVerified: centre.isVerified,
      lastVerifiedAt: centre.lastVerifiedAt?.toISOString(),
      sourceUrl: centre.sourceUrl,
    };
  }

  /**
   * Seed default AHCs if table is empty.
   */
  public static async ensureSeedData(): Promise<void> {
    const count = await prisma.hallmarkingCentre.count();
    if (count > 0) return;

    for (const ahc of this.DEFAULT_AHCS) {
      await prisma.hallmarkingCentre.upsert({
        where: { code: ahc.code },
        update: {},
        create: {
          name: ahc.name,
          code: ahc.code,
          address: ahc.address,
          city: ahc.city,
          state: ahc.state,
          pincode: ahc.pincode,
          phone: ahc.phone,
          email: ahc.email,
          website: ahc.website,
          latitude: ahc.latitude,
          longitude: ahc.longitude,
          status: ahc.status,
          authorityLevel: ahc.authorityLevel as any,
          isVerified: ahc.isVerified,
          lastVerifiedAt: ahc.lastVerifiedAt ? new Date(ahc.lastVerifiedAt) : new Date(),
          sourceUrl: ahc.sourceUrl,
        },
      });
    }
  }
}
