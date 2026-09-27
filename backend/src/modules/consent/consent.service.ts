import { prisma } from '../../config/database';
import { AuditService } from '../../services/audit.service';

export class ConsentService {
  static async updateConsent(data: {
    traineeId: string;
    consentType: string;
    status: 'granted' | 'withdrawn';
    notes?: string;
  }) {
    const record = await prisma.consentRecord.create({
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
      await prisma.outcomeFollowup.updateMany({
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

    await AuditService.log({
      entityType: 'ConsentRecord',
      entityId: record.id,
      action: data.status === 'granted' ? 'CONSENT_GRANTED' : 'CONSENT_WITHDRAWN',
      changes: { traineeId: data.traineeId, consentType: data.consentType, status: data.status },
    });

    return record;
  }

  static async getActiveConsents(traineeId: string) {
    const records = await prisma.consentRecord.findMany({
      where: { traineeId },
      orderBy: { grantedAt: 'desc' },
    });

    // Get latest state per consentType
    const latestMap: Record<string, typeof records[0]> = {};
    for (const r of records) {
      if (!latestMap[r.consentType]) {
        latestMap[r.consentType] = r;
      }
    }

    return Object.values(latestMap);
  }

  static async getConsentHistory(traineeId: string) {
    return await prisma.consentRecord.findMany({
      where: { traineeId },
      orderBy: { grantedAt: 'desc' },
    });
  }
}
