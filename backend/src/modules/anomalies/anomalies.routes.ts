import { Router } from 'express';
import { AnomaliesController } from './anomalies.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'provider_admin'), AnomaliesController.list);
router.post('/scan', authorize('admin'), AnomaliesController.triggerScan);
router.get('/:id', authorize('admin', 'provider_admin'), AnomaliesController.getById);
router.put('/:id/review', authorize('admin'), AnomaliesController.review);
router.patch('/:id', authorize('admin'), AnomaliesController.review); // frontend patch compatibility

export default router;
