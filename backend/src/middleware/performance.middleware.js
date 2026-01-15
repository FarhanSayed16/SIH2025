/**
 * Phase 3.5.1: Performance Monitoring Middleware
 * Tracks request/response times, database queries, and cache performance
 */

import logger from '../config/logger.js';

// In-memory performance metrics (can be enhanced with Redis for distributed systems)
const performanceMetrics = {
  requests: {
    total: 0,
    slow: 0, // Requests > 1 second
    errors: 0
  },
  responseTimes: [], // Store last 100 response times
  slowRequests: [], // Store last 20 slow requests
  cacheStats: {
    hits: 0,
    misses: 0
  },
  dbQueries: {
    total: 0,
    slow: 0, // Queries > 100ms
    avgTime: 0
  }
};

// Thresholds
const THRESHOLDS = {
  SLOW_REQUEST: 1000, // 1 second
  SLOW_QUERY: 100, // 100ms
  MAX_STORED_RESPONSES: 100,
  MAX_STORED_SLOW_REQUESTS: 20
};

/**
 * Request timing middleware
 */
export const requestTimingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.requestId || req.headers['x-request-id'] || 'unknown';

  // Track total requests
  performanceMetrics.requests.total++;

  // Override res.json to track response time
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const duration = Date.now() - startTime;

    // Add timing headers
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Request-ID', requestId);

    // Track response time
    performanceMetrics.responseTimes.push({
      path: req.path,
      method: req.method,
      duration,
      statusCode: res.statusCode,
      timestamp: new Date()
    });

    // Keep only last N responses
    if (performanceMetrics.responseTimes.length > THRESHOLDS.MAX_STORED_RESPONSES) {
      performanceMetrics.responseTimes.shift();
    }

    // Track slow requests
    if (duration > THRESHOLDS.SLOW_REQUEST) {
      performanceMetrics.requests.slow++;
      
      performanceMetrics.slowRequests.push({
        path: req.path,
        method: req.method,
        duration,
        statusCode: res.statusCode,
        query: req.query,
        params: req.params,
        timestamp: new Date()
      });

      // Keep only last N slow requests
      if (performanceMetrics.slowRequests.length > THRESHOLDS.MAX_STORED_SLOW_REQUESTS) {
        performanceMetrics.slowRequests.shift();
      }

      logger.warn(`Slow request detected: ${req.method} ${req.path} - ${duration}ms`);
    }

    // Track errors
    if (res.statusCode >= 400) {
      performanceMetrics.requests.errors++;
    }

    // Log request completion
    logger.debug(`Request completed: ${req.method} ${req.path} - ${duration}ms - ${res.statusCode}`);

    return originalJson(data);
  };

  next();
};

/**
 * Cache statistics middleware
 */
export const cacheStatsMiddleware = (req, res, next) => {
  // Check for cache headers from cache middleware
  res.on('finish', () => {
    const cacheStatus = res.getHeader('X-Cache');
    
    if (cacheStatus === 'HIT') {
      performanceMetrics.cacheStats.hits++;
    } else if (cacheStatus === 'MISS') {
      performanceMetrics.cacheStats.misses++;
    }
  });

  next();
};

/**
 * Database query tracking
 * Wrapper for mongoose queries to track performance
 */
export const trackDatabaseQuery = async (queryName, queryFn) => {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;

    // Track query
    performanceMetrics.dbQueries.total++;
    
    // Calculate average query time
    const currentAvg = performanceMetrics.dbQueries.avgTime;
    const totalQueries = performanceMetrics.dbQueries.total;
    performanceMetrics.dbQueries.avgTime = 
      ((currentAvg * (totalQueries - 1)) + duration) / totalQueries;

    // Track slow queries
    if (duration > THRESHOLDS.SLOW_QUERY) {
      performanceMetrics.dbQueries.slow++;
      logger.warn(`Slow query detected: ${queryName} - ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Query error: ${queryName} - ${duration}ms -`, error.message);
    throw error;
  }
};

/**
 * Get performance metrics (detailed)
 */
export const getPerformanceMetrics = () => {
  // Calculate cache hit rate
  const totalCacheRequests = 
    performanceMetrics.cacheStats.hits + performanceMetrics.cacheStats.misses;
  const cacheHitRate = totalCacheRequests > 0
    ? (performanceMetrics.cacheStats.hits / totalCacheRequests * 100).toFixed(2)
    : 0;

  // Calculate average response time
  const responseTimes = performanceMetrics.responseTimes.map(r => r.duration);
  const avgResponseTime = responseTimes.length > 0
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)
    : 0;

  // Calculate slow request rate
  const slowRequestRate = performanceMetrics.requests.total > 0
    ? (performanceMetrics.requests.slow / performanceMetrics.requests.total * 100).toFixed(2)
    : 0;

  // Calculate error rate
  const errorRate = performanceMetrics.requests.total > 0
    ? (performanceMetrics.requests.errors / performanceMetrics.requests.total * 100).toFixed(2)
    : 0;

  // Calculate slow query rate
  const slowQueryRate = performanceMetrics.dbQueries.total > 0
    ? (performanceMetrics.dbQueries.slow / performanceMetrics.dbQueries.total * 100).toFixed(2)
    : 0;

  return {
    requests: {
      total: performanceMetrics.requests.total,
      slow: performanceMetrics.requests.slow,
      slowRate: `${slowRequestRate}%`,
      errors: performanceMetrics.requests.errors,
      errorRate: `${errorRate}%`
    },
    responseTime: {
      average: `${avgResponseTime}ms`,
      recent: responseTimes.slice(-10).map(t => `${t}ms`)
    },
    cache: {
      hits: performanceMetrics.cacheStats.hits,
      misses: performanceMetrics.cacheStats.misses,
      hitRate: `${cacheHitRate}%`
    },
    database: {
      totalQueries: performanceMetrics.dbQueries.total,
      slowQueries: performanceMetrics.dbQueries.slow,
      slowQueryRate: `${slowQueryRate}%`,
      avgQueryTime: `${performanceMetrics.dbQueries.avgTime.toFixed(2)}ms`
    },
    slowRequests: performanceMetrics.slowRequests.slice(-10), // Last 10 slow requests
    timestamp: new Date()
  };
};

/**
 * Get metrics (alias for getPerformanceMetrics - returns current metrics object)
 */
export const getMetrics = () => {
  return getPerformanceMetrics();
};

/**
 * Get metrics summary (simplified version)
 */
export const getMetricsSummary = () => {
  const metrics = getPerformanceMetrics();
  
  return {
    requests: {
      total: metrics.requests.total,
      slow: metrics.requests.slow,
      errors: metrics.requests.errors
    },
    responseTime: {
      average: metrics.responseTime.average
    },
    cache: {
      hits: metrics.cache.hits,
      misses: metrics.cache.misses,
      hitRate: metrics.cache.hitRate
    },
    database: {
      totalQueries: metrics.database.totalQueries,
      slowQueries: metrics.database.slowQueries,
      avgQueryTime: metrics.database.avgQueryTime
    },
    timestamp: metrics.timestamp
  };
};

/**
 * Reset performance metrics
 */
export const resetPerformanceMetrics = () => {
  performanceMetrics.requests = {
    total: 0,
    slow: 0,
    errors: 0
  };
  performanceMetrics.responseTimes = [];
  performanceMetrics.slowRequests = [];
  performanceMetrics.cacheStats = {
    hits: 0,
    misses: 0
  };
  performanceMetrics.dbQueries = {
    total: 0,
    slow: 0,
    avgTime: 0
  };
  logger.info('Performance metrics reset');
};

export default {
  requestTimingMiddleware,
  cacheStatsMiddleware,
  trackDatabaseQuery,
  getPerformanceMetrics,
  getMetrics,
  getMetricsSummary,
  resetPerformanceMetrics
};
