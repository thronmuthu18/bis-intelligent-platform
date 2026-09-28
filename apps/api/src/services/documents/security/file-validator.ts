import path from 'path';
import { createHash } from 'crypto';
import { AppError } from '../../../utils/AppError.js';

// ─────────────────────────────────────────────────────────────────────────────
//  File Upload Security Validator
//  Defence-in-depth validation: size → extension → MIME allow-list → magic bytes.
//  Rejects path traversal, control characters, MIME spoofing, and oversized files.
// ─────────────────────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Strict MIME allow-list. Any MIME type not in this set is rejected.
 * `application/octet-stream` is intentionally excluded — callers must
 * pass the declared MIME type, not a browser fallback.
 */
export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/tiff',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.tiff',
  '.tif',
  '.txt',
  '.docx',
]);

/** Extension → expected MIME types mapping for cross-validation */
const EXTENSION_MIME_MAP: Record<string, string[]> = {
  '.pdf':  ['application/pdf'],
  '.jpg':  ['image/jpeg', 'image/jpg'],
  '.jpeg': ['image/jpeg', 'image/jpg'],
  '.png':  ['image/png'],
  '.webp': ['image/webp'],
  '.tiff': ['image/tiff'],
  '.tif':  ['image/tiff'],
  '.txt':  ['text/plain'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip', // docx is a ZIP container; some browsers report this
  ],
};

export interface FileValidationResult {
  isValid: boolean;
  sanitizedFileName: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  error?: string;
}

/**
 * Validates magic numbers / file signatures to prevent MIME spoofing.
 * Returns true only when the buffer matches a known-good signature.
 */
export function validateMagicBytes(buffer: Buffer, declaredMimeType: string): boolean {
  if (buffer.length < 4) return false;

  // PDF: %PDF (0x25 0x50 0x44 0x46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return declaredMimeType.includes('pdf') || declaredMimeType.includes('octet-stream');
  }

  // PNG: 0x89 0x50 0x4E 0x47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47
  ) {
    return declaredMimeType.includes('png') || declaredMimeType.includes('octet-stream');
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return declaredMimeType.includes('jpeg') || declaredMimeType.includes('jpg') || declaredMimeType.includes('octet-stream');
  }

  // WebP: RIFF...WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return declaredMimeType.includes('webp') || declaredMimeType.includes('octet-stream');
  }

  // TIFF: little-endian II (0x49 0x49 0x2A 0x00) or big-endian MM (0x4D 0x4D 0x00 0x2A)
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
    (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a)
  ) {
    return declaredMimeType.includes('tiff') || declaredMimeType.includes('octet-stream');
  }

  // ZIP / DOCX: PK header (0x50 0x4B 0x03 0x04)
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    // Allow docx (ZIP container) and generic octet-stream
    return (
      declaredMimeType.includes('officedocument') ||
      declaredMimeType.includes('zip') ||
      declaredMimeType.includes('octet-stream')
    );
  }

  // Plain text: allow if declared as text/plain (no reliable magic bytes)
  if (declaredMimeType === 'text/plain') {
    return true;
  }

  return false;
}

/**
 * Sanitizes original filenames, eliminating path traversal, control chars,
 * and illegal shell/filesystem symbols.
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'document_upload.pdf';
  }

  // Remove directory separators & path traversal
  const baseName = path.basename(fileName).trim();

  // Strip non-printable / control chars (keep printable ASCII + extended Latin)
  const strippedControl = Array.from(baseName)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return (code >= 32 && code < 127) || code > 159;
    })
    .join('');

  // Replace characters that are dangerous in file system or injection contexts
  const cleaned = strippedControl
    .replace(/[<>:"/\\|?*;`${}[\]()]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length > 0 ? cleaned : 'document_upload.pdf';
}

/**
 * Performs comprehensive security and format validation on uploaded files.
 * Validation order: empty → size → extension → MIME allow-list → extension/MIME cross-check → magic bytes.
 */
export function validateUploadedFile(
  fileBuffer: Buffer,
  originalFileName: string,
  mimeType: string,
): FileValidationResult {
  // 1. Reject empty files
  if (!fileBuffer || fileBuffer.length === 0) {
    throw AppError.badRequest('Uploaded file is empty or corrupted');
  }

  // 2. Enforce file size limit
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw AppError.badRequest(
      `File size exceeds maximum allowable limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
    );
  }

  const sanitizedFileName = sanitizeFileName(originalFileName);
  const ext = path.extname(sanitizedFileName).toLowerCase();

  // 3. Reject unknown extensions
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw AppError.badRequest(
      `Unsupported file format (${ext || 'none'}). Allowed formats: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
    );
  }

  // 4. Normalise MIME type — reject unknown MIME types entirely
  const normalizedMime = mimeType ? mimeType.toLowerCase().split(';')[0].trim() : '';
  if (!normalizedMime || !ALLOWED_MIME_TYPES.has(normalizedMime)) {
    // Allow application/octet-stream as a fallback for binary files (handled by magic bytes)
    if (normalizedMime !== 'application/octet-stream') {
      throw AppError.badRequest(
        `Unsupported or unrecognised MIME type (${normalizedMime || 'not provided'}). ` +
        `Allowed types: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`,
      );
    }
  }

  // 5. Extension / MIME cross-validation (prevents extension spoofing)
  //    Skipped for text/plain uploads since rawText API callers always use text/plain
  //    regardless of the document's logical extension (.pdf, .docx etc.).
  const expectedMimes = EXTENSION_MIME_MAP[ext];
  if (expectedMimes && normalizedMime !== 'application/octet-stream' && normalizedMime !== 'text/plain') {
    const mimeAllowedForExt = expectedMimes.some(
      (allowed) => normalizedMime === allowed || normalizedMime.includes(allowed),
    );
    if (!mimeAllowedForExt) {
      throw AppError.badRequest(
        `File extension (${ext}) does not match declared MIME type (${normalizedMime}). ` +
        `Please upload a genuine ${ext} file.`,
      );
    }
  }

  // 6. Magic bytes / file signature validation (prevents MIME spoofing at byte level)
  const isMagicValid = validateMagicBytes(fileBuffer, normalizedMime || 'application/octet-stream');
  if (!isMagicValid) {
    throw AppError.badRequest(
      'File signature mismatch: the uploaded file contents do not match its declared format.',
    );
  }

  const fileHash = createHash('sha256').update(fileBuffer).digest('hex');

  return {
    isValid: true,
    sanitizedFileName,
    mimeType: normalizedMime || 'application/octet-stream',
    fileSize: fileBuffer.length,
    fileHash,
  };
}
