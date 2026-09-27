"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchesController = void 0;
const database_1 = require("../../config/database");
const errors_1 = require("../../utils/errors");
const idGenerator_1 = require("../../utils/idGenerator");
class BatchesController {
    static async create(req, res, next) {
        try {
            const { courseId, providerId, batchCode, startDate, endDate, status } = req.body;
            const batch = await database_1.prisma.batch.create({
                data: {
                    courseId,
                    providerId: providerId || req.user?.providerId,
                    batchCode: batchCode || (0, idGenerator_1.generateCode)('BAT'),
                    startDate: new Date(startDate),
                    endDate: endDate ? new Date(endDate) : null,
                    status: status || 'planned',
                },
                include: { course: true, provider: true },
            });
            return res.status(201).json({ success: true, data: batch });
        }
        catch (err) {
            next(err);
        }
    }
    static async list(req, res, next) {
        try {
            const { providerId, courseId, status } = req.query;
            const batches = await database_1.prisma.batch.findMany({
                where: {
                    ...(providerId ? { providerId: providerId } : {}),
                    ...(courseId ? { courseId: courseId } : {}),
                    ...(status ? { status: status } : {}),
                },
                include: {
                    course: true,
                    provider: true,
                    _count: { select: { enrolments: true } },
                },
                orderBy: { startDate: 'desc' },
            });
            return res.json({ success: true, data: batches });
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const batch = await database_1.prisma.batch.findUnique({
                where: { id: req.params.id },
                include: {
                    course: true,
                    provider: true,
                    enrolments: {
                        include: {
                            trainee: true,
                            outcomes: true,
                        },
                    },
                },
            });
            if (!batch)
                throw new errors_1.NotFoundError('Batch not found');
            return res.json({ success: true, data: batch });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const updated = await database_1.prisma.batch.update({
                where: { id: req.params.id },
                data: req.body,
            });
            return res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.BatchesController = BatchesController;
