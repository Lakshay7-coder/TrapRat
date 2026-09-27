import { Router } from 'express';
import { CoursesController } from './courses.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.post('/', authorize('admin', 'provider_admin'), CoursesController.create);
router.get('/', CoursesController.list);
router.get('/:id', CoursesController.getById);
router.put('/:id', authorize('admin', 'provider_admin'), CoursesController.update);

export default router;
