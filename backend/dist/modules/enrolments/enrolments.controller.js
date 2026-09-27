"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrolmentsController = void 0;
const enrolments_service_1 = require("./enrolments.service");
const database_1 = require("../../config/database");
const errors_1 = require("../../utils/errors");
class EnrolmentsController {
    static async create(req, res, next) {
        try {
            const result = await enrolments_service_1.EnrolmentsService.enrolTrainee(req.body);
            return res.status(201).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async list(req, res, next) {
        try {
            const filters = {
                batchId: req.query.batchId,
                traineeId: req.query.traineeId,
                status: req.query.status,
                providerId: req.query.providerId,
            };
            const result = await enrolments_service_1.EnrolmentsService.listEnrolments(filters);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const enrolment = await database_1.prisma.enrolment.findUnique({
                where: { id: req.params.id },
                include: {
                    trainee: true,
                    batch: { include: { course: true, provider: true } },
                    outcomes: true,
                },
            });
            if (!enrolment)
                throw new errors_1.NotFoundError('Enrolment not found');
            return res.json({ success: true, data: enrolment });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const updated = await database_1.prisma.enrolment.update({
                where: { id: req.params.id },
                data: req.body,
            });
            return res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    }
    static async complete(req, res, next) {
        try {
            const result = await enrolments_service_1.EnrolmentsService.completeEnrolment(req.params.id, req.body);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async bulkImport(req, res, next) {
        try {
            const items = Array.isArray(req.body) ? req.body : req.body.enrolments || [];
            const result = await enrolments_service_1.EnrolmentsService.bulkImport(items);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.EnrolmentsController = EnrolmentsController;
