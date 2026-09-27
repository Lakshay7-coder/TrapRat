export interface SignalCheckInput {
  traineeId: string;
  skillOutcomeId: string;
  name: string;
  outcomeType: string;
  employerName?: string;
  consentedPurposes: string[];
}

export interface SignalCheckResult {
  connectorName: string;
  result: 'confirmed' | 'contradicted' | 'inconclusive';
  confidence: number; // 0.0 - 1.0
  evidence?: Record<string, any>;
  notice: string;
}

export interface SignalConnector {
  name: string;
  check(input: SignalCheckInput): Promise<SignalCheckResult>;
}
