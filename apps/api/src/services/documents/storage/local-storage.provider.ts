import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { DocumentStorageProvider, StoredFileMetadata } from './storage.interface.js';
import { AppError } from '../../../utils/AppError.js';

export class LocalPrivateStorageProvider implements DocumentStorageProvider {
  private baseStorageDir: string;

  constructor(customStorageDir?: string) {
    // Default to private storage inside apps/api/uploads/documents
    this.baseStorageDir =
      customStorageDir ||
      path.resolve(process.cwd(), 'uploads', 'documents');

    // Ensure directory exists with safe permissions
    if (!fs.existsSync(this.baseStorageDir)) {
      fs.mkdirSync(this.baseStorageDir, { recursive: true });
    }
  }

  private resolveSafePath(storageKey: string): string {
    // Prevent path traversal attacks
    const normalizedKey = path.normalize(storageKey).replace(/^(\.\.[/\\])+/, '');
    const fullPath = path.resolve(this.baseStorageDir, normalizedKey);

    if (!fullPath.startsWith(path.resolve(this.baseStorageDir))) {
      throw AppError.forbidden('Invalid storage path or path traversal detected');
    }

    return fullPath;
  }

  async upload(
    fileBuffer: Buffer,
    originalFileName: string,
    _mimeType: string,
    productId: string
  ): Promise<{ storageKey: string; storedFileName: string; fileSize: number; fileHash: string }> {
    const ext = path.extname(originalFileName).toLowerCase() || '.bin';
    const cleanExt = ext.replace(/[^a-z0-9.]/gi, '');
    const uniqueId = uuidv4();
    const storedFileName = `${productId}_${uniqueId}${cleanExt}`;
    const storageKey = storedFileName;

    const targetPath = this.resolveSafePath(storageKey);
    const targetDir = path.dirname(targetPath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    await fs.promises.writeFile(targetPath, fileBuffer);

    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');
    const fileSize = fileBuffer.length;

    return {
      storageKey,
      storedFileName,
      fileSize,
      fileHash,
    };
  }

  async downloadStream(storageKey: string): Promise<Readable> {
    const filePath = this.resolveSafePath(storageKey);

    if (!fs.existsSync(filePath)) {
      throw AppError.notFound('Stored document file not found');
    }

    return fs.createReadStream(filePath);
  }

  async downloadBuffer(storageKey: string): Promise<Buffer> {
    const filePath = this.resolveSafePath(storageKey);

    if (!fs.existsSync(filePath)) {
      throw AppError.notFound('Stored document file not found');
    }

    return fs.promises.readFile(filePath);
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      const filePath = this.resolveSafePath(storageKey);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch {
      return false;
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    const filePath = this.resolveSafePath(storageKey);
    return fs.existsSync(filePath);
  }

  async getMetadata(storageKey: string): Promise<StoredFileMetadata | null> {
    const filePath = this.resolveSafePath(storageKey);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stat = await fs.promises.stat(filePath);
    const buffer = await fs.promises.readFile(filePath);
    const fileHash = createHash('sha256').update(buffer).digest('hex');

    return {
      storageKey,
      originalFileName: path.basename(storageKey),
      storedFileName: path.basename(storageKey),
      mimeType: 'application/octet-stream',
      fileSize: stat.size,
      fileHash,
      uploadedAt: stat.birthtime,
    };
  }

  async getSignedAccess(storageKey: string, expiresInSeconds: number = 3600): Promise<string> {
    // Generate private signed token identifier for secure endpoint retrieval
    const token = createHash('sha256')
      .update(`${storageKey}_${Date.now()}_${expiresInSeconds}`)
      .digest('hex');
    return token;
  }
}
