"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraineesController = void 0;
const trainees_service_1 = require("./trainees.service");
const zod_1 = require("zod");
const createTraineeSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    gender: zod_1.z.string(),
    dob: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    disability: zod_1.z.boolean().optional(),
    ruralUrban: zod_1.z.string().optional(),
    phonePrimary: zod_1.z.string().min(10),
    phoneSecondary: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    district: zod_1.z.string().min(2),
    state: zod_1.z.string().min(2),
    pincode: zod_1.z.string().optional(),
});
class TraineesController {
    static async create(req, res, next) {
        try {
            const data = createTraineeSchema.parse(req.body);
            const result = await trainees_service_1.TraineesService.createTrainee(data);
            return res.status(201).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async list(req, res, next) {
        try {
            const filters = {
                providerId: req.query.providerId || (req.user?.role.includes('provider') ? req.user.providerId || undefined : undefined),
                batchId: req.query.batchId,
                district: req.query.district,
                search: req.query.search,
                page: req.query.page ? parseInt(req.query.page, 10) : 1,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
            };
            const result = await trainees_service_1.TraineesService.listTrainees(filters);
            return res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const result = await trainees_service_1.TraineesService.getTraineeById(req.params.id);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const result = await trainees_service_1.TraineesService.updateTrainee(req.params.id, req.body);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async claimRecord(req, res, next) {
        try {
            const { phone } = req.body;
            const result = await trainees_service_1.TraineesService.initiateClaimRecord(req.params.id, phone);
            return res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.TraineesController = TraineesController;
