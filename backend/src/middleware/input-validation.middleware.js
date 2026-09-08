/**
 * Phase 3.4.4: Enhanced Input Validation Middleware
 * Hardened input validation and sanitization
 */

import { body, param, query, validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Sanitize string input (remove dangerous characters)
 */
export const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  
  // Remove null bytes, control characters
  return value
    .split('').filter(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127).join('')
    .trim();
};

/**
 * Validate and sanitize MongoDB ObjectId
 */
export const validateObjectId = (field = 'id') => {
  return [
    param(field).isMongoId().withMessage(`Valid ${field} is required`),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Invalid ID format', 400, errors.array());
      }
      next();
    }
  ];
};

/**
 * Validate email format
 */
export const validateEmail = (field = 'email') => {
  return body(field)
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required');
};

/**
 * Validate password strength
 */
export const validatePassword = (field = 'password') => {
  return body(field)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .customSanitizer(sanitizeString);
};

/**
 * Sanitize HTML input (basic)
 */
export const sanitizeHTML = (value) => {
  if (typeof value !== 'string') return value;
  
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
};

/**
 * Validate and sanitize string input
 */
export const validateString = (field, options = {}) => {
  const { minLength = 1, maxLength = 1000, required = true } = options;
  
  let validator = body(field)
    .customSanitizer(sanitizeString);
  
  if (required) {
    validator = validator.notEmpty().withMessage(`${field} is required`);
  }
  
  validator = validator
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`);
  
  return validator;
};

/**
 * Rate limit exceeded handler with logging
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Validation errors for ${req.path}:`, errors.array());
    return errorResponse(res, 'Validation failed', 400, errors.array());
  }
  next();
};

/**
 * Prevent NoSQL injection
 */
export const preventNoSQLInjection = (req, res, next) => {
  const checkObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return true;
    return Object.entries(obj).every(([key, value]) =>
      !key.startsWith('$') && !key.includes('.') &&
      !['__proto__', 'prototype', 'constructor'].includes(key) && checkObject(value));
  };
  if (![req.query, req.body, req.params].every(checkObject)) {
    return errorResponse(res, 'Invalid input keys', 400);
  }

  next();
};

export default {
  sanitizeString,
  validateObjectId,
  validateEmail,
  validatePassword,
  sanitizeHTML,
  validateString,
  handleValidationErrors,
  preventNoSQLInjection
};

