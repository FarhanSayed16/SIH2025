/**
 * Phase 3.5.1: Metrics Controller
 * Provides cache metrics endpoint
 */

import { getPerformanceMetrics } from '../middleware/performance.middleware.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Get cache statistics
 * GET /api/metrics/cache
 */
export const getCacheMetrics = async (req, res) => {
  try {
    // Get quiz cache stats (if available)
    let quizCacheStats = { 
      note: 'Redis handles cache expiration automatically via TTL',
      ttl: 86400,
      prefix: 'quiz'
    };
    try {
      const { getCacheStats } = await import('../services/quizCache.service.js');
      quizCacheStats = await getCacheStats();
    } catch (error) {
      logger.debug('Quiz cache stats not available:', error.message);
    }
    
    // Get performance metrics for cache stats
    const perfMetrics = getPerformanceMetrics();
    
    return successResponse(res, {
      cache: {
        quiz: quizCacheStats,
        performance: {
          hits: perfMetrics.cache?.hits || 0,
          misses: perfMetrics.cache?.misses || 0,
          hitRate: perfMetrics.cache?.hitRate || '0%'
        }
      },
      timestamp: new Date().toISOString()
    }, 'Cache metrics retrieved successfully');
  } catch (error) {
    logger.error('Get cache metrics error:', error);
    return errorResponse(res, 'Failed to retrieve cache metrics', 500);
  }
};
