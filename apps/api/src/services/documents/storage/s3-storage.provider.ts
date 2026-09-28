import { createHash, createHmac } from 'crypto';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import type { DocumentStorageProvider, StoredFileMetadata } from './storage.interface.js';
import { AppError } from '../../../utils/AppError.js';
import { logger } from '../../../config/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
//  S3 Configuration Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface S3StorageConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  AWS Signature V4 Utilities (Zero External Dependencies)
// ─────────────────────────────────────────────────────────────────────────────

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256Hex(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

function getSigningKey(secretAccessKey: string, dateStamp: string, region: string): Buffer {
  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, 's3');
  return hmacSha256(kService, 'aws4_request');
}

// ─────────────────────────────────────────────────────────────────────────────
//  S3PrivateStorageProvider
//  Complies with AWS S3, Cloudflare R2, MinIO, and AWS S3-compatible object stores.
//  Enforces private bucket access, server-side HMAC validation, and signed access.
// ─────────────────────────────────────────────────────────────────────────────

export class S3PrivateStorageProvider implements DocumentStorageProvider {
  private config: S3StorageConfig;

  constructor(config: S3StorageConfig) {
    if (!config.bucket) throw new Error('S3PrivateStorageProvider requires a bucket name.');
    if (!config.region) throw new Error('S3PrivateStorageProvider requires a region.');
    if (!config.accessKeyId) throw new Error('S3PrivateStorageProvider requires an accessKeyId.');
    if (!config.secretAccessKey) throw new Error('S3PrivateStorageProvider requires a secretAccessKey.');

    this.config = {
      ...config,
      endpoint: config.endpoint ? config.endpoint.replace(/\/$/, '') : undefined,
      forcePathStyle: config.forcePathStyle ?? false,
    };
  }

  private getHostAndUrl(key: string): { host: string; url: string; pathname: string } {
    const encodedKey = encodeURI(key).replace(/^\//, '');
    let host: string;
    let pathname: string;
    let url: string;

    if (this.config.endpoint) {
      const parsed = new URL(this.config.endpoint);
      host = parsed.host;
      if (this.config.forcePathStyle) {
        pathname = `/${this.config.bucket}/${encodedKey}`;
      } else {
        host = `${this.config.bucket}.${host}`;
        pathname = `/${encodedKey}`;
      }
      url = `${parsed.protocol}//${host}${pathname}`;
    } else {
      // Standard AWS S3
      if (this.config.forcePathStyle) {
        host = `s3.${this.config.region}.amazonaws.com`;
        pathname = `/${this.config.bucket}/${encodedKey}`;
        url = `https://${host}${pathname}`;
      } else {
        host = `${this.config.bucket}.s3.${this.config.region}.amazonaws.com`;
        pathname = `/${encodedKey}`;
        url = `https://${host}${pathname}`;
      }
    }

    return { host, url, pathname };
  }

  private buildSignedHeaders(
    method: string,
    key: string,
    payloadHash: string,
    contentType?: string
  ): { headers: Record<string, string>; url: string } {
    const { host, url, pathname } = this.getHostAndUrl(key);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const headers: Record<string, string> = {
      host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
    };

    if (contentType) {
      headers['content-type'] = contentType;
    }

    const headerKeys = Object.keys(headers).sort();
    const canonicalHeaders = headerKeys.map((k) => `${k}:${headers[k]}\n`).join('');
    const signedHeaders = headerKeys.join(';');

    const canonicalRequest = [
      method,
      pathname,
      '', // query string
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${this.config.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join('\n');

    const signingKey = getSigningKey(this.config.secretAccessKey, dateStamp, this.config.region);
    const signature = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');

    headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return { headers, url };
  }

  async upload(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    productId: string
  ): Promise<{ storageKey: string; storedFileName: string; fileSize: number; fileHash: string }> {
    const ext = path.extname(originalFileName).toLowerCase() || '.bin';
    const cleanExt = ext.replace(/[^a-z0-9.]/gi, '');
    const uniqueId = uuidv4();
    const storedFileName = `${productId}_${uniqueId}${cleanExt}`;
    const storageKey = `documents/${productId}/${storedFileName}`;

    const payloadHash = sha256Hex(fileBuffer);
    const { headers, url } = this.buildSignedHeaders('PUT', storageKey, payloadHash, mimeType);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: fileBuffer,
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.error(`S3 Upload failed with status ${response.status}: ${errText}`);
        throw AppError.internal('Failed to upload document to secure object storage');
      }

      return {
        storageKey,
        storedFileName,
        fileSize: fileBuffer.length,
        fileHash: payloadHash,
      };
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('S3 Upload network exception', { error: msg });
      throw AppError.internal(`Storage service connection error: ${msg}`);
    }
  }

  async downloadStream(storageKey: string): Promise<Readable> {
    const buffer = await this.downloadBuffer(storageKey);
    return Readable.from(buffer);
  }

  async downloadBuffer(storageKey: string): Promise<Buffer> {
    const payloadHash = sha256Hex('');
    const { headers, url } = this.buildSignedHeaders('GET', storageKey, payloadHash);

    try {
      const response = await fetch(url, { method: 'GET', headers });

      if (response.status === 404) {
        throw AppError.notFound('Stored document file not found in storage');
      }

      if (!response.ok) {
        const errText = await response.text();
        logger.error(`S3 Download failed with status ${response.status}: ${errText}`);
        throw AppError.internal('Failed to retrieve document from secure storage');
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('S3 Download exception', { error: msg });
      throw AppError.internal(`Storage download error: ${msg}`);
    }
  }

  async delete(storageKey: string): Promise<boolean> {
    const payloadHash = sha256Hex('');
    const { headers, url } = this.buildSignedHeaders('DELETE', storageKey, payloadHash);

    try {
      const response = await fetch(url, { method: 'DELETE', headers });
      return response.status === 204 || response.status === 200 || response.status === 404;
    } catch {
      return false;
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    const payloadHash = sha256Hex('');
    const { headers, url } = this.buildSignedHeaders('HEAD', storageKey, payloadHash);

    try {
      const response = await fetch(url, { method: 'HEAD', headers });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async getMetadata(storageKey: string): Promise<StoredFileMetadata | null> {
    const payloadHash = sha256Hex('');
    const { headers, url } = this.buildSignedHeaders('HEAD', storageKey, payloadHash);

    try {
      const response = await fetch(url, { method: 'HEAD', headers });
      if (response.status !== 200) return null;

      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const etag = (response.headers.get('etag') || '').replace(/"/g, '');
      const lastModified = response.headers.get('last-modified')
        ? new Date(response.headers.get('last-modified')!)
        : new Date();

      return {
        storageKey,
        originalFileName: path.basename(storageKey),
        storedFileName: path.basename(storageKey),
        mimeType: contentType,
        fileSize: contentLength,
        fileHash: etag || 'unknown',
        uploadedAt: lastModified,
      };
    } catch {
      return null;
    }
  }

  async getSignedAccess(storageKey: string, expiresInSeconds: number = 3600): Promise<string> {
    const { host, pathname } = this.getHostAndUrl(storageKey);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const credentialScope = `${dateStamp}/${this.config.region}/s3/aws4_request`;

    const queryParams: Record<string, string> = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${this.config.accessKeyId}/${credentialScope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': expiresInSeconds.toString(),
      'X-Amz-SignedHeaders': 'host',
    };

    const sortedQuery = Object.keys(queryParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
      .join('&');

    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = 'host';

    const canonicalRequest = [
      'GET',
      pathname,
      sortedQuery,
      canonicalHeaders,
      signedHeaders,
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join('\n');

    const signingKey = getSigningKey(this.config.secretAccessKey, dateStamp, this.config.region);
    const signature = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');

    const protocol = this.config.endpoint?.startsWith('http://') ? 'http' : 'https';
    return `${protocol}://${host}${pathname}?${sortedQuery}&X-Amz-Signature=${signature}`;
  }
}
