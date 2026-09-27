import { prisma } from '../../config/database';
import { SkillGapService } from './skillGap.service';

export class AdvisoryReportService {
  /**
   * Generates a quarterly curriculum advisory report for a provider or all providers
   */
  static async generateQuarterlyReport(providerId?: string, period: string = '2026-Q3') {
    const gaps = await SkillGapService.computeSkillGaps();
    const providers = await prisma.trainingProvider.findMany({
      where: providerId ? { id: providerId } : undefined,
      include: {
        courses: true,
      },
    });

    const reportsCreated = [];

    for (const p of providers) {
      const providerCourseIds = p.courses.map((c) => c.id);
      const providerGaps = gaps.filter((g) => providerCourseIds.includes(g.courseId));

      const summary = {
        providerName: p.name,
        providerCode: p.code,
        period,
        totalCoursesEvaluated: providerGaps.length,
        curriculumGaps: providerGaps,
        recommendedActions: [
          'Integrate high-frequency demanded digital tools into course syllabi',
          'Coordinate with local industrial partners for guest lectures on emerging tooling',
          'Conduct refresher workshops on soft skills and interview readiness',
        ],
        generatedAt: new Date().toISOString(),
      };

      const report = await prisma.advisoryReport.create({
        data: {
          providerId: p.id,
          period,
          summary: JSON.stringify(summary),
          fileUrl: `/reports/advisory_${p.code}_${period}.pdf`,
          deliveredTo: JSON.stringify({ email: p.contactEmail, dispatched: true }),
        },
      });

      reportsCreated.push(report);
    }

    return reportsCreated;
  }
}
