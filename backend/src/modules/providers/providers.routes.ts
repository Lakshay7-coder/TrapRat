import { Router } from 'express';
import { ProvidersController } from './providers.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.post('/', authorize('admin'), ProvidersController.create);
router.get('/', authorize('admin', 'provider_admin', 'provider_staff', 'field_officer'), ProvidersController.list);
router.get('/:id', ProvidersController.getById);
router.put('/:id', authorize('admin', 'provider_admin'), ProvidersController.update);
router.get('/:id/stats', ProvidersController.getStats);

export default router;
