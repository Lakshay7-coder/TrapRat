import { ReasonClassifier } from '../src/modules/reasons/reasons.classifier';

export function runReasonsClassifierTests() {
  console.log('🧪 Running Reason Classifier Unit Tests...');
  let passed = 0;
  let failed = 0;

  function assertEqual(actual: any, expected: any, testName: string) {
    if (actual === expected) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} - Expected ${expected}, got ${actual}`);
      failed++;
    }
  }

  const r1 = ReasonClassifier.classify('non_placement', 'The company needed advanced Python and Power BI skills not in our course');
  assertEqual(r1.category, 'skill_mismatch', 'Identifies skill mismatch reason');
  assertEqual(r1.needsReview, false, 'High confidence does not require review');

  const r2 = ReasonClassifier.classify('non_placement', 'Salary offered was only 8000 which is too low for my expenses');
  assertEqual(r2.category, 'salary_expectations', 'Identifies salary expectation reason');

  const r3 = ReasonClassifier.classify('attrition', 'Got a better offer with 40% salary hike at another firm');
  assertEqual(r3.category, 'better_opportunity', 'Identifies better opportunity attrition reason');

  const r4 = ReasonClassifier.classify('attrition', 'Something completely random and unparsable abcxyz 123');
  assertEqual(r4.category, 'other', 'Falls back to other for ambiguous input');
  assertEqual(r4.needsReview, true, 'Ambiguous input flags needsReview = true');

  console.log(`Reason Classifier Tests Result: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}
