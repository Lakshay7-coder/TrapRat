"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutcomesController = void 0;
const outcomes_service_1 = require("./outcomes.service");
const database_1 = require("../../config/database");
class OutcomesController {
    static async create(req, res, next) {
        try {
            const result = await outcomes_service_1.OutcomesService.createOutcome(req.body);
            return res.status(201).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async list(req, res, next) {
        try {
            const filters = {
                traineeId: req.query.traineeId,
                providerId: req.query.providerId,
                outcomeType: req.query.outcomeType,
                isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
                page: req.query.page ? parseInt(req.query.page, 10) : 1,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
            };
            const result = await outcomes_service_1.OutcomesService.listOutcomes(filters);
            return res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const result = await outcomes_service_1.OutcomesService.getOutcomeById(req.params.id);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async verify(req, res, next) {
        try {
            const verifierName = req.user?.email || 'Admin Verifier';
            const result = await outcomes_service_1.OutcomesService.verifyOutcome(req.params.id, verifierName, req.body.notes);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async recalculate(req, res, next) {
        try {
            const result = await outcomes_service_1.OutcomesService.recalculateScore(req.params.id);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async recordReason(req, res, next) {
        try {
            const { kind, category, rawText } = req.body;
            const reason = await database_1.prisma.outcomeReason.create({
                data: {
                    outcomeId: req.params.id,
                    kind: kind || 'non_placement',
                    category,
                    rawText,
                    confidence: 0.95,
                },
            });
            return res.status(201).json({ success: true, data: reason });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.OutcomesController = OutcomesController;
