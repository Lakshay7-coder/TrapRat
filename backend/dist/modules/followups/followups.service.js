"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowupsService = void 0;
const database_1 = require("../../config/database");
const errors_1 = require("../../utils/errors");
const notification_service_1 = require("../../services/notification.service");
const audit_service_1 = require("../../services/audit.service");
const trustScore_service_1 = require("../outcomes/trustScore.service");
class FollowupsService {
    static async scheduleFollowups(traineeId, outcomeId, startDate = new Date()) {
        const intervals = [30, 90, 180, 365];
        const created = [];
        for (const days of intervals) {
            const scheduledDate = new Date(startDate.getTime() + days * 24 * 3600 * 1000);
            try {
                const item = await database_1.prisma.outcomeFollowup.create({
                    data: {
                        traineeId,
                        outcomeId: outcomeId || null,
                        scheduledDate,
                        status: 'pending',
                        channel: days === 30 ? 'whatsapp' : 'sms',
                        notes: `Auto-scheduled +${days} days follow-up`,
                    },
                });
                created.push(item);
            }
            catch {
                // Ignore unique collision
            }
        }
        return created;
    }
    static async listFollowups(filters) {
        return await database_1.prisma.outcomeFollowup.findMany({
            where: {
                ...(filters.traineeId ? { traineeId: filters.traineeId } : {}),
                ...(filters.status ? { status: filters.status } : {}),
                ...(filters.channel ? { channel: filters.channel } : {}),
            },
            include: {
                trainee: true,
                outcome: true,
                notificationLogs: true,
            },
            orderBy: { scheduledDate: 'asc' },
        });
    }
    static async recordResponse(id, responseData, notes) {
        const followup = await database_1.prisma.outcomeFollowup.findUnique({
            where: { id },
            include: { trainee: { include: { documents: true } }, outcome: { include: { anomalyFlags: true } } },
        });
        if (!followup)
            throw new errors_1.NotFoundError('Follow-up record not found');
        const updated = await database_1.prisma.outcomeFollowup.update({
            where: { id },
            data: {
                actualDate: new Date(),
                status: 'completed',
                responseData: JSON.stringify(responseData),
                notes: notes || followup.notes,
            },
        });
        // If response indicates employment or update, update outcome & trust score
        if (followup.outcomeId && followup.outcome) {
            const { score, breakdown } = trustScore_service_1.TrustScoreService.calculateTrustScore({ ...followup.outcome, updatedAt: new Date() }, followup.trainee.documents, followup.outcome.anomalyFlags, []);
            await database_1.prisma.outcome.update({
                where: { id: followup.outcomeId },
                data: {
                    trustScore: score,
                    trustBreakdown: JSON.stringify(breakdown),
                    confidenceLabel: 'confirmed_trainee',
                },
            });
        }
        await audit_service_1.AuditService.log({
            entityType: 'OutcomeFollowup',
            entityId: id,
            action: 'FOLLOWUP_RESPONSE_RECORDED',
            changes: { responseData },
        });
        return updated;
    }
    /**
     * Process webhook / incoming notification responses
     */
    static async handleIncomingResponse(payload) {
        const botStep = await notification_service_1.notificationService.processWhatsAppResponse(payload.traineeId, payload.followupId, payload.messageText);
        if (botStep.status === 'completed') {
            await this.recordResponse(payload.followupId, botStep.data, 'Automated Bot Chat Completed');
        }
        return botStep;
    }
}
exports.FollowupsService = FollowupsService;
