import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { AuditService } from '../../services/audit.service';
import { TrustScoreService } from '../outcomes/trustScore.service';

export class AnomaliesService {
  static async listAnomalies(filters: {
    status?: string;
    severity?: string;
    ruleCode?: string;
  }) {
    const flags = await prisma.anomalyFlag.findMany({
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
        if (f.evidence) evidence = JSON.parse(f.evidence);
      } catch {
        evidence = {};
      }
      return { ...f, evidence };
    });
  }

  static async getAnomalyById(id: string) {
    const flag = await prisma.anomalyFlag.findUnique({
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
    if (!flag) throw new NotFoundError('Anomaly flag not found');

    let evidence = {};
    try {
      if (flag.evidence) evidence = JSON.parse(flag.evidence);
    } catch {
      evidence = {};
    }

    return { ...flag, evidence };
  }

  static async reviewAnomaly(id: string, data: {
    status: 'under_review' | 'resolved' | 'dismissed';
    reviewNote?: string;
    reviewedBy: string;
  }) {
    const flag = await prisma.anomalyFlag.findUnique({
      where: { id },
      include: { outcome: { include: { trainee: { include: { documents: true } } } } },
    });
    if (!flag) throw new NotFoundError('Anomaly flag not found');

    const updated = await prisma.anomalyFlag.update({
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
      const allFlags = await prisma.anomalyFlag.findMany({
        where: { outcomeId: flag.outcomeId },
      });

      const { score, breakdown } = TrustScoreService.calculateTrustScore(
        flag.outcome,
        flag.outcome.trainee.documents,
        allFlags,
        []
      );

      await prisma.outcome.update({
        where: { id: flag.outcomeId },
        data: {
          trustScore: score,
          trustBreakdown: JSON.stringify(breakdown),
        },
      });
    }

    await AuditService.log({
      entityType: 'AnomalyFlag',
      entityId: id,
      action: `ANOMALY_${data.status.toUpperCase()}`,
      performedBy: data.reviewedBy,
      changes: { status: data.status, reviewNote: data.reviewNote },
    });

    return updated;
  }
}
