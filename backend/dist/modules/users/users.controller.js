"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const database_1 = require("../../config/database");
const errors_1 = require("../../utils/errors");
const auth_service_1 = require("../auth/auth.service");
class UsersController {
    static async getMe(req, res, next) {
        try {
            if (!req.user)
                throw new errors_1.NotFoundError('User not authenticated');
            const user = await database_1.prisma.user.findUnique({
                where: { id: req.user.userId },
            });
            if (!user)
                throw new errors_1.NotFoundError('User profile not found');
            return res.json({
                success: true,
                data: auth_service_1.AuthService.sanitizeUser(user),
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async updateMe(req, res, next) {
        try {
            if (!req.user)
                throw new errors_1.NotFoundError('User not authenticated');
            const { name, phone } = req.body;
            const updated = await database_1.prisma.user.update({
                where: { id: req.user.userId },
                data: { name, phone },
            });
            return res.json({
                success: true,
                data: auth_service_1.AuthService.sanitizeUser(updated),
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UsersController = UsersController;
