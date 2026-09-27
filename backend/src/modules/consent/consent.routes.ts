import { Router } from 'express';
import { ConsentController } from './consent.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', ConsentController.getActive);
router.post('/', ConsentController.update);
router.get('/history', ConsentController.getHistory);

export default router;
