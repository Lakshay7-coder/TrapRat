import { Request, Response, NextFunction } from 'express';
import { AnomaliesService } from './anomalies.service';
import { AnomalyDetector } from './anomalyRules';

export class AnomaliesController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string,
        severity: req.query.severity as string,
        ruleCode: req.query.ruleCode as string,
      };
      const result = await AnomaliesService.listAnomalies(filters);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnomaliesService.getAnomalyById(req.params.id);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async review(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, reviewNote } = req.body;
      const reviewedBy = req.user?.email || 'Admin';
      const result = await AnomaliesService.reviewAnomaly(req.params.id, {
        status: status || 'under_review',
        reviewNote,
        reviewedBy,
      });
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async triggerScan(_req: Request, res: Response, next: NextFunction) {
    try {
      const newFlags = await AnomalyDetector.runAllScans();
      return res.json({ success: true, newFlagsCount: newFlags.length, flags: newFlags });
    } catch (err) {
      next(err);
    }
  }
}
