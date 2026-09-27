import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { generateCode } from '../../utils/idGenerator';

export class CoursesController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerId, name, code, durationMonths, sector, nsqfLevel, skillIds } = req.body;
      const course = await prisma.course.create({
        data: {
          providerId: providerId || req.user?.providerId,
          name,
          code: code || generateCode('CRS'),
          durationMonths: parseInt(durationMonths, 10) || 3,
          sector,
          nsqfLevel: nsqfLevel?.toString(),
          ...(skillIds && skillIds.length > 0
            ? {
                courseSkills: {
                  create: skillIds.map((skillId: string) => ({ skillId })),
                },
              }
            : {}),
        },
        include: { courseSkills: { include: { skill: true } } },
      });
      return res.status(201).json({ success: true, data: course });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerId, sector } = req.query;
      const courses = await prisma.course.findMany({
        where: {
          ...(providerId ? { providerId: providerId as string } : {}),
          ...(sector ? { sector: sector as string } : {}),
        },
        include: {
          provider: true,
          courseSkills: { include: { skill: true } },
          _count: { select: { batches: true } },
        },
      });
      return res.json({ success: true, data: courses });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await prisma.course.findUnique({
        where: { id: req.params.id },
        include: {
          provider: true,
          courseSkills: { include: { skill: true } },
          batches: { include: { enrolments: true } },
        },
      });
      if (!course) throw new NotFoundError('Course not found');
      return res.json({ success: true, data: course });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await prisma.course.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
}
