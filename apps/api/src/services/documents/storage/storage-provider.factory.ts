import { DocumentStorageProvider } from './storage.interface.js';
import { LocalPrivateStorageProvider } from './local-storage.provider.js';
import { S3PrivateStorageProvider } from './s3-storage.provider.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Storage Provider Factory
//  Resolves local private disk or S3-compatible cloud storage based on environment
// ─────────────────────────────────────────────────────────────────────────────

let cachedStorageProvider: DocumentStorageProvider | null = null;

export function getStorageProvider(): DocumentStorageProvider {
  if (cachedStorageProvider) {
    return cachedStorageProvider;
  }

  const providerType = env.STORAGE_PROVIDER;

  if (providerType === 's3') {
    logger.info(`Initializing S3PrivateStorageProvider (bucket: ${env.STORAGE_BUCKET}, region: ${env.STORAGE_REGION})`);
    cachedStorageProvider = new S3PrivateStorageProvider({
      bucket: env.STORAGE_BUCKET || '',
      region: env.STORAGE_REGION || 'ap-south-1',
      accessKeyId: env.STORAGE_ACCESS_KEY || undefined,
      secretAccessKey: env.STORAGE_SECRET_KEY || undefined,
      endpoint: env.STORAGE_ENDPOINT,
      forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
    });
    return cachedStorageProvider;
  }

  logger.info(`Using LocalPrivateStorageProvider (baseDir: ${env.STORAGE_LOCAL_PATH})`);
  cachedStorageProvider = new LocalPrivateStorageProvider(env.STORAGE_LOCAL_PATH);
  return cachedStorageProvider;
}

/**
 * Allows overriding or resetting the active storage provider (useful for unit tests).
 */
export function setStorageProvider(provider: DocumentStorageProvider | null): void {
  cachedStorageProvider = provider;
}
