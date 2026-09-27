import { Router } from 'express';
import multer from 'multer';
import { DocumentsController } from './documents.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();

router.use(authenticate);
router.post('/upload', upload.single('file'), DocumentsController.upload);
router.get('/', DocumentsController.list);
router.put('/:id/verify', authorize('admin', 'provider_admin', 'field_officer'), DocumentsController.verify);

export default router;
