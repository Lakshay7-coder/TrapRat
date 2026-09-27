import { SignalConnector, SignalCheckInput, SignalCheckResult } from './connector.interface';

export class EpfoMockConnector implements SignalConnector {
  name = 'EPFO_SIGNAL_CONNECTOR';

  async check(input: SignalCheckInput): Promise<SignalCheckResult> {
    // Check consent
    if (!input.consentedPurposes.includes('employment_tracking') && !input.consentedPurposes.includes('placement_tracking')) {
      return {
        connectorName: this.name,
        result: 'inconclusive',
        confidence: 0,
        notice: 'Trainee consent not granted for employment tracking',
      };
    }

    // Mock EPFO check
    if (input.outcomeType === 'employed' || input.outcomeType === 'apprenticeship') {
      return {
        connectorName: this.name,
        result: 'confirmed',
        confidence: 0.95,
        evidence: {
          mockEcrMemberId: `MH/BAN/${Math.floor(1000000 + Math.random() * 9000000)}/0001`,
          activeWageMonth: '2026-08',
          establishmentName: input.employerName || 'Sample Registered Entity',
          verifiedAt: new Date().toISOString(),
        },
        notice: 'Prototype Mock: Live EPFO access requires formal government data-sharing agreement.',
      };
    }

    return {
      connectorName: this.name,
      result: 'inconclusive',
      confidence: 0.2,
      notice: 'No active ECR entry detected for non-salaried outcome.',
    };
  }
}

export const epfoMockConnector = new EpfoMockConnector();
