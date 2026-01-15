import rateLimit from 'express-rate-limit';
import logger from '../config/logger.js';

/**
 * Key generator for rate limiting
 * Works properly with trust proxy setting
 */
const keyGenerator = (req) => {
  // Use X-Forwarded-For if available (when behind proxy), otherwise use req.ip
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
             req.headers['x-real-ip'] || 
             req.ip || 
             req.connection?.remoteAddress || 
             'unknown';
  return ip;
};

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator, // Use custom key generator for trust proxy
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${keyGenerator(req)}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.'
    });
  }
});

/**
 * Strict rate limiter for auth endpoints
 * More lenient in development, stricter in production
 */
const isDevelopment = process.env.NODE_ENV === 'development';
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 20 : 10, // More lenient in dev (20), stricter in prod (10)
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Only count failed attempts
  keyGenerator, // Use custom key generator for trust proxy
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${keyGenerator(req)}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.'
    });
  }
});

/**
 * Device registration rate limiter
 */
export const deviceRegistrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 device registrations per hour
  message: 'Too many device registration attempts, please try again later.',
  keyGenerator, // Use custom key generator for trust proxy
  handler: (req, res) => {
    logger.warn(`Device registration rate limit exceeded for IP: ${keyGenerator(req)}`);
    res.status(429).json({
      success: false,
      message: 'Too many device registration attempts, please try again later.'
    });
  }
});

