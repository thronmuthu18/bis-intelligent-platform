// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin & Knowledge Data Management Controller
// ─────────────────────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { AdminDashboardService } from '../services/admin/admin-dashboard.service.js';
import { AdminSourceService } from '../services/admin/admin-source.service.js';
import { AdminStandardService } from '../services/admin/admin-standard.service.js';
import { AdminQcoService } from '../services/admin/admin-qco.service.js';
import { AdminSchemeService } from '../services/admin/admin-scheme.service.js';
import { AdminKnowledgeService } from '../services/admin/admin-knowledge.service.js';
import { AdminEmbeddingService } from '../services/admin/admin-embedding.service.js';
import { AdminIngestionService } from '../services/admin/admin-ingestion.service.js';
import { AdminLaboratoryService } from '../services/admin/admin-laboratory.service.js';
import { AdminHallmarkingService } from '../services/admin/admin-hallmarking.service.js';
import { AdminConsumerService } from '../services/admin/admin-consumer.service.js';
import { AdminRegulatoryService } from '../services/admin/admin-regulatory.service.js';
import { AdminDataQualityService } from '../services/admin/admin-data-quality.service.js';
import { AdminAuditService } from '../services/admin/admin-audit.service.js';

export class AdminController {
  // ── 1. Dashboard ──────────────────────────────────────────────────────────
  public static async getDashboardMetrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await AdminDashboardService.getMetrics();
      res.json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  }

  // ── 2. Sources ────────────────────────────────────────────────────────────
  public static async getSources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminSourceService.getSources(req.query as any);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getSourceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const source = await AdminSourceService.getSourceById(req.params.id);
      res.json({ success: true, data: { source } });
    } catch (err) {
      next(err);
    }
  }

  public static async createSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const source = await AdminSourceService.createSource(req.body, req.user!.id);
      res.status(201).json({ success: true, data: { source } });
    } catch (err) {
      next(err);
    }
  }

  public static async updateSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const source = await AdminSourceService.updateSource(req.params.id, req.body, req.user!.id);
      res.json({ success: true, data: { source } });
    } catch (err) {
      next(err);
    }
  }

  public static async verifySource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const source = await AdminSourceService.verifySource(req.params.id, req.user!.id);
      res.json({ success: true, data: { source } });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminSourceService.deleteSource(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ── 3. Standards ──────────────────────────────────────────────────────────
  public static async getStandards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminStandardService.getStandards(req.query as any);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getStandardById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const standard = await AdminStandardService.getStandardById(req.params.id);
      res.json({ success: true, data: { standard } });
    } catch (err) {
      next(err);
    }
  }

  public static async createStandard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const standard = await AdminStandardService.createStandard(req.body, req.user!.id);
      res.status(201).json({ success: true, data: { standard } });
    } catch (err) {
      next(err);
    }
  }

  public static async updateStandard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const standard = await AdminStandardService.updateStandard(req.params.id, req.body, req.user!.id);
      res.json({ success: true, data: { standard } });
    } catch (err) {
      next(err);
    }
  }

  public static async publishStandard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const standard = await AdminStandardService.publishStandard(req.params.id, req.user!.id);
      res.json({ success: true, data: { standard } });
    } catch (err) {
      next(err);
    }
  }

  public static async archiveStandard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reason = req.body?.reason || 'Archived by administrator';
      const standard = await AdminStandardService.archiveStandard(req.params.id, reason, req.user!.id);
      res.json({ success: true, data: { standard } });
    } catch (err) {
      next(err);
    }
  }

  // ── 4. QCOs ───────────────────────────────────────────────────────────────
  public static async getQcos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminQcoService.getQcos(req.query as any);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getQcoById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qco = await AdminQcoService.getQcoById(req.params.id);
      res.json({ success: true, data: { qco } });
    } catch (err) {
      next(err);
    }
  }

  public static async createQco(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qco = await AdminQcoService.createQco(req.body, req.user!.id);
      res.status(201).json({ success: true, data: { qco } });
    } catch (err) {
      next(err);
    }
  }

  public static async updateQco(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qco = await AdminQcoService.updateQco(req.params.id, req.body, req.user!.id);
      res.json({ success: true, data: { qco } });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteQco(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminQcoService.deleteQco(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ── 5. Schemes ────────────────────────────────────────────────────────────
  public static async getSchemes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminSchemeService.getSchemes(req.query as any);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getSchemeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scheme = await AdminSchemeService.getSchemeById(req.params.id);
      res.json({ success: true, data: { scheme } });
    } catch (err) {
      next(err);
    }
  }

  public static async createScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scheme = await AdminSchemeService.createScheme(req.body, req.user!.id);
      res.status(201).json({ success: true, data: { scheme } });
    } catch (err) {
      next(err);
    }
  }

  public static async updateScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scheme = await AdminSchemeService.updateScheme(req.params.id, req.body, req.user!.id);
      res.json({ success: true, data: { scheme } });
    } catch (err) {
      next(err);
    }
  }

  public static async mapStandardScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { standardId, schemeId, sourceDocumentId } = req.body;
      const mapping = await AdminSchemeService.mapStandard(standardId, schemeId, sourceDocumentId, req.user!.id);
      res.json({ success: true, data: { mapping } });
    } catch (err) {
      next(err);
    }
  }

  // ── 6. Knowledge Chunks ───────────────────────────────────────────────────
  public static async getKnowledgeChunks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminKnowledgeService.getChunks(req.query as any);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getKnowledgeChunkById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const chunk = await AdminKnowledgeService.getChunkById(req.params.id);
      res.json({ success: true, data: { chunk } });
    } catch (err) {
      next(err);
    }
  }

  public static async reindexKnowledgeChunk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const chunk = await AdminKnowledgeService.reindexChunk(req.params.id, req.user!.id);
      res.json({ success: true, data: { chunk } });
    } catch (err) {
      next(err);
    }
  }

  // ── 7. Embeddings ─────────────────────────────────────────────────────────
  public static async getEmbeddingStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await AdminEmbeddingService.getStatus();
      res.json({ success: true, data: { status } });
    } catch (err) {
      next(err);
    }
  }

  public static async triggerReindex(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scope = req.body?.scope || 'MISSING';
      const result = await AdminEmbeddingService.triggerReindex(scope, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ── 8. Ingestion Runs ─────────────────────────────────────────────────────
  public static async getIngestionRuns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminIngestionService.getRuns(req.query as any);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async triggerIngestionRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const run = await AdminIngestionService.triggerRun(req.body, req.user!.id);
      res.status(201).json({ success: true, data: { run } });
    } catch (err) {
      next(err);
    }
  }

  // ── 9. Laboratories ───────────────────────────────────────────────────────
  public static async getLaboratories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminLaboratoryService.getLaboratories(req.query as any);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async createLaboratory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const laboratory = await AdminLaboratoryService.createLaboratory(req.body, req.user!.id);
      res.status(201).json({ success: true, data: { laboratory } });
    } catch (err) {
      next(err);
    }
  }

  public static async updateLaboratory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const laboratory = await AdminLaboratoryService.updateLaboratory(req.params.id, req.body, req.user!.id);
      res.json({ success: true, data: { laboratory } });
    } catch (err) {
      next(err);
    }
  }

  // ── 10. Hallmarking Centres ───────────────────────────────────────────────
  public static async getHallmarkingCentres(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminHallmarkingService.getCentres(req.query as any);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async createHallmarkingCentre(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const centre = await AdminHallmarkingService.createCentre(req.body, req.user!.id);
      res.status(201).json({ success: true, data: { centre } });
    } catch (err) {
      next(err);
    }
  }

  public static async updateHallmarkingCentre(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const centre = await AdminHallmarkingService.updateCentre(req.params.id, req.body, req.user!.id);
      res.json({ success: true, data: { centre } });
    } catch (err) {
      next(err);
    }
  }

  // ── 11. Consumer Services ─────────────────────────────────────────────────
  public static async getConsumerServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminConsumerService.getServices(req.query as any);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async createConsumerService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await AdminConsumerService.createService(req.body, req.user!.id);
      res.status(201).json({ success: true, data: { service } });
    } catch (err) {
      next(err);
    }
  }

  public static async updateConsumerService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await AdminConsumerService.updateService(req.params.id, req.body, req.user!.id);
      res.json({ success: true, data: { service } });
    } catch (err) {
      next(err);
    }
  }

  // ── 12. Regulatory Changes ────────────────────────────────────────────────
  public static async getRegulatoryChanges(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminRegulatoryService.getChanges(req.query as any);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async createRegulatoryChange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const change = await AdminRegulatoryService.createChange(req.body, req.user!.id);
      res.status(201).json({ success: true, data: { change } });
    } catch (err) {
      next(err);
    }
  }

  // ── 13. Data Quality ──────────────────────────────────────────────────────
  public static async getDataQualityReport(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await AdminDataQualityService.scan();
      res.json({ success: true, data: { report } });
    } catch (err) {
      next(err);
    }
  }

  // ── 14. Audit Logs ────────────────────────────────────────────────────────
  public static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminAuditService.getLogs(req.query as any);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
