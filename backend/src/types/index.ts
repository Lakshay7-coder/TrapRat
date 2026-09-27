export type Role =
  | 'admin'
  | 'provider_admin'
  | 'provider_staff'
  | 'employer'
  | 'field_officer'
  | 'trainee'
  | 'micro_verifier';

export type OutcomeType =
  | 'employed'
  | 'self_employed'
  | 'apprenticeship'
  | 'studying'
  | 'seeking_work'
  | 'not_available'
  | 'other';

export type ConsentType =
  | 'follow_up_contact'
  | 'employer_contact'
  | 'document_upload'
  | 'analytics'
  | 'job_sharing'
  | 'placement_tracking'
  | 'employment_tracking'
  | 'wage_tracking'
  | 'self_employment_tracking'
  | 'identity_linking'
  | 'incentive_communications';

export type ConsentStatus = 'granted' | 'withdrawn';
export type EnrolmentStatus = 'enrolled' | 'completed' | 'dropped_out' | 'transferred';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type DocType =
  | 'joining_letter'
  | 'payslip'
  | 'id_card'
  | 'business_photo'
  | 'invoice'
  | 'udyam_cert'
  | 'other';

export type OutcomeSource =
  | 'trainee_self_report'
  | 'employer_confirm'
  | 'document'
  | 'field_officer'
  | 'ecosystem_signal';

export type AnomalySeverity = 'low' | 'medium' | 'high';
export type AnomalyStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';
export type BatchStatus = 'planned' | 'ongoing' | 'completed';
export type FollowupStatus = 'pending' | 'completed' | 'skipped' | 'failed';
export type FollowupChannel = 'sms' | 'whatsapp' | 'ivr' | 'call' | 'field_visit';
export type ConfidenceLabel = 'verified_signal' | 'confirmed_trainee' | 'self_reported' | 'unconfirmed';

export interface TrustBreakdownItem {
  component: string;
  points: number;
  description?: string;
}

export interface CoverageObject {
  verifiedPct: number;
  confirmedPct: number;
  selfReportedPct: number;
  unconfirmedPct: number;
  followupCoveragePct: number;
}

export interface MetricWithCoverage<T = number> {
  value: T | null;
  coverage: CoverageObject;
  suppressed?: boolean;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  providerId?: string | null;
  traineeId?: string | null;
}
