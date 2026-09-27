"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().default('file:./dev.db'),
    JWT_SECRET: zod_1.z.string().default('kaushal_sankalp_jwt_access_secret_super_secure_32_chars!'),
    JWT_REFRESH_SECRET: zod_1.z.string().default('kaushal_sankalp_jwt_refresh_secret_secure_key_32c!'),
    JWT_ACCESS_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRY: zod_1.z.string().default('7d'),
    NODE_ENV: zod_1.z.string().default('development'),
    PORT: zod_1.z.coerce.number().default(3000),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:5173'),
    BACKEND_URL: zod_1.z.string().default('http://localhost:3000'),
    UPLOAD_DIR: zod_1.z.string().default('./uploads'),
    MAX_FILE_SIZE_MB: zod_1.z.coerce.number().default(10),
    FIELD_ENCRYPTION_KEY: zod_1.z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
    FIELD_HMAC_KEY: zod_1.z.string().default('abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'),
    IDENTITY_HMAC_SALT: zod_1.z.string().default('kaushal_identity_hmac_salt_2026_secure'),
    MOCK_NOTIFICATIONS: zod_1.z.coerce.boolean().default(true),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(900000),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(1000),
    AUTH_RATE_LIMIT_MAX: zod_1.z.coerce.number().default(50),
    ANOMALY_EMPLOYER_BULK_THRESHOLD: zod_1.z.coerce.number().default(20),
    ANOMALY_PLACEMENT_SPIKE_DAYS: zod_1.z.coerce.number().default(7),
    ANOMALY_RAPID_CONFIRM_MINUTES: zod_1.z.coerce.number().default(5),
    IDENTITY_AUTO_LINK_THRESHOLD: zod_1.z.coerce.number().default(0.90),
    IDENTITY_REVIEW_THRESHOLD: zod_1.z.coerce.number().default(0.65),
    ANALYTICS_MIN_CELL_SIZE: zod_1.z.coerce.number().default(10),
    FOLLOWUP_CADENCE: zod_1.z.string().default('30,90,180,365'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid environment configuration');
}
exports.env = parsed.data;
