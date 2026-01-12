/**
 * Phase 3.5.1: Caching Middleware
 * Adds caching support to Express endpoints
 */

import { getCache, setCache, deleteCache, DEFAULT_TTL } from '../services/cache.service.js';
import crypto from 'crypto';
import logger from '../config/logger.js';

// Export DEFAULT_TTL for use in routes
export { DEFAULT_TTL };

/**
 * Generate cache key from request
 */
const generateCacheKey = (prefix, req, includeUser = true) => {
  // Include path, query params, and user context if needed
  const path = req.path;
  const query = JSON.stringify(req.query || {});
  
  // Include user context for user-specific caches
  const userId = req.userId || req.user?.id;
  const userContext = (includeUser && userId) ? `:user:${userId}` : '';
  
  // Hash query string to keep key short
  const queryHash = crypto
    .createHash('md5')
    .update(query)
    .digest('hex')
    .substring(0, 8);
  
  return `${prefix}:${path}:${queryHash}${userContext}`;
};

/**
 * Cache middleware factory
 * Supports multiple API styles for backward compatibility
 * @param {string|Object} prefixOrOptions - Cache prefix string or options object
 * @param {number} ttl - Time to live in seconds (if prefix is string)
 * @param {Object} extraOptions - Additional options (if prefix is string)
 */
export const cacheMiddleware = (prefixOrOptions = {}, ttl = null, extraOptions = {}) => {
  // Support both old API: cacheMiddleware('prefix', ttl, options) and new API: cacheMiddleware(options)
  let prefix, options;
  
  if (typeof prefixOrOptions === 'string') {
    // Old API: cacheMiddleware('prefix', ttl, extraOptions)
    prefix = prefixOrOptions;
    options = {
      ttl: ttl || 600,
      ...extraOptions
    };
  } else {
    // New API: cacheMiddleware({ prefix, ttl, ... })
    prefix = prefixOrOptions.prefix || 'api';
    options = {
      ttl: prefixOrOptions.ttl || 600,
      keyGenerator: prefixOrOptions.keyGenerator,
      skipCache: prefixOrOptions.skipCache || prefixOrOptions.condition,
      includeUser: prefixOrOptions.includeUser !== false // Default to true
    };
  }

  const {
    ttl: cacheTtl,
    keyGenerator,
    skipCache,
    includeUser = true
  } = options;

  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if cache should be skipped
    if (skipCache && skipCache(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : generateCacheKey(prefix, req, includeUser);

    try {
      // Try to get from cache
      const cached = await getCache(prefix, cacheKey);
      
      if (cached) {
        logger.debug(`Cache hit: ${cacheKey}`);
        
        // Add cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        
        // Return cached response
        return res.status(200).json({
          success: true,
          data: cached.data,
          message: cached.message || 'Success',
          cached: true
        });
      }

      // Cache miss - continue to handler
      logger.debug(`Cache miss: ${cacheKey}`);
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function(data) {
        // Cache successful responses
        if (res.statusCode === 200 && data && data.success !== false) {
          const cacheData = {
            data: data.data || data,
            message: data.message || 'Success'
          };
          
          setCache(prefix, cacheKey, cacheData, cacheTtl).catch(err => {
            logger.warn(`Failed to cache response for ${cacheKey}:`, err.message);
          });
        }
        
        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.warn(`Cache middleware error for ${cacheKey}:`, error.message);
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Invalidate cache by prefix and pattern
 */
export const invalidateCache = async (prefix, pattern) => {
  try {
    const { deleteCacheByPrefix } = await import('../services/cache.service.js');
    const deleted = await deleteCacheByPrefix(`${prefix}:${pattern}`);
    logger.debug(`Invalidated cache: ${prefix}:${pattern} (${deleted} keys)`);
    return deleted;
  } catch (error) {
    logger.warn(`Cache invalidation error for ${prefix}:${pattern}:`, error.message);
    return 0;
  }
};

/**
 * Clear cache helper
 */
export const clearCache = async (prefix, key) => {
  try {
    await deleteCache(prefix, key);
    logger.debug(`Cleared cache: ${prefix}:${key}`);
  } catch (error) {
    logger.warn(`Cache clear error for ${prefix}:${key}:`, error.message);
  }
};
