"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSkillOutcomeId = generateSkillOutcomeId;
exports.generateCode = generateCode;
exports.generateOtp = generateOtp;
exports.generateToken = generateToken;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates standard Skill Outcome ID: KSL-YYYY-XXXXX
 * Example: KSL-2026-48921
 */
function generateSkillOutcomeId(year = new Date().getFullYear()) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `KSL-${year}-${randomNum}`;
}
/**
 * Generate standard Course code or Batch code
 */
function generateCode(prefix) {
    const random = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${random}`;
}
/**
 * Generate 6-digit verification OTP
 */
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/**
 * Generate secure random token
 */
function generateToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
