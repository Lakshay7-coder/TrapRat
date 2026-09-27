import { Request, Response, NextFunction } from 'express';
import { TraineesService } from './trainees.service';
import { z } from 'zod';

const createTraineeSchema = z.object({
  name: z.string().min(2),
  gender: z.string(),
  dob: z.string().optional(),
  category: z.string().optional(),
  disability: z.boolean().optional(),
  ruralUrban: z.string().optional(),
  phonePrimary: z.string().min(10),
  phoneSecondary: z.string().optional(),
  email: z.string().email().optional(),
  district: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().optional(),
});

export class TraineesController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTraineeSchema.parse(req.body);
      const result = await TraineesService.createTrainee(data);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        providerId: (req.query.providerId as string) || (req.user?.role.includes('provider') ? req.user.providerId || undefined : undefined),
        batchId: req.query.batchId as string,
        district: req.query.district as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };

      const result = await TraineesService.listTrainees(filters);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TraineesService.getTraineeById(req.params.id);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TraineesService.updateTrainee(req.params.id, req.body);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async claimRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.body;
      const result = await TraineesService.initiateClaimRecord(req.params.id, phone);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
