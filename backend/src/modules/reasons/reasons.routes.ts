import { Router, Request, Response } from 'express';
import { REASONS_TAXONOMY } from './reasons.taxonomy';
import { ReasonClassifier } from './reasons.classifier';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/taxonomy', (_req: Request, res: Response) => {
  return res.json({ success: true, data: REASONS_TAXONOMY });
});

router.post('/classify', authenticate, (req: Request, res: Response) => {
  const { kind, rawText } = req.body;
  const result = ReasonClassifier.classify(kind || 'non_placement', rawText || '');
  return res.json({ success: true, data: result });
});

export default router;
