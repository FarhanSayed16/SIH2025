/**
 * Phase 3.1.4: Quiz Cache Service
 * Phase 3.5.1: Migrated to Redis for better scalability
 * Caches AI-generated quizzes to avoid regenerating for same module content
 */

import { getCache, setCache, deleteCache, deleteCacheByPrefix, DEFAULT_TTL } from './cache.service.js';
import logger from '../config/logger.js';

// Cache TTL (Time To Live) - 24 hours in seconds
const CACHE_TTL = DEFAULT_TTL.QUIZ_CACHE; // 86400 seconds (24 hours)
const CACHE_PREFIX = 'quiz';

/**
 * Generate cache key from module content
 */
function generateCacheKey(moduleId, options = {}) {
  const { numQuestions = 5, difficulty = 'beginner', gradeLevel = 'all' } = options;
  return `${moduleId}:${numQuestions}:${difficulty}:${gradeLevel}`;
}

/**
 * Get cached quiz
 * Phase 3.5.1: Now uses Redis instead of in-memory Map
 */
export const getCachedQuiz = async (moduleId, options = {}) => {
  const cacheKey = generateCacheKey(moduleId, options);
  
  try {
    const cached = await getCache(CACHE_PREFIX, cacheKey);
    
    if (!cached) {
      logger.debug(`Quiz cache miss: ${cacheKey}`);
      return null;
    }

    logger.debug(`Quiz cache hit: ${cacheKey}`);
    // Return questions directly (cached object contains questions)
    return cached.questions || cached;
  } catch (error) {
    logger.warn(`Error getting quiz cache for ${cacheKey}:`, error.message);
    return null;
  }
};

/**
 * Cache quiz questions
 * Phase 3.5.1: Now uses Redis instead of in-memory Map
 */
export const cacheQuiz = async (moduleId, questions, options = {}) => {
  const cacheKey = generateCacheKey(moduleId, options);
  
  try {
    const cacheValue = {
      questions,
      timestamp: Date.now(),
      moduleId,
      options
    };

    await setCache(CACHE_PREFIX, cacheKey, cacheValue, CACHE_TTL);
    logger.info(`Quiz cached: ${cacheKey} (${questions.length} questions)`);
    return true;
  } catch (error) {
    logger.warn(`Error caching quiz for ${cacheKey}:`, error.message);
    return false;
  }
};

/**
 * Clear cache for a specific module
 * Phase 3.5.1: Now uses Redis pattern deletion
 */
export const clearModuleCache = async (moduleId) => {
  try {
    // Delete all cache entries starting with moduleId
    const pattern = `${moduleId}:*`;
    const cleared = await deleteCacheByPrefix(`${CACHE_PREFIX}:${pattern}`);
    logger.info(`Cleared ${cleared} cached quizzes for module: ${moduleId}`);
    return cleared;
  } catch (error) {
    logger.warn(`Error clearing module cache for ${moduleId}:`, error.message);
    return 0;
  }
};

/**
 * Clear all cache
 * Phase 3.5.1: Now uses Redis prefix deletion
 */
export const clearAllCache = async () => {
  try {
    const cleared = await deleteCacheByPrefix(CACHE_PREFIX);
    logger.info(`Cleared all quiz cache (${cleared} entries)`);
    return cleared;
  } catch (error) {
    logger.warn(`Error clearing all quiz cache:`, error.message);
    return 0;
  }
};

/**
 * Get cache statistics
 * Phase 3.5.1: Simplified - Redis handles TTL automatically
 */
export const getCacheStats = async () => {
  // Note: Redis handles expiration automatically via TTL
  // Detailed stats would require Redis INFO command or additional tracking
  return {
    note: 'Redis handles cache expiration automatically via TTL',
    ttl: CACHE_TTL,
    prefix: CACHE_PREFIX
  };
};

