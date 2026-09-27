import { Request, Response, NextFunction } from 'express';
import { IdentityService } from './identity.service';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { AuditService } from '../../services/audit.service';

export class IdentityController {
  static async linkCandidates(req: Request, res: Response, next: NextFunction) {
    try {
      const { traineeId } = req.body;
      const candidates = await IdentityService.findLinkCandidates(traineeId);
      return res.json({ success: true, data: candidates });
    } catch (err) {
      next(err);
    }
  }

  static async reviewQueue(_req: Request, res: Response, next: NextFunction) {
    try {
      const items = await prisma.identityLink.findMany({
        where: { status: 'under_review' },
        include: { trainee: true },
        orderBy: { confidence: 'desc' },
      });
      return res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  static async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body; // 'merged' | 'rejected'
      const link = await prisma.identityLink.findUnique({ where: { id: req.params.id } });
      if (!link) throw new NotFoundError('Identity link record not found');

      const updated = await prisma.identityLink.update({
        where: { id: req.params.id },
        data: {
          status: status || 'merged',
          reviewedBy: req.user?.email || 'Admin',
        },
      });

      await AuditService.log({
        entityType: 'IdentityLink',
        entityId: link.id,
        action: `IDENTITY_LINK_${status?.toUpperCase() || 'RESOLVED'}`,
        changes: { status },
      });

      return res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
}
