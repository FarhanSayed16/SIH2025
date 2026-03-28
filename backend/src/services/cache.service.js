/**
 * Phase 3.5.1: Centralized Caching Service
 * Provides a unified interface for Redis caching across the application
 */

import { getRedisClient } from '../config/redis.js';
import logger from '../config/logger.js';

// Default cache TTLs (in seconds)
const DEFAULT_TTL = {
  USER_PROFILE: 3600, // 1 hour
  MODULE_LIST: 1800, // 30 minutes
  MODULE_DETAIL: 3600, // 1 hour
  SCHOOL_LIST: 3600, // 1 hour
  CLASS_LIST: 1800, // 30 minutes
  PREPAREDNESS_SCORE: 300, // 5 minutes
  TEACHER_CLASSES: 1800, // 30 minutes
  QUIZ_CACHE: 86400, // 24 hours (quizzes don't change often)
  GENERAL: 600, // 10 minutes
};

/**
 * Check if Redis is available
 */
const isRedisAvailable = () => {
  try {
    const client = getRedisClient();
    return client !== null && client?.isReady;
  } catch (error) {
    return false;
  }
};

/**
 * Get cache key with prefix
 */
const getCacheKey = (prefix, key) => {
  return `cache:${prefix}:${key}`;
};

/**
 * Get value from cache
 * @param {string} prefix - Cache prefix (e.g., 'user', 'module')
 * @param {string} key - Cache key
 * @returns {Promise<Object|null>} Cached value or null
 */
export const getCache = async (prefix, key) => {
  if (!isRedisAvailable()) {
    logger.debug(`Cache miss (Redis unavailable): ${prefix}:${key}`);
    return null;
  }

  try {
    const client = getRedisClient();
    const cacheKey = getCacheKey(prefix, key);
    const cached = await client.get(cacheKey);

    if (!cached) {
      logger.debug(`Cache miss: ${prefix}:${key}`);
      return null;
    }

    logger.debug(`Cache hit: ${prefix}:${key}`);
    return JSON.parse(cached);
  } catch (error) {
    logger.warn(`Cache get error for ${prefix}:${key}:`, error.message);
    return null;
  }
};

/**
 * Set value in cache
 * @param {string} prefix - Cache prefix
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise<boolean>} Success status
 */
export const setCache = async (prefix, key, value, ttl = null) => {
  if (!isRedisAvailable()) {
    logger.debug(`Cache set skipped (Redis unavailable): ${prefix}:${key}`);
    return false;
  }

  try {
    const client = getRedisClient();
    const cacheKey = getCacheKey(prefix, key);
    
    // Use default TTL for prefix if not provided
    if (!ttl) {
      ttl = DEFAULT_TTL[prefix.toUpperCase()] || DEFAULT_TTL.GENERAL;
    }

    const serialized = JSON.stringify(value);
    await client.setEx(cacheKey, ttl, serialized);
    
    logger.debug(`Cache set: ${prefix}:${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    logger.warn(`Cache set error for ${prefix}:${key}:`, error.message);
    return false;
  }
};

/**
 * Delete cache entry
 * @param {string} prefix - Cache prefix
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
export const deleteCache = async (prefix, key) => {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const client = getRedisClient();
    const cacheKey = getCacheKey(prefix, key);
    await client.del(cacheKey);
    
    logger.debug(`Cache deleted: ${prefix}:${key}`);
    return true;
  } catch (error) {
    logger.warn(`Cache delete error for ${prefix}:${key}:`, error.message);
    return false;
  }
};

/**
 * Delete all cache entries with a prefix
 * @param {string} prefix - Cache prefix
 * @returns {Promise<number>} Number of keys deleted
 */
export const deleteCacheByPrefix = async (prefix) => {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const client = getRedisClient();
    const pattern = getCacheKey(prefix, '*');
    
    // Get all keys matching pattern
    const keys = await client.keys(pattern);
    
    if (keys.length === 0) {
      return 0;
    }

    // Delete all keys
    const deleted = await client.del(keys);
    
    logger.debug(`Cache deleted by prefix: ${prefix} (${deleted} keys)`);
    return deleted;
  } catch (error) {
    logger.warn(`Cache delete by prefix error for ${prefix}:`, error.message);
    return 0;
  }
};

/**
 * Check if key exists in cache
 * @param {string} prefix - Cache prefix
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Exists status
 */
export const cacheExists = async (prefix, key) => {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const client = getRedisClient();
    const cacheKey = getCacheKey(prefix, key);
    const exists = await client.exists(cacheKey);
    return exists === 1;
  } catch (error) {
    logger.warn(`Cache exists check error for ${prefix}:${key}:`, error.message);
    return false;
  }
};

/**
 * Get or set cache (fetch if not cached, cache and return result)
 * @param {string} prefix - Cache prefix
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise<any>} Cached or fetched value
 */
export const getOrSetCache = async (prefix, key, fetchFn, ttl = null) => {
  // Try to get from cache
  const cached = await getCache(prefix, key);
  if (cached !== null) {
    return cached;
  }

  // Fetch and cache
  try {
    const value = await fetchFn();
    await setCache(prefix, key, value, ttl);
    return value;
  } catch (error) {
    logger.error(`Error fetching data for cache ${prefix}:${key}:`, error.message);
    throw error;
  }
};

// Export default TTLs for use in other services
export { DEFAULT_TTL };

