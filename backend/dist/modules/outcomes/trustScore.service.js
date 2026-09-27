"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustScoreService = void 0;
const trustScoreUtils_1 = require("../../utils/trustScoreUtils");
class TrustScoreService {
    /**
     * Calculates the Explainable Trust Score (0-100) and its component breakdown
     */
    static calculateTrustScore(outcome, documents = [], anomalyFlags = [], previousOutcomes = []) {
        let score = 0;
        const breakdown = [];
        // 1. BASE POINTS by outcome source
        const baseMap = {
            trainee_self_report: 25,
            employer_confirm: 40,
            document: 30,
            field_officer: 35,
            ecosystem_signal: 30,
        };
        const basePoints = baseMap[outcome.source] ?? 0;
        score += basePoints;
        breakdown.push({
            component: `${outcome.source}_base`,
            points: basePoints,
            description: `Base confidence points for ${outcome.source.replace('_', ' ')}`,
        });
        // 2. EMPLOYER VERIFICATION BONUS (+20)
        if (outcome.source === 'employer_confirm' && outcome.isVerified) {
            score += 20;
            breakdown.push({
                component: 'employer_verified_bonus',
                points: 20,
                description: 'Verified confirmation by registered employer',
            });
        }
        // 3. DOCUMENT BONUS (Max 20 pts: +10 per verified doc)
        const verifiedDocs = documents.filter((d) => d.verificationStatus === 'verified').length;
        const docBonus = Math.min(verifiedDocs * 10, 20);
        if (docBonus > 0) {
            score += docBonus;
            breakdown.push({
                component: 'verified_documents',
                points: docBonus,
                description: `${verifiedDocs} verified supporting document(s)`,
            });
        }
        // 4. RECENCY BONUS
        const dateToCheck = outcome.updatedAt || outcome.createdAt || new Date();
        const days = (0, trustScoreUtils_1.daysBetween)(new Date(), dateToCheck);
        if (days <= 30) {
            score += 15;
            breakdown.push({
                component: 'recency_30d',
                points: 15,
                description: 'Recent activity updated within 30 days',
            });
        }
        else if (days <= 90) {
            score += 10;
            breakdown.push({
                component: 'recency_90d',
                points: 10,
                description: 'Recent activity updated within 90 days',
            });
        }
        else if (days <= 180) {
            score += 5;
            breakdown.push({
                component: 'recency_180d',
                points: 5,
                description: 'Activity updated within 180 days',
            });
        }
        // 5. CONSISTENCY BONUS (+10)
        if (previousOutcomes.length > 0 && (0, trustScoreUtils_1.isConsistentWithHistory)(outcome, previousOutcomes)) {
            score += 10;
            breakdown.push({
                component: 'consistent_history',
                points: 10,
                description: 'Historical progression consistency verified',
            });
        }
        // 6. ANOMALY PENALTY (-15)
        const openFlags = anomalyFlags.filter((f) => f.status === 'open' || f.status === 'under_review');
        if (openFlags.length > 0) {
            score -= 15;
            breakdown.push({
                component: 'anomaly_penalty',
                points: -15,
                description: `${openFlags.length} active or unreviewed anomaly flag(s)`,
            });
        }
        // 7. CLAMP BETWEEN 0 AND 100
        const clampedScore = Math.max(0, Math.min(100, score));
        return {
            score: clampedScore,
            breakdown,
        };
    }
    /**
     * Derive Confidence Label based on verification attempts
     */
    static deriveConfidenceLabel(attempts = [], outcome) {
        if (attempts.some((a) => a.level === 1 && a.result === 'confirmed')) {
            return 'verified_signal';
        }
        if (attempts.some((a) => (a.level === 2 || a.level === 3) && a.result === 'confirmed')) {
            return 'confirmed_trainee';
        }
        if (outcome.source === 'trainee_self_report') {
            return 'self_reported';
        }
        return 'unconfirmed';
    }
}
exports.TrustScoreService = TrustScoreService;
