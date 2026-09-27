import { Router } from 'express';
import { EmployersController } from './employers.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

// Public routes for token verification
router.get('/public/verify/:token', EmployersController.getPublicContext);
router.post('/public/verify/:token', EmployersController.submitPublicVerification);

// Protected routes
router.use(authenticate);
router.post('/', authorize('admin', 'provider_admin'), EmployersController.create);
router.get('/', EmployersController.list);
router.get('/:id', EmployersController.getById);
router.post('/:id/send-verification-link', authorize('admin', 'provider_admin', 'provider_staff'), EmployersController.sendVerificationLink);

export default router;
