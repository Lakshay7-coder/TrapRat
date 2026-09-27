"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnomaliesService = void 0;
const database_1 = require("../../config/database");
const errors_1 = require("../../utils/errors");
const audit_service_1 = require("../../services/audit.service");
const trustScore_service_1 = require("../outcomes/trustScore.service");
class AnomaliesService {
    static async listAnomalies(filters) {
        const flags = await database_1.prisma.anomalyFlag.findMany({
            where: {
                ...(filters.status ? { status: filters.status } : {}),
                ...(filters.severity ? { severity: filters.severity } : {}),
                ...(filters.ruleCode ? { ruleCode: filters.ruleCode } : {}),
            },
            include: {
                outcome: {
                    include: {
                        trainee: true,
                        employer: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return flags.map((f) => {
            let evidence = {};
            try {
                if (f.evidence)
                    evidence = JSON.parse(f.evidence);
            }
            catch {
                evidence = {};
            }
            return { ...f, evidence };
        });
    }
    static async getAnomalyById(id) {
        const flag = await database_1.prisma.anomalyFlag.findUnique({
            where: { id },
            include: {
                outcome: {
                    include: {
                        trainee: { include: { documents: true } },
                        employer: true,
                    },
                },
            },
        });
        if (!flag)
            throw new errors_1.NotFoundError('Anomaly flag not found');
        let evidence = {};
        try {
            if (flag.evidence)
                evidence = JSON.parse(flag.evidence);
        }
        catch {
            evidence = {};
        }
        return { ...flag, evidence };
    }
    static async reviewAnomaly(id, data) {
        const flag = await database_1.prisma.anomalyFlag.findUnique({
            where: { id },
            include: { outcome: { include: { trainee: { include: { documents: true } } } } },
        });
        if (!flag)
            throw new errors_1.NotFoundError('Anomaly flag not found');
        const updated = await database_1.prisma.anomalyFlag.update({
            where: { id },
            data: {
                status: data.status,
                reviewNote: data.reviewNote,
                reviewedBy: data.reviewedBy,
                resolvedAt: data.status === 'resolved' || data.status === 'dismissed' ? new Date() : null,
            },
        });
        // If flag is resolved/dismissed on an outcome, recalculate trust score without penalty
        if (flag.outcomeId && flag.outcome) {
            const allFlags = await database_1.prisma.anomalyFlag.findMany({
                where: { outcomeId: flag.outcomeId },
            });
            const { score, breakdown } = trustScore_service_1.TrustScoreService.calculateTrustScore(flag.outcome, flag.outcome.trainee.documents, allFlags, []);
            await database_1.prisma.outcome.update({
                where: { id: flag.outcomeId },
                data: {
                    trustScore: score,
                    trustBreakdown: JSON.stringify(breakdown),
                },
            });
        }
        await audit_service_1.AuditService.log({
            entityType: 'AnomalyFlag',
            entityId: id,
            action: `ANOMALY_${data.status.toUpperCase()}`,
            performedBy: data.reviewedBy,
            changes: { status: data.status, reviewNote: data.reviewNote },
        });
        return updated;
    }
}
exports.AnomaliesService = AnomaliesService;
