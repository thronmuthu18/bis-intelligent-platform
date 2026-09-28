import { Readable } from 'stream';

export interface StoredFileMetadata {
  storageKey: string;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  uploadedAt: Date;
}

export interface DocumentStorageProvider {
  /**
   * Stores a file buffer or stream in private storage.
   */
  upload(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    productId: string
  ): Promise<{ storageKey: string; storedFileName: string; fileSize: number; fileHash: string }>;

  /**
   * Retrieves a readable stream for a stored file.
   */
  downloadStream(storageKey: string): Promise<Readable>;

  /**
   * Retrieves full file buffer.
   */
  downloadBuffer(storageKey: string): Promise<Buffer>;

  /**
   * Deletes a stored file.
   */
  delete(storageKey: string): Promise<boolean>;

  /**
   * Checks if a file exists in storage.
   */
  exists(storageKey: string): Promise<boolean>;

  /**
   * Retrieves metadata for stored file.
   */
  getMetadata(storageKey: string): Promise<StoredFileMetadata | null>;

  /**
   * Generates a signed/temporary access token or URL.
   */
  getSignedAccess(storageKey: string, expiresInSeconds?: number): Promise<string>;
}
