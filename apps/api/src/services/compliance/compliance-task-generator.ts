import { logger } from '../../config/logger.js';
import type {
  ComplianceRequirementType,
  ComplianceTaskType,
  ComplianceTaskStatus,
  RequirementPriority,
} from '@bis/shared';

export interface GeneratedTaskData {
  requirementId?: string | null;
  dedupKey: string;
  title: string;
  description: string;
  taskType: ComplianceTaskType;
  status: ComplianceTaskStatus;
  priority: RequirementPriority;
  taskOrder: number;
  dueDate?: Date | null;
  sourceEvidence?: any;
}

export class ComplianceTaskGenerator {
  /**
   * Generates deduplicated compliance tasks based on normalized compliance requirements.
   */
  generateTasksForRequirements(
    requirementsWithIds: Array<{
      id: string;
      dedupKey: string;
      requirementType: ComplianceRequirementType;
      title: string;
      description?: string | null;
      mandatoryStatus: string;
      priority: RequirementPriority;
      status: string;
      evidence?: any;
    }>
  ): GeneratedTaskData[] {
    logger.info('Generating actionable compliance tasks', { requirementCount: requirementsWithIds.length });

    const tasks: GeneratedTaskData[] = [];
    let orderIndex = 1;

    for (const req of requirementsWithIds) {
      let taskType: ComplianceTaskType = 'OTHER';
      let title = `Complete: ${req.title}`;
      let description = req.description || `Address requirement: ${req.title}`;
      let initialStatus: ComplianceTaskStatus = 'TODO';

      switch (req.requirementType) {
        case 'STANDARD':
          taskType = 'REVIEW_STANDARD';
          title = `Review and Confirm Applicable Standard: ${req.title}`;
          initialStatus = req.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS';
          break;

        case 'QCO':
          taskType = 'REVIEW_QCO';
          title = `Review Quality Control Order (QCO) Mandate: ${req.title}`;
          description = `Verify gazette notification date, mandatory enforcement timeline, and exemption rules for ${req.title}.`;
          initialStatus = req.status === 'COMPLETED' ? 'COMPLETED' : 'TODO';
          break;

        case 'CERTIFICATION':
          taskType = 'REVIEW_CERTIFICATION';
          title = `Confirm Certification Scheme: ${req.title}`;
          description = `Review BIS scheme requirements, factory audit norms, and STI documentation guidelines.`;
          initialStatus = req.status === 'COMPLETED' ? 'COMPLETED' : 'TODO';
          break;

        case 'TEST':
          taskType = req.status === 'COMPLETED' ? 'VERIFY_TEST_REPORT' : 'COMPLETE_TEST';
          title = req.status === 'COMPLETED'
            ? `Verify Test Report: ${req.title}`
            : `Execute Mandatory Test: ${req.title}`;
          description = `Obtain and verify test results matching specified limits per BIS Scheme of Testing and Inspection (STI).`;
          initialStatus = req.status === 'COMPLETED' ? 'COMPLETED' : 'TODO';
          break;

        case 'LABORATORY':
          taskType = 'SELECT_LAB';
          title = 'Shortlist & Engage BIS-Recognized Laboratory';
          description = 'Select an accredited third-party laboratory for independent sample testing and verification reports.';
          initialStatus = req.status === 'COMPLETED' ? 'COMPLETED' : 'TODO';
          break;

        case 'DOCUMENT':
        case 'FACTORY':
          taskType = req.status === 'NEEDS_REVIEW' ? 'VERIFY_DOCUMENT' : 'UPLOAD_DOCUMENT';
          title = req.status === 'NEEDS_REVIEW'
            ? `Review & Verify Uploaded Document: ${req.title}`
            : `Upload Required Document: ${req.title}`;
          description = req.description || `Ensure authentic, signed, and stamped evidence is provided for ${req.title}.`;
          initialStatus = req.status === 'COMPLETED' ? 'COMPLETED' : 'TODO';
          break;

        case 'APPLICATION':
          taskType = 'COMPLETE_APPLICATION';
          title = req.title;
          description = req.description || 'Finalize application documentation and review readiness for official submission.';
          initialStatus = req.status === 'COMPLETED' ? 'COMPLETED' : 'TODO';
          break;

        case 'QUALITY_CONTROL':
          taskType = 'COMPLETE_PRODUCT_INFO';
          title = 'Establish In-House Quality Control & STI Equipment';
          description = 'Verify in-house testing equipment availability and current calibration certificates.';
          initialStatus = req.status === 'COMPLETED' ? 'COMPLETED' : 'TODO';
          break;

        default:
          taskType = 'OTHER';
          title = req.title;
          initialStatus = req.status === 'COMPLETED' ? 'COMPLETED' : 'TODO';
          break;
      }

      tasks.push({
        requirementId: req.id,
        dedupKey: `TASK_${req.dedupKey}`,
        title,
        description,
        taskType,
        status: initialStatus,
        priority: req.priority,
        taskOrder: orderIndex++,
        sourceEvidence: req.evidence,
      });
    }

    return tasks;
  }
}

export const complianceTaskGenerator = new ComplianceTaskGenerator();
