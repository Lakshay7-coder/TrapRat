"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidersController = void 0;
const database_1 = require("../../config/database");
const errors_1 = require("../../utils/errors");
const idGenerator_1 = require("../../utils/idGenerator");
const adjustedScore_service_1 = require("../equity/adjustedScore.service");
class ProvidersController {
    static async create(req, res, next) {
        try {
            const { name, code, district, state, contactName, contactPhone, contactEmail } = req.body;
            const provider = await database_1.prisma.trainingProvider.create({
                data: {
                    name,
                    code: code || (0, idGenerator_1.generateCode)('TP'),
                    district,
                    state,
                    contactName,
                    contactPhone,
                    contactEmail,
                },
            });
            return res.status(201).json({ success: true, data: provider });
        }
        catch (err) {
            next(err);
        }
    }
    static async list(_req, res, next) {
        try {
            const providers = await database_1.prisma.trainingProvider.findMany({
                include: {
                    _count: {
                        select: { courses: true, batches: true },
                    },
                },
                orderBy: { name: 'asc' },
            });
            return res.json({ success: true, data: providers });
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const provider = await database_1.prisma.trainingProvider.findUnique({
                where: { id: req.params.id },
                include: {
                    courses: true,
                    batches: { include: { course: true, enrolments: true } },
                },
            });
            if (!provider)
                throw new errors_1.NotFoundError('Training Provider not found');
            return res.json({ success: true, data: provider });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const updated = await database_1.prisma.trainingProvider.update({
                where: { id: req.params.id },
                data: req.body,
            });
            return res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    }
    static async getStats(req, res, next) {
        try {
            const stats = await adjustedScore_service_1.AdjustedScoreService.computeProviderScorecard(req.params.id);
            return res.json({ success: true, data: stats });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ProvidersController = ProvidersController;
