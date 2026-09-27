"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentService = void 0;
const database_1 = require("../../config/database");
const audit_service_1 = require("../../services/audit.service");
class ConsentService {
    static async updateConsent(data) {
        const record = await database_1.prisma.consentRecord.create({
            data: {
                traineeId: data.traineeId,
                consentType: data.consentType,
                status: data.status,
                grantedAt: new Date(),
                withdrawnAt: data.status === 'withdrawn' ? new Date() : null,
                notes: data.notes,
            },
        });
        // If withdrawn, immediately cancel scheduled pending follow-ups for this channel/purpose
        if (data.status === 'withdrawn' && data.consentType === 'follow_up_contact') {
            await database_1.prisma.outcomeFollowup.updateMany({
                where: {
                    traineeId: data.traineeId,
                    status: 'pending',
                },
                data: {
                    status: 'skipped',
                    notes: 'Cancelled due to immediate trainee consent withdrawal',
                },
            });
        }
        await audit_service_1.AuditService.log({
            entityType: 'ConsentRecord',
            entityId: record.id,
            action: data.status === 'granted' ? 'CONSENT_GRANTED' : 'CONSENT_WITHDRAWN',
            changes: { traineeId: data.traineeId, consentType: data.consentType, status: data.status },
        });
        return record;
    }
    static async getActiveConsents(traineeId) {
        const records = await database_1.prisma.consentRecord.findMany({
            where: { traineeId },
            orderBy: { grantedAt: 'desc' },
        });
        // Get latest state per consentType
        const latestMap = {};
        for (const r of records) {
            if (!latestMap[r.consentType]) {
                latestMap[r.consentType] = r;
            }
        }
        return Object.values(latestMap);
    }
    static async getConsentHistory(traineeId) {
        return await database_1.prisma.consentRecord.findMany({
            where: { traineeId },
            orderBy: { grantedAt: 'desc' },
        });
    }
}
exports.ConsentService = ConsentService;
