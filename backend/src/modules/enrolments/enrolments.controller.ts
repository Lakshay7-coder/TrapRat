import { Request, Response, NextFunction } from 'express';
import { EnrolmentsService } from './enrolments.service';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export class EnrolmentsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EnrolmentsService.enrolTrainee(req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        batchId: req.query.batchId as string,
        traineeId: req.query.traineeId as string,
        status: req.query.status as string,
        providerId: req.query.providerId as string,
      };
      const result = await EnrolmentsService.listEnrolments(filters);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const enrolment = await prisma.enrolment.findUnique({
        where: { id: req.params.id },
        include: {
          trainee: true,
          batch: { include: { course: true, provider: true } },
          outcomes: true,
        },
      });
      if (!enrolment) throw new NotFoundError('Enrolment not found');
      return res.json({ success: true, data: enrolment });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await prisma.enrolment.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EnrolmentsService.completeEnrolment(req.params.id, req.body);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async bulkImport(req: Request, res: Response, next: NextFunction) {
    try {
      const items = Array.isArray(req.body) ? req.body : req.body.enrolments || [];
      const result = await EnrolmentsService.bulkImport(items);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
