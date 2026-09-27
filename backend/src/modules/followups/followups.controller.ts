import { Request, Response, NextFunction } from 'express';
import { FollowupsService } from './followups.service';

export class FollowupsController {
  static async schedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { traineeId, outcomeId, startDate } = req.body;
      const result = await FollowupsService.scheduleFollowups(
        traineeId,
        outcomeId,
        startDate ? new Date(startDate) : new Date()
      );
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        traineeId: req.query.traineeId as string,
        status: req.query.status as string,
        channel: req.query.channel as string,
      };
      const result = await FollowupsService.listFollowups(filters);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async recordResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const { responseData, notes } = req.body;
      const result = await FollowupsService.recordResponse(req.params.id, responseData, notes);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async webhookResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await FollowupsService.handleIncomingResponse(req.body);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}
