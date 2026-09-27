import { prisma } from '../../config/database';
import { env } from '../../config/env';

export class EquityService {
  /**
   * Calculates outcome rates segmented by demographics (gender, rural/urban, category, disability)
   * with small-cell suppression
   */
  static async getDemographicDisparities() {
    const minCellSize = env.ANALYTICS_MIN_CELL_SIZE;

    const trainees = await prisma.trainee.findMany({
      include: {
        outcomes: true,
      },
    });

    const calculateGroupMetrics = (keyFn: (t: any) => string) => {
      const groups: Record<string, { total: number; employed: number }> = {};

      for (const t of trainees) {
        const key = keyFn(t) || 'unspecified';
        if (!groups[key]) groups[key] = { total: 0, employed: 0 };
        groups[key].total++;
        if (t.outcomes.some((o) => o.outcomeType === 'employed' || o.outcomeType === 'self_employed')) {
          groups[key].employed++;
        }
      }

      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(groups)) {
        if (v.total < minCellSize) {
          result[k] = {
            sampleSize: v.total,
            placementRate: null,
            suppressed: true,
          };
        } else {
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
