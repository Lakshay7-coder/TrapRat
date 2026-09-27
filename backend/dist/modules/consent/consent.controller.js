"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentController = void 0;
const consent_service_1 = require("./consent.service");
class ConsentController {
    static async update(req, res, next) {
        try {
            const traineeId = req.body.traineeId || req.user?.traineeId;
            const result = await consent_service_1.ConsentService.updateConsent({
                traineeId,
                consentType: req.body.consentType,
                status: req.body.status,
                notes: req.body.notes,
            });
            return res.status(201).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getActive(req, res, next) {
        try {
            const traineeId = req.query.traineeId || req.user?.traineeId;
            const result = await consent_service_1.ConsentService.getActiveConsents(traineeId || '');
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getHistory(req, res, next) {
        try {
            const traineeId = req.query.traineeId || req.user?.traineeId;
            const result = await consent_service_1.ConsentService.getConsentHistory(traineeId || '');
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ConsentController = ConsentController;
