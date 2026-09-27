"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationOrchestrator = void 0;
const database_1 = require("../../config/database");
const epfo_mock_connector_1 = require("./connectors/epfo.mock.connector");
const udyam_mock_connector_1 = require("./connectors/udyam.mock.connector");
const notification_service_1 = require("../../services/notification.service");
const trustScore_service_1 = require("../outcomes/trustScore.service");
const crypto_1 = require("../../utils/crypto");
class VerificationOrchestrator {
    /**
     * Run multi-level verification ladder for an outcome
     */
    static async runVerificationLadder(outcomeId) {
        const outcome = await database_1.prisma.outcome.findUnique({
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
        if (!outcome)
            throw new Error('Outcome not found');
        const consentedPurposes = outcome.trainee.consentRecords
            .filter((c) => c.status === 'granted')
            .map((c) => c.consentType);
        // LEVEL 1: Ecosystem Signals (EPFO / Udyam)
        let level1Result = null;
        if (outcome.outcomeType === 'employed' || outcome.outcomeType === 'apprenticeship') {
            level1Result = await epfo_mock_connector_1.epfoMockConnector.check({
                traineeId: outcome.traineeId,
                skillOutcomeId: outcome.trainee.skillOutcomeId,
                name: outcome.trainee.name,
                outcomeType: outcome.outcomeType,
                employerName: outcome.employer?.name,
                consentedPurposes,
            });
        }
        else if (outcome.outcomeType === 'self_employed') {
            level1Result = await udyam_mock_connector_1.udyamMockConnector.check({
                traineeId: outcome.traineeId,
                skillOutcomeId: outcome.trainee.skillOutcomeId,
                name: outcome.trainee.name,
                outcomeType: outcome.outcomeType,
                consentedPurposes,
            });
        }
        if (level1Result) {
            await database_1.prisma.verificationAttempt.create({
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
                const updatedAttempts = await database_1.prisma.verificationAttempt.findMany({ where: { outcomeId: outcome.id } });
                const { score, breakdown } = trustScore_service_1.TrustScoreService.calculateTrustScore({ ...outcome, isVerified: true, source: 'ecosystem_signal' }, outcome.trainee.documents, outcome.anomalyFlags, []);
                return await database_1.prisma.outcome.update({
                    where: { id: outcome.id },
                    data: {
                        verificationLevel: 1,
                        isVerified: true,
                        verifiedAt: new Date(),
                        verifiedBy: level1Result.connectorName,
                        confidenceLabel: trustScore_service_1.TrustScoreService.deriveConfidenceLabel(updatedAttempts, outcome),
                        trustScore: score,
                        trustBreakdown: JSON.stringify(breakdown),
                    },
                });
            }
        }
        // LEVEL 2 & 3: Direct Trainee verification outreach if Level 1 is inconclusive
        const rawPhone = (0, crypto_1.decryptField)(outcome.trainee.phonePrimary);
        if (rawPhone) {
            await notification_service_1.notificationService.sendWhatsApp(rawPhone, `Namaste ${outcome.trainee.name}! Please confirm your recent placement details for Kaushal Sankalp verification: ${outcome.jobRole || 'Training Completion'}. Reply YES to confirm.`, 'trainee_placement_verify');
            await database_1.prisma.verificationAttempt.create({
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
        const currentAttempts = await database_1.prisma.verificationAttempt.findMany({ where: { outcomeId: outcome.id } });
        const { score, breakdown } = trustScore_service_1.TrustScoreService.calculateTrustScore(outcome, outcome.trainee.documents, outcome.anomalyFlags, []);
        return await database_1.prisma.outcome.update({
            where: { id: outcome.id },
            data: {
                verificationLevel: 2,
                confidenceLabel: trustScore_service_1.TrustScoreService.deriveConfidenceLabel(currentAttempts, outcome),
                trustScore: score,
                trustBreakdown: JSON.stringify(breakdown),
            },
        });
    }
}
exports.VerificationOrchestrator = VerificationOrchestrator;
