export interface ClassificationResult {
  category: string;
  confidence: number;
  needsReview: boolean;
}

export class ReasonClassifier {
  /**
   * Classify free-text explanation into standard reason category
   */
  static classify(kind: 'non_placement' | 'attrition', rawText: string): ClassificationResult {
    if (!rawText || rawText.trim().length === 0) {
      return { category: 'other', confidence: 0.1, needsReview: true };
    }

    const text = rawText.toLowerCase();

    if (kind === 'non_placement') {
      if (text.includes('skill') || text.includes('knowledge') || text.includes('coding') || text.includes('training') || text.includes('hard')) {
        return { category: 'skill_mismatch', confidence: 0.88, needsReview: false };
      }
      if (text.includes('salary') || text.includes('pay') || text.includes('money') || text.includes('stipend') || text.includes('less')) {
        return { category: 'salary_expectations', confidence: 0.92, needsReview: false };
      }
      if (text.includes('location') || text.includes('far') || text.includes('travel') || text.includes('city') || text.includes('commute')) {
        return { category: 'location_constraints', confidence: 0.9, needsReview: false };
      }
      if (text.includes('no job') || text.includes('local') || text.includes('village') || text.includes('district') || text.includes('opening')) {
        return { category: 'lack_of_local_opportunities', confidence: 0.85, needsReview: false };
      }
      if (text.includes('interview') || text.includes('test') || text.includes('failed') || text.includes('rejected')) {
        return { category: 'interview_performance', confidence: 0.86, needsReview: false };
      }
    } else {
      // attrition
      if (text.includes('better') || text.includes('higher') || text.includes('offer') || text.includes('new company')) {
        return { category: 'better_opportunity', confidence: 0.93, needsReview: false };
      }
      if (text.includes('low') || text.includes('salary') || text.includes('pay') || text.includes('delayed') || text.includes('bonus')) {
        return { category: 'low_salary', confidence: 0.91, needsReview: false };
      }
      if (text.includes('marriage') || text.includes('family') || text.includes('relocate') || text.includes('shifted') || text.includes('home')) {
        return { category: 'relocation', confidence: 0.89, needsReview: false };
      }
      if (text.includes('toxic') || text.includes('boss') || text.includes('hours') || text.includes('stress') || text.includes('overtime')) {
        return { category: 'workplace_conditions', confidence: 0.87, needsReview: false };
      }
      if (text.includes('growth') || text.includes('promotion') || text.includes('future') || text.includes('stuck')) {
        return { category: 'lack_of_career_growth', confidence: 0.84, needsReview: false };
      }
    }

    // Fallback: low confidence -> requires human review
    return { category: 'other', confidence: 0.45, needsReview: true };
  }
}
