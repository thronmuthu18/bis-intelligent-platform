import type {
  ProductTestingReadiness,
  ProductTestRequirementItem,
  ProductTestEquipmentItem,
  ProductExternalLabRequirementItem,
  ProductLaboratoryReviewItem,
  TestingReadinessStatus,
} from '@bis/shared';

/**
 * Evaluates testing & laboratory workflow readiness for the product.
 */
export function evaluateTestingReadiness(
  requirements: ProductTestRequirementItem[],
  equipment: ProductTestEquipmentItem[],
  labRequirements: ProductExternalLabRequirementItem[],
  labReviews: ProductLaboratoryReviewItem[] = []
): ProductTestingReadiness {
  const blockers: string[] = [];
  const nextSteps: string[] = [];

  let score = 40;
  const isExtLabRequired = labRequirements.some(
    (r) => r.requirementType === 'EXTERNAL_LAB_REQUIRED'
  );

  const hasShortlistedLab = labReviews.some(
    (r) => r.decision === 'SHORTLISTED' || r.decision === 'SELECTED'
  );
  const hasSelectedLab = labReviews.some((r) => r.decision === 'SELECTED');

  if (requirements.length === 0) {
    return {
      status: 'INSUFFICIENT_EVIDENCE',
      score: 20,
      summary:
        'Insufficient official testing requirements found in the current BIS knowledge repository for the matched standards.',
      blockers: [
        'Standard test clauses and Scheme of Testing and Inspection (STI) data unavailable',
      ],
      nextSteps: [
        'Verify standard match in the Standards Intelligence workspace',
        'Consult official BIS Technical Committee guidelines',
      ],
      factoryTestingReady: false,
      externalLabRequired: isExtLabRequired,
      labShortlisted: false,
      labSelected: false,
    };
  }

  // 1. Requirements Identified (+20)
  score += 20;

  // 2. Equipment & Calibration Identified (+15)
  if (equipment.length > 0) {
    score += 15;
    const missingCal = equipment.some((e) => e.calibrationRequired && !e.calibrationInterval);
    if (missingCal) {
      blockers.push('Calibration intervals missing for some factory test equipment');
    }
  } else {
    blockers.push('Factory test equipment list has not been configured');
  }

  // 3. Laboratory Requirements Handling
  if (isExtLabRequired) {
    if (hasSelectedLab) {
      score += 25;
      nextSteps.push(
        'Generate test sample dispatch requisition and contact the selected laboratory for booking'
      );
    } else if (hasShortlistedLab) {
      score += 15;
      blockers.push('Finalize testing laboratory selection from shortlisted candidates');
      nextSteps.push(
        'Compare testing turnaround time and quotation from shortlisted laboratories'
      );
    } else {
      blockers.push('Mandatory external test report required: No laboratory shortlisted or selected');
      nextSteps.push(
        'Review capability-matched BIS-recognized laboratories and shortlist candidate testing facilities'
      );
    }
  } else {
    score += 25;
    nextSteps.push('Ensure factory in-house laboratory logbook and test records are updated');
  }

  // Determine Status
  let status: TestingReadinessStatus = 'NEEDS_REVIEW';

  if (score >= 85) {
    status = 'TESTING_READY';
  } else if (isExtLabRequired && !hasSelectedLab && !hasShortlistedLab) {
    status = 'MISSING_LAB_REPORT';
  } else if (equipment.length > 0 && blockers.some((b) => b.includes('Calibration'))) {
    status = 'MISSING_CALIBRATION';
  } else {
    status = 'NEEDS_REVIEW';
  }

  const summary =
    status === 'TESTING_READY'
      ? 'Testing parameters, equipment checklist, and laboratory pathways are fully established and ready for execution.'
      : status === 'MISSING_LAB_REPORT'
      ? 'Product requires independent testing at a BIS-recognized laboratory. Please shortlist and select a testing facility.'
      : status === 'MISSING_CALIBRATION'
      ? 'Factory testing equipment calibration records require review before proceeding with inspection.'
      : 'Testing requirements identified. Please review factory test equipment and laboratory options.';

  return {
    status,
    score: Math.min(100, Math.max(0, score)),
    summary,
    blockers,
    nextSteps,
    factoryTestingReady: equipment.length > 0,
    externalLabRequired: isExtLabRequired,
    labShortlisted: hasShortlistedLab,
    labSelected: hasSelectedLab,
  };
}
