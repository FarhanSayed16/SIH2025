/**
 * Phase 3.5.1: Health Check Controller
 * Provides health check endpoints for load balancers and monitoring
 */

import mongoose from 'mongoose';
import { getRedisClient } from '../config/redis.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Basic health check
 * GET /api/health
 */
export const healthCheck = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    };

    return res.status(200).json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
};

/**
 * Detailed health check with dependencies
 * GET /api/health/detailed
 */
export const detailedHealthCheck = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      dependencies: {}
    };

    // Check MongoDB connection
    try {
      const dbState = mongoose.connection.readyState;
      const dbStatus = dbState === 1 ? 'connected' : 
                       dbState === 2 ? 'connecting' : 
                       dbState === 0 ? 'disconnected' : 'error';
      
      health.dependencies.mongodb = {
        status: dbStatus,
        readyState: dbState
      };

      if (dbState !== 1) {
        health.status = 'degraded';
      }
    } catch (error) {
      health.dependencies.mongodb = {
        status: 'error',
        error: error.message
      };
      health.status = 'unhealthy';
    }

    // Check Redis connection
    try {
      const redisClient = getRedisClient();
      if (redisClient && redisClient.isReady) {
        health.dependencies.redis = {
          status: 'connected'
        };
        
        // Test Redis with a ping
        try {
          await redisClient.ping();
          health.dependencies.redis.status = 'connected';
        } catch (error) {
          health.dependencies.redis = {
            status: 'error',
            error: error.message
          };
          health.status = 'degraded';
        }
      } else {
        health.dependencies.redis = {
          status: 'disconnected',
          note: 'Redis not configured or unavailable'
        };
        // Redis is optional, so don't mark as unhealthy
      }
    } catch (error) {
      health.dependencies.redis = {
        status: 'error',
        error: error.message
      };
      // Redis is optional, so don't mark as unhealthy
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    health.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024) // MB
    };

    // CPU usage (if available)
    const cpuUsage = process.cpuUsage();
    health.cpu = {
      user: cpuUsage.user,
      system: cpuUsage.system
    };

    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;

    return res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Detailed health check error:', error);
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

/**
 * Readiness check (for Kubernetes, load balancers)
 * GET /api/health/ready
 */
export const readinessCheck = async (req, res) => {
  try {
    // Check critical dependencies
    const dbReady = mongoose.connection.readyState === 1;

    if (!dbReady) {
      return res.status(503).json({
        ready: false,
        reason: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check error:', error);
    return res.status(503).json({
      ready: false,
      reason: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Liveness check (for Kubernetes)
 * GET /api/health/live
 */
export const livenessCheck = (req, res) => {
  // Simple check - if server is responding, it's alive
  return res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString()
  });
};

