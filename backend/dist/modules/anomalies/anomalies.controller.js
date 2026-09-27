"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnomaliesController = void 0;
const anomalies_service_1 = require("./anomalies.service");
const anomalyRules_1 = require("./anomalyRules");
class AnomaliesController {
    static async list(req, res, next) {
        try {
            const filters = {
                status: req.query.status,
                severity: req.query.severity,
                ruleCode: req.query.ruleCode,
            };
            const result = await anomalies_service_1.AnomaliesService.listAnomalies(filters);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const result = await anomalies_service_1.AnomaliesService.getAnomalyById(req.params.id);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async review(req, res, next) {
        try {
            const { status, reviewNote } = req.body;
            const reviewedBy = req.user?.email || 'Admin';
            const result = await anomalies_service_1.AnomaliesService.reviewAnomaly(req.params.id, {
                status: status || 'under_review',
                reviewNote,
                reviewedBy,
            });
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async triggerScan(_req, res, next) {
        try {
            const newFlags = await anomalyRules_1.AnomalyDetector.runAllScans();
            return res.json({ success: true, newFlagsCount: newFlags.length, flags: newFlags });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AnomaliesController = AnomaliesController;
