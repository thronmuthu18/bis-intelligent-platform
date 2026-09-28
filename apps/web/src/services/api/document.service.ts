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

    const res = await apiClient.post<{ status: string; data: ProductDocumentItem }>(
      `/products/${productId}/documents`,
      formData
    );
    return res.data;
  },

  /**
   * Retrieves all documents for a product.
   */
  async getDocuments(productId: string): Promise<ProductDocumentItem[]> {
    const res = await apiClient.get<{ status: string; data: ProductDocumentItem[] }>(
      `/products/${productId}/documents`
    );
    return res.data;
  },

  /**
   * Retrieves a single document by ID with extraction and page evidence.
   */
  async getDocumentById(productId: string, documentId: string): Promise<ProductDocumentItem> {
    const res = await apiClient.get<{ status: string; data: ProductDocumentItem }>(
      `/products/${productId}/documents/${documentId}`
    );
    return res.data;
  },

  /**
   * Submits human-in-the-loop verification for a document.
   */
  async verifyDocument(
    productId: string,
    documentId: string,
    input: VerifyDocumentInput
  ): Promise<ProductDocumentItem> {
    const res = await apiClient.post<{ status: string; data: ProductDocumentItem }>(
      `/products/${productId}/documents/${documentId}/verify`,
      input
    );
    return res.data;
  },

  /**
   * Deletes a document.
   */
  async deleteDocument(
    productId: string,
    documentId: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ status: string; data: { success: boolean; message: string } }>(
      `/products/${productId}/documents/${documentId}`
    );
    return res.data;
  },

  /**
   * Retrieves document completeness analysis and readiness score.
   */
  async getCompleteness(productId: string): Promise<ProductDocumentCompletenessResponse> {
    const res = await apiClient.get<{ status: string; data: ProductDocumentCompletenessResponse }>(
      `/products/${productId}/documents/completeness`
    );
    return res.data;
  },

  /**
   * Retrieves document requirement mapping matrices.
   */
  async getRequirementMappings(productId: string): Promise<DocumentRequirementMappingResponse> {
    const res = await apiClient.get<{ status: string; data: DocumentRequirementMappingResponse }>(
      `/products/${productId}/documents/requirements`
    );
    return res.data;
  },

  /**
   * Retrieves page evidence citations for a document.
   */
  async getDocumentEvidence(
    productId: string,
    documentId: string
  ): Promise<DocumentEvidenceResponse> {
    const res = await apiClient.get<{ status: string; data: DocumentEvidenceResponse }>(
      `/products/${productId}/documents/${documentId}/evidence`
    );
    return res.data;
  },

  /**
   * Returns direct download URL for document.
   */
  getDownloadUrl(productId: string, documentId: string): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${baseUrl}/products/${productId}/documents/${documentId}/download`;
  },
};
