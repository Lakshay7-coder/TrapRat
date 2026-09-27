import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { AuthService } from '../auth/auth.service';

export class UsersController {
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new NotFoundError('User not authenticated');

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) throw new NotFoundError('User profile not found');

      return res.json({
        success: true,
        data: AuthService.sanitizeUser(user),
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new NotFoundError('User not authenticated');

      const { name, phone } = req.body;
      const updated = await prisma.user.update({
        where: { id: req.user.userId },
        data: { name, phone },
      });

      return res.json({
        success: true,
        data: AuthService.sanitizeUser(updated),
      });
    } catch (err) {
      next(err);
    }
  }
}
