import type { DocumentType } from '@bis/shared';

export interface ClassificationResult {
  documentType: DocumentType;
  confidence: number;
  reasons: string[];
  evidencePage?: number;
  evidenceSnippet?: string;
}

interface PatternRule {
  type: DocumentType;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  weight: number;
}

const CLASSIFICATION_RULES: PatternRule[] = [
  {
    type: 'TEST_REPORT',
    primaryKeywords: [
      'test report',
      'test results',
      'testing laboratory',
      'test certificate',
      'evaluation report',
      'sample tested',
      'test parameters',
    ],
    secondaryKeywords: [
      'nabl',
      'bis recognized',
      'is 10322',
      'is 302',
      'is 16046',
      'pass',
      'fail',
      'method of test',
      'clause',
      'breakdown voltage',
      'insulation resistance',
      'temperature rise',
    ],
    weight: 0.95,
  },
  {
    type: 'CALIBRATION_CERTIFICATE',
    primaryKeywords: [
      'calibration certificate',
      'certificate of calibration',
      'calibration report',
      'calibrated by',
      'calibration date',
    ],
    secondaryKeywords: [
      'traceability',
      'traceable to npl',
      'standard equipment',
      'due date',
      'calibration interval',
      'uncertainty of measurement',
      'master instrument',
    ],
    weight: 0.95,
  },
  {
    type: 'PRODUCT_MANUAL',
    primaryKeywords: [
      'product manual',
      'user manual',
      'instruction manual',
      'operation manual',
      'service manual',
    ],
    secondaryKeywords: [
      'installation',
      'maintenance',
      'operating instructions',
      'safety precautions',
      'specifications',
      'wiring diagram',
    ],
    weight: 0.90,
  },
  {
    type: 'TECHNICAL_SPECIFICATION',
    primaryKeywords: [
      'technical specification',
      'datasheet',
      'technical data sheet',
      'product specification',
      'technical brochure',
    ],
    secondaryKeywords: [
      'rated voltage',
      'wattage',
      'dimensions',
      'luminous flux',
      'power factor',
      'ip rating',
      'operating temperature',
      'material grade',
    ],
    weight: 0.88,
  },
  {
    type: 'FACTORY_LAYOUT',
    primaryKeywords: [
      'factory layout',
      'plant layout',
      'manufacturing layout',
      'floor plan',
      'site plan',
    ],
    secondaryKeywords: [
      'production area',
      'testing area',
      'raw material storage',
      'assembly line',
      'sq meters',
      'machinery placement',
    ],
    weight: 0.90,
  },
  {
    type: 'MANUFACTURING_PROCESS_DOCUMENT',
    primaryKeywords: [
      'manufacturing process',
      'process flow chart',
      'process flow diagram',
      'production flow',
      'standard operating procedure',
    ],
    secondaryKeywords: [
      'fabrication',
      'machining',
      'assembly',
      'in-process inspection',
      'quality check',
      'stage inspection',
    ],
    weight: 0.88,
  },
  {
    type: 'QUALITY_CONTROL_DOCUMENT',
    primaryKeywords: [
      'quality plan',
      'scheme of testing and inspection',
      'sti document',
      'quality manual',
      'quality assurance plan',
    ],
    secondaryKeywords: [
      'routine testing',
      'acceptance criteria',
      'sampling plan',
      'rejection limits',
      'internal audit',
      'iso 9001',
    ],
    weight: 0.90,
  },
  {
    type: 'RAW_MATERIAL_DOCUMENT',
    primaryKeywords: [
      'raw material test certificate',
      'mill test certificate',
      'tc of raw material',
      'material invoice',
      'material test report',
    ],
    secondaryKeywords: [
      'chemical composition',
      'mechanical properties',
      'grade',
      'supplier certificate',
      'batch number',
    ],
    weight: 0.88,
  },
  {
    type: 'DECLARATION_OF_CONFORMITY',
    primaryKeywords: [
      'declaration of conformity',
      'self declaration',
      'undertaking',
      'manufacturer declaration',
    ],
    secondaryKeywords: [
      'hereby declare',
      'conformity to standard',
      'authorized signatory',
      'legal representative',
    ],
    weight: 0.90,
  },
  {
    type: 'APPLICATION_DOCUMENT',
    primaryKeywords: [
      'application form',
      'form-i',
      'form-vi',
      'manakonline application',
      'crs application',
    ],
    secondaryKeywords: [
      'applicant details',
      'factory address',
      'portal acknowledgment',
      'application fee receipt',
    ],
    weight: 0.92,
  },
  {
    type: 'IDENTITY_DOCUMENT',
    primaryKeywords: [
      'certificate of incorporation',
      'gst registration',
      'pan card',
      'msme udyam',
      'trademark certificate',
    ],
    secondaryKeywords: [
      'cin',
      'gstin',
      'udyam registration',
      'ministry of corporate affairs',
      'brand ownership',
    ],
    weight: 0.92,
  },
  {
    type: 'SAFETY_DATA_SHEET',
    primaryKeywords: [
      'safety data sheet',
      'material safety data sheet',
      'msds',
      'sds',
    ],
    secondaryKeywords: [
      'hazard identification',
      'first aid measures',
      'handling and storage',
      'toxicological information',
    ],
    weight: 0.95,
  },
];

export class DocumentClassificationService {
  /**
   * Classifies a document using extracted text, filename, and contextual keyword signals.
   */
  classify(
    fullText: string,
    originalFileName: string,
    userSelectedType?: DocumentType
  ): ClassificationResult {
    const textLower = (fullText || '').toLowerCase();
    const nameLower = (originalFileName || '').toLowerCase();

    // If user explicitly provided a specific valid type (not OTHER/UNKNOWN) and text doesn't severely contradict it
    if (userSelectedType && userSelectedType !== 'OTHER' && userSelectedType !== 'UNKNOWN') {
      const matchedRule = CLASSIFICATION_RULES.find((r) => r.type === userSelectedType);
      if (matchedRule) {
        let hasSignal = false;
        for (const kw of [...matchedRule.primaryKeywords, ...matchedRule.secondaryKeywords]) {
          if (textLower.includes(kw) || nameLower.includes(kw)) {
            hasSignal = true;
            break;
          }
        }
        if (hasSignal || fullText.length < 50) {
          return {
            documentType: userSelectedType,
            confidence: 0.95,
            reasons: [
              `User specified classification: ${userSelectedType}`,
              `Confirmed by contextual content signals`,
            ],
            evidencePage: 1,
            evidenceSnippet: fullText.slice(0, 150),
          };
        }
      }
    }

    let bestMatch: DocumentType = 'UNKNOWN';
    let highestScore = 0;
    let matchReasons: string[] = [];
    let evidenceSnippet = '';
    let evidencePage = 1;

    for (const rule of CLASSIFICATION_RULES) {
      let score = 0;
      const detectedReasons: string[] = [];

      // Check primary keywords in text
      for (const kw of rule.primaryKeywords) {
        if (textLower.includes(kw)) {
          score += 0.45;
          detectedReasons.push(`Primary keyword match: "${kw}"`);
          if (!evidenceSnippet) {
            const idx = textLower.indexOf(kw);
            evidenceSnippet = fullText.slice(Math.max(0, idx - 20), Math.min(fullText.length, idx + 120));
          }
        }
      }

      // Check primary keywords in filename
      for (const kw of rule.primaryKeywords) {
        if (nameLower.includes(kw.replace(/\s+/g, '_')) || nameLower.includes(kw.replace(/\s+/g, '-')) || nameLower.includes(kw)) {
          score += 0.35;
          detectedReasons.push(`Filename match: "${kw}"`);
        }
      }

      // Check secondary keywords in text
      for (const kw of rule.secondaryKeywords) {
        if (textLower.includes(kw)) {
          score += 0.15;
          detectedReasons.push(`Supporting signal: "${kw}"`);
        }
      }

      score = Math.min(0.99, score * rule.weight);

      if (score > highestScore) {
        highestScore = score;
        bestMatch = rule.type;
        matchReasons = detectedReasons;
      }
    }

    // Confidence threshold logic
    if (highestScore >= 0.60) {
      return {
        documentType: bestMatch,
        confidence: parseFloat(highestScore.toFixed(2)),
        reasons: matchReasons.slice(0, 4),
        evidencePage,
        evidenceSnippet: evidenceSnippet || fullText.slice(0, 150),
      };
    }

    // Low confidence / unclassified fallback
    return {
      documentType: 'UNKNOWN',
      confidence: parseFloat(highestScore.toFixed(2)) || 0.30,
      reasons: [
        'Insufficient distinctive technical keywords found to automatically classify with high confidence',
        'Human verification recommended',
      ],
      evidencePage: 1,
      evidenceSnippet: fullText.slice(0, 150),
    };
  }
}
