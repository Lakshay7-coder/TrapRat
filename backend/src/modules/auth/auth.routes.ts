import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { UsersController } from '../users/users.controller';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);

// Route alias for frontend compatibility (/api/auth/me)
router.get('/me', authenticate, UsersController.getMe);

export default router;
