import crypto from 'crypto';

/**
 * Generates standard Skill Outcome ID: KSL-YYYY-XXXXX
 * Example: KSL-2026-48921
 */
export function generateSkillOutcomeId(year: number = new Date().getFullYear()): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `KSL-${year}-${randomNum}`;
}

/**
 * Generate standard Course code or Batch code
 */
export function generateCode(prefix: string): string {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * Generate 6-digit verification OTP
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate secure random token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
