"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptField = encryptField;
exports.decryptField = decryptField;
exports.hmacIndex = hmacIndex;
exports.sha256 = sha256;
exports.maskPhone = maskPhone;
exports.maskEmail = maskEmail;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
// 32-byte key derived from config
const ENCRYPTION_KEY = crypto_1.default
    .createHash('sha256')
    .update(env_1.env.FIELD_ENCRYPTION_KEY)
    .digest();
const HMAC_KEY = crypto_1.default
    .createHash('sha256')
    .update(env_1.env.FIELD_HMAC_KEY)
    .digest();
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
/**
 * Encrypt a plaintext string using AES-256-GCM
 */
function encryptField(plainText) {
    if (!plainText)
        return plainText;
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}
/**
 * Decrypt an AES-256-GCM formatted string
 */
function decryptField(cipherText) {
    if (!cipherText || !cipherText.includes(':'))
        return cipherText;
    try {
        const [ivHex, authTagHex, encryptedData] = cipherText.split(':');
        if (!ivHex || !authTagHex || !encryptedData)
            return cipherText;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch {
        // If not encrypted or decryption fails, return as-is
        return cipherText;
    }
}
/**
 * Deterministic HMAC for searchable encrypted fields
 */
function hmacIndex(value) {
    if (!value)
        return '';
    return crypto_1.default.createHmac('sha256', HMAC_KEY).update(value.trim().toLowerCase()).digest('hex');
}
/**
 * SHA-256 hash string (e.g. for files, tokens)
 */
function sha256(data) {
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
}
/**
 * Mask phone number (e.g., 9876543210 -> 98******10)
 */
function maskPhone(phone) {
    if (!phone || phone.length < 6)
        return '******';
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 6)
        return '******';
    return `${clean.slice(0, 2)}${'*'.repeat(Math.max(2, clean.length - 4))}${clean.slice(-2)}`;
}
/**
 * Mask email (e.g., john.doe@example.com -> j***e@example.com)
 */
function maskEmail(email) {
    if (!email || !email.includes('@'))
        return '****@****';
    const [local, domain] = email.split('@');
    if (local.length <= 2)
        return `*@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
}
