"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutcomesService = void 0;
const database_1 = require("../../config/database");
const errors_1 = require("../../utils/errors");
const trustScore_service_1 = require("./trustScore.service");
const audit_service_1 = require("../../services/audit.service");
const anomalyRules_1 = require("../anomalies/anomalyRules");
class OutcomesService {
    static async createOutcome(data) {
        const outcomeSource = data.source || 'trainee_self_report';
        // Calculate initial trust score
        const { score, breakdown } = trustScore_service_1.TrustScoreService.calculateTrustScore({
            source: outcomeSource,
            isVerified: false,
            createdAt: new Date(),
        });
        const outcome = await database_1.prisma.outcome.create({
            data: {
                traineeId: data.traineeId,
                enrolmentId: data.enrolmentId || null,
                outcomeType: data.outcomeType,
                outcomeDate: data.outcomeDate ? new Date(data.outcomeDate) : new Date(),
                employerId: data.employerId || null,
                jobRole: data.jobRole,
                wageBandLow: data.wageBandLow ? parseInt(data.wageBandLow, 10) : null,
                wageBandHigh: data.wageBandHigh ? parseInt(data.wageBandHigh, 10) : null,
                isRelatedToTraining: data.isRelatedToTraining || 'yes',
                source: outcomeSource,
                trustScore: score,
                trustBreakdown: JSON.stringify(breakdown),
                employmentType: data.employmentType || 'full_time',
                selfEmploymentType: data.selfEmploymentType,
                apprenticeshipStage: data.apprenticeshipStage,
                confidenceLabel: outcomeSource === 'trainee_self_report' ? 'self_reported' : 'unconfirmed',
                ...(data.skillIds && data.skillIds.length > 0
                    ? {
                        skillRequirements: {
                            create: data.skillIds.map((skillId) => ({ skillId })),
                        },
                    }
                    : {}),
            },
            include: {
                trainee: true,
                employer: true,
                documents: true,
                skillRequirements: { include: { skill: true } },
            },
        });
        await audit_service_1.AuditService.log({
            entityType: 'Outcome',
            entityId: outcome.id,
            action: 'OUTCOME_CREATED',
            changes: {
                traineeId: data.traineeId,
                outcomeType: data.outcomeType,
                trustScore: score,
            },
        });
        // Run anomaly scans in background
        setTimeout(() => anomalyRules_1.AnomalyDetector.runAllScans(), 100);
        return this.parseOutcome(outcome);
    }
    static async listOutcomes(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.traineeId)
            where.traineeId = filters.traineeId;
        if (filters.outcomeType)
            where.outcomeType = filters.outcomeType;
        if (filters.isVerified !== undefined)
            where.isVerified = filters.isVerified;
        if (filters.providerId) {
            where.enrolment = { batch: { providerId: filters.providerId } };
        }
        const [total, outcomes] = await Promise.all([
            database_1.prisma.outcome.count({ where }),
            database_1.prisma.outcome.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    trainee: true,
                    employer: true,
                    documents: true,
                    anomalyFlags: true,
                    enrolment: { include: { batch: { include: { course: true, provider: true } } } },
                },
            }),
        ]);
        return {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            data: outcomes.map((o) => this.parseOutcome(o)),
        };
    }
    static async getOutcomeById(id) {
        const outcome = await database_1.prisma.outcome.findUnique({
            where: { id },
            include: {
                trainee: { include: { documents: true, consentRecords: true } },
                employer: true,
                documents: true,
                followups: true,
                verificationAttempts: true,
                anomalyFlags: true,
                outcomeReasons: true,
                skillRequirements: { include: { skill: true } },
                enrolment: { include: { batch: { include: { course: true, provider: true } } } },
            },
        });
        if (!outcome)
            throw new errors_1.NotFoundError('Outcome record not found');
        return this.parseOutcome(outcome);
    }
    static async verifyOutcome(id, verifierName, notes) {
        const outcome = await database_1.prisma.outcome.findUnique({
            where: { id },
            include: { trainee: { include: { documents: true } }, anomalyFlags: true },
        });
        if (!outcome)
            throw new errors_1.NotFoundError('Outcome record not found');
        const updatedOutcome = await database_1.prisma.outcome.update({
            where: { id },
            data: {
                isVerified: true,
                verifiedAt: new Date(),
                verifiedBy: verifierName,
                verificationLevel: 2,
                confidenceLabel: 'confirmed_trainee',
            },
        });
        const { score, breakdown } = trustScore_service_1.TrustScoreService.calculateTrustScore({ ...updatedOutcome, isVerified: true, source: 'employer_confirm' }, outcome.trainee.documents, outcome.anomalyFlags, []);
        const final = await database_1.prisma.outcome.update({
            where: { id },
            data: {
                trustScore: score,
                trustBreakdown: JSON.stringify(breakdown),
            },
            include: { trainee: true, employer: true },
        });
        await audit_service_1.AuditService.log({
            entityType: 'Outcome',
            entityId: id,
            action: 'OUTCOME_MANUAL_VERIFIED',
            performedBy: verifierName,
            changes: { newScore: score, notes },
        });
        return this.parseOutcome(final);
    }
    static async recalculateScore(id) {
        const outcome = await database_1.prisma.outcome.findUnique({
            where: { id },
            include: {
                trainee: { include: { documents: true } },
                anomalyFlags: true,
                verificationAttempts: true,
            },
        });
        if (!outcome)
            throw new errors_1.NotFoundError('Outcome not found');
        const prev = await database_1.prisma.outcome.findMany({
            where: { traineeId: outcome.traineeId, id: { not: outcome.id } },
            orderBy: { outcomeDate: 'desc' },
        });
        const { score, breakdown } = trustScore_service_1.TrustScoreService.calculateTrustScore(outcome, outcome.trainee.documents, outcome.anomalyFlags, prev);
        const updated = await database_1.prisma.outcome.update({
            where: { id },
            data: {
                trustScore: score,
                trustBreakdown: JSON.stringify(breakdown),
                confidenceLabel: trustScore_service_1.TrustScoreService.deriveConfidenceLabel(outcome.verificationAttempts, outcome),
            },
            include: { trainee: true, employer: true, anomalyFlags: true },
        });
        return this.parseOutcome(updated);
    }
    static parseOutcome(outcome) {
        let breakdown = [];
        try {
            if (outcome.trustBreakdown) {
                breakdown = JSON.parse(outcome.trustBreakdown);
            }
        }
        catch {
            breakdown = [];
        }
        return {
            ...outcome,
            trustBreakdown: breakdown,
        };
    }
}
exports.OutcomesService = OutcomesService;
