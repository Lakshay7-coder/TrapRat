import crypto from 'crypto';
import { env } from '../config/env';

// 32-byte key derived from config
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(env.FIELD_ENCRYPTION_KEY)
  .digest();

const HMAC_KEY = crypto
  .createHash('sha256')
  .update(env.FIELD_HMAC_KEY)
  .digest();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a plaintext string using AES-256-GCM
 */
export function encryptField(plainText: string): string {
  if (!plainText) return plainText;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM formatted string
 */
export function decryptField(cipherText: string): string {
  if (!cipherText || !cipherText.includes(':')) return cipherText;
  try {
    const [ivHex, authTagHex, encryptedData] = cipherText.split(':');
    if (!ivHex || !authTagHex || !encryptedData) return cipherText;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    // If not encrypted or decryption fails, return as-is
    return cipherText;
  }
}

/**
 * Deterministic HMAC for searchable encrypted fields
 */
export function hmacIndex(value: string): string {
  if (!value) return '';
  return crypto.createHmac('sha256', HMAC_KEY).update(value.trim().toLowerCase()).digest('hex');
}

/**
 * SHA-256 hash string (e.g. for files, tokens)
 */
export function sha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Mask phone number (e.g., 9876543210 -> 98******10)
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '******';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 6) return '******';
  return `${clean.slice(0, 2)}${'*'.repeat(Math.max(2, clean.length - 4))}${clean.slice(-2)}`;
}

/**
 * Mask email (e.g., john.doe@example.com -> j***e@example.com)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '****@****';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `*@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}
