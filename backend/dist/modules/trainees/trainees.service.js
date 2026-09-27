"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraineesService = void 0;
const database_1 = require("../../config/database");
const idGenerator_1 = require("../../utils/idGenerator");
const crypto_1 = require("../../utils/crypto");
const errors_1 = require("../../utils/errors");
const notification_service_1 = require("../../services/notification.service");
const audit_service_1 = require("../../services/audit.service");
class TraineesService {
    static async createTrainee(data) {
        const skillOutcomeId = (0, idGenerator_1.generateSkillOutcomeId)();
        const encryptedPhone = (0, crypto_1.encryptField)(data.phonePrimary);
        const encryptedPhoneSec = data.phoneSecondary ? (0, crypto_1.encryptField)(data.phoneSecondary) : null;
        const encryptedEmail = data.email ? (0, crypto_1.encryptField)(data.email) : null;
        const trainee = await database_1.prisma.trainee.create({
            data: {
                skillOutcomeId,
                name: data.name,
                gender: data.gender,
                dob: data.dob ? new Date(data.dob) : null,
                category: data.category,
                disability: data.disability ?? false,
                ruralUrban: data.ruralUrban || 'rural',
                phonePrimary: encryptedPhone,
                phoneSecondary: encryptedPhoneSec,
                email: encryptedEmail,
                district: data.district,
                state: data.state,
                pincode: data.pincode,
                consentStatus: 'granted',
                consentTimestamp: new Date(),
            },
        });
        // Default basic DPDP consents
        await database_1.prisma.consentRecord.createMany({
            data: [
                { traineeId: trainee.id, consentType: 'follow_up_contact', status: 'granted' },
                { traineeId: trainee.id, consentType: 'placement_tracking', status: 'granted' },
                { traineeId: trainee.id, consentType: 'analytics', status: 'granted' },
            ],
        });
        await audit_service_1.AuditService.log({
            entityType: 'Trainee',
            entityId: trainee.id,
            action: 'TRAINEE_REGISTERED',
            changes: { skillOutcomeId, name: trainee.name, district: trainee.district },
        });
        return this.sanitizeTrainee(trainee);
    }
    static async listTrainees(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.district)
            where.district = filters.district;
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search } },
                { skillOutcomeId: { contains: filters.search } },
            ];
        }
        if (filters.batchId || filters.providerId) {
            where.enrolments = {
                some: {
                    ...(filters.batchId ? { batchId: filters.batchId } : {}),
                    ...(filters.providerId ? { batch: { providerId: filters.providerId } } : {}),
                },
            };
        }
        const [total, trainees] = await Promise.all([
            database_1.prisma.trainee.count({ where }),
            database_1.prisma.trainee.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    enrolments: {
                        include: {
                            batch: { include: { course: true, provider: true } },
                            outcomes: true,
                        },
                    },
                    outcomes: {
                        include: {
                            anomalyFlags: { where: { status: { in: ['open', 'under_review'] } } },
                        },
                    },
                },
            }),
        ]);
        return {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            data: trainees.map((t) => this.sanitizeTrainee(t)),
        };
    }
    static async getTraineeById(id) {
        const trainee = await database_1.prisma.trainee.findFirst({
            where: { OR: [{ id }, { skillOutcomeId: id }] },
            include: {
                enrolments: {
                    include: {
                        batch: { include: { course: true, provider: true } },
                        outcomes: true,
                    },
                },
                outcomes: {
                    include: {
                        employer: true,
                        documents: true,
                        followups: true,
                        verificationAttempts: true,
                        anomalyFlags: true,
                    },
                },
                documents: true,
                followups: { orderBy: { scheduledDate: 'asc' } },
                consentRecords: { orderBy: { grantedAt: 'desc' } },
                identityLinks: true,
                incentives: true,
            },
        });
        if (!trainee)
            throw new errors_1.NotFoundError('Trainee not found');
        return this.sanitizeTrainee(trainee);
    }
    static async updateTrainee(id, data) {
        const trainee = await database_1.prisma.trainee.findUnique({ where: { id } });
        if (!trainee)
            throw new errors_1.NotFoundError('Trainee not found');
        const updateData = { ...data };
        if (data.phonePrimary)
            updateData.phonePrimary = (0, crypto_1.encryptField)(data.phonePrimary);
        if (data.phoneSecondary)
            updateData.phoneSecondary = (0, crypto_1.encryptField)(data.phoneSecondary);
        if (data.email)
            updateData.email = (0, crypto_1.encryptField)(data.email);
        const updated = await database_1.prisma.trainee.update({
            where: { id },
            data: updateData,
        });
        return this.sanitizeTrainee(updated);
    }
    /**
     * Public Record Claim flow with OTP verification
     */
    static async initiateClaimRecord(traineeId, phone) {
        const trainee = await database_1.prisma.trainee.findUnique({ where: { id: traineeId } });
        if (!trainee)
            throw new errors_1.NotFoundError('Trainee record not found');
        const rawPhone = (0, crypto_1.decryptField)(trainee.phonePrimary);
        if (rawPhone && rawPhone.slice(-4) !== phone.slice(-4)) {
            throw new errors_1.ValidationError('Phone number does not match registered records');
        }
        const otp = (0, idGenerator_1.generateOtp)();
        await notification_service_1.notificationService.sendSms(phone, `Your Kaushal Sankalp record claim OTP is ${otp}. Valid for 10 minutes.`);
        return {
            success: true,
            message: `OTP sent to ${(0, crypto_1.maskPhone)(phone)}`,
            sessionRef: otp, // Mock for prototype verification
        };
    }
    static sanitizeTrainee(trainee) {
        const rawPhone = (0, crypto_1.decryptField)(trainee.phonePrimary);
        const rawEmail = trainee.email ? (0, crypto_1.decryptField)(trainee.email) : null;
        return {
            ...trainee,
            phonePrimary: rawPhone,
            phonePrimaryMasked: (0, crypto_1.maskPhone)(rawPhone),
            email: rawEmail,
        };
    }
}
exports.TraineesService = TraineesService;
