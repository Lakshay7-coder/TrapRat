import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface AnomalyEvaluationResult {
  ruleCode: string;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  entityType: string;
  entityId: string;
  outcomeId?: string;
  evidence: Record<string, any>;
}

export class AnomalyDetector {
  /**
   * Run all registered anomaly rules across recent data
   */
  static async runAllScans(): Promise<AnomalyEvaluationResult[]> {
    const flags: AnomalyEvaluationResult[] = [];

    try {
      flags.push(...(await this.checkMultiFulltime()));
      flags.push(...(await this.checkIdenticalBatchDetails()));
      flags.push(...(await this.checkImpossibleTimeline()));
      flags.push(...(await this.checkEmployerBulkConfirm()));
      flags.push(...(await this.checkDuplicateDocuments()));
    } catch (err) {
      logger.error('Error running anomaly scans', err);
    }

    // Persist new unique flags
    for (const flag of flags) {
      const existing = await prisma.anomalyFlag.findFirst({
        where: {
          ruleCode: flag.ruleCode,
          entityId: flag.entityId,
          status: { in: ['open', 'under_review'] },
        },
      });

      if (!existing) {
        await prisma.anomalyFlag.create({
          data: {
            ruleCode: flag.ruleCode,
            severity: flag.severity,
            status: 'open',
            reason: flag.reason,
            entityType: flag.entityType,
            entityId: flag.entityId,
            outcomeId: flag.outcomeId || null,
            evidence: JSON.stringify(flag.evidence),
            slaDeadline: new Date(Date.now() + 48 * 3600 * 1000), // 48h SLA
          },
        });
      }
    }

    return flags;
  }

  /**
   * Rule 1: Multi-Fulltime Outcomes
   */
  static async checkMultiFulltime(): Promise<AnomalyEvaluationResult[]> {
    const results: AnomalyEvaluationResult[] = [];
    const trainees = await prisma.trainee.findMany({
      include: {
        outcomes: {
          where: {
            outcomeType: 'employed',
            employmentType: 'full_time',
          },
        },
      },
    });

    for (const t of trainees) {
      if (t.outcomes.length >= 2) {
        results.push({
          ruleCode: 'multi_fulltime',
          severity: 'high',
          reason: `Trainee ${t.skillOutcomeId} has ${t.outcomes.length} concurrent active full-time placements`,
          entityType: 'trainee',
          entityId: t.id,
          outcomeId: t.outcomes[0]?.id,
          evidence: {
            skillOutcomeId: t.skillOutcomeId,
            outcomeCount: t.outcomes.length,
            outcomes: t.outcomes.map((o) => ({
              id: o.id,
              jobRole: o.jobRole,
              employerId: o.employerId,
              date: o.outcomeDate,
            })),
          },
        });
      }
    }
    return results;
  }

  /**
   * Rule 2: Identical Batch Placement Details (3+ same batch & same role & date)
   */
  static async checkIdenticalBatchDetails(): Promise<AnomalyEvaluationResult[]> {
    const results: AnomalyEvaluationResult[] = [];
    const enrolments = await prisma.enrolment.findMany({
      where: { outcomes: { some: {} } },
      include: { outcomes: true, batch: true },
    });

    const groupedByBatch: Record<string, any[]> = {};
    for (const e of enrolments) {
      for (const o of e.outcomes) {
        if (!groupedByBatch[e.batchId]) groupedByBatch[e.batchId] = [];
        groupedByBatch[e.batchId].push({ outcome: o, enrolment: e });
      }
    }

    for (const [batchId, items] of Object.entries(groupedByBatch)) {
      if (items.length >= 3) {
        const signatureMap: Record<string, any[]> = {};
        for (const item of items) {
          const sig = `${item.outcome.jobRole}_${item.outcome.wageBandLow}_${item.outcome.employerId}`;
          if (!signatureMap[sig]) signatureMap[sig] = [];
          signatureMap[sig].push(item);
        }

        for (const [sig, sigItems] of Object.entries(signatureMap)) {
          if (sigItems.length >= 3) {
            results.push({
              ruleCode: 'identical_batch_details',
              severity: 'high',
              reason: `${sigItems.length} trainees in batch share identical job role, employer, and wage band`,
              entityType: 'outcome',
              entityId: sigItems[0].outcome.id,
              outcomeId: sigItems[0].outcome.id,
              evidence: {
                batchId,
                identicalCount: sigItems.length,
                signature: sig,
                outcomeIds: sigItems.map((i) => i.outcome.id),
              },
            });
          }
        }
      }
    }
    return results;
  }

  /**
   * Rule 3: Impossible Timeline (outcome date before batch start or in future)
   */
  static async checkImpossibleTimeline(): Promise<AnomalyEvaluationResult[]> {
    const results: AnomalyEvaluationResult[] = [];
    const outcomes = await prisma.outcome.findMany({
      include: { enrolment: { include: { batch: true } } },
    });

    const now = new Date();
    for (const o of outcomes) {
      const outcomeDate = new Date(o.outcomeDate);
      if (outcomeDate > now) {
        results.push({
          ruleCode: 'impossible_timeline',
          severity: 'medium',
          reason: 'Outcome start date is set in the future',
          entityType: 'outcome',
          entityId: o.id,
          outcomeId: o.id,
          evidence: { outcomeDate: o.outcomeDate, currentDate: now.toISOString() },
        });
      } else if (o.enrolment?.batch?.startDate && outcomeDate < new Date(o.enrolment.batch.startDate)) {
        results.push({
          ruleCode: 'impossible_timeline',
          severity: 'medium',
          reason: 'Outcome date precedes course/batch start date',
          entityType: 'outcome',
          entityId: o.id,
          outcomeId: o.id,
          evidence: {
            outcomeDate: o.outcomeDate,
            batchStartDate: o.enrolment.batch.startDate,
          },
        });
      }
    }
    return results;
  }

  /**
   * Rule 4: Employer Bulk Confirm (> THRESHOLD in SPIKE_DAYS)
   */
  static async checkEmployerBulkConfirm(): Promise<AnomalyEvaluationResult[]> {
    const results: AnomalyEvaluationResult[] = [];
    const threshold = env.ANOMALY_EMPLOYER_BULK_THRESHOLD;
    const employers = await prisma.employer.findMany({
      include: {
        outcomes: {
          where: { isVerified: true },
        },
      },
    });

    for (const emp of employers) {
      if (emp.outcomes.length >= threshold) {
        results.push({
          ruleCode: 'employer_bulk_confirm',
          severity: 'high',
          reason: `Employer ${emp.name} confirmed ${emp.outcomes.length} trainees exceeding threshold of ${threshold}`,
          entityType: 'employer',
          entityId: emp.id,
          evidence: {
            employerName: emp.name,
            totalConfirmed: emp.outcomes.length,
            threshold,
          },
        });
      }
    }
    return results;
  }

  /**
   * Rule 5: Duplicate Document Hash across different trainees
   */
  static async checkDuplicateDocuments(): Promise<AnomalyEvaluationResult[]> {
    const results: AnomalyEvaluationResult[] = [];
    const docs = await prisma.document.findMany({
      where: { contentHash: { not: null } },
    });

    const hashMap: Record<string, typeof docs> = {};
    for (const doc of docs) {
      if (!doc.contentHash) continue;
      if (!hashMap[doc.contentHash]) hashMap[doc.contentHash] = [];
      hashMap[doc.contentHash].push(doc);
    }

    for (const [hash, docList] of Object.entries(hashMap)) {
      const distinctTrainees = new Set(docList.map((d) => d.traineeId));
      if (distinctTrainees.size > 1) {
        results.push({
          ruleCode: 'duplicate_document',
          severity: 'medium',
          reason: `Identical document content hash used across ${distinctTrainees.size} distinct trainees`,
          entityType: 'document',
          entityId: docList[0].id,
          outcomeId: docList[0].outcomeId || undefined,
          evidence: {
            contentHash: hash,
            traineeCount: distinctTrainees.size,
            documentIds: docList.map((d) => d.id),
          },
        });
      }
    }
    return results;
  }
}
