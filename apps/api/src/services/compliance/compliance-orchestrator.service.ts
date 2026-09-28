import { prisma } from '../../db/client.js';
import { logger } from '../../config/logger.js';
import { multiStandardOrchestrator } from './multi-standard-orchestrator.service.js';
import { complianceTaskGenerator } from './compliance-task-generator.js';
import { complianceReadinessService } from './compliance-readiness.service.js';
import { applicationDossierService } from './application-dossier.service.js';
import { regulatoryChangeService } from './regulatory-change.service.js';
import { complianceAlertService } from './compliance-alert.service.js';
import type {
  ComplianceJourneyOverviewResponse,
  ComplianceJourneyItem,
  ComplianceTaskItem,
  ComplianceTimelineEvent,
  ComplianceJourneyStatus,
  ComplianceRequirementType,
  ComplianceTaskType,
  ComplianceTaskStatus,
  RequirementPriority,
  CompleteTaskInput,
  CompileDossierInput,
  ValidateDossierResponse,
  ApplicationDossierResponse,
} from '@bis/shared';

function safeIso(val?: any): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function safeIsoOrNull(val?: any): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

export class ComplianceOrchestratorService {
  /**
   * Initializes or gets the active compliance journey for a product.
   */
  async initializeJourney(productId: string, userId: string): Promise<ComplianceJourneyOverviewResponse> {
    logger.info('Initializing compliance journey', { productId, userId });

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    if (product.userId !== userId) {
      throw new Error('Unauthorized: You do not own this product');
    }

    // 1. Run Multi-Standard Orchestration to get normalized requirements & input hash
    const orchResult = await multiStandardOrchestrator.orchestrateProductRequirements(productId);

    // 2. Check for existing journey with the same hash
    let journey: any = await prisma.complianceJourney.findFirst({
      where: { productId },
      include: {
        requirements: {
          include: {
            dependencies: true,
            dependedBy: true,
            standard: true,
          },
        },
        tasks: {
          include: { requirement: true },
          orderBy: { taskOrder: 'asc' },
        },
        dossiers: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    const isFirstTime = !journey;
    const isHashMatched = journey && journey.inputHash === orchResult.inputHash;

    if (!journey || !isHashMatched) {
      // Upsert journey
      if (!journey) {
        journey = await prisma.complianceJourney.create({
          data: {
            productId,
            status: 'STANDARD_IDENTIFICATION',
            journeyVersion: '1.0.0',
            inputHash: orchResult.inputHash,
            currentStage: 'STANDARD_IDENTIFICATION',
          },
          include: {
            requirements: {
              include: {
                dependencies: true,
                dependedBy: true,
                standard: true,
              },
            },
            tasks: {
              include: { requirement: true },
              orderBy: { taskOrder: 'asc' },
            },
            dossiers: {
              orderBy: { version: 'desc' },
              take: 1,
            },
          },
        });
      } else {
        journey = await prisma.complianceJourney.update({
          where: { id: journey.id },
          data: {
            inputHash: orchResult.inputHash,
          },
          include: {
            requirements: {
              include: {
                dependencies: true,
                dependedBy: true,
                standard: true,
              },
            },
            tasks: {
              include: { requirement: true },
              orderBy: { taskOrder: 'asc' },
            },
            dossiers: {
              orderBy: { version: 'desc' },
              take: 1,
            },
          },
        });
      }

      if (!journey) {
        throw new Error('Failed to create or update compliance journey');
      }

      // Record Automation Run
      await prisma.complianceAutomationRun.create({
        data: {
          journeyId: journey.id,
          runType: isFirstTime ? 'INITIALIZE' : 'RECALCULATE',
          inputHash: orchResult.inputHash,
          engineVersion: '1.0.0',
          status: 'COMPLETED',
          changesDetected: {
            requirementCount: orchResult.requirements.length,
            confirmedStandards: orchResult.confirmedStandards.map((s: any) => s.isNumber),
          },
        },
      });

      // Synchronize Requirements
      const existingReqMap = new Map((journey.requirements || []).map((r: any) => [r.title, r]));
      const requirementIdMap = new Map<string, string>(); // dedupKey -> DB ID
      const requirementsWithDbIds: any[] = [];

      for (const reqInput of orchResult.requirements) {
        let dbReq: any = existingReqMap.get(reqInput.title);
        if (dbReq) {
          dbReq = await prisma.complianceRequirement.update({
            where: { id: dbReq.id },
            data: {
              standardId: reqInput.standardId,
              requirementType: reqInput.requirementType,
              sourceEntityType: reqInput.sourceEntityType,
              sourceEntityId: reqInput.sourceEntityId,
              description: reqInput.description,
              mandatoryStatus: reqInput.mandatoryStatus,
              priority: reqInput.priority,
              status: dbReq.status === 'COMPLETED' ? 'COMPLETED' : reqInput.status,
              evidenceRequired: reqInput.evidenceRequired,
              sourceDocumentId: reqInput.sourceDocumentId,
              sourceUrl: reqInput.sourceUrl,
              sourceAuthority: reqInput.sourceAuthority,
              evidence: reqInput.evidence || {},
            },
            include: {
              dependencies: true,
              dependedBy: true,
              standard: true,
            },
          });
        } else {
          dbReq = await prisma.complianceRequirement.create({
            data: {
              journeyId: journey.id,
              standardId: reqInput.standardId,
              requirementType: reqInput.requirementType,
              sourceEntityType: reqInput.sourceEntityType,
              sourceEntityId: reqInput.sourceEntityId,
              title: reqInput.title,
              description: reqInput.description,
              mandatoryStatus: reqInput.mandatoryStatus,
              priority: reqInput.priority,
              status: reqInput.status,
              evidenceRequired: reqInput.evidenceRequired,
              sourceDocumentId: reqInput.sourceDocumentId,
              sourceUrl: reqInput.sourceUrl,
              sourceAuthority: reqInput.sourceAuthority,
              evidence: reqInput.evidence || {},
            },
            include: {
              dependencies: true,
              dependedBy: true,
              standard: true,
            },
          });
        }
        requirementIdMap.set(reqInput.dedupKey, dbReq.id);
        requirementsWithDbIds.push({
          ...dbReq,
          dedupKey: reqInput.dedupKey,
        });
      }

      // Link Requirement Dependencies
      for (const reqInput of orchResult.requirements) {
        const reqId = requirementIdMap.get(reqInput.dedupKey);
        if (reqId && reqInput.prerequisiteKeys && reqInput.prerequisiteKeys.length > 0) {
          for (const prereqKey of reqInput.prerequisiteKeys) {
            const prereqId = requirementIdMap.get(prereqKey);
            if (prereqId && prereqId !== reqId) {
              await prisma.complianceRequirementDependency.upsert({
                where: {
                  requirementId_prerequisiteRequirementId: {
                    requirementId: reqId,
                    prerequisiteRequirementId: prereqId,
                  },
                },
                update: {},
                create: {
                  requirementId: reqId,
                  prerequisiteRequirementId: prereqId,
                  dependencyType: 'BLOCKS',
                },
              });
            }
          }
        }
      }

      // Generate Tasks
      const generatedTasks = complianceTaskGenerator.generateTasksForRequirements(requirementsWithDbIds);
      const existingTaskTitles = new Set((journey.tasks || []).map((t: any) => t.title));

      for (const t of generatedTasks) {
        if (!existingTaskTitles.has(t.title)) {
          await prisma.complianceTask.create({
            data: {
              journeyId: journey.id,
              requirementId: t.requirementId,
              title: t.title,
              description: t.description,
              taskType: t.taskType,
              status: t.status,
              priority: t.priority,
              taskOrder: t.taskOrder,
              sourceEvidence: t.sourceEvidence || {},
            },
          });
        }
      }

      // Record Audit Log
      await prisma.auditLog.create({
        data: {
          userId,
          productId,
          action: isFirstTime ? 'COMPLIANCE_JOURNEY_CREATED' : 'COMPLIANCE_JOURNEY_RECALCULATED',
          metadata: {
            journeyId: journey.id,
            inputHash: orchResult.inputHash,
            standardsCount: orchResult.confirmedStandards.length,
            requirementsCount: orchResult.requirements.length,
          },
        },
      });
    }

    if (!journey) {
      throw new Error('Compliance journey not available');
    }

    // 3. Sync Alerts & Compile Initial Dossier & Calculate Readiness
    await complianceAlertService.syncJourneyAlerts(journey.id, productId);
    await applicationDossierService.compileDossier(journey.id, productId);
    await complianceReadinessService.calculateReadiness(journey.id);

    return this.getJourneyOverview(productId, userId);
  }

  /**
   * Retrieves complete overview of the compliance journey for a product.
   */
  async getJourneyOverview(productId: string, userId: string): Promise<ComplianceJourneyOverviewResponse> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    if (product.userId !== userId) {
      throw new Error('Unauthorized: You do not own this product');
    }

    const journey: any = await prisma.complianceJourney.findFirst({
      where: { productId },
      include: {
        requirements: {
          include: {
            dependencies: { include: { prerequisiteRequirement: true } },
            dependedBy: { include: { requirement: true } },
            standard: true,
          },
        },
        tasks: {
          include: {
            requirement: {
              include: {
                dependencies: { include: { prerequisiteRequirement: true } },
              },
            },
          },
          orderBy: { taskOrder: 'asc' },
        },
        dossiers: {
          orderBy: { version: 'desc' },
          take: 1,
        },
        product: {
          include: {
            standardReviews: {
              include: {
                standard: {
                  include: { schemeMappings: { include: { scheme: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!journey) {
      return this.initializeJourney(productId, userId);
    }

    const readiness = await complianceReadinessService.calculateReadiness(journey.id);
    const alerts = await complianceAlertService.getProductAlerts(productId);
    const regulatoryImpacts = await regulatoryChangeService.getProductImpacts(productId);
    const timeline = await this.getTimeline(productId, userId);

    const confirmedStandards = (journey.product.standardReviews || [])
      .filter((r: any) => r.decision === 'CONFIRMED')
      .map((r: any) => ({
        id: r.standard.id,
        isNumber: r.standard.isNumber,
        title: r.standard.title,
        status: r.standard.status,
        schemeTitle: r.standard.schemeMappings?.[0]?.scheme?.name || 'ISI Certification Scheme',
      }));

    // Evaluate Task Blocker Statuses
    const taskItems: ComplianceTaskItem[] = (journey.tasks || []).map((task: any) => {
      const blockingReasons: string[] = [];
      let isBlocked = false;

      if (task.requirement && task.requirement.dependencies) {
        for (const dep of task.requirement.dependencies) {
          const prereq = dep.prerequisiteRequirement;
          if (prereq && prereq.status !== 'COMPLETED' && prereq.status !== 'WAIVED') {
            isBlocked = true;
            blockingReasons.push(`Prerequisite not satisfied: "${prereq.title}" (${prereq.status})`);
          }
        }
      }

      return {
        id: task.id,
        journeyId: task.journeyId,
        requirementId: task.requirementId,
        requirementTitle: task.requirement?.title,
        requirementType: task.requirement?.requirementType as ComplianceRequirementType,
        title: task.title,
        description: task.description,
        taskType: task.taskType as ComplianceTaskType,
        status: task.status as ComplianceTaskStatus,
        priority: task.priority as RequirementPriority,
        assignedToUserId: task.assignedToUserId,
        dueDate: safeIsoOrNull(task.dueDate),
        completedAt: safeIsoOrNull(task.completedAt),
        blockerReason: task.blockerReason,
        sourceEvidence: task.sourceEvidence,
        taskOrder: task.taskOrder,
        isBlocked,
        blockingReasons,
        createdAt: safeIso(task.createdAt),
        updatedAt: safeIso(task.updatedAt),
      };
    });

    const completedTasksCount = taskItems.filter((t) => t.status === 'COMPLETED').length;
    const blockedTasksCount = taskItems.filter((t) => t.isBlocked).length;
    const completedReqsCount = (journey.requirements || []).filter((r: any) => r.status === 'COMPLETED' || r.status === 'WAIVED').length;

    const latestDossier = journey.dossiers?.[0];

    const journeyItem: ComplianceJourneyItem = {
      id: journey.id,
      productId: journey.productId,
      productName: journey.product?.name || product.name,
      status: journey.status as ComplianceJourneyStatus,
      journeyVersion: journey.journeyVersion || 1,
      inputHash: journey.inputHash,
      readinessScore: readiness.overallScore,
      readinessStatus: readiness.readinessStatus,
      currentStage: journey.currentStage,
      summary: journey.summary,
      startedAt: safeIso(journey.startedAt),
      completedAt: safeIsoOrNull(journey.completedAt),
      createdAt: safeIso(journey.createdAt),
      updatedAt: safeIso(journey.updatedAt),
      requirementsCount: (journey.requirements || []).length,
      completedRequirementsCount: completedReqsCount,
      tasksCount: taskItems.length,
      completedTasksCount,
      blockedTasksCount,
    };

    return {
      journey: journeyItem,
      readiness,
      confirmedStandards,
      tasks: taskItems,
      alerts,
      regulatoryImpacts,
      dossierSummary: latestDossier
        ? {
            id: latestDossier.id,
            status: latestDossier.status,
            completenessScore: latestDossier.completenessScore,
            missingCount: latestDossier.missingCount,
            verifiedCount: latestDossier.verifiedCount,
          }
        : null,
      timeline,
    };
  }

  /**
   * Retrieves tasks for a product compliance journey.
   */
  async getTasks(productId: string, userId: string): Promise<ComplianceTaskItem[]> {
    const overview = await this.getJourneyOverview(productId, userId);
    return overview.tasks;
  }

  /**
   * Completes a compliance task, with strict dependency / blocker validation.
   */
  async completeTask(
    productId: string,
    taskId: string,
    userId: string,
    input?: CompleteTaskInput
  ): Promise<ComplianceTaskItem> {
    logger.info('Attempting to complete compliance task', { productId, taskId, userId });

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.userId !== userId) {
      throw new Error('Unauthorized or product not found');
    }

    const task = await prisma.complianceTask.findUnique({
      where: { id: taskId },
      include: {
        requirement: {
          include: {
            dependencies: {
              include: { prerequisiteRequirement: true },
            },
          },
        },
      },
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Check prerequisite requirement dependencies
    if (task.requirement && task.requirement.dependencies) {
      const unresolvedPrereqs = task.requirement.dependencies
        .filter((d: any) => d.prerequisiteRequirement.status !== 'COMPLETED' && d.prerequisiteRequirement.status !== 'WAIVED')
        .map((d: any) => d.prerequisiteRequirement.title);

      if (unresolvedPrereqs.length > 0) {
        throw new Error(
          `Cannot complete task "${task.title}". The following prerequisite requirement(s) are unresolved: ${unresolvedPrereqs.join('; ')}`
        );
      }
    }

    // Complete the task
    const updatedTask = await prisma.complianceTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        sourceEvidence: {
          ...(task.sourceEvidence as any || {}),
          completedByUserId: userId,
          completionNotes: input?.evidenceNotes || 'Completed via compliance task manager',
          completedAt: new Date().toISOString(),
        },
      },
      include: { requirement: true },
    });

    // If linked to requirement, complete requirement as well
    if (task.requirementId) {
      await prisma.complianceRequirement.update({
        where: { id: task.requirementId },
        data: {
          status: 'COMPLETED',
        },
      });
    }

    // Recalculate readiness
    await complianceReadinessService.calculateReadiness(task.journeyId);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        productId,
        action: 'COMPLIANCE_TASK_COMPLETED',
        metadata: {
          taskId: task.id,
          taskTitle: task.title,
          requirementId: task.requirementId,
        },
      },
    });

    return {
      id: updatedTask.id,
      journeyId: updatedTask.journeyId,
      requirementId: updatedTask.requirementId,
      requirementTitle: updatedTask.requirement?.title,
      requirementType: updatedTask.requirement?.requirementType as ComplianceRequirementType,
      title: updatedTask.title,
      description: updatedTask.description,
      taskType: updatedTask.taskType as ComplianceTaskType,
      status: updatedTask.status as ComplianceTaskStatus,
      priority: updatedTask.priority as RequirementPriority,
      assignedToUserId: updatedTask.assignedToUserId,
      dueDate: safeIsoOrNull(updatedTask.dueDate),
      completedAt: safeIsoOrNull(updatedTask.completedAt),
      blockerReason: updatedTask.blockerReason,
      sourceEvidence: updatedTask.sourceEvidence,
      taskOrder: updatedTask.taskOrder,
      isBlocked: false,
      blockingReasons: [],
      createdAt: safeIso(updatedTask.createdAt),
      updatedAt: safeIso(updatedTask.updatedAt),
    };
  }

  /**
   * Reopens a completed compliance task.
   */
  async reopenTask(productId: string, taskId: string, userId: string): Promise<ComplianceTaskItem> {
    logger.info('Reopening compliance task', { productId, taskId, userId });

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.userId !== userId) {
      throw new Error('Unauthorized or product not found');
    }

    const task = await prisma.complianceTask.findUnique({
      where: { id: taskId },
      include: { requirement: true },
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const updatedTask = await prisma.complianceTask.update({
      where: { id: taskId },
      data: {
        status: 'IN_PROGRESS',
        completedAt: null,
      },
      include: { requirement: true },
    });

    if (task.requirementId) {
      await prisma.complianceRequirement.update({
        where: { id: task.requirementId },
        data: {
          status: 'IN_PROGRESS',
        },
      });
    }

    await complianceReadinessService.calculateReadiness(task.journeyId);

    await prisma.auditLog.create({
      data: {
        userId,
        productId,
        action: 'COMPLIANCE_TASK_REOPENED',
        metadata: {
          taskId: task.id,
          taskTitle: task.title,
        },
      },
    });

    return {
      id: updatedTask.id,
      journeyId: updatedTask.journeyId,
      requirementId: updatedTask.requirementId,
      requirementTitle: updatedTask.requirement?.title,
      requirementType: updatedTask.requirement?.requirementType as ComplianceRequirementType,
      title: updatedTask.title,
      description: updatedTask.description,
      taskType: updatedTask.taskType as ComplianceTaskType,
      status: updatedTask.status as ComplianceTaskStatus,
      priority: updatedTask.priority as RequirementPriority,
      assignedToUserId: updatedTask.assignedToUserId,
      dueDate: safeIsoOrNull(updatedTask.dueDate),
      completedAt: null,
      blockerReason: updatedTask.blockerReason,
      sourceEvidence: updatedTask.sourceEvidence,
      taskOrder: updatedTask.taskOrder,
      isBlocked: false,
      blockingReasons: [],
      createdAt: safeIso(updatedTask.createdAt),
      updatedAt: safeIso(updatedTask.updatedAt),
    };
  }

  /**
   * Recalculates the compliance journey.
   */
  async recalculateJourney(productId: string, userId: string, reason?: string): Promise<ComplianceJourneyOverviewResponse> {
    logger.info('Recalculating compliance journey', { productId, userId, reason });

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.userId !== userId) {
      throw new Error('Unauthorized or product not found');
    }

    // Force re-orchestration
    const journey = await prisma.complianceJourney.findFirst({
      where: { productId },
    });

    if (journey) {
      await prisma.complianceJourney.update({
        where: { id: journey.id },
        data: { inputHash: 'RECALCULATE_FORCE' },
      });
    }

    return this.initializeJourney(productId, userId);
  }

  /**
   * Compiles preparation dossier for product.
   */
  async compileDossier(productId: string, userId: string, input?: CompileDossierInput): Promise<ApplicationDossierResponse> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { complianceJourneys: { take: 1 } },
    });

    if (!product || product.userId !== userId) {
      throw new Error('Unauthorized or product not found');
    }

    let journeyId = product.complianceJourneys[0]?.id;
    if (!journeyId) {
      const init = await this.initializeJourney(productId, userId);
      journeyId = init.journey.id;
    }

    const dossier = await applicationDossierService.compileDossier(journeyId, productId, input);

    await prisma.auditLog.create({
      data: {
        userId,
        productId,
        action: 'COMPLIANCE_DOSSIER_COMPILED',
        metadata: {
          dossierId: dossier.id,
          completenessScore: dossier.completenessScore,
          itemsCount: dossier.items.length,
        },
      },
    });

    return dossier;
  }

  /**
   * Validates preparation dossier for product.
   */
  async validateDossier(productId: string, userId: string): Promise<ValidateDossierResponse> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { complianceJourneys: { take: 1 } },
    });

    if (!product || product.userId !== userId) {
      throw new Error('Unauthorized or product not found');
    }

    let journeyId = product.complianceJourneys[0]?.id;
    if (!journeyId) {
      const init = await this.initializeJourney(productId, userId);
      journeyId = init.journey.id;
    }

    const result = await applicationDossierService.validateDossier(journeyId, productId);

    await prisma.auditLog.create({
      data: {
        userId,
        productId,
        action: 'COMPLIANCE_DOSSIER_VALIDATED',
        metadata: {
          isValid: result.isValid,
          status: result.status,
          blockersCount: result.blockers.length,
        },
      },
    });

    return result;
  }

  /**
   * Generates chronological compliance journey timeline.
   */
  async getTimeline(productId: string, userId: string): Promise<ComplianceTimelineEvent[]> {
    const product: any = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        standardReviews: { include: { standard: true } },
        certificationAnalyses: { take: 1, orderBy: { createdAt: 'desc' } },
        testingAnalyses: { take: 1, orderBy: { createdAt: 'desc' } },
        laboratoryReviews: { include: { laboratory: true } },
        documents: { include: { checklistMatches: true } },
        complianceJourneys: { take: 1, orderBy: { createdAt: 'desc' } },
        applicationDossiers: { take: 1, orderBy: { createdAt: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!product || product.userId !== userId) {
      throw new Error('Unauthorized or product not found');
    }

    const events: ComplianceTimelineEvent[] = [];

    // 1. Product Created
    events.push({
      id: `EVT_PROD_CREATED_${product.id}`,
      stage: 'PRODUCT_IDENTIFIED',
      title: 'Product Profile Created',
      description: `Registered "${product.name}" in category "${product.category}".`,
      status: 'COMPLETED',
      actor: 'User',
      timestamp: safeIso(product.createdAt),
    });

    // 2. Standards Identified & Confirmed
    const acceptedReviews = (product.standardReviews || []).filter(
      (r: any) => r.decision === 'CONFIRMED'
    );
    if (acceptedReviews.length > 0) {
      events.push({
        id: `EVT_STD_CONFIRMED_${product.id}`,
        stage: 'STANDARD_IDENTIFICATION',
        title: 'Applicable Indian Standards Confirmed',
        description: `Confirmed ${acceptedReviews.length} standard(s): ${acceptedReviews.map((r: any) => r.standard?.isNumber || r.standardId).join(', ')}.`,
        status: 'COMPLETED',
        actor: 'User & System',
        timestamp: safeIso(acceptedReviews[0]?.createdAt),
      });
    }

    // 3. Certification Scheme Analyzed
    if (product.certificationAnalyses?.length > 0) {
      events.push({
        id: `EVT_CERT_ANALYZED_${product.id}`,
        stage: 'CERTIFICATION_ANALYSIS',
        title: 'Certification Pathway Evaluated',
        description: 'Completed Scheme-I / ISI / CRS pathway recommendation and STI documentation checklist builder.',
        status: 'COMPLETED',
        actor: 'System',
        timestamp: safeIso(product.certificationAnalyses[0]?.createdAt),
      });
    }

    // 4. Testing Requirements Analyzed
    if (product.testingAnalyses?.length > 0) {
      events.push({
        id: `EVT_TEST_ANALYZED_${product.id}`,
        stage: 'TESTING_ANALYSIS',
        title: 'Testing & Laboratory Intelligence Evaluated',
        description: 'Identified mandatory STI test parameters, frequency, and testing equipment requirements.',
        status: 'COMPLETED',
        actor: 'System',
        timestamp: safeIso(product.testingAnalyses[0]?.createdAt),
      });
    }

    // 5. Laboratory Selected
    const selectedLab = (product.laboratoryReviews || []).find((r: any) => r.decision === 'SELECTED');
    if (selectedLab) {
      events.push({
        id: `EVT_LAB_SELECTED_${product.id}`,
        stage: 'LAB_SELECTION',
        title: 'Accredited Laboratory Selected',
        description: `Selected ${selectedLab.laboratory?.name || 'Laboratory'} for independent sample verification.`,
        status: 'COMPLETED',
        actor: 'User',
        timestamp: safeIso(selectedLab.createdAt),
      });
    }

    // 6. Documents Uploaded & Verified
    const verifiedDocs = (product.documents || []).filter((d: any) => d.verificationStatus === 'VERIFIED');
    const needsReviewDocs = (product.documents || []).filter((d: any) => d.verificationStatus === 'NEEDS_REVIEW');
    if (product.documents?.length > 0) {
      events.push({
        id: `EVT_DOCS_${product.id}`,
        stage: 'DOCUMENT_VERIFICATION',
        title: 'Document Intelligence & Verification',
        description: `${verifiedDocs.length} document(s) verified, ${needsReviewDocs.length} pending review out of ${product.documents.length} total.`,
        status: needsReviewDocs.length > 0 ? 'ATTENTION_REQUIRED' : 'COMPLETED',
        actor: 'User & System',
        timestamp: safeIso(product.documents[product.documents.length - 1]?.createdAt),
      });
    }

    // 7. Application Preparation Dossier Compiled
    if (product.applicationDossiers?.length > 0) {
      const dossier = product.applicationDossiers[0];
      events.push({
        id: `EVT_DOSSIER_${product.id}`,
        stage: 'READY_FOR_OFFICIAL_ACTION',
        title: 'Application Preparation Dossier Compiled',
        description: `Dossier completeness score: ${dossier.completenessScore}%. Status: ${dossier.status}.`,
        status: dossier.status === 'READY_FOR_OFFICIAL_ACTION' ? 'COMPLETED' : 'IN_PROGRESS',
        actor: 'System',
        timestamp: safeIso(dossier.updatedAt || dossier.createdAt),
      });
    }

    return events;
  }
}

export const complianceOrchestratorService = new ComplianceOrchestratorService();
