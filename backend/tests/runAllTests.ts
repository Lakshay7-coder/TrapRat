import { runTrustScoreTests } from './trustScore.test';
import { runReasonsClassifierTests } from './reasonsClassifier.test';

async function main() {
  console.log('=============================================');
  console.log('🚀 Kaushal Sankalp Backend Test Suite');
  console.log('=============================================\n');

  const tScoreOk = runTrustScoreTests();
  const reasonsOk = runReasonsClassifierTests();

  if (tScoreOk && reasonsOk) {
    console.log('🎉 ALL BACKEND UNIT TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

main();
