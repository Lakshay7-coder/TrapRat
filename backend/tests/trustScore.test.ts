import { TrustScoreService } from '../src/modules/outcomes/trustScore.service';

export function runTrustScoreTests() {
  console.log('🧪 Running Trust Score Engine Unit Tests...');
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

  // Test 1: Base trainee self report (25 base + 15 recency <= 30d = 40)
  const t1 = TrustScoreService.calculateTrustScore({
    source: 'trainee_self_report',
    isVerified: false,
    updatedAt: new Date(),
  });
  assertEqual(t1.score, 40, 'Trainee self report with recent update should score 40');

  // Test 2: Employer verified bonus (40 base + 20 employer verified + 20 doc + 15 recency = 95)
  const t2 = TrustScoreService.calculateTrustScore(
    {
      source: 'employer_confirm',
      isVerified: true,
      updatedAt: new Date(),
    },
    [{ verificationStatus: 'verified' }, { verificationStatus: 'verified' }]
  );
  assertEqual(t2.score, 95, 'Employer verified with 2 verified docs and recency should score 95');

  // Test 3: Clamping to 100 maximum
  const t3 = TrustScoreService.calculateTrustScore(
    {
      source: 'employer_confirm',
      isVerified: true,
      updatedAt: new Date(),
      jobRole: 'Developer',
    },
    [
      { verificationStatus: 'verified' },
      { verificationStatus: 'verified' },
      { verificationStatus: 'verified' },
    ],
    [],
    [{ jobRole: 'Developer' }] // consistency +10
  );
  assertEqual(t3.score, 100, 'Score above 100 should be clamped to 100');

  // Test 4: Anomaly penalty (-15)
  const t4 = TrustScoreService.calculateTrustScore(
    {
      source: 'trainee_self_report',
      isVerified: false,
      updatedAt: new Date(),
    },
    [],
    [{ status: 'open' }]
  );
  assertEqual(t4.score, 25, 'Anomaly penalty should deduct 15 points (40 - 15 = 25)');

  // Test 5: Boundary test: recency > 180 days (0 bonus)
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 200);
  const t5 = TrustScoreService.calculateTrustScore({
    source: 'trainee_self_report',
    isVerified: false,
    updatedAt: pastDate,
  });
  assertEqual(t5.score, 25, 'Outcome updated > 180 days ago should get 0 recency bonus (25 total)');

  // Test 6: Boundary test: recency <= 90 days (+10 bonus)
  const date60 = new Date();
  date60.setDate(date60.getDate() - 60);
  const t6 = TrustScoreService.calculateTrustScore({
    source: 'document',
    isVerified: false,
    updatedAt: date60,
  });
  assertEqual(t6.score, 40, 'Document source (30) + 60 days recency (10) = 40');

  // Test 7: Clamping to 0 minimum
  const t7 = TrustScoreService.calculateTrustScore(
    {
      source: 'unknown',
      isVerified: false,
      updatedAt: pastDate,
    },
    [],
    [{ status: 'open' }, { status: 'open' }]
  );
  assertEqual(t7.score, 0, 'Negative score should be clamped to 0');

  // Test 8: Explainable breakdown structure
  const hasBreakdown = t2.breakdown.length >= 4 && t2.breakdown.some((b) => b.component === 'employer_verified_bonus');
  assertEqual(hasBreakdown, true, 'Trust breakdown should contain explicit components and points');

  console.log(`Trust Score Tests Result: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}
