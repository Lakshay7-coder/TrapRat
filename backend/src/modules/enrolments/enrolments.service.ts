import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { generateCode } from '../../utils/idGenerator';
import { AuditService } from '../../services/audit.service';
import { VerificationOrchestrator } from '../verification/verification.orchestrator';

export class EnrolmentsService {
  static async enrolTrainee(data: {
    traineeId: string;
    batchId: string;
    enrolmentDate?: Date | string;
    attendancePercent?: number;
    assessmentScore?: number;
  }) {
    const enrolment = await prisma.enrolment.create({
      data: {
        traineeId: data.traineeId,
        batchId: data.batchId,
        enrolmentDate: data.enrolmentDate ? new Date(data.enrolmentDate) : new Date(),
        status: 'enrolled',
        attendancePercent: data.attendancePercent ?? 85.0,
        assessmentScore: data.assessmentScore ?? 75.0,
      },
      include: { trainee: true, batch: { include: { course: true, provider: true } } },
    });

    await AuditService.log({
      entityType: 'Enrolment',
      entityId: enrolment.id,
      action: 'TRAINEE_ENROLLED',
      changes: { traineeId: data.traineeId, batchId: data.batchId },
    });

    return enrolment;
  }

  static async listEnrolments(filters: {
    batchId?: string;
    traineeId?: string;
    status?: string;
    providerId?: string;
  }) {
    return await prisma.enrolment.findMany({
      where: {
        ...(filters.batchId ? { batchId: filters.batchId } : {}),
        ...(filters.traineeId ? { traineeId: filters.traineeId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.providerId ? { batch: { providerId: filters.providerId } } : {}),
      },
      include: {
        trainee: true,
        batch: { include: { course: true, provider: true } },
        outcomes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async completeEnrolment(id: string, data: {
    certificateNumber?: string;
    attendancePercent?: number;
    assessmentScore?: number;
    outcomeType?: string;
    jobRole?: string;
    employerId?: string;
  }) {
    const enrolment = await prisma.enrolment.findUnique({
      where: { id },
      include: { trainee: true, batch: { include: { course: true } } },
    });
    if (!enrolment) throw new NotFoundError('Enrolment not found');

    const certNum = data.certificateNumber || generateCode('CERT');
    const now = new Date();

    // 1. Update enrolment to completed
    const updatedEnrolment = await prisma.enrolment.update({
      where: { id },
      data: {
        status: 'completed',
        certificateNumber: certNum,
        certificateIssuedDate: now,
        attendancePercent: data.attendancePercent ?? enrolment.attendancePercent,
        assessmentScore: data.assessmentScore ?? enrolment.assessmentScore,
      },
    });

    // 2. Create Initial Outcome record
    const outcome = await prisma.outcome.create({
      data: {
        traineeId: enrolment.traineeId,
        enrolmentId: enrolment.id,
        outcomeType: data.outcomeType || 'employed',
        outcomeDate: now,
        jobRole: data.jobRole || `${enrolment.batch.course.name} Associate`,
        employerId: data.employerId || null,
        source: 'trainee_self_report',
        trustScore: 35,
        confidenceLabel: 'self_reported',
        employmentType: 'full_time',
      },
    });

    // 3. Schedule 30 / 90 / 180 / 365 days follow-ups
    const followUpDays = [30, 90, 180, 365];
    for (const days of followUpDays) {
      const scheduledDate = new Date(now.getTime() + days * 24 * 3600 * 1000);
      try {
        await prisma.outcomeFollowup.create({
          data: {
            traineeId: enrolment.traineeId,
            outcomeId: outcome.id,
            scheduledDate,
            status: 'pending',
            channel: days === 30 ? 'whatsapp' : 'sms',
            notes: `Automated follow-up at +${days} days post certification`,
          },
        });
      } catch {
        // Ignore unique collision
      }
    }

    // 4. Trigger signal-first verification check
    try {
      await VerificationOrchestrator.runVerificationLadder(outcome.id);
    } catch {
      // Async non-blocking
    }

    // 5. Audit Log
    await AuditService.log({
      entityType: 'Enrolment',
      entityId: id,
      action: 'ENROLMENT_COMPLETED',
      changes: {
        certificateNumber: certNum,
        outcomeId: outcome.id,
        scheduledFollowups: followUpDays,
      },
    });

    return {
      enrolment: updatedEnrolment,
      initialOutcome: outcome,
      message: 'Enrolment completed and 30/90/180/365 follow-ups scheduled',
    };
  }

  static async bulkImport(enrolmentsData: any[]) {
    const results = [];
    for (const item of enrolmentsData) {
      try {
        const res = await this.enrolTrainee(item);
        results.push({ success: true, id: res.id, traineeId: item.traineeId });
      } catch (err: any) {
        results.push({ success: false, error: err.message, traineeId: item.traineeId });
      }
    }
    return results;
  }
}
