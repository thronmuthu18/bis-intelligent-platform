import type { Request, Response, NextFunction } from 'express';
import {
  searchStandards,
  getStandardById,
  getStandardVersions,
  getStandardAmendments,
  getStandardQCOs,
  getStandardManuals,
} from '../services/standard.service.js';
import { executeHybridSearch } from '../services/rag/hybridSearch.js';
import { StandardSearchParams, SearchMode } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Standards Controller (Phase 4 & Phase 5)
// ─────────────────────────────────────────────────────────────────────────────

export async function listStandards(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const params: StandardSearchParams = {
      q: req.query.q as string,
      isNumber: req.query.isNumber as string,
      sector: req.query.sector as string,
      department: req.query.department as string,
      status: req.query.status as StandardSearchParams['status'],
      authorityLevel: req.query.authorityLevel as StandardSearchParams['authorityLevel'],
      mode: (req.query.mode as SearchMode) || 'hybrid',
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
    };

    if (params.q && params.q.trim().length > 0) {
      const hybridResult = await executeHybridSearch(params);
      res.status(200).json({
        success: true,
        data: {
          ...hybridResult,
          standards: hybridResult.results,
        },
      });
      return;
    }

    const result = await searchStandards(params);
    res.status(200).json({
      success: true,
      data: {
        ...result,
        results: result.standards,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function searchStandardsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  return listStandards(req, res, next);
}

export async function getStandard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const standard = await getStandardById(id);
    res.status(200).json({
      success: true,
      data: standard,
    });
  } catch (error) {
    next(error);
  }
}

export async function listStandardVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const versions = await getStandardVersions(id);
    res.status(200).json({
      success: true,
      data: versions,
    });
  } catch (error) {
    next(error);
  }
}

export async function listStandardAmendments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const amendments = await getStandardAmendments(id);
    res.status(200).json({
      success: true,
      data: amendments,
    });
  } catch (error) {
    next(error);
  }
}

export async function listStandardQCOs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const qcos = await getStandardQCOs(id);
    res.status(200).json({
      success: true,
      data: qcos,
    });
  } catch (error) {
    next(error);
  }
}

export async function listStandardManuals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const manuals = await getStandardManuals(id);
    res.status(200).json({
      success: true,
      data: manuals,
    });
  } catch (error) {
    next(error);
  }
}
