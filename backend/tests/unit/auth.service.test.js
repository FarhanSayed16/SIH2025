import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyToken
} from '../../src/services/auth.service.js';

describe('Auth Service - Token Generation', () => {
  const testUserId = '507f1f77bcf86cd799439011';
  const testRole = 'student';
  const testSecret = 'test-secret-key';

  beforeEach(() => {
    process.env.JWT_SECRET = testSecret;
    process.env.JWT_EXPIRE = '15m';
    process.env.JWT_REFRESH_EXPIRE = '7d';
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = generateAccessToken(testUserId, testRole);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify token can be decoded
      const decoded = jwt.verify(token, testSecret);
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.role).toBe(testRole);
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateAccessToken(testUserId, testRole);
      const token2 = generateAccessToken('507f1f77bcf86cd799439012', testRole);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testUserId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify token can be decoded
      const decoded = jwt.verify(token, testSecret);
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.type).toBe('refresh');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(testUserId, testRole);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.role).toBe(testRole);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        verifyToken(invalidToken);
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', () => {
      // Generate token with 1ms expiry
      const expiredToken = jwt.sign(
        { userId: testUserId, role: testRole },
        testSecret,
        { expiresIn: '1ms' }
      );
      
      // Wait for token to expire
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(() => {
            verifyToken(expiredToken);
          }).toThrow('Invalid or expired token');
          resolve();
        }, 10);
      });
    });
  });
});

describe('Auth Service - Password Hashing', () => {
  describe('bcrypt password hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hashed = await bcrypt.hash(password, 10);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should compare password correctly', async () => {
      const password = 'testPassword123';
      const hashed = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hashed = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(wrongPassword, hashed);
      expect(isValid).toBe(false);
    });
  });
});

