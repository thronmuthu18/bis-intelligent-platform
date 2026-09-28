// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin & Knowledge Data Management Frontend API Client
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from './client';
import type {
  AdminDashboardMetrics,
  AdminSourceItem,
  CreateSourceInput,
  UpdateSourceInput,
  AdminStandardItem,
  CreateStandardInput,
  UpdateStandardInput,
  AdminQcoItem,
  CreateQcoInput,
  UpdateQcoInput,
  AdminSchemeItem,
  CreateSchemeInput,
  UpdateSchemeInput,
  AdminKnowledgeChunkItem,
  AdminEmbeddingStatus,
  ReindexResult,
  AdminIngestionRunItem,
  TriggerIngestionInput,
  AdminLaboratoryItem,
  CreateLaboratoryInput,
  UpdateLaboratoryInput,
  AdminHallmarkingCentreItem,
  CreateHallmarkingCentreInput,
  UpdateHallmarkingCentreInput,
  AdminConsumerServiceItem,
  CreateConsumerServiceInput,
  UpdateConsumerServiceInput,
  AdminRegulatoryChangeEventItem,
  CreateRegulatoryChangeEventInput,
  DataQualityReport,
  AdminAuditLogItem,
  AuditLogFilterParams,
} from '@bis/shared';

function toQuery(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

export const adminService = {
  // 1. Dashboard Metrics
  getDashboardMetrics: async (): Promise<AdminDashboardMetrics> => {
    return apiClient.get<AdminDashboardMetrics>('/admin/dashboard');
  },

  // 2. Sources Registry
  getSources: async (params?: Record<string, any>): Promise<{ sources: AdminSourceItem[]; total: number; page: number; limit: number }> => {
    return apiClient.get<{ sources: AdminSourceItem[]; total: number; page: number; limit: number }>(`/admin/sources${toQuery(params)}`);
  },

  getSourceById: async (id: string): Promise<AdminSourceItem> => {
    const res = await apiClient.get<{ source: AdminSourceItem }>(`/admin/sources/${id}`);
    return res.source;
  },

  createSource: async (data: CreateSourceInput): Promise<AdminSourceItem> => {
    const res = await apiClient.post<{ source: AdminSourceItem }>('/admin/sources', data);
    return res.source;
  },

  updateSource: async (id: string, data: UpdateSourceInput): Promise<AdminSourceItem> => {
    const res = await apiClient.put<{ source: AdminSourceItem }>(`/admin/sources/${id}`, data);
    return res.source;
  },

  verifySource: async (id: string): Promise<AdminSourceItem> => {
    const res = await apiClient.post<{ source: AdminSourceItem }>(`/admin/sources/${id}/verify`, {});
    return res.source;
  },

  deleteSource: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/sources/${id}`);
  },

  // 3. Standards
  getStandards: async (params?: Record<string, any>): Promise<{ standards: AdminStandardItem[]; total: number; page: number; limit: number }> => {
    return apiClient.get<{ standards: AdminStandardItem[]; total: number; page: number; limit: number }>(`/admin/standards${toQuery(params)}`);
  },

  getStandardById: async (id: string): Promise<any> => {
    const res = await apiClient.get<{ standard: any }>(`/admin/standards/${id}`);
    return res.standard;
  },

  createStandard: async (data: CreateStandardInput): Promise<AdminStandardItem> => {
    const res = await apiClient.post<{ standard: AdminStandardItem }>('/admin/standards', data);
    return res.standard;
  },

  updateStandard: async (id: string, data: UpdateStandardInput): Promise<AdminStandardItem> => {
    const res = await apiClient.put<{ standard: AdminStandardItem }>(`/admin/standards/${id}`, data);
    return res.standard;
  },

  publishStandard: async (id: string): Promise<AdminStandardItem> => {
    const res = await apiClient.post<{ standard: AdminStandardItem }>(`/admin/standards/${id}/publish`, {});
    return res.standard;
  },

  archiveStandard: async (id: string, reason?: string): Promise<AdminStandardItem> => {
    const res = await apiClient.post<{ standard: AdminStandardItem }>(`/admin/standards/${id}/archive`, { reason });
    return res.standard;
  },

  // 4. QCOs
  getQcos: async (params?: Record<string, any>): Promise<{ qcos: AdminQcoItem[]; total: number; page: number; limit: number }> => {
    return apiClient.get<{ qcos: AdminQcoItem[]; total: number; page: number; limit: number }>(`/admin/qcos${toQuery(params)}`);
  },

  getQcoById: async (id: string): Promise<AdminQcoItem> => {
    const res = await apiClient.get<{ qco: AdminQcoItem }>(`/admin/qcos/${id}`);
    return res.qco;
  },

  createQco: async (data: CreateQcoInput): Promise<AdminQcoItem> => {
    const res = await apiClient.post<{ qco: AdminQcoItem }>('/admin/qcos', data);
    return res.qco;
  },

  updateQco: async (id: string, data: UpdateQcoInput): Promise<AdminQcoItem> => {
    const res = await apiClient.put<{ qco: AdminQcoItem }>(`/admin/qcos/${id}`, data);
    return res.qco;
  },

  deleteQco: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/qcos/${id}`);
  },

  // 5. Schemes
  getSchemes: async (params?: Record<string, any>): Promise<{ schemes: AdminSchemeItem[]; total: number; page: number; limit: number }> => {
    return apiClient.get<{ schemes: AdminSchemeItem[]; total: number; page: number; limit: number }>(`/admin/schemes${toQuery(params)}`);
  },

  getSchemeById: async (id: string): Promise<any> => {
    const res = await apiClient.get<{ scheme: any }>(`/admin/schemes/${id}`);
    return res.scheme;
  },

  createScheme: async (data: CreateSchemeInput): Promise<AdminSchemeItem> => {
    const res = await apiClient.post<{ scheme: AdminSchemeItem }>('/admin/schemes', data);
    return res.scheme;
  },

  updateScheme: async (id: string, data: UpdateSchemeInput): Promise<AdminSchemeItem> => {
    const res = await apiClient.put<{ scheme: AdminSchemeItem }>(`/admin/schemes/${id}`, data);
    return res.scheme;
  },

  mapStandardScheme: async (data: { standardId: string; schemeId: string; sourceDocumentId?: string }): Promise<any> => {
    const res = await apiClient.post<{ mapping: any }>('/admin/schemes/map', data);
    return res.mapping;
  },

  // 6. Knowledge Chunks
  getKnowledgeChunks: async (params?: Record<string, any>): Promise<{ chunks: AdminKnowledgeChunkItem[]; total: number; page: number; limit: number }> => {
    return apiClient.get<{ chunks: AdminKnowledgeChunkItem[]; total: number; page: number; limit: number }>(`/admin/knowledge${toQuery(params)}`);
  },

  reindexKnowledgeChunk: async (id: string): Promise<AdminKnowledgeChunkItem> => {
    const res = await apiClient.post<{ chunk: AdminKnowledgeChunkItem }>(`/admin/knowledge/${id}/reindex`, {});
    return res.chunk;
  },

  // 7. Embeddings
  getEmbeddingStatus: async (): Promise<AdminEmbeddingStatus> => {
    const res = await apiClient.get<{ status: AdminEmbeddingStatus }>('/admin/embeddings/status');
    return res.status;
  },

  triggerReindex: async (scope: 'MISSING' | 'FAILED' | 'ALL' = 'MISSING'): Promise<ReindexResult> => {
    return apiClient.post<ReindexResult>('/admin/embeddings/reindex', { scope });
  },

  // 8. Ingestion
  getIngestionRuns: async (params?: Record<string, any>): Promise<{ runs: AdminIngestionRunItem[]; total: number; page: number; limit: number }> => {
    return apiClient.get<{ runs: AdminIngestionRunItem[]; total: number; page: number; limit: number }>(`/admin/ingestion${toQuery(params)}`);
  },

  triggerIngestionRun: async (data: TriggerIngestionInput): Promise<AdminIngestionRunItem> => {
    const res = await apiClient.post<{ run: AdminIngestionRunItem }>('/admin/ingestion/trigger', data);
    return res.run;
  },

  // 9. Laboratories
  getLaboratories: async (params?: Record<string, any>): Promise<{ laboratories: AdminLaboratoryItem[]; total: number; page: number; limit: number }> => {
    return apiClient.get<{ laboratories: AdminLaboratoryItem[]; total: number; page: number; limit: number }>(`/admin/laboratories${toQuery(params)}`);
  },

  createLaboratory: async (data: CreateLaboratoryInput): Promise<AdminLaboratoryItem> => {
    const res = await apiClient.post<{ laboratory: AdminLaboratoryItem }>('/admin/laboratories', data);
    return res.laboratory;
  },

  updateLaboratory: async (id: string, data: UpdateLaboratoryInput): Promise<AdminLaboratoryItem> => {
    const res = await apiClient.put<{ laboratory: AdminLaboratoryItem }>(`/admin/laboratories/${id}`, data);
    return res.laboratory;
  },

  // 10. Hallmarking Centres
  getHallmarkingCentres: async (params?: Record<string, any>): Promise<{ centres: AdminHallmarkingCentreItem[]; total: number; page: number; limit: number }> => {
    return apiClient.get<{ centres: AdminHallmarkingCentreItem[]; total: number; page: number; limit: number }>(`/admin/hallmarking-centres${toQuery(params)}`);
  },

  createHallmarkingCentre: async (data: CreateHallmarkingCentreInput): Promise<AdminHallmarkingCentreItem> => {
    const res = await apiClient.post<{ centre: AdminHallmarkingCentreItem }>('/admin/hallmarking-centres', data);
    return res.centre;
  },

  updateHallmarkingCentre: async (id: string, data: UpdateHallmarkingCentreInput): Promise<AdminHallmarkingCentreItem> => {
    const res = await apiClient.put<{ centre: AdminHallmarkingCentreItem }>(`/admin/hallmarking-centres/${id}`, data);
    return res.centre;
  },

  // 11. Consumer Services
  getConsumerServices: async (params?: Record<string, any>): Promise<{ services: AdminConsumerServiceItem[]; total: number; page: number; limit: number }> => {
    return apiClient.get<{ services: AdminConsumerServiceItem[]; total: number; page: number; limit: number }>(`/admin/consumer-services${toQuery(params)}`);
  },

  createConsumerService: async (data: CreateConsumerServiceInput): Promise<AdminConsumerServiceItem> => {
    const res = await apiClient.post<{ service: AdminConsumerServiceItem }>('/admin/consumer-services', data);
    return res.service;
  },

  updateConsumerService: async (id: string, data: UpdateConsumerServiceInput): Promise<AdminConsumerServiceItem> => {
    const res = await apiClient.put<{ service: AdminConsumerServiceItem }>(`/admin/consumer-services/${id}`, data);
    return res.service;
  },

  // 12. Regulatory Changes
  getRegulatoryChanges: async (params?: Record<string, any>): Promise<{ changes: AdminRegulatoryChangeEventItem[]; total: number; page: number; limit: number }> => {
    return apiClient.get<{ changes: AdminRegulatoryChangeEventItem[]; total: number; page: number; limit: number }>(`/admin/regulatory-changes${toQuery(params)}`);
  },

  createRegulatoryChange: async (data: CreateRegulatoryChangeEventInput): Promise<AdminRegulatoryChangeEventItem> => {
    const res = await apiClient.post<{ change: AdminRegulatoryChangeEventItem }>('/admin/regulatory-changes', data);
    return res.change;
  },

  // 13. Data Quality Report
  getDataQualityReport: async (): Promise<DataQualityReport> => {
    const res = await apiClient.get<{ report: DataQualityReport }>('/admin/data-quality');
    return res.report;
  },

  // 14. Audit Logs
  getAuditLogs: async (params?: AuditLogFilterParams): Promise<{ logs: AdminAuditLogItem[]; total: number; page: number; limit: number }> => {
    return apiClient.get<{ logs: AdminAuditLogItem[]; total: number; page: number; limit: number }>(`/admin/audit${toQuery(params)}`);
  },
};
