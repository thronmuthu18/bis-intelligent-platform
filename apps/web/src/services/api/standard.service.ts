import { apiClient } from './client';
import type {
  StandardListResponse,
  StandardDetailResponse,
  StandardSearchParams,
  StandardVersion,
  StandardAmendment,
  QCOStandardMapping,
  QCO,
  ProductManual,
  SourceRegistryItem,
  IngestionRun,
  HybridSearchResponse,
  RagRetrieveInput,
  RagContextResponse,
  ReindexEmbeddingsInput,
  EmbeddingStatusResponse,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Standards, Hybrid Search & RAG API Client Service (Phase 4 & 5)
// ─────────────────────────────────────────────────────────────────────────────

export interface StandardListApiResponse {
  success: boolean;
  data: StandardListResponse;
}

export interface HybridSearchApiResponse {
  success: boolean;
  data: HybridSearchResponse;
}

export interface StandardDetailApiResponse {
  success: boolean;
  data: StandardDetailResponse;
}

export interface KnowledgeSourcesApiResponse {
  success: boolean;
  data: SourceRegistryItem[];
}

export interface IngestionRunsApiResponse {
  success: boolean;
  data: IngestionRun[];
}

export interface RagContextApiResponse {
  success: boolean;
  data: RagContextResponse;
}

export interface EmbeddingStatusApiResponse {
  success: boolean;
  data: EmbeddingStatusResponse;
}

export const standardService = {
  /**
   * Search Indian Standards with optional keyword, IS number, sector, department, mode, and pagination.
   */
  async searchStandards(params: StandardSearchParams = {}): Promise<HybridSearchResponse> {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.isNumber) query.append('isNumber', params.isNumber);
    if (params.sector) query.append('sector', params.sector);
    if (params.department) query.append('department', params.department);
    if (params.status) query.append('status', params.status);
    if (params.authorityLevel) query.append('authorityLevel', params.authorityLevel);
    if (params.mode) query.append('mode', params.mode);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const url = `/standards${queryString ? `?${queryString}` : ''}`;
    const res = await apiClient.get<HybridSearchApiResponse>(url);
    return res.data;
  },

  /**
   * Retrieve full standard details by ID including relations (versions, amendments, QCOs, manuals, source provenance).
   */
  async getStandardById(id: string): Promise<StandardDetailResponse> {
    const res = await apiClient.get<StandardDetailApiResponse>(`/standards/${id}`);
    return res.data;
  },

  /**
   * Retrieve historical versions of a standard.
   */
  async getStandardVersions(id: string): Promise<StandardVersion[]> {
    const res = await apiClient.get<{ success: boolean; data: StandardVersion[] }>(`/standards/${id}/versions`);
    return res.data;
  },

  /**
   * Retrieve amendments for a standard.
   */
  async getStandardAmendments(id: string): Promise<StandardAmendment[]> {
    const res = await apiClient.get<{ success: boolean; data: StandardAmendment[] }>(`/standards/${id}/amendments`);
    return res.data;
  },

  /**
   * Retrieve QCO mappings for a standard.
   */
  async getStandardQCOs(id: string): Promise<(QCOStandardMapping & { qco: QCO })[]> {
    const res = await apiClient.get<{ success: boolean; data: (QCOStandardMapping & { qco: QCO })[] }>(`/standards/${id}/qcos`);
    return res.data;
  },

  /**
   * Retrieve product manuals and STI specifications for a standard.
   */
  async getStandardManuals(id: string): Promise<ProductManual[]> {
    const res = await apiClient.get<{ success: boolean; data: ProductManual[] }>(`/standards/${id}/manuals`);
    return res.data;
  },

  /**
   * List registered official sources.
   */
  async getSources(): Promise<SourceRegistryItem[]> {
    const res = await apiClient.get<KnowledgeSourcesApiResponse>('/knowledge/sources');
    return res.data;
  },

  /**
   * List historical ingestion runs.
   */
  async getIngestionRuns(limit = 20): Promise<IngestionRun[]> {
    const res = await apiClient.get<IngestionRunsApiResponse>(`/knowledge/ingestion-runs?limit=${limit}`);
    return res.data;
  },

  /**
   * Trigger ingestion (admin / data manager only).
   */
  async triggerIngestion(sourceKey: string): Promise<{ success: boolean; message: string; data: unknown }> {
    const res = await apiClient.post<{ success: boolean; message: string; data: unknown }>('/knowledge/ingest', { sourceKey });
    return res;
  },

  /**
   * Phase 5: Retrieve source-grounded RAG context evidence blocks.
   */
  async getRagContext(input: RagRetrieveInput): Promise<RagContextResponse> {
    const res = await apiClient.post<RagContextApiResponse>('/knowledge/retrieve', input);
    return res.data;
  },

  /**
   * Phase 5: Reindex knowledge embeddings (admin / data manager only).
   */
  async reindexEmbeddings(input: ReindexEmbeddingsInput = {}): Promise<{ success: boolean; message: string; data: unknown }> {
    const res = await apiClient.post<{ success: boolean; message: string; data: unknown }>('/knowledge/embeddings/reindex', input);
    return res;
  },

  /**
   * Phase 5: Get embedding status and statistics.
   */
  async getEmbeddingStatus(): Promise<EmbeddingStatusResponse> {
    const res = await apiClient.get<EmbeddingStatusApiResponse>('/knowledge/embeddings/status');
    return res.data;
  },
};
