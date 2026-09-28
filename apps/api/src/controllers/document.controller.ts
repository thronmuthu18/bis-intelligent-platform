import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { documentIntelligenceService } from '../services/documents/document-intelligence.service.js';
import { AppError } from '../utils/AppError.js';
import type { VerifyDocumentInput, DocumentType } from '@bis/shared';

// Configure multer memory storage for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
  },
});

export const documentUploadMiddleware = upload.single('file');

export class DocumentController {
  /**
   * POST /api/v1/products/:id/documents
   * Handles document upload (multipart/form-data or json payload), extraction, classification, and requirement mapping.
   */
  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: productId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw AppError.unauthorized('Authentication required');
      }

      if (!productId) {
        throw AppError.badRequest('Product ID is required');
      }

      let fileBuffer: Buffer | undefined;
      let originalFileName: string | undefined;
      let mimeType: string | undefined;
      let userSelectedType: DocumentType | undefined;
      let notes: string | undefined;

      // Handle multipart/form-data (via multer)
      if (req.file) {
        fileBuffer = req.file.buffer;
        originalFileName = req.file.originalname;
        mimeType = req.file.mimetype;
        userSelectedType = req.body.documentType as DocumentType;
        notes = req.body.notes;
      } else if (req.body.fileContentBase64) {
        // Handle JSON base64 payload (for API clients and programmatic tests)
        fileBuffer = Buffer.from(req.body.fileContentBase64, 'base64');
        originalFileName = req.body.fileName || 'compliance_document.pdf';
        mimeType = req.body.mimeType || 'application/pdf';
        userSelectedType = req.body.documentType as DocumentType;
        notes = req.body.notes;
      } else if (req.body.rawText) {
        // Handle raw text upload (programmatic API path).
        // The supplied filename is preserved for document classification and versioning.
        // The file-validator handles text/plain MIME correctly for any allowed extension.
        fileBuffer = Buffer.from(req.body.rawText, 'utf-8');
        originalFileName = (req.body.fileName as string) || 'compliance_document.txt';
        mimeType = 'text/plain';
        userSelectedType = req.body.documentType as DocumentType;
        notes = req.body.notes;
      } else {
        throw AppError.badRequest('No document file attached. Please attach a valid file or base64 payload.');
      }

      if (!fileBuffer || !originalFileName || !mimeType) {
        throw AppError.badRequest('No valid document content provided.');
      }

      const document = await documentIntelligenceService.uploadAndProcessDocument(
        productId,
        userId,
        fileBuffer,
        originalFileName,
        mimeType,
        userSelectedType,
        notes
      );

      res.status(201).json({
        status: 'success',
        data: document,
        message: 'Document uploaded and analyzed successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/products/:id/documents
   * Retrieves all compliance documents for a product.
   */
  async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: productId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw AppError.unauthorized('Authentication required');
      }

      const documents = await documentIntelligenceService.getDocuments(productId, userId);

      res.status(200).json({
        status: 'success',
        data: documents,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/products/:id/documents/completeness
   * Retrieves overall document completeness analysis for a product.
   */
  async getCompleteness(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: productId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw AppError.unauthorized('Authentication required');
      }

      const completeness = await documentIntelligenceService.getCompleteness(productId, userId);

      res.status(200).json({
        status: 'success',
        data: completeness,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/products/:id/documents/requirements
   * Retrieves document requirement mapping matrices.
   */
  async getRequirementMappings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: productId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw AppError.unauthorized('Authentication required');
      }

      const mappings = await documentIntelligenceService.getRequirementMappings(productId, userId);

      res.status(200).json({
        status: 'success',
        data: mappings,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/products/:id/documents/:documentId
   * Retrieves single document details with extraction and evidence.
   */
  async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: productId, documentId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw AppError.unauthorized('Authentication required');
      }

      const document = await documentIntelligenceService.getDocumentById(
        productId,
        documentId,
        userId
      );

      res.status(200).json({
        status: 'success',
        data: document,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/products/:id/documents/:documentId/verify
   * Submits human-in-the-loop verification decision.
   */
  async verifyDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: productId, documentId } = req.params;
      const userId = (req as any).user?.id;
      const input = req.body as VerifyDocumentInput;

      if (!userId) {
        throw AppError.unauthorized('Authentication required');
      }

      if (!input.verificationStatus) {
        throw AppError.badRequest('verificationStatus is required');
      }

      const document = await documentIntelligenceService.verifyDocument(
        productId,
        documentId,
        userId,
        input
      );

      res.status(200).json({
        status: 'success',
        data: document,
        message: 'Document verification updated successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/products/:id/documents/:documentId
   * Deletes a document.
   */
  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: productId, documentId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw AppError.unauthorized('Authentication required');
      }

      const result = await documentIntelligenceService.deleteDocument(
        productId,
        documentId,
        userId
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/products/:id/documents/:documentId/evidence
   * Retrieves page evidence for document.
   */
  async getDocumentEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: productId, documentId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw AppError.unauthorized('Authentication required');
      }

      const evidence = await documentIntelligenceService.getDocumentEvidence(
        productId,
        documentId,
        userId
      );

      res.status(200).json({
        status: 'success',
        data: evidence,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/products/:id/documents/:documentId/download
   * Streams document file for authenticated owner.
   */
  async downloadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: productId, documentId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw AppError.unauthorized('Authentication required');
      }

      const { stream, mimeType, fileName, fileSize } =
        await documentIntelligenceService.getDownloadStream(productId, documentId, userId);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
      res.setHeader('Content-Length', fileSize);

      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }
}

export const documentController = new DocumentController();
