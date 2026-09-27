import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { notificationService } from '../../services/notification.service';
import { AuditService } from '../../services/audit.service';
import { TrustScoreService } from '../outcomes/trustScore.service';

export class FollowupsService {
  static async scheduleFollowups(traineeId: string, outcomeId?: string, startDate: Date = new Date()) {
    const intervals = [30, 90, 180, 365];
    const created = [];

    for (const days of intervals) {
      const scheduledDate = new Date(startDate.getTime() + days * 24 * 3600 * 1000);
      try {
        const item = await prisma.outcomeFollowup.create({
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
      } catch {
        // Ignore unique collision
      }
    }
    return created;
  }

  static async listFollowups(filters: {
    traineeId?: string;
    status?: string;
    channel?: string;
  }) {
    return await prisma.outcomeFollowup.findMany({
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

  static async recordResponse(id: string, responseData: any, notes?: string) {
    const followup = await prisma.outcomeFollowup.findUnique({
      where: { id },
      include: { trainee: { include: { documents: true } }, outcome: { include: { anomalyFlags: true } } },
    });
    if (!followup) throw new NotFoundError('Follow-up record not found');

    const updated = await prisma.outcomeFollowup.update({
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
      const { score, breakdown } = TrustScoreService.calculateTrustScore(
        { ...followup.outcome, updatedAt: new Date() },
        followup.trainee.documents,
        followup.outcome.anomalyFlags,
        []
      );

      await prisma.outcome.update({
        where: { id: followup.outcomeId },
        data: {
          trustScore: score,
          trustBreakdown: JSON.stringify(breakdown),
          confidenceLabel: 'confirmed_trainee',
        },
      });
    }

    await AuditService.log({
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
  static async handleIncomingResponse(payload: {
    traineeId: string;
    followupId: string;
    messageText: string;
  }) {
    const botStep = await notificationService.processWhatsAppResponse(
      payload.traineeId,
      payload.followupId,
      payload.messageText
    );

    if (botStep.status === 'completed') {
      await this.recordResponse(payload.followupId, botStep.data, 'Automated Bot Chat Completed');
    }

    return botStep;
  }
}
