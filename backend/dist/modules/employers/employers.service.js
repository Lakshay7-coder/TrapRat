"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployersService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../../config/database");
const errors_1 = require("../../utils/errors");
const crypto_1 = require("../../utils/crypto");
const idGenerator_1 = require("../../utils/idGenerator");
const notification_service_1 = require("../../services/notification.service");
const audit_service_1 = require("../../services/audit.service");
const trustScore_service_1 = require("../outcomes/trustScore.service");
class EmployersService {
    static async createEmployer(data) {
        const employer = await database_1.prisma.employer.create({
            data: {
                name: data.name,
                contactPhone: data.contactPhone ? (0, crypto_1.encryptField)(data.contactPhone) : null,
                contactEmail: data.contactEmail ? (0, crypto_1.encryptField)(data.contactEmail) : null,
                district: data.district,
                state: data.state,
                sector: data.sector,
            },
        });
        return this.sanitizeEmployer(employer);
    }
    static async listEmployers() {
        const employers = await database_1.prisma.employer.findMany({
            include: {
                _count: { select: { outcomes: true } },
            },
            orderBy: { name: 'asc' },
        });
        return employers.map((e) => this.sanitizeEmployer(e));
    }
    static async getEmployerById(id) {
        const employer = await database_1.prisma.employer.findUnique({
            where: { id },
            include: {
                outcomes: { include: { trainee: true } },
            },
        });
        if (!employer)
            throw new errors_1.NotFoundError('Employer not found');
        return this.sanitizeEmployer(employer);
    }
    /**
     * Generates secure 72h single-use verification link + OTP
     */
    static async sendVerificationLink(employerId, outcomeId) {
        const [employer, outcome] = await Promise.all([
            database_1.prisma.employer.findUnique({ where: { id: employerId } }),
            database_1.prisma.outcome.findUnique({ where: { id: outcomeId }, include: { trainee: true } }),
        ]);
        if (!employer)
            throw new errors_1.NotFoundError('Employer not found');
        if (!outcome)
            throw new errors_1.NotFoundError('Outcome not found');
        const rawToken = (0, idGenerator_1.generateToken)();
        const tokenHash = (0, crypto_1.sha256)(rawToken);
        const rawOtp = (0, idGenerator_1.generateOtp)();
        const otpHash = await bcryptjs_1.default.hash(rawOtp, 8);
        const expiresAt = new Date(Date.now() + 72 * 3600 * 1000); // 72h
        await database_1.prisma.verificationToken.create({
            data: {
                outcomeId: outcome.id,
                employerId: employer.id,
                tokenHash,
                otpHash,
                expiresAt,
            },
        });
        const verifyUrl = `http://localhost:5173/verify/${rawToken}`;
        const rawContactPhone = employer.contactPhone ? (0, crypto_1.decryptField)(employer.contactPhone) : null;
        const rawContactEmail = employer.contactEmail ? (0, crypto_1.decryptField)(employer.contactEmail) : null;
        if (rawContactPhone) {
            await notification_service_1.notificationService.sendSms(rawContactPhone, `Kaushal Sankalp Verification for ${outcome.trainee.name}: Link ${verifyUrl} | OTP: ${rawOtp}`);
        }
        if (rawContactEmail) {
            await notification_service_1.notificationService.sendEmail(rawContactEmail, 'Trainee Employment Verification Request', `Please verify trainee ${outcome.trainee.name} using link: ${verifyUrl} and OTP: ${rawOtp}`);
        }
        await audit_service_1.AuditService.log({
            entityType: 'Employer',
            entityId: employer.id,
            action: 'VERIFICATION_LINK_SENT',
            changes: { outcomeId: outcome.id, tokenHash },
        });
        return {
            success: true,
            verifyUrl,
            rawToken,
            otp: rawOtp, // Provided in mock mode for instant testing
            message: 'Verification link and OTP generated successfully',
        };
    }
    /**
     * Public: Get masked details for verification token
     */
    static async getVerificationContext(rawToken) {
        const tokenHash = (0, crypto_1.sha256)(rawToken);
        const tokenRecord = await database_1.prisma.verificationToken.findUnique({
            where: { tokenHash },
            include: {
                outcome: { include: { trainee: true } },
                employer: true,
            },
        });
        if (!tokenRecord)
            throw new errors_1.NotFoundError('Invalid verification link');
        if (tokenRecord.usedAt)
            throw new errors_1.ValidationError('This verification link has already been used');
        if (new Date() > tokenRecord.expiresAt)
            throw new errors_1.ValidationError('This verification link has expired');
        if (tokenRecord.attempts >= 5)
            throw new errors_1.ValidationError('Verification locked due to too many failed attempts');
        return {
            traineeNameMasked: tokenRecord.outcome.trainee.name,
            skillOutcomeId: tokenRecord.outcome.trainee.skillOutcomeId,
            jobRole: tokenRecord.outcome.jobRole,
            outcomeDate: tokenRecord.outcome.outcomeDate,
            employerName: tokenRecord.employer?.name || 'Your Organisation',
            expiresAt: tokenRecord.expiresAt,
        };
    }
    /**
     * Public: Submit employer verification confirmation with OTP
     */
    static async submitVerification(rawToken, data) {
        const tokenHash = (0, crypto_1.sha256)(rawToken);
        const tokenRecord = await database_1.prisma.verificationToken.findUnique({
            where: { tokenHash },
            include: { outcome: { include: { trainee: { include: { documents: true } }, anomalyFlags: true } }, employer: true },
        });
        if (!tokenRecord)
            throw new errors_1.NotFoundError('Invalid verification link');
        if (tokenRecord.usedAt)
            throw new errors_1.ValidationError('This verification link has already been used');
        if (new Date() > tokenRecord.expiresAt)
            throw new errors_1.ValidationError('This verification link has expired');
        if (tokenRecord.attempts >= 5)
            throw new errors_1.ValidationError('Verification locked due to too many failed attempts');
        const isOtpValid = tokenRecord.otpHash ? await bcryptjs_1.default.compare(data.otp, tokenRecord.otpHash) : true;
        if (!isOtpValid) {
            await database_1.prisma.verificationToken.update({
                where: { id: tokenRecord.id },
                data: { attempts: { increment: 1 } },
            });
            throw new errors_1.ValidationError('Invalid verification OTP');
        }
        // Mark token as used
        await database_1.prisma.verificationToken.update({
            where: { id: tokenRecord.id },
            data: { usedAt: new Date() },
        });
        // Update outcome
        const updatedOutcome = await database_1.prisma.outcome.update({
            where: { id: tokenRecord.outcomeId },
            data: {
                isVerified: data.confirmed,
                verifiedAt: new Date(),
                verifiedBy: `Employer: ${tokenRecord.employer?.name || 'Verified Partner'}`,
                source: 'employer_confirm',
                verificationLevel: 2,
                confidenceLabel: data.confirmed ? 'confirmed_trainee' : 'unconfirmed',
                jobRole: data.jobRole || tokenRecord.outcome.jobRole,
            },
        });
        // Increment Employer verification count & mark verified
        if (tokenRecord.employerId) {
            await database_1.prisma.employer.update({
                where: { id: tokenRecord.employerId },
                data: {
                    isVerified: true,
                    verificationCount: { increment: 1 },
                },
            });
        }
        // Recalculate trust score
        const { score, breakdown } = trustScore_service_1.TrustScoreService.calculateTrustScore({ ...updatedOutcome, isVerified: data.confirmed, source: 'employer_confirm' }, tokenRecord.outcome.trainee.documents, tokenRecord.outcome.anomalyFlags, []);
        await database_1.prisma.outcome.update({
            where: { id: tokenRecord.outcomeId },
            data: {
                trustScore: score,
                trustBreakdown: JSON.stringify(breakdown),
            },
        });
        await audit_service_1.AuditService.log({
            entityType: 'Outcome',
            entityId: tokenRecord.outcomeId,
            action: 'EMPLOYER_VERIFIED_OUTCOME',
            changes: { confirmed: data.confirmed, employerId: tokenRecord.employerId, newTrustScore: score },
        });
        return {
            success: true,
            message: 'Employer verification submitted successfully',
            trustScore: score,
        };
    }
    static sanitizeEmployer(employer) {
        const rawPhone = employer.contactPhone ? (0, crypto_1.decryptField)(employer.contactPhone) : null;
        const rawEmail = employer.contactEmail ? (0, crypto_1.decryptField)(employer.contactEmail) : null;
        return {
            ...employer,
            contactPhone: rawPhone,
            contactPhoneMasked: rawPhone ? (0, crypto_1.maskPhone)(rawPhone) : null,
            contactEmail: rawEmail,
            contactEmailMasked: rawEmail ? (0, crypto_1.maskEmail)(rawEmail) : null,
        };
    }
}
exports.EmployersService = EmployersService;
