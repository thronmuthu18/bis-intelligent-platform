import type {
  ChecklistMatchStatus,
  TestRequirementMatchStatus,
} from '@bis/shared';
import type { StructuredExtractionResult } from './structured-extractor.js';

export interface ChecklistMatchResult {
  checklistItemId?: string;
  checklistCategory?: string;
  requirementTitle: string;
  matchStatus: ChecklistMatchStatus;
  confidence: number;
  matchReason: string;
  evidencePage?: number;
  evidenceSnippet?: string;
}

export interface TestMatchResult {
  testRequirementId?: string;
  testName: string;
  testMethod?: string;
  standardNumber?: string;
  parameter?: string;
  extractedResult?: string;
  passFailStatus?: string;
  matchStatus: TestRequirementMatchStatus;
  evidencePage?: number;
  evidenceSnippet?: string;
}

export class RequirementMapperService {
  /**
   * Maps a document extraction against Phase 7 documentation checklist items.
   */
  mapChecklistRequirements(
    _document: { id: string; originalFileName: string; documentType: string },
    structured: StructuredExtractionResult,
    fullText: string,
    checklistItems: any[]
  ): ChecklistMatchResult[] {
    const matches: ChecklistMatchResult[] = [];
    const textLower = (fullText || '').toLowerCase();
    const docType = structured.extractedType;

    for (const item of checklistItems) {
      const titleLower = (item.documentName || '').toLowerCase();
      const catLower = (item.category || '').toLowerCase();
      let isMatch = false;
      let reason = '';
      let matchStatus: ChecklistMatchStatus = 'MATCHED';
      let confidence = 0.85;

      // Type-specific matching rules
      if (docType === 'TEST_REPORT' && (titleLower.includes('test report') || catLower.includes('testing'))) {
        isMatch = true;
        reason = `Document identified as official Test Report matching checklist item "${item.documentName}"`;
        if (structured.validityStatus === 'EXPIRED') {
          matchStatus = 'EXPIRED';
        }
      } else if (
        docType === 'CALIBRATION_CERTIFICATE' &&
        (titleLower.includes('calibration') || catLower.includes('calibration') || titleLower.includes('equipment'))
      ) {
        isMatch = true;
        reason = `Document identified as Calibration Certificate matching checklist item "${item.documentName}"`;
        if (structured.validityStatus === 'EXPIRED') {
          matchStatus = 'EXPIRED';
        }
      } else if (
        docType === 'FACTORY_LAYOUT' &&
        (titleLower.includes('layout') || titleLower.includes('plant') || catLower.includes('manufacturing'))
      ) {
        isMatch = true;
        reason = `Document identified as Factory Layout Plan matching checklist item "${item.documentName}"`;
      } else if (
        docType === 'QUALITY_CONTROL_DOCUMENT' &&
        (titleLower.includes('quality') || titleLower.includes('sti') || titleLower.includes('inspection'))
      ) {
        isMatch = true;
        reason = `Document identified as Quality Control / STI Plan matching checklist item "${item.documentName}"`;
      } else if (
        docType === 'RAW_MATERIAL_DOCUMENT' &&
        (titleLower.includes('raw material') || titleLower.includes('tc') || catLower.includes('raw_material'))
      ) {
        isMatch = true;
        reason = `Document identified as Raw Material Certificate matching checklist item "${item.documentName}"`;
      } else if (
        docType === 'DECLARATION_OF_CONFORMITY' &&
        (titleLower.includes('declaration') || titleLower.includes('undertaking'))
      ) {
        isMatch = true;
        reason = `Document identified as Declaration of Conformity matching checklist item "${item.documentName}"`;
      } else if (
        docType === 'IDENTITY_DOCUMENT' &&
        (titleLower.includes('incorporation') || titleLower.includes('gst') || titleLower.includes('identity') || titleLower.includes('pan'))
      ) {
        isMatch = true;
        reason = `Document identified as Business Identity Proof matching checklist item "${item.documentName}"`;
      } else {
        // Text keyword heuristic match
        const keywords = item.documentName
          .toLowerCase()
          .split(/\s+/)
          .filter((w: string) => w.length > 3);
        const matchCount = keywords.filter((kw: string) => textLower.includes(kw)).length;
        if (keywords.length > 0 && matchCount / keywords.length >= 0.6) {
          isMatch = true;
          reason = `Content keyword alignment matching checklist requirement "${item.documentName}"`;
          matchStatus = 'NEEDS_REVIEW';
          confidence = 0.70;
        }
      }

      if (isMatch) {
        matches.push({
          checklistItemId: item.id,
          checklistCategory: item.category,
          requirementTitle: item.documentName,
          matchStatus,
          confidence,
          matchReason: reason,
          evidencePage: structured.pageEvidence[0]?.pageNumber || 1,
          evidenceSnippet: structured.pageEvidence[0]?.sourceText || fullText.slice(0, 150),
        });
      }
    }

    return matches;
  }

  /**
   * Maps a document extraction against Phase 8 testing requirements.
   */
  mapTestRequirements(
    structured: StructuredExtractionResult,
    fullText: string,
    testRequirements: any[]
  ): TestMatchResult[] {
    const matches: TestMatchResult[] = [];
    const textLower = (fullText || '').toLowerCase();

    if (structured.extractedType !== 'TEST_REPORT' && structured.extractedType !== 'LABORATORY_DOCUMENT') {
      return [];
    }

    for (const req of testRequirements) {
      const testNameLower = (req.testName || '').toLowerCase();
      const methodLower = (req.testMethod || '').toLowerCase();
      const clauseLower = (req.clause || '').toLowerCase();

      let isMatch = false;
      let snippet = '';
      let pageNum = 1;

      // 1. Direct test name search in text
      if (testNameLower.length > 3 && textLower.includes(testNameLower)) {
        isMatch = true;
        const idx = textLower.indexOf(testNameLower);
        snippet = fullText.slice(Math.max(0, idx - 20), Math.min(fullText.length, idx + 120));
      } else if (clauseLower.length > 2 && textLower.includes(clauseLower)) {
        isMatch = true;
        const idx = textLower.indexOf(clauseLower);
        snippet = fullText.slice(Math.max(0, idx - 20), Math.min(fullText.length, idx + 120));
      } else if (methodLower.length > 4 && textLower.includes(methodLower)) {
        isMatch = true;
        const idx = textLower.indexOf(methodLower);
        snippet = fullText.slice(Math.max(0, idx - 20), Math.min(fullText.length, idx + 120));
      }

      if (isMatch) {
        matches.push({
          testRequirementId: req.id,
          testName: req.testName,
          testMethod: req.testMethod || structured.standardNumber || null,
          standardNumber: structured.standardNumber || req.standard?.isNumber || null,
          parameter: req.parameter || null,
          extractedResult: structured.passFailStatus === 'PASS' ? 'Complies / Pass' : structured.passFailStatus || 'Report Available',
          passFailStatus: structured.passFailStatus || 'UNKNOWN',
          matchStatus: structured.passFailStatus ? 'MATCHED' : 'NEEDS_REVIEW',
          evidencePage: pageNum,
          evidenceSnippet: snippet || fullText.slice(0, 150),
        });
      }
    }

    return matches;
  }
}
