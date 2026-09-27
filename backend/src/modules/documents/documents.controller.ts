import { Request, Response, NextFunction } from 'express';
import { DocumentsService } from './documents.service';
import { ValidationError } from '../../utils/errors';

export class DocumentsController {
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('No document file uploaded');
      }

      const { traineeId, outcomeId, docType } = req.body;
      const uploadedBy = req.user?.email || 'trainee';

      const result = await DocumentsService.saveDocument({
        traineeId: traineeId || req.user?.traineeId,
        outcomeId,
        docType: docType || 'other',
        file: req.file,
        uploadedBy,
      });

      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        traineeId: req.query.traineeId as string,
        outcomeId: req.query.outcomeId as string,
      };
      const result = await DocumentsService.listDocuments(filters);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, notes } = req.body;
      const verifier = req.user?.email || 'Admin';
      const result = await DocumentsService.verifyDocument(req.params.id, status, verifier, notes);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
