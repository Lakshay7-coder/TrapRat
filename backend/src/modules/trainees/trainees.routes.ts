import { Router } from 'express';
import { TraineesController } from './trainees.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

// Public OTP-gated record claim
router.post('/:id/claim-record', TraineesController.claimRecord);

// Protected routes
router.use(authenticate);
router.post('/', authorize('admin', 'provider_admin', 'provider_staff'), TraineesController.create);
router.get('/', authorize('admin', 'provider_admin', 'provider_staff', 'field_officer'), TraineesController.list);
router.get('/:id', TraineesController.getById);
router.put('/:id', authorize('admin', 'provider_admin', 'provider_staff'), TraineesController.update);

export default router;
