import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { S3PrivateStorageProvider } from '../src/services/documents/storage/s3-storage.provider.js';
import {
  getStorageProvider,
  setStorageProvider,
} from '../src/services/documents/storage/storage-provider.factory.js';
import { LocalPrivateStorageProvider } from '../src/services/documents/storage/local-storage.provider.js';

describe('S3PrivateStorageProvider', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should throw an error if required bucket or region is missing', () => {
    expect(() => new S3PrivateStorageProvider({
      bucket: '',
      region: 'ap-south-1',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    })).toThrow('requires a bucket name');

    expect(() => new S3PrivateStorageProvider({
      bucket: 'test-bucket',
      region: '',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    })).toThrow('requires a region');

    expect(() => new S3PrivateStorageProvider({
      bucket: 'test-bucket',
      region: 'ap-south-1',
      accessKeyId: '',
      secretAccessKey: 'test-secret',
    })).toThrow('requires an accessKeyId');

    expect(() => new S3PrivateStorageProvider({
      bucket: 'test-bucket',
      region: 'ap-south-1',
      accessKeyId: 'test-key',
      secretAccessKey: '',
    })).toThrow('requires a secretAccessKey');
  });

  it('should initialize S3PrivateStorageProvider without explicit credentials for AWS ECS Task IAM Role', () => {
    const provider = new S3PrivateStorageProvider({
      bucket: 'bis-staging-documents-5gvs3g',
      region: 'ap-south-1',
    });
    expect(provider).toBeInstanceOf(S3PrivateStorageProvider);
  });

  it('should support explicit credentials and sessionToken for temporary credentials', async () => {
    const provider = new S3PrivateStorageProvider({
      bucket: 'test-bucket',
      region: 'ap-south-1',
      accessKeyId: 'ASIAEXAMPLE',
      secretAccessKey: 'secretKey',
      sessionToken: 'testSessionToken123',
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    global.fetch = mockFetch;

    await provider.upload(Buffer.from('hello'), 'doc.pdf', 'application/pdf', 'prod-1');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, callOptions] = mockFetch.mock.calls[0];
    expect(callOptions.headers['x-amz-security-token']).toBe('testSessionToken123');

    const signedUrl = await provider.getSignedAccess('documents/prod-1/doc.pdf', 300);
    expect(signedUrl).toContain('X-Amz-Security-Token=testSessionToken123');
  });

  it('should successfully upload a document to S3 and calculate SHA-256', async () => {
    const provider = new S3PrivateStorageProvider({
      bucket: 'test-bucket',
      region: 'ap-south-1',
      accessKeyId: 'AKIAEXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    global.fetch = mockFetch;

    const fileBuffer = Buffer.from('Test BIS compliance document content');
    const result = await provider.upload(fileBuffer, 'sample.pdf', 'application/pdf', 'prod-123');

    expect(result.storageKey).toContain('documents/prod-123/');
    expect(result.storageKey).toContain('.pdf');
    expect(result.fileSize).toBe(fileBuffer.length);
    expect(result.fileHash).toHaveLength(64); // SHA-256 hex string

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [callUrl, callOptions] = mockFetch.mock.calls[0];
    expect(callUrl).toContain('test-bucket.s3.ap-south-1.amazonaws.com');
    expect(callOptions.method).toBe('PUT');
    expect(callOptions.headers['Authorization']).toContain('AWS4-HMAC-SHA256');
    expect(callOptions.headers['x-amz-content-sha256']).toBe(result.fileHash);
  });

  it('should throw AppError when S3 upload fails', async () => {
    const provider = new S3PrivateStorageProvider({
      bucket: 'test-bucket',
      region: 'ap-south-1',
      accessKeyId: 'AKIAEXAMPLE',
      secretAccessKey: 'secret',
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue('Access Denied'),
    });

    const fileBuffer = Buffer.from('Test content');
    await expect(
      provider.upload(fileBuffer, 'sample.pdf', 'application/pdf', 'prod-123')
    ).rejects.toThrow('Failed to upload document');
  });

  it('should download a document buffer from S3', async () => {
    const provider = new S3PrivateStorageProvider({
      bucket: 'test-bucket',
      region: 'ap-south-1',
      accessKeyId: 'AKIAEXAMPLE',
      secretAccessKey: 'secret',
    });

    const expectedContent = 'Downloaded file content';
    const cleanArrayBuf = await new Response(expectedContent).arrayBuffer();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: vi.fn().mockResolvedValue(cleanArrayBuf),
    });

    const buffer = await provider.downloadBuffer('documents/prod-123/file.pdf');
    expect(buffer.toString()).toBe(expectedContent);
  });

  it('should throw notFound when file is missing in S3', async () => {
    const provider = new S3PrivateStorageProvider({
      bucket: 'test-bucket',
      region: 'ap-south-1',
      accessKeyId: 'AKIAEXAMPLE',
      secretAccessKey: 'secret',
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue('NoSuchKey'),
    });

    await expect(provider.downloadBuffer('documents/prod-123/missing.pdf')).rejects.toThrow(
      'Stored document file not found'
    );
  });

  it('should download stream from S3', async () => {
    const provider = new S3PrivateStorageProvider({
      bucket: 'test-bucket',
      region: 'ap-south-1',
      accessKeyId: 'AKIAEXAMPLE',
      secretAccessKey: 'secret',
    });

    const streamContent = 'stream content';
    const streamArrayBuf = await new Response(streamContent).arrayBuffer();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: vi.fn().mockResolvedValue(streamArrayBuf),
    });

    const stream = await provider.downloadStream('documents/prod-123/file.pdf');
    expect(stream).toBeDefined();

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    expect(Buffer.concat(chunks).toString()).toBe(streamContent);
  });

  it('should check if object exists via HEAD request', async () => {
    const provider = new S3PrivateStorageProvider({
      bucket: 'test-bucket',
      region: 'ap-south-1',
      accessKeyId: 'AKIAEXAMPLE',
      secretAccessKey: 'secret',
    });

    global.fetch = vi.fn().mockResolvedValue({ status: 200 });
    expect(await provider.exists('documents/prod-123/exists.pdf')).toBe(true);

    global.fetch = vi.fn().mockResolvedValue({ status: 404 });
    expect(await provider.exists('documents/prod-123/not-exists.pdf')).toBe(false);
  });

  it('should delete an object from S3', async () => {
    const provider = new S3PrivateStorageProvider({
      bucket: 'test-bucket',
      region: 'ap-south-1',
      accessKeyId: 'AKIAEXAMPLE',
      secretAccessKey: 'secret',
    });

    global.fetch = vi.fn().mockResolvedValue({ status: 204 });
    const success = await provider.delete('documents/prod-123/to-delete.pdf');
    expect(success).toBe(true);
  });

  it('should retrieve object metadata', async () => {
    const provider = new S3PrivateStorageProvider({
      bucket: 'test-bucket',
      region: 'ap-south-1',
      accessKeyId: 'AKIAEXAMPLE',
      secretAccessKey: 'secret',
    });

    const mockHeaders = new Headers({
      'content-length': '2048',
      'content-type': 'application/pdf',
      etag: '"d41d8cd98f00b204e9800998ecf8427e"',
      'last-modified': 'Wed, 21 Oct 2026 07:28:00 GMT',
    });

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: mockHeaders,
    });

    const metadata = await provider.getMetadata('documents/prod-123/doc.pdf');
    expect(metadata).not.toBeNull();
    expect(metadata?.fileSize).toBe(2048);
    expect(metadata?.mimeType).toBe('application/pdf');
    expect(metadata?.fileHash).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('should generate a valid SigV4 presigned GET URL for temporary access', async () => {
    const provider = new S3PrivateStorageProvider({
      bucket: 'test-bucket',
      region: 'ap-south-1',
      accessKeyId: 'AKIAEXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    });

    const signedUrl = await provider.getSignedAccess('documents/prod-123/file.pdf', 900);

    expect(signedUrl).toContain('https://test-bucket.s3.ap-south-1.amazonaws.com/documents/prod-123/file.pdf');
    expect(signedUrl).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
    expect(signedUrl).toContain('X-Amz-Credential=AKIAEXAMPLE');
    expect(signedUrl).toContain('X-Amz-Expires=900');
    expect(signedUrl).toContain('X-Amz-Signature=');
  });

  it('should support custom endpoint and path-style URLs (MinIO / Cloudflare R2)', async () => {
    const provider = new S3PrivateStorageProvider({
      bucket: 'minio-bucket',
      region: 'us-east-1',
      accessKeyId: 'minio-user',
      secretAccessKey: 'minio-password',
      endpoint: 'http://localhost:9000',
      forcePathStyle: true,
    });

    const signedUrl = await provider.getSignedAccess('test.pdf', 3600);
    expect(signedUrl).toContain('http://localhost:9000/minio-bucket/test.pdf');
    expect(signedUrl).toContain('X-Amz-Signature=');
  });
});

describe('StorageProviderFactory', () => {
  beforeEach(() => {
    setStorageProvider(null);
  });

  afterEach(() => {
    setStorageProvider(null);
  });

  it('should return LocalPrivateStorageProvider by default in development', () => {
    const provider = getStorageProvider();
    expect(provider).toBeInstanceOf(LocalPrivateStorageProvider);
  });

  it('should allow setting and resetting custom storage provider for testing', () => {
    const mockProvider = {
      upload: vi.fn(),
      downloadStream: vi.fn(),
      downloadBuffer: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      getMetadata: vi.fn(),
      getSignedAccess: vi.fn(),
    };

    setStorageProvider(mockProvider);
    expect(getStorageProvider()).toBe(mockProvider);

    setStorageProvider(null);
    expect(getStorageProvider()).toBeInstanceOf(LocalPrivateStorageProvider);
  });
});
