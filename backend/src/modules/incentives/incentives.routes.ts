import { Router, Request, Response, NextFunction } from 'express';
import { IncentivesService } from './incentives.service';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const traineeId = (req.query.traineeId as string) || req.user?.traineeId;
    if (!traineeId) return res.json({ success: true, data: [] });
    const items = await IncentivesService.listTraineeIncentives(traineeId);
    return res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/redeem', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await IncentivesService.redeemIncentive(req.params.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
