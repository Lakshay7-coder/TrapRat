export const REASONS_TAXONOMY = {
  version: '2.0',
  non_placement: [
    { code: 'skill_mismatch', label: 'Skill Mismatch', description: 'Curriculum did not cover requirements demanded by employers' },
    { code: 'lack_of_local_opportunities', label: 'Lack of Local Opportunities', description: 'No relevant jobs available in home district' },
    { code: 'salary_expectations', label: 'Salary Below Expectations', description: 'Offered wage was below acceptable threshold' },
    { code: 'location_constraints', label: 'Location / Mobility Constraints', description: 'Unable to relocate or commute to job site' },
    { code: 'interview_performance', label: 'Interview / Assessment Performance', description: 'Failed technical or soft-skills interview rounds' },
    { code: 'employer_rejection', label: 'Employer Hiring Freeze / Rejection', description: 'Company reduced hiring quota' },
    { code: 'lack_of_job_information', label: 'Lack of Job Information', description: 'Did not receive timely notifications of drives' },
    { code: 'other', label: 'Other Reasons', description: 'Miscellaneous personal or circumstantial reasons' },
  ],
  attrition: [
    { code: 'better_opportunity', label: 'Better Opportunity', description: 'Found higher paying or better aligned role' },
    { code: 'low_salary', label: 'Low Salary / Delayed Payment', description: 'Compensation insufficient or irregular' },
    { code: 'relocation', label: 'Relocation / Family Care', description: 'Moved due to marriage, family care, or domestic duties' },
    { code: 'workplace_conditions', label: 'Workplace Conditions / Culture', description: 'Unsafe, stressful, or unsupportive environment' },
    { code: 'skill_mismatch', label: 'Skill Gap on the Job', description: 'Struggled with actual workplace tasks' },
    { code: 'lack_of_career_growth', label: 'Lack of Career Progression', description: 'No clear path for promotion or raises' },
    { code: 'personal_reasons', label: 'Health / Personal Reasons', description: 'Personal illness or education resumption' },
    { code: 'other', label: 'Other Reasons', description: 'Other non-specified factors' },
  ],
};
