import type {
  DocumentTextExtractor,
  ExtractionResult,
} from './extractor.interface.js';
import { PdfTextExtractor } from './pdf-text-extractor.js';
import { OcrExtractor } from './ocr-extractor.js';

export class ExtractorRouter implements DocumentTextExtractor {
  private pdfExtractor = new PdfTextExtractor();
  private ocrExtractor = new OcrExtractor();

  async extractText(
    fileBuffer: Buffer,
    mimeType: string,
    originalFileName: string
  ): Promise<ExtractionResult> {
    const normalizedMime = (mimeType || '').toLowerCase();
    const ext = originalFileName.toLowerCase();

    if (normalizedMime === 'application/pdf' || ext.endsWith('.pdf')) {
      return this.pdfExtractor.extractText(fileBuffer, mimeType, originalFileName);
    }

    if (
      normalizedMime.startsWith('image/') ||
      ext.endsWith('.png') ||
      ext.endsWith('.jpg') ||
      ext.endsWith('.jpeg') ||
      ext.endsWith('.tiff') ||
      ext.endsWith('.tif') ||
      ext.endsWith('.webp')
    ) {
      return this.ocrExtractor.extractText(fileBuffer, mimeType, originalFileName);
    }

    // Default text/fallback
    const rawText = fileBuffer.toString('utf-8');
    return {
      fullText: rawText.trim(),
      pageCount: 1,
      pages: [
        {
          pageNumber: 1,
          text: rawText.trim(),
          confidence: 0.90,
          wordCount: rawText.trim().split(/\s+/).length,
        },
      ],
      metadata: {
        extractorName: 'BIS_Plain_Text_Extractor',
        extractorVersion: '1.0.0',
        extractedAt: new Date().toISOString(),
        ocrUsed: false,
        confidenceScore: 0.90,
      },
    };
  }
}
