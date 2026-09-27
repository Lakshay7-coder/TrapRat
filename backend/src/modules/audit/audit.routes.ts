import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entityType, entityId } = req.query;
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(entityType ? { entityType: entityType as string } : {}),
        ...(entityId ? { entityId: entityId as string } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const parsed = logs.map((l) => {
      let changes = {};
      try {
        if (l.changes) changes = JSON.parse(l.changes);
      } catch {
        changes = {};
      }
      return { ...l, changes };
    });

    return res.json({ success: true, data: parsed });
  } catch (err) {
    next(err);
  }
});

export default router;
