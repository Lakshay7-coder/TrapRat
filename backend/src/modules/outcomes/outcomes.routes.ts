import { Router } from 'express';
import { OutcomesController } from './outcomes.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.post('/', authorize('admin', 'provider_admin', 'provider_staff', 'trainee'), OutcomesController.create);
router.get('/', OutcomesController.list);
router.get('/:id', OutcomesController.getById);
router.post('/:id/verify', authorize('admin', 'provider_admin', 'field_officer'), OutcomesController.verify);
router.post('/:id/recalculate-trust-score', authorize('admin', 'provider_admin'), OutcomesController.recalculate);
router.post('/:id/reasons', OutcomesController.recordReason);

export default router;
