"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustedScoreService = void 0;
const database_1 = require("../../config/database");
class AdjustedScoreService {
    /**
     * Computes context-adjusted provider scorecard
     * (raw placement vs expected placement given district difficulty & baseline demographics)
     */
    static async computeProviderScorecard(providerId) {
        const provider = await database_1.prisma.trainingProvider.findUnique({
            where: { id: providerId },
            include: {
                batches: {
                    include: {
                        enrolments: {
                            include: {
                                trainee: true,
                                outcomes: true,
                            },
                        },
                    },
                },
            },
        });
        if (!provider)
            return null;
        let totalEnrolled = 0;
        let totalCompleted = 0;
        let totalPlaced = 0;
        let totalVerified = 0;
        let totalRural = 0;
        let totalFemale = 0;
        for (const batch of provider.batches) {
            for (const enr of batch.enrolments) {
                totalEnrolled++;
                if (enr.status === 'completed')
                    totalCompleted++;
                if (enr.trainee.ruralUrban === 'rural')
                    totalRural++;
                if (enr.trainee.gender === 'female')
                    totalFemale++;
                const activeOutcome = enr.outcomes[0];
                if (activeOutcome && (activeOutcome.outcomeType === 'employed' || activeOutcome.outcomeType === 'self_employed')) {
                    totalPlaced++;
                    if (activeOutcome.isVerified)
                        totalVerified++;
                }
            }
        }
        const completionRate = totalEnrolled > 0 ? (totalCompleted / totalEnrolled) * 100 : 0;
        const rawPlacementRate = totalCompleted > 0 ? (totalPlaced / totalCompleted) * 100 : 0;
        const verificationRate = totalPlaced > 0 ? (totalVerified / totalPlaced) * 100 : 0;
        // District and demographic challenge penalty/credit adjustment
        const ruralRatio = totalEnrolled > 0 ? totalRural / totalEnrolled : 0;
        const femaleRatio = totalEnrolled > 0 ? totalFemale / totalEnrolled : 0;
        // Expected baseline for this demographic mix (e.g. baseline 65% with difficulty modifier)
        const expectedPlacementRate = 65.0 - (ruralRatio * 5.0) - (femaleRatio * 3.0);
        const adjustmentDelta = rawPlacementRate - expectedPlacementRate;
        const adjustedScore = Math.max(0, Math.min(100, Math.round(75 + adjustmentDelta)));
        return {
            providerId: provider.id,
            providerName: provider.name,
            district: provider.district,
            state: provider.state,
            totalEnrolled,
            totalCompleted,
            totalPlaced,
            completionRate: parseFloat(completionRate.toFixed(1)),
            rawPlacementRate: parseFloat(rawPlacementRate.toFixed(1)),
            expectedPlacementRate: parseFloat(expectedPlacementRate.toFixed(1)),
            adjustedScore,
            verificationRate: parseFloat(verificationRate.toFixed(1)),
            isProvisional: totalEnrolled < 15,
            demographicWeights: {
                ruralPercentage: Math.round(ruralRatio * 100),
                femalePercentage: Math.round(femaleRatio * 100),
            },
        };
    }
}
exports.AdjustedScoreService = AdjustedScoreService;
