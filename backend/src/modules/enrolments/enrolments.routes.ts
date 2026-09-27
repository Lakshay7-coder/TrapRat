import { Router } from 'express';
import { EnrolmentsController } from './enrolments.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.post('/', authorize('admin', 'provider_admin', 'provider_staff'), EnrolmentsController.create);
router.get('/', EnrolmentsController.list);
router.get('/:id', EnrolmentsController.getById);
router.put('/:id', authorize('admin', 'provider_admin', 'provider_staff'), EnrolmentsController.update);
router.post('/:id/complete', authorize('admin', 'provider_admin', 'provider_staff'), EnrolmentsController.complete);
router.post('/bulk-import', authorize('admin', 'provider_admin'), EnrolmentsController.bulkImport);

export default router;
