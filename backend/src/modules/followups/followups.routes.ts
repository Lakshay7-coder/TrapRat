import { Router } from 'express';
import { FollowupsController } from './followups.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

// Public webhook endpoint for simulated bot / messaging replies
router.post('/webhook/response', FollowupsController.webhookResponse);

router.use(authenticate);
router.post('/schedule', authorize('admin', 'provider_admin', 'provider_staff'), FollowupsController.schedule);
router.get('/', FollowupsController.list);
router.post('/:id/record-response', FollowupsController.recordResponse);

export default router;
