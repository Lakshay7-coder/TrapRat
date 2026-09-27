"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const zod_1 = require("zod");
const auth_service_1 = require("./auth.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const errors_1 = require("../../utils/errors");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['admin', 'provider_admin', 'provider_staff', 'employer', 'field_officer', 'trainee', 'micro_verifier']).optional(),
    name: zod_1.z.string().optional(),
    providerId: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
class AuthController {
    static async register(req, res, next) {
        try {
            const data = registerSchema.parse(req.body);
            const result = await auth_service_1.AuthService.register(data);
            res.cookie('ks_refresh_token', result.refreshToken, {
                httpOnly: true,
                secure: env_1.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async login(req, res, next) {
        try {
            const { email, password } = loginSchema.parse(req.body);
            const result = await auth_service_1.AuthService.login(email, password);
            res.cookie('ks_refresh_token', result.refreshToken, {
                httpOnly: true,
                secure: env_1.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async refresh(req, res, next) {
        try {
            const refreshToken = req.cookies?.ks_refresh_token || req.body?.refreshToken;
            if (!refreshToken) {
                throw new errors_1.UnauthorizedError('Refresh token missing');
            }
            const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
            const tokens = auth_service_1.AuthService.generateTokens({
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                providerId: decoded.providerId,
            });
            res.cookie('ks_refresh_token', tokens.refreshToken, {
                httpOnly: true,
                secure: env_1.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return res.json({
                success: true,
                data: tokens,
            });
        }
        catch (err) {
            next(new errors_1.UnauthorizedError('Invalid or expired refresh token'));
        }
    }
    static async logout(_req, res) {
        res.clearCookie('ks_refresh_token');
        res.clearCookie('ks_access_token');
        return res.json({
            success: true,
            message: 'Logged out successfully',
        });
    }
}
exports.AuthController = AuthController;
