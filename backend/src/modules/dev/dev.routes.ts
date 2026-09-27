import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { FollowupsService } from '../followups/followups.service';

const router = Router();

// Dev only: inspect all mock notifications dispatched
router.get('/notification-inbox', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.notificationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { followup: { include: { trainee: true } } },
    });

    const parsed = logs.map((l) => {
      let payload = {};
      try {
        if (l.payload) payload = JSON.parse(l.payload);
      } catch {
        payload = {};
      }
      return { ...l, payload };
    });

    return res.json({ success: true, data: parsed });
  } catch (err) {
    next(err);
  }
});

// Dev only: simulate incoming reply to a follow-up
router.post('/simulate-reply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { followupId, traineeId, messageText } = req.body;
    const result = await FollowupsService.handleIncomingResponse({
      followupId,
      traineeId,
      messageText,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
