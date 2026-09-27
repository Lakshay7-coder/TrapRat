import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/me', UsersController.getMe);
router.put('/me', UsersController.updateMe);

export default router;
