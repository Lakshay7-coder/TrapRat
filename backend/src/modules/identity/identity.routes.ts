import { Router } from 'express';
import { IdentityController } from './identity.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.post('/link-candidates', authorize('admin', 'provider_admin'), IdentityController.linkCandidates);
router.get('/review-queue', authorize('admin', 'provider_admin'), IdentityController.reviewQueue);
router.post('/:id/resolve', authorize('admin', 'provider_admin'), IdentityController.resolve);

export default router;
