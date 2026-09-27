import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().default('kaushal_sankalp_jwt_access_secret_super_secure_32_chars!'),
  JWT_REFRESH_SECRET: z.string().default('kaushal_sankalp_jwt_refresh_secret_secure_key_32c!'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  BACKEND_URL: z.string().default('http://localhost:3000'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  FIELD_ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  FIELD_HMAC_KEY: z.string().default('abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'),
  IDENTITY_HMAC_SALT: z.string().default('kaushal_identity_hmac_salt_2026_secure'),
  MOCK_NOTIFICATIONS: z.coerce.boolean().default(true),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(50),
  ANOMALY_EMPLOYER_BULK_THRESHOLD: z.coerce.number().default(20),
  ANOMALY_PLACEMENT_SPIKE_DAYS: z.coerce.number().default(7),
  ANOMALY_RAPID_CONFIRM_MINUTES: z.coerce.number().default(5),
  IDENTITY_AUTO_LINK_THRESHOLD: z.coerce.number().default(0.90),
  IDENTITY_REVIEW_THRESHOLD: z.coerce.number().default(0.65),
  ANALYTICS_MIN_CELL_SIZE: z.coerce.number().default(10),
  FOLLOWUP_CADENCE: z.string().default('30,90,180,365'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
