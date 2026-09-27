import { Request, Response, NextFunction } from 'express';
import { OutcomesService } from './outcomes.service';
import { prisma } from '../../config/database';

export class OutcomesController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OutcomesService.createOutcome(req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        traineeId: req.query.traineeId as string,
        providerId: req.query.providerId as string,
        outcomeType: req.query.outcomeType as string,
        isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };
      const result = await OutcomesService.listOutcomes(filters);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OutcomesService.getOutcomeById(req.params.id);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const verifierName = req.user?.email || 'Admin Verifier';
      const result = await OutcomesService.verifyOutcome(req.params.id, verifierName, req.body.notes);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async recalculate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OutcomesService.recalculateScore(req.params.id);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async recordReason(req: Request, res: Response, next: NextFunction) {
    try {
      const { kind, category, rawText } = req.body;
      const reason = await prisma.outcomeReason.create({
        data: {
          outcomeId: req.params.id,
          kind: kind || 'non_placement',
          category,
          rawText,
          confidence: 0.95,
        },
      });
      return res.status(201).json({ success: true, data: reason });
    } catch (err) {
      next(err);
    }
  }
}
