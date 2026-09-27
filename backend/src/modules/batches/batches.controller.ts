import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { generateCode } from '../../utils/idGenerator';

export class BatchesController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, providerId, batchCode, startDate, endDate, status } = req.body;
      const batch = await prisma.batch.create({
        data: {
          courseId,
          providerId: providerId || req.user?.providerId,
          batchCode: batchCode || generateCode('BAT'),
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          status: status || 'planned',
        },
        include: { course: true, provider: true },
      });
      return res.status(201).json({ success: true, data: batch });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerId, courseId, status } = req.query;
      const batches = await prisma.batch.findMany({
        where: {
          ...(providerId ? { providerId: providerId as string } : {}),
          ...(courseId ? { courseId: courseId as string } : {}),
          ...(status ? { status: status as string } : {}),
        },
        include: {
          course: true,
          provider: true,
          _count: { select: { enrolments: true } },
        },
        orderBy: { startDate: 'desc' },
      });
      return res.json({ success: true, data: batches });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const batch = await prisma.batch.findUnique({
        where: { id: req.params.id },
        include: {
          course: true,
          provider: true,
          enrolments: {
            include: {
              trainee: true,
              outcomes: true,
            },
          },
        },
      });
      if (!batch) throw new NotFoundError('Batch not found');
      return res.json({ success: true, data: batch });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await prisma.batch.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
}
