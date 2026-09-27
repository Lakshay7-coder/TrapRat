"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoursesController = void 0;
const database_1 = require("../../config/database");
const errors_1 = require("../../utils/errors");
const idGenerator_1 = require("../../utils/idGenerator");
class CoursesController {
    static async create(req, res, next) {
        try {
            const { providerId, name, code, durationMonths, sector, nsqfLevel, skillIds } = req.body;
            const course = await database_1.prisma.course.create({
                data: {
                    providerId: providerId || req.user?.providerId,
                    name,
                    code: code || (0, idGenerator_1.generateCode)('CRS'),
                    durationMonths: parseInt(durationMonths, 10) || 3,
                    sector,
                    nsqfLevel: nsqfLevel?.toString(),
                    ...(skillIds && skillIds.length > 0
                        ? {
                            courseSkills: {
                                create: skillIds.map((skillId) => ({ skillId })),
                            },
                        }
                        : {}),
                },
                include: { courseSkills: { include: { skill: true } } },
            });
            return res.status(201).json({ success: true, data: course });
        }
        catch (err) {
            next(err);
        }
    }
    static async list(req, res, next) {
        try {
            const { providerId, sector } = req.query;
            const courses = await database_1.prisma.course.findMany({
                where: {
                    ...(providerId ? { providerId: providerId } : {}),
                    ...(sector ? { sector: sector } : {}),
                },
                include: {
                    provider: true,
                    courseSkills: { include: { skill: true } },
                    _count: { select: { batches: true } },
                },
            });
            return res.json({ success: true, data: courses });
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const course = await database_1.prisma.course.findUnique({
                where: { id: req.params.id },
                include: {
                    provider: true,
                    courseSkills: { include: { skill: true } },
                    batches: { include: { enrolments: true } },
                },
            });
            if (!course)
                throw new errors_1.NotFoundError('Course not found');
            return res.json({ success: true, data: course });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const updated = await database_1.prisma.course.update({
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
exports.CoursesController = CoursesController;
