import { prisma } from '../../config/database';
import { epfoMockConnector } from './connectors/epfo.mock.connector';
import { udyamMockConnector } from './connectors/udyam.mock.connector';
import { notificationService } from '../../services/notification.service';
import { TrustScoreService } from '../outcomes/trustScore.service';
import { decryptField } from '../../utils/crypto';
import { logger } from '../../utils/logger';

export class VerificationOrchestrator {
  /**
   * Run multi-level verification ladder for an outcome
   */
  static async runVerificationLadder(outcomeId: string): Promise<any> {
    const outcome = await prisma.outcome.findUnique({
      where: { id: outcomeId },
      include: {
        trainee: {
          include: { consentRecords: true, documents: true },
        },
        employer: true,
        verificationAttempts: true,
        anomalyFlags: true,
      },
    });

    if (!outcome) throw new Error('Outcome not found');

    const consentedPurposes = outcome.trainee.consentRecords
      .filter((c) => c.status === 'granted')
      .map((c) => c.consentType);

    // LEVEL 1: Ecosystem Signals (EPFO / Udyam)
    let level1Result = null;
    if (outcome.outcomeType === 'employed' || outcome.outcomeType === 'apprenticeship') {
      level1Result = await epfoMockConnector.check({
        traineeId: outcome.traineeId,
        skillOutcomeId: outcome.trainee.skillOutcomeId,
        name: outcome.trainee.name,
        outcomeType: outcome.outcomeType,
        employerName: outcome.employer?.name,
        consentedPurposes,
      });
    } else if (outcome.outcomeType === 'self_employed') {
      level1Result = await udyamMockConnector.check({
        traineeId: outcome.traineeId,
        skillOutcomeId: outcome.trainee.skillOutcomeId,
        name: outcome.trainee.name,
        outcomeType: outcome.outcomeType,
        consentedPurposes,
      });
    }

    if (level1Result) {
      await prisma.verificationAttempt.create({
        data: {
          outcomeId: outcome.id,
          level: 1,
          mechanism: level1Result.connectorName,
          result: level1Result.result,
          confidence: level1Result.confidence,
          detail: JSON.stringify(level1Result),
        },
      });

      if (level1Result.result === 'confirmed') {
        const updatedAttempts = await prisma.verificationAttempt.findMany({ where: { outcomeId: outcome.id } });
        const { score, breakdown } = TrustScoreService.calculateTrustScore(
          { ...outcome, isVerified: true, source: 'ecosystem_signal' },
          outcome.trainee.documents,
          outcome.anomalyFlags,
          []
        );

        return await prisma.outcome.update({
          where: { id: outcome.id },
          data: {
            verificationLevel: 1,
            isVerified: true,
            verifiedAt: new Date(),
            verifiedBy: level1Result.connectorName,
            confidenceLabel: TrustScoreService.deriveConfidenceLabel(updatedAttempts, outcome),
            trustScore: score,
            trustBreakdown: JSON.stringify(breakdown),
          },
        });
      }
    }

    // LEVEL 2 & 3: Direct Trainee verification outreach if Level 1 is inconclusive
    const rawPhone = decryptField(outcome.trainee.phonePrimary);
    if (rawPhone) {
      await notificationService.sendWhatsApp(
        rawPhone,
        `Namaste ${outcome.trainee.name}! Please confirm your recent placement details for Kaushal Sankalp verification: ${outcome.jobRole || 'Training Completion'}. Reply YES to confirm.`,
        'trainee_placement_verify'
      );

      await prisma.verificationAttempt.create({
        data: {
          outcomeId: outcome.id,
          level: 2,
          mechanism: 'WHATSAPP_ONE_TAP',
          result: 'pending',
          confidence: 0.8,
          detail: JSON.stringify({ recipient: rawPhone, dispatchedAt: new Date().toISOString() }),
        },
      });
    }

    // Recalculate score with current state
    const currentAttempts = await prisma.verificationAttempt.findMany({ where: { outcomeId: outcome.id } });
    const { score, breakdown } = TrustScoreService.calculateTrustScore(
      outcome,
      outcome.trainee.documents,
      outcome.anomalyFlags,
      []
    );

    return await prisma.outcome.update({
      where: { id: outcome.id },
      data: {
        verificationLevel: 2,
        confidenceLabel: TrustScoreService.deriveConfidenceLabel(currentAttempts, outcome),
        trustScore: score,
        trustBreakdown: JSON.stringify(breakdown),
      },
    });
  }
}
