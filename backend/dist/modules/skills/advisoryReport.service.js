"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvisoryReportService = void 0;
const database_1 = require("../../config/database");
const skillGap_service_1 = require("./skillGap.service");
class AdvisoryReportService {
    /**
     * Generates a quarterly curriculum advisory report for a provider or all providers
     */
    static async generateQuarterlyReport(providerId, period = '2026-Q3') {
        const gaps = await skillGap_service_1.SkillGapService.computeSkillGaps();
        const providers = await database_1.prisma.trainingProvider.findMany({
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
            const report = await database_1.prisma.advisoryReport.create({
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
exports.AdvisoryReportService = AdvisoryReportService;
