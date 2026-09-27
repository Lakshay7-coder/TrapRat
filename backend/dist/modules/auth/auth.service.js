"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const errors_1 = require("../../utils/errors");
const audit_service_1 = require("../../services/audit.service");
class AuthService {
    static async register(data) {
        const existing = await database_1.prisma.user.findUnique({
            where: { email: data.email.toLowerCase().trim() },
        });
        if (existing) {
            throw new errors_1.ValidationError('User with this email already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
        const user = await database_1.prisma.user.create({
            data: {
                email: data.email.toLowerCase().trim(),
                passwordHash,
                role: data.role || 'trainee',
                name: data.name,
                providerId: data.providerId,
                phone: data.phone,
            },
        });
        await audit_service_1.AuditService.log({
            entityType: 'User',
            entityId: user.id,
            action: 'USER_REGISTERED',
            changes: { email: user.email, role: user.role },
        });
        const tokens = this.generateTokens({
            userId: user.id,
            email: user.email,
            role: user.role,
            providerId: user.providerId,
        });
        return { user: this.sanitizeUser(user), ...tokens };
    }
    static async login(email, password) {
        const user = await database_1.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const tokens = this.generateTokens({
            userId: user.id,
            email: user.email,
            role: user.role,
            providerId: user.providerId,
        });
        return { user: this.sanitizeUser(user), ...tokens };
    }
    static generateTokens(payload) {
        const accessToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
            expiresIn: '1d', // 15m in prod, 1d in dev for ease
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, {
            expiresIn: '7d',
        });
        return { accessToken, refreshToken, token: accessToken };
    }
    static sanitizeUser(user) {
        const { passwordHash, ...safe } = user;
        return safe;
    }
}
exports.AuthService = AuthService;
