import { Router } from 'express';
import { BatchesController } from './batches.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.post('/', authorize('admin', 'provider_admin'), BatchesController.create);
router.get('/', BatchesController.list);
router.get('/:id', BatchesController.getById);
router.put('/:id', authorize('admin', 'provider_admin'), BatchesController.update);

export default router;
