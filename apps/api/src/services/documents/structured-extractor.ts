import type {
  DocumentType,
  PageEvidenceItem,
} from '@bis/shared';
import type { ExtractedPage } from './extraction/extractor.interface.js';

export interface StructuredExtractionResult {
  extractedType: DocumentType;
  laboratoryName: string | null;
  reportNumber: string | null;
  reportDate: Date | null;
  certificateNumber: string | null;
  calibrationDate: Date | null;
  calibrationDueDate: Date | null;
  calibrationInterval: string | null;
  traceability: string | null;
  productName: string | null;
  modelNumber: string | null;
  manufacturerName: string | null;
  standardNumber: string | null;
  passFailStatus: string | null;
  validityStatus: string | null;
  extractedFields: Record<string, any>;
  pageEvidence: PageEvidenceItem[];
}

/**
 * Parses date strings into Date objects safely.
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.replace(/[,.]/g, '').trim();
  const timestamp = Date.parse(clean);
  if (!isNaN(timestamp)) {
    return new Date(timestamp);
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    const year = parseInt(dmy[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

export class StructuredExtractorService {
  /**
   * Extracts structured domain fields and page-level evidence from pages.
   */
  extract(
    documentType: DocumentType,
    pages: ExtractedPage[],
    _fullText: string
  ): StructuredExtractionResult {
    const pageEvidence: PageEvidenceItem[] = [];

    let laboratoryName: string | null = null;
    let reportNumber: string | null = null;
    let reportDate: Date | null = null;
    let certificateNumber: string | null = null;
    let calibrationDate: Date | null = null;
    let calibrationDueDate: Date | null = null;
    let calibrationInterval: string | null = null;
    let traceability: string | null = null;
    let productName: string | null = null;
    let modelNumber: string | null = null;
    let manufacturerName: string | null = null;
    let standardNumber: string | null = null;
    let passFailStatus: string | null = null;
    let validityStatus: string | null = null;
    const extractedFields: Record<string, any> = {};

    // 1. Scan across each page to locate evidence
    for (const page of pages) {
      const pText = page.text;
      const pNum = page.pageNumber;

      // Extract Laboratory Name
      if (!laboratoryName) {
        const labMatch = pText.match(
          /(?:Testing Laboratory|Issued by|Laboratory Name|Calibrated at|Test House|Testing Agency)\s*[:-]?\s*([A-Za-z0-9\s.,&'-]{4,60})/i
        ) || pText.match(/\b(BIS Central Laboratory|National Test House|ERDA|CPRI|UL India|TUV SUD|Shriram Institute)\b/i);

        if (labMatch) {
          laboratoryName = labMatch[1].trim();
          pageEvidence.push({
            pageNumber: pNum,
            claim: `Laboratory Name: ${laboratoryName}`,
            sourceText: pText.slice(Math.max(0, labMatch.index! - 20), Math.min(pText.length, labMatch.index! + 100)),
            confidence: 0.92,
            sectionKey: 'laboratoryName',
          });
        }
      }

      // Extract Report / Certificate Number
      if (!reportNumber && (documentType === 'TEST_REPORT' || documentType === 'LABORATORY_DOCUMENT')) {
        const repMatch = pText.match(
          /(?:Report No|Test Report No|TR No|Certificate No|Ref No)\s*[:-]?\s*([A-Za-z0-9/_-]{4,40})/i
        );
        if (repMatch) {
          reportNumber = repMatch[1].trim();
          pageEvidence.push({
            pageNumber: pNum,
            claim: `Test Report Number: ${reportNumber}`,
            sourceText: pText.slice(Math.max(0, repMatch.index! - 20), Math.min(pText.length, repMatch.index! + 80)),
            confidence: 0.95,
            sectionKey: 'reportNumber',
          });
        }
      }

      if (!certificateNumber && (documentType === 'CALIBRATION_CERTIFICATE' || documentType === 'CERTIFICATE')) {
        const certMatch = pText.match(
          /(?:Certificate No|Cal Cert No|Calibration Certificate No)\s*[:-]?\s*([A-Za-z0-9/_-]{4,40})/i
        );
        if (certMatch) {
          certificateNumber = certMatch[1].trim();
          pageEvidence.push({
            pageNumber: pNum,
            claim: `Calibration Certificate Number: ${certificateNumber}`,
            sourceText: pText.slice(Math.max(0, certMatch.index! - 20), Math.min(pText.length, certMatch.index! + 80)),
            confidence: 0.95,
            sectionKey: 'certificateNumber',
          });
        }
      }

      // Extract Standard Number (e.g. IS 10322, IS 302, IS 16046, etc.)
      if (!standardNumber) {
        const stdMatch = pText.match(/\b(IS\s*\d{3,5}(?:\s*\([A-Za-z0-9\s/]+\))?(?:\s*:\s*\d{4})?)\b/i);
        if (stdMatch) {
          standardNumber = stdMatch[1].replace(/\s+/g, ' ').trim();
          pageEvidence.push({
            pageNumber: pNum,
            claim: `Indian Standard Reference: ${standardNumber}`,
            sourceText: pText.slice(Math.max(0, stdMatch.index! - 20), Math.min(pText.length, stdMatch.index! + 80)),
            confidence: 0.94,
            sectionKey: 'standardNumber',
          });
        }
      }

      // Extract Product Name / Model
      if (!productName) {
        const prodMatch = pText.match(/(?:Product Name|Sample Description|Item Name|Equipment Tested)\s*[:-]?\s*([A-Za-z0-9\s.,-]{4,50})/i);
        if (prodMatch) {
          productName = prodMatch[1].trim();
          pageEvidence.push({
            pageNumber: pNum,
            claim: `Product Description: ${productName}`,
            sourceText: pText.slice(Math.max(0, prodMatch.index! - 20), Math.min(pText.length, prodMatch.index! + 80)),
            confidence: 0.90,
            sectionKey: 'productName',
          });
        }
      }

      if (!modelNumber) {
        const modMatch = pText.match(/(?:Model No|Model Number|Type Designation|Rating\/Model)\s*[:-]?\s*([A-Za-z0-9_-]{2,30})/i);
        if (modMatch) {
          modelNumber = modMatch[1].trim();
          pageEvidence.push({
            pageNumber: pNum,
            claim: `Model Number: ${modelNumber}`,
            sourceText: pText.slice(Math.max(0, modMatch.index! - 20), Math.min(pText.length, modMatch.index! + 80)),
            confidence: 0.92,
            sectionKey: 'modelNumber',
          });
        }
      }

      // Extract Manufacturer
      if (!manufacturerName) {
        const mfgMatch = pText.match(/(?:Manufacturer|Applicant|Customer|Manufactured By)\s*[:-]?\s*([A-Za-z0-9\s.,&'-]{4,50})/i);
        if (mfgMatch) {
          manufacturerName = mfgMatch[1].trim();
          pageEvidence.push({
            pageNumber: pNum,
            claim: `Manufacturer: ${manufacturerName}`,
            sourceText: pText.slice(Math.max(0, mfgMatch.index! - 20), Math.min(pText.length, mfgMatch.index! + 80)),
            confidence: 0.90,
            sectionKey: 'manufacturerName',
          });
        }
      }

      // Calibration Dates
      if (documentType === 'CALIBRATION_CERTIFICATE') {
        if (!calibrationDate) {
          const calDateMatch = pText.match(/(?:Date of Calibration|Calibration Date|Cal Date)\s*[:-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4}|[A-Za-z]+\s+[0-9]{1,2},?\s+[0-9]{4})/i);
          if (calDateMatch) {
            calibrationDate = parseDate(calDateMatch[1]);
            pageEvidence.push({
              pageNumber: pNum,
              claim: `Calibration Date: ${calDateMatch[1]}`,
              sourceText: pText.slice(Math.max(0, calDateMatch.index! - 20), Math.min(pText.length, calDateMatch.index! + 80)),
              confidence: 0.92,
              sectionKey: 'calibrationDate',
            });
          }
        }

        if (!calibrationDueDate) {
          const dueMatch = pText.match(/(?:Due Date|Next Calibration Due|Suggested Due Date|Valid Until)\s*[:-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4}|[A-Za-z]+\s+[0-9]{1,2},?\s+[0-9]{4})/i);
          if (dueMatch) {
            calibrationDueDate = parseDate(dueMatch[1]);
            pageEvidence.push({
              pageNumber: pNum,
              claim: `Calibration Due Date: ${dueMatch[1]}`,
              sourceText: pText.slice(Math.max(0, dueMatch.index! - 20), Math.min(pText.length, dueMatch.index! + 80)),
              confidence: 0.92,
              sectionKey: 'calibrationDueDate',
            });
          }
        }

        if (!calibrationInterval) {
          const intMatch = pText.match(/(?:Calibration Interval|Validity Period|Periodicity)\s*[:-]?\s*([0-9]+\s*(?:Months|Years|Days|Year|Month))/i);
          if (intMatch) {
            calibrationInterval = intMatch[1].trim();
          }
        }

        if (!traceability) {
          const trMatch = pText.match(/(?:Traceable to|Traceability Statement|Calibration Traceability)\s*[:-]?\s*([A-Za-z0-9\s.,-]{5,80})/i) ||
            pText.match(/\b(NPL|NABL Accredited Laboratory|National Metrology Institute|NIST)\b/i);
          if (trMatch) {
            traceability = trMatch[1].trim();
          }
        }
      }

      // Test Report Dates & Pass/Fail
      if (documentType === 'TEST_REPORT') {
        if (!reportDate) {
          const dateMatch = pText.match(/(?:Date of Issue|Report Date|Test Date|Dated)\s*[:-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4}|[A-Za-z]+\s+[0-9]{1,2},?\s+[0-9]{4})/i);
          if (dateMatch) {
            reportDate = parseDate(dateMatch[1]);
            pageEvidence.push({
              pageNumber: pNum,
              claim: `Report Date: ${dateMatch[1]}`,
              sourceText: pText.slice(Math.max(0, dateMatch.index! - 20), Math.min(pText.length, dateMatch.index! + 80)),
              confidence: 0.92,
              sectionKey: 'reportDate',
            });
          }
        }

        if (!passFailStatus) {
          if (/\b(PASSED|COMPLIES|MEETS REQUIREMENTS|SATISFACTORY|CONFORMS)\b/i.test(pText)) {
            passFailStatus = 'PASS';
            pageEvidence.push({
              pageNumber: pNum,
              claim: 'Test Result Outcome: PASS / CONFORMS',
              sourceText: pText.slice(0, 150),
              confidence: 0.90,
              sectionKey: 'passFailStatus',
            });
          } else if (/\b(FAILED|DOES NOT COMPLY|NON-CONFORMING|UNSATISFACTORY)\b/i.test(pText)) {
            passFailStatus = 'FAIL';
            pageEvidence.push({
              pageNumber: pNum,
              claim: 'Test Result Outcome: FAIL / NON-CONFORMING',
              sourceText: pText.slice(0, 150),
              confidence: 0.90,
              sectionKey: 'passFailStatus',
            });
          }
        }
      }
    }

    // Expiry / Validity check if due date exists
    if (calibrationDueDate) {
      const now = new Date();
      validityStatus = calibrationDueDate < now ? 'EXPIRED' : 'VALID';
    } else {
      validityStatus = 'VALID';
    }

    // Populate dynamic extractedFields JSON
    extractedFields.laboratoryName = laboratoryName;
    extractedFields.reportNumber = reportNumber;
    extractedFields.reportDate = reportDate ? reportDate.toISOString() : null;
    extractedFields.certificateNumber = certificateNumber;
    extractedFields.calibrationDate = calibrationDate ? calibrationDate.toISOString() : null;
    extractedFields.calibrationDueDate = calibrationDueDate ? calibrationDueDate.toISOString() : null;
    extractedFields.calibrationInterval = calibrationInterval;
    extractedFields.traceability = traceability;
    extractedFields.productName = productName;
    extractedFields.modelNumber = modelNumber;
    extractedFields.manufacturerName = manufacturerName;
    extractedFields.standardNumber = standardNumber;
    extractedFields.passFailStatus = passFailStatus;
    extractedFields.validityStatus = validityStatus;

    return {
      extractedType: documentType,
      laboratoryName,
      reportNumber,
      reportDate,
      certificateNumber,
      calibrationDate,
      calibrationDueDate,
      calibrationInterval,
      traceability,
      productName,
      modelNumber,
      manufacturerName,
      standardNumber,
      passFailStatus,
      validityStatus,
      extractedFields,
      pageEvidence,
    };
  }
}
