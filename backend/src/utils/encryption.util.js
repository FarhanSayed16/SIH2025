/**
 * Phase 3.4.4: Encryption Utilities
 * Provides encryption/decryption for sensitive data
 */

import crypto from 'crypto';
import logger from '../config/logger.js';

// Encryption key from environment (should be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Get encryption key buffer
 */
const getKey = () => {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  if (key.length !== 32) {
    logger.error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    throw new Error('Invalid encryption key length');
  }
  return key;
};

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text (base64 encoded)
 */
export const encrypt = (text) => {
  try {
    if (!text) return text;
    
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine iv, tag, and encrypted data
    const result = Buffer.concat([
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ]).toString('base64');
    
    return result;
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted text (base64 encoded)
 * @returns {string} Decrypted plain text
 */
export const decrypt = (encryptedText) => {
  try {
    if (!encryptedText) return encryptedText;
    
    const key = getKey();
    const data = Buffer.from(encryptedText, 'base64');
    
    // Extract iv, tag, and encrypted data
    const iv = data.slice(0, IV_LENGTH);
    const tag = data.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = data.slice(IV_LENGTH + TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash sensitive data (one-way)
 * @param {string} text - Text to hash
 * @returns {string} Hashed text
 */
export const hash = (text) => {
  if (!text) return null;
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Hash with salt
 * @param {string} text - Text to hash
 * @param {string} salt - Salt (optional, generates if not provided)
 * @returns {Object} { hash, salt }
 */
export const hashWithSalt = (text, salt = null) => {
  if (!text) return null;
  
  const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.pbkdf2Sync(text, saltBuffer, 10000, 64, 'sha512');
  
  return {
    hash: hash.toString('hex'),
    salt: saltBuffer.toString('hex')
  };
};

/**
 * Verify hash with salt
 * @param {string} text - Plain text
 * @param {string} hash - Hashed text
 * @param {string} salt - Salt
 * @returns {boolean} True if matches
 */
export const verifyHash = (text, hash, salt) => {
  if (!text || !hash || !salt) return false;
  
  const saltBuffer = Buffer.from(salt, 'hex');
  const computedHash = crypto.pbkdf2Sync(text, saltBuffer, 10000, 64, 'sha512');
  
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), computedHash);
};

/**
 * Mask sensitive data (for logging)
 * @param {string} text - Text to mask
 * @param {number} visibleChars - Number of visible characters at start/end
 * @returns {string} Masked text
 */
export const maskSensitiveData = (text, visibleChars = 4) => {
  if (!text || text.length <= visibleChars * 2) {
    return '*'.repeat(text?.length || 0);
  }
  
  const start = text.substring(0, visibleChars);
  const end = text.substring(text.length - visibleChars);
  const middle = '*'.repeat(Math.max(4, text.length - visibleChars * 2));
  
  return `${start}${middle}${end}`;
};

export default {
  encrypt,
  decrypt,
  hash,
  hashWithSalt,
  verifyHash,
  maskSensitiveData
};

