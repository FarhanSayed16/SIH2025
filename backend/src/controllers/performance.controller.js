/**
 * Phase 3.5.1: Performance Metrics Controller
 * Provides performance monitoring and metrics endpoints
 */

import { getPerformanceMetrics, resetPerformanceMetrics } from '../middleware/performance.middleware.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

/**
 * Get performance metrics
 * GET /api/metrics/performance
 */
export const getMetrics = async (req, res) => {
  try {
    const metrics = getPerformanceMetrics();
    
    // Add database connection status
    const dbStatus = {
      connected: mongoose.connection.readyState === 1,
      state: mongoose.connection.readyState, // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A'
    };

    // Add Redis status if available
    let redisStatus = { available: false };
    try {
      const { getRedisClient } = await import('../config/redis.js');
      const redisClient = getRedisClient();
      redisStatus = {
        available: redisClient !== null && redisClient?.isReady,
        connected: redisClient?.isReady || false
      };
    } catch (error) {
      // Redis not available, that's okay
    }

    return successResponse(res, {
      ...metrics,
      database: {
        ...metrics.database,
        connection: dbStatus
      },
      redis: redisStatus,
      system: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
          external: Math.round(process.memoryUsage().external / 1024 / 1024) // MB
        },
        nodeVersion: process.version
      }
    }, 'Performance metrics retrieved successfully');
  } catch (error) {
    logger.error('Get performance metrics error:', error);
    return errorResponse(res, 'Failed to retrieve performance metrics', 500);
  }
};

/**
 * Reset performance metrics (Admin only)
 * POST /api/metrics/performance/reset
 */
export const resetMetrics = async (req, res) => {
  try {
    resetPerformanceMetrics();
    return successResponse(res, {}, 'Performance metrics reset successfully');
  } catch (error) {
    logger.error('Reset performance metrics error:', error);
    return errorResponse(res, 'Failed to reset performance metrics', 500);
  }
};

