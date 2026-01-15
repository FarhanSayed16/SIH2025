import { randomUUID } from 'crypto';
import logger from '../config/logger.js';

/**
 * Request tracing middleware
 * Adds unique request ID to each request for tracing
 */
export const requestTracing = (req, res, next) => {
  // Generate unique request ID
  const requestId = randomUUID();
  req.requestId = requestId;
  
  // Add request ID to response header
  res.setHeader('X-Request-ID', requestId);
  
  // Log request start
  const startTime = Date.now();
  
  // Log request details
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Track response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
};

