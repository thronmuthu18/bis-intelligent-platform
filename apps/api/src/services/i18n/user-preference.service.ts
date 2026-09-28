// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — User Preference Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import type {
  SupportedLanguage,
  UpdateUserPreferenceRequest,
  UserPreferenceItem,
  UserPreferenceResponse,
} from '@bis/shared';

export class UserPreferenceService {
  /**
   * Get preference for an authenticated user, creating default if none exists.
   */
  public static async getUserPreference(userId: string): Promise<UserPreferenceResponse> {
    let pref = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await prisma.userPreference.create({
        data: {
          userId,
          language: 'en',
          theme: 'system',
          reducedMotion: false,
          highContrast: false,
        },
      });
    }

    const item: UserPreferenceItem = {
      id: pref.id,
      userId: pref.userId,
      language: pref.language as SupportedLanguage,
      theme: pref.theme || undefined,
      reducedMotion: pref.reducedMotion,
      highContrast: pref.highContrast,
      createdAt: pref.createdAt.toISOString(),
      updatedAt: pref.updatedAt.toISOString(),
    };

    return { preference: item };
  }

  /**
   * Update preference for an authenticated user.
   */
  public static async updateUserPreference(
    userId: string,
    data: UpdateUserPreferenceRequest
  ): Promise<UserPreferenceResponse> {
    const updated = await prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        language: data.language || 'en',
        theme: data.theme || 'system',
        reducedMotion: data.reducedMotion ?? false,
        highContrast: data.highContrast ?? false,
      },
      update: {
        ...(data.language ? { language: data.language } : {}),
        ...(data.theme !== undefined ? { theme: data.theme } : {}),
        ...(data.reducedMotion !== undefined ? { reducedMotion: data.reducedMotion } : {}),
        ...(data.highContrast !== undefined ? { highContrast: data.highContrast } : {}),
      },
    });

    const item: UserPreferenceItem = {
      id: updated.id,
      userId: updated.userId,
      language: updated.language as SupportedLanguage,
      theme: updated.theme || undefined,
      reducedMotion: updated.reducedMotion,
      highContrast: updated.highContrast,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return { preference: item };
  }
}
