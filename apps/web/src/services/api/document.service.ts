import { apiClient } from './client';
import type {
  ProductDocumentItem,
  ProductDocumentCompletenessResponse,
  DocumentRequirementMappingResponse,
  DocumentEvidenceResponse,
  VerifyDocumentInput,
  DocumentType,
} from '@bis/shared';

export interface UploadDocumentOptions {
  file: File;
  documentType?: DocumentType;
  notes?: string;
}

function unwrap<T>(res: T | { data: T }): T {
  if (res && typeof res === 'object' && 'data' in res && (res as Record<string, unknown>).data !== undefined) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export const documentService = {
  /**
   * Uploads a document via multipart/form-data.
   */
  async uploadDocument(
    productId: string,
    options: UploadDocumentOptions
  ): Promise<ProductDocumentItem> {
    const formData = new FormData();
    formData.append('file', options.file);
    if (options.documentType) {
      formData.append('documentType', options.documentType);
    }
    if (options.notes) {
      formData.append('notes', options.notes);
    }

    const res = await apiClient.post<ProductDocumentItem | { status?: string; data: ProductDocumentItem }>(
      `/products/${productId}/documents`,
      formData
    );
    return unwrap(res);
  },

  /**
   * Retrieves all documents for a product.
   */
  async getDocuments(productId: string): Promise<ProductDocumentItem[]> {
    const res = await apiClient.get<ProductDocumentItem[] | { status?: string; data: ProductDocumentItem[] }>(
      `/products/${productId}/documents`
    );
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Retrieves a single document by ID with extraction and page evidence.
   */
  async getDocumentById(productId: string, documentId: string): Promise<ProductDocumentItem> {
    const res = await apiClient.get<ProductDocumentItem | { status?: string; data: ProductDocumentItem }>(
      `/products/${productId}/documents/${documentId}`
    );
    return unwrap(res);
  },

  /**
   * Submits human-in-the-loop verification for a document.
   */
  async verifyDocument(
    productId: string,
    documentId: string,
    input: VerifyDocumentInput
  ): Promise<ProductDocumentItem> {
    const res = await apiClient.post<ProductDocumentItem | { status?: string; data: ProductDocumentItem }>(
      `/products/${productId}/documents/${documentId}/verify`,
      input
    );
    return unwrap(res);
  },

  /**
   * Deletes a document.
   */
  async deleteDocument(
    productId: string,
    documentId: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string } | { status?: string; data: { success: boolean; message: string } }>(
      `/products/${productId}/documents/${documentId}`
    );
    return unwrap(res);
  },

  /**
   * Retrieves document completeness analysis and readiness score.
   */
  async getCompleteness(productId: string): Promise<ProductDocumentCompletenessResponse> {
    const res = await apiClient.get<ProductDocumentCompletenessResponse | { status?: string; data: ProductDocumentCompletenessResponse }>(
      `/products/${productId}/documents/completeness`
    );
    return unwrap(res);
  },

  /**
   * Retrieves document requirement mapping matrices.
   */
  async getRequirementMappings(productId: string): Promise<DocumentRequirementMappingResponse> {
    const res = await apiClient.get<DocumentRequirementMappingResponse | { status?: string; data: DocumentRequirementMappingResponse }>(
      `/products/${productId}/documents/requirements`
    );
    return unwrap(res);
  },

  /**
   * Retrieves page evidence citations for a document.
   */
  async getDocumentEvidence(
    productId: string,
    documentId: string
  ): Promise<DocumentEvidenceResponse> {
    const res = await apiClient.get<DocumentEvidenceResponse | { status?: string; data: DocumentEvidenceResponse }>(
      `/products/${productId}/documents/${documentId}/evidence`
    );
    return unwrap(res);
  },

  /**
   * Returns direct download URL for document.
   */
  getDownloadUrl(productId: string, documentId: string): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${baseUrl}/products/${productId}/documents/${documentId}/download`;
  },
};
