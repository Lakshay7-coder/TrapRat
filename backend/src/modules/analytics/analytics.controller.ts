import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { EquityService } from '../equity/equity.service';
import { SkillGapService } from '../skills/skillGap.service';
import { AdvisoryReportService } from '../skills/advisoryReport.service';
import { AdjustedScoreService } from '../equity/adjustedScore.service';
import { prisma } from '../../config/database';

export class AnalyticsController {
  static async getSummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnalyticsService.getSummaryFunnel();
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getProviderMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnalyticsService.getProviderMetrics(req.params.id);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getProviderScorecard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdjustedScoreService.computeProviderScorecard(req.params.id);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getDistrictMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnalyticsService.getDistrictMetrics(req.params.district);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getEquityDisparities(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EquityService.getDemographicDisparities();
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getSkillGaps(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = req.query.courseId as string;
      const result = await SkillGapService.computeSkillGaps(courseId);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getReasonsDistribution(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnalyticsService.getReasonsDistribution();
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getDataQualityHeatmap(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnalyticsService.getDataQualityHeatmap();
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async listAdvisoryReports(_req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await prisma.advisoryReport.findMany({ orderBy: { generatedAt: 'desc' } });
      const parsed = reports.map((r) => {
        let summary = {};
        try {
          if (r.summary) summary = JSON.parse(r.summary);
        } catch {
          summary = {};
        }
        return { ...r, summary };
      });
      return res.json({ success: true, data: parsed });
    } catch (err) {
      next(err);
    }
  }

  static async generateAdvisoryReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerId, period } = req.body;
      const reports = await AdvisoryReportService.generateQuarterlyReport(providerId, period || '2026-Q3');
      return res.status(201).json({ success: true, data: reports });
    } catch (err) {
      next(err);
    }
  }
}
