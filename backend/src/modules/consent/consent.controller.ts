import { Request, Response, NextFunction } from 'express';
import { ConsentService } from './consent.service';

export class ConsentController {
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const traineeId = req.body.traineeId || req.user?.traineeId;
      const result = await ConsentService.updateConsent({
        traineeId,
        consentType: req.body.consentType,
        status: req.body.status,
        notes: req.body.notes,
      });
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const traineeId = (req.query.traineeId as string) || req.user?.traineeId;
      const result = await ConsentService.getActiveConsents(traineeId || '');
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const traineeId = (req.query.traineeId as string) || req.user?.traineeId;
      const result = await ConsentService.getConsentHistory(traineeId || '');
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
