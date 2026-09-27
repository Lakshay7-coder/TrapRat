import { prisma } from '../../config/database';
import { env } from '../../config/env';

export class SkillGapService {
  /**
   * Computes curriculum skill gaps by comparing course skills with employer-demanded outcome skills
   */
  static async computeSkillGaps(courseId?: string) {
    const minCellSize = env.ANALYTICS_MIN_CELL_SIZE;

    const courses = await prisma.course.findMany({
      where: courseId ? { id: courseId } : undefined,
      include: {
        courseSkills: { include: { skill: true } },
        batches: {
          include: {
            enrolments: {
              include: {
                outcomes: {
                  include: {
                    skillRequirements: { include: { skill: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const results = [];

    for (const course of courses) {
      const taughtSkillNames = new Set(course.courseSkills.map((cs) => cs.skill.name.toLowerCase()));
      const demandedSkillCounts: Record<string, number> = {};
      let totalEmployedSample = 0;

      for (const batch of course.batches) {
        for (const enrolment of batch.enrolments) {
          for (const outcome of enrolment.outcomes) {
            if (outcome.outcomeType === 'employed' || outcome.outcomeType === 'self_employed') {
              totalEmployedSample++;
              for (const req of outcome.skillRequirements) {
                const sName = req.skill.name;
                demandedSkillCounts[sName] = (demandedSkillCounts[sName] || 0) + 1;
              }
            }
          }
        }
      }

      if (totalEmployedSample < minCellSize && totalEmployedSample > 0) {
        results.push({
          courseId: course.id,
          courseName: course.name,
          sampleSize: totalEmployedSample,
          suppressed: true,
          message: `Sample size (${totalEmployedSample}) below minimum threshold (${minCellSize}) for suppression protection`,
        });
        continue;
      }

      const missingSkills = [];
      for (const [skillName, count] of Object.entries(demandedSkillCounts)) {
        if (!taughtSkillNames.has(skillName.toLowerCase())) {
          const missingPct = Math.round((count / Math.max(1, totalEmployedSample)) * 100);
          missingSkills.push({
            skillName,
            demandedCount: count,
            missingPercentage: missingPct,
          });
        }
      }

      results.push({
        courseId: course.id,
        courseName: course.name,
        sampleSize: totalEmployedSample,
        suppressed: false,
        taughtSkills: course.courseSkills.map((cs) => cs.skill.name),
        missingSkills: missingSkills.sort((a, b) => b.missingPercentage - a.missingPercentage),
      });
    }

    return results;
  }
}
