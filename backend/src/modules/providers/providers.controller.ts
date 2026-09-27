import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { generateCode } from '../../utils/idGenerator';
import { AdjustedScoreService } from '../equity/adjustedScore.service';

export class ProvidersController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, code, district, state, contactName, contactPhone, contactEmail } = req.body;
      const provider = await prisma.trainingProvider.create({
        data: {
          name,
          code: code || generateCode('TP'),
          district,
          state,
          contactName,
          contactPhone,
          contactEmail,
        },
      });
      return res.status(201).json({ success: true, data: provider });
    } catch (err) {
      next(err);
    }
  }

  static async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const providers = await prisma.trainingProvider.findMany({
        include: {
          _count: {
            select: { courses: true, batches: true },
          },
        },
        orderBy: { name: 'asc' },
      });
      return res.json({ success: true, data: providers });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = await prisma.trainingProvider.findUnique({
        where: { id: req.params.id },
        include: {
          courses: true,
          batches: { include: { course: true, enrolments: true } },
        },
      });
      if (!provider) throw new NotFoundError('Training Provider not found');
      return res.json({ success: true, data: provider });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await prisma.trainingProvider.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdjustedScoreService.computeProviderScorecard(req.params.id);
      return res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}
