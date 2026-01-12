/**
 * Phase 3.4.4: Enhanced Rate Limiter
 * Additional rate limiting with security monitoring
 */

import rateLimit from 'express-rate-limit';
import { monitorFailedAuthAttempts, monitorSuspiciousIP } from '../services/security-monitoring.service.js';
import { logSecurityEvent } from '../services/audit.service.js';
import logger from '../config/logger.js';

/**
 * Get client IP address
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.ip ||
         req.connection?.remoteAddress ||
         'unknown';
};

/**
 * Enhanced rate limiter with security monitoring
 */
export const createEnhancedRateLimiter = (options) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later.',
    enableSecurityMonitoring = true
  } = options;

  const limiter = rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIP,
    handler: async (req, res) => {
      const ipAddress = getClientIP(req);
      const userId = req.userId || req.user?._id;

      // Log security event
      if (enableSecurityMonitoring) {
        await logSecurityEvent(
          userId,
          req.user?.institutionId,
          'rate_limit_exceeded',
          'api',
          req,
          'medium',
          {
            ipAddress,
            endpoint: req.path,
            method: req.method,
            limit: max,
            window: `${windowMs / 1000}s`
          }
        );

        // Monitor suspicious IP
        await monitorSuspiciousIP(ipAddress).catch(err => {
          logger.error('Security monitoring error:', err);
        });
      }

      logger.warn(`Rate limit exceeded: IP ${ipAddress}, Endpoint: ${req.path}`);
      
      res.status(429).json({
        success: false,
        message
      });
    }
  });

  return limiter;
};

/**
 * Strict rate limiter for sensitive operations
 */
export const strictRateLimiter = createEnhancedRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many requests for this operation, please try again later.'
});

/**
 * GDPR request rate limiter
 */
export const gdprRateLimiter = createEnhancedRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many GDPR requests. Please try again later.'
});

/**
 * API rate limiter
 */
export const apiRateLimiter = createEnhancedRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests, please try again later.'
});

