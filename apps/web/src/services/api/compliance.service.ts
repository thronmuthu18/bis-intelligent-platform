import { apiClient } from './client';
import type {
  ComplianceJourneyOverviewResponse,
  ComplianceReadinessResponse,
  ComplianceTaskItem,
  ComplianceTimelineEvent,
  ApplicationDossierResponse,
  ValidateDossierResponse,
  ComplianceAlertItem,
  RegulatoryImpactItem,
  CompleteTaskInput,
  CompileDossierInput,
} from '@bis/shared';

export const complianceService = {
  /**
   * Initializes or gets the active compliance journey for a product.
   */
  async initializeJourney(productId: string): Promise<ComplianceJourneyOverviewResponse> {
    const res = await apiClient.post<{ success: boolean; data: ComplianceJourneyOverviewResponse }>(
      `/products/${productId}/compliance/initialize`,
      {}
    );
    return res.data;
  },

  /**
   * Retrieves complete overview of the compliance journey for a product.
   */
  async getJourneyOverview(productId: string): Promise<ComplianceJourneyOverviewResponse> {
    const res = await apiClient.get<{ success: boolean; data: ComplianceJourneyOverviewResponse }>(
      `/products/${productId}/compliance`
    );
    return res.data;
  },

  /**
   * Recalculates the compliance journey.
   */
  async recalculateJourney(productId: string, reason?: string): Promise<ComplianceJourneyOverviewResponse> {
    const res = await apiClient.post<{ success: boolean; data: ComplianceJourneyOverviewResponse }>(
      `/products/${productId}/compliance/recalculate`,
      { reason }
    );
    return res.data;
  },

  /**
   * Retrieves all tasks for a product.
   */
  async getTasks(productId: string): Promise<ComplianceTaskItem[]> {
    const res = await apiClient.get<{ success: boolean; data: ComplianceTaskItem[] }>(
      `/products/${productId}/compliance/tasks`
    );
    return res.data;
  },

  /**
   * Completes a compliance task with optional evidence notes.
   */
  async completeTask(productId: string, taskId: string, input?: CompleteTaskInput): Promise<ComplianceTaskItem> {
    const res = await apiClient.post<{ success: boolean; data: ComplianceTaskItem }>(
      `/products/${productId}/compliance/tasks/${taskId}/complete`,
      input || {}
    );
    return res.data;
  },

  /**
   * Reopens a completed compliance task.
   */
  async reopenTask(productId: string, taskId: string): Promise<ComplianceTaskItem> {
    const res = await apiClient.post<{ success: boolean; data: ComplianceTaskItem }>(
      `/products/${productId}/compliance/tasks/${taskId}/reopen`,
      {}
    );
    return res.data;
  },

  /**
   * Retrieves compliance readiness scores.
   */
  async getReadiness(productId: string): Promise<ComplianceReadinessResponse> {
    const res = await apiClient.get<{ success: boolean; data: ComplianceReadinessResponse }>(
      `/products/${productId}/compliance/readiness`
    );
    return res.data;
  },

  /**
   * Retrieves compliance timeline events.
   */
  async getTimeline(productId: string): Promise<ComplianceTimelineEvent[]> {
    const res = await apiClient.get<{ success: boolean; data: ComplianceTimelineEvent[] }>(
      `/products/${productId}/compliance/timeline`
    );
    return res.data;
  },

  /**
   * Retrieves the latest application preparation dossier.
   */
  async getDossier(productId: string): Promise<ApplicationDossierResponse> {
    const res = await apiClient.get<{ success: boolean; data: ApplicationDossierResponse }>(
      `/products/${productId}/compliance/dossier`
    );
    return res.data;
  },

  /**
   * Compiles or updates preparation dossier for product.
   */
  async compileDossier(productId: string, input?: CompileDossierInput): Promise<ApplicationDossierResponse> {
    const res = await apiClient.post<{ success: boolean; data: ApplicationDossierResponse }>(
      `/products/${productId}/compliance/dossier/compile`,
      input || {}
    );
    return res.data;
  },

  /**
   * Validates preparation dossier.
   */
  async validateDossier(productId: string): Promise<ValidateDossierResponse> {
    const res = await apiClient.post<{ success: boolean; data: ValidateDossierResponse }>(
      `/products/${productId}/compliance/dossier/validate`,
      {}
    );
    return res.data;
  },

  /**
   * Retrieves compliance alerts.
   */
  async getAlerts(productId: string): Promise<ComplianceAlertItem[]> {
    const res = await apiClient.get<{ success: boolean; data: ComplianceAlertItem[] }>(
      `/products/${productId}/compliance/alerts`
    );
    return res.data;
  },

  /**
   * Marks an alert as read.
   */
  async markAlertRead(productId: string, alertId: string): Promise<void> {
    await apiClient.post<{ success: boolean; message: string }>(
      `/products/${productId}/compliance/alerts/${alertId}/read`,
      {}
    );
  },

  /**
   * Retrieves regulatory impacts.
   */
  async getRegulatoryImpact(productId: string): Promise<RegulatoryImpactItem[]> {
    const res = await apiClient.get<{ success: boolean; data: RegulatoryImpactItem[] }>(
      `/products/${productId}/compliance/regulatory-impact`
    );
    return res.data;
  },
};
