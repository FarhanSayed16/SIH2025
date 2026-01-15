import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

/**
 * Middleware to check validation results
 * Formats errors for easy frontend consumption
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors for frontend: convert array to object keyed by field name
    const formattedErrors = errors.array().reduce((acc, error) => {
      const field = error.param || error.path || 'general';
      // If multiple errors for same field, combine them
      if (acc[field]) {
        acc[field] = Array.isArray(acc[field]) 
          ? [...acc[field], error.msg]
          : [acc[field], error.msg];
      } else {
        acc[field] = error.msg;
      }
      return acc;
    }, {});

    return errorResponse(
      res,
      'Validation failed',
      400,
      {
        // Keep original array format for backward compatibility
        details: errors.array(),
        // Add formatted object for easier frontend consumption
        fields: formattedErrors
      }
    );
  }
  next();
};

