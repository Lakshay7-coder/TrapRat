"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquityService = void 0;
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
class EquityService {
    /**
     * Calculates outcome rates segmented by demographics (gender, rural/urban, category, disability)
     * with small-cell suppression
     */
    static async getDemographicDisparities() {
        const minCellSize = env_1.env.ANALYTICS_MIN_CELL_SIZE;
        const trainees = await database_1.prisma.trainee.findMany({
            include: {
                outcomes: true,
            },
        });
        const calculateGroupMetrics = (keyFn) => {
            const groups = {};
            for (const t of trainees) {
                const key = keyFn(t) || 'unspecified';
                if (!groups[key])
                    groups[key] = { total: 0, employed: 0 };
                groups[key].total++;
                if (t.outcomes.some((o) => o.outcomeType === 'employed' || o.outcomeType === 'self_employed')) {
                    groups[key].employed++;
                }
            }
            const result = {};
            for (const [k, v] of Object.entries(groups)) {
                if (v.total < minCellSize) {
                    result[k] = {
                        sampleSize: v.total,
                        placementRate: null,
                        suppressed: true,
                    };
                }
                else {
                    result[k] = {
                        sampleSize: v.total,
                        placementRate: parseFloat(((v.employed / v.total) * 100).toFixed(1)),
                        suppressed: false,
                    };
                }
            }
            return result;
        };
        return {
            byGender: calculateGroupMetrics((t) => t.gender),
            byLocation: calculateGroupMetrics((t) => t.ruralUrban || 'rural'),
            byCategory: calculateGroupMetrics((t) => t.category || 'General'),
            byDisability: calculateGroupMetrics((t) => (t.disability ? 'pwd' : 'non_pwd')),
        };
    }
}
exports.EquityService = EquityService;
