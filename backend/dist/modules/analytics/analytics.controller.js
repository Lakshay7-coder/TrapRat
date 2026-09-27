"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = require("./analytics.service");
const equity_service_1 = require("../equity/equity.service");
const skillGap_service_1 = require("../skills/skillGap.service");
const advisoryReport_service_1 = require("../skills/advisoryReport.service");
const adjustedScore_service_1 = require("../equity/adjustedScore.service");
const database_1 = require("../../config/database");
class AnalyticsController {
    static async getSummary(_req, res, next) {
        try {
            const result = await analytics_service_1.AnalyticsService.getSummaryFunnel();
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getProviderMetrics(req, res, next) {
        try {
            const result = await analytics_service_1.AnalyticsService.getProviderMetrics(req.params.id);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getProviderScorecard(req, res, next) {
        try {
            const result = await adjustedScore_service_1.AdjustedScoreService.computeProviderScorecard(req.params.id);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getDistrictMetrics(req, res, next) {
        try {
            const result = await analytics_service_1.AnalyticsService.getDistrictMetrics(req.params.district);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getEquityDisparities(_req, res, next) {
        try {
            const result = await equity_service_1.EquityService.getDemographicDisparities();
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getSkillGaps(req, res, next) {
        try {
            const courseId = req.query.courseId;
            const result = await skillGap_service_1.SkillGapService.computeSkillGaps(courseId);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getReasonsDistribution(_req, res, next) {
        try {
            const result = await analytics_service_1.AnalyticsService.getReasonsDistribution();
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getDataQualityHeatmap(_req, res, next) {
        try {
            const result = await analytics_service_1.AnalyticsService.getDataQualityHeatmap();
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async listAdvisoryReports(_req, res, next) {
        try {
            const reports = await database_1.prisma.advisoryReport.findMany({ orderBy: { generatedAt: 'desc' } });
            const parsed = reports.map((r) => {
                let summary = {};
                try {
                    if (r.summary)
                        summary = JSON.parse(r.summary);
                }
                catch {
                    summary = {};
                }
                return { ...r, summary };
            });
            return res.json({ success: true, data: parsed });
        }
        catch (err) {
            next(err);
        }
    }
    static async generateAdvisoryReport(req, res, next) {
        try {
            const { providerId, period } = req.body;
            const reports = await advisoryReport_service_1.AdvisoryReportService.generateQuarterlyReport(providerId, period || '2026-Q3');
            return res.status(201).json({ success: true, data: reports });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AnalyticsController = AnalyticsController;
