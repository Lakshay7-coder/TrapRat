import { Request, Response, NextFunction } from 'express';
import { EmployersService } from './employers.service';

export class EmployersController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EmployersService.createEmployer(req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EmployersService.listEmployers();
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EmployersService.getEmployerById(req.params.id);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async sendVerificationLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { outcomeId } = req.body;
      const result = await EmployersService.sendVerificationLink(req.params.id, outcomeId);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // Public verification handlers
  static async getPublicContext(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EmployersService.getVerificationContext(req.params.token);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async submitPublicVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EmployersService.submitVerification(req.params.token, req.body);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
