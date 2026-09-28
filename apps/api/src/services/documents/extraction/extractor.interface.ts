export interface ExtractedPage {
  pageNumber: number;
  text: string;
  confidence?: number;
  wordCount?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ExtractionResult {
  fullText: string;
  pageCount: number;
  pages: ExtractedPage[];
  metadata: {
    extractorName: string;
    extractorVersion: string;
    extractedAt: string;
    ocrUsed: boolean;
    confidenceScore?: number;
    [key: string]: any;
  };
}

export interface DocumentTextExtractor {
  extractText(
    fileBuffer: Buffer,
    mimeType: string,
    originalFileName: string
  ): Promise<ExtractionResult>;
}
