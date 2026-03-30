/**
 * Phase 3.4.4: Security Monitoring Service
 * Monitors and alerts on security events
 */

import AuditLog from '../models/AuditLog.js';
import { logSecurityEvent } from './audit.service.js';
import logger from '../config/logger.js';

/**
 * Monitor failed authentication attempts
 */
export const monitorFailedAuthAttempts = async (ipAddress, userId = null) => {
  try {
    // Check failed attempts in last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const failedAttempts = await AuditLog.countDocuments({
      action: 'authentication_failure',
      ipAddress,
      ...(userId && { userId }),
      createdAt: { $gte: fifteenMinutesAgo }
    });

    // Alert if more than 5 failed attempts
    if (failedAttempts >= 5) {
      await logSecurityEvent(
        userId,
        null,
        'authentication_failure',
        'user',
        null,
        'high',
        {
          ipAddress,
          failedAttempts,
          timeWindow: '15 minutes',
          alert: 'Multiple failed authentication attempts detected'
        }
      );

      logger.warn(`Security alert: ${failedAttempts} failed authentication attempts from IP ${ipAddress}`);
      return {
        alert: true,
        failedAttempts,
        message: 'Multiple failed authentication attempts detected'
      };
    }

    return {
      alert: false,
      failedAttempts
    };
  } catch (error) {
    logger.error('Security monitoring error:', error);
    return { alert: false, error: error.message };
  }
};

/**
 * Monitor suspicious IP activity
 */
export const monitorSuspiciousIP = async (ipAddress) => {
  try {
    // Check all suspicious activities from this IP in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const suspiciousActivities = await AuditLog.countDocuments({
      ipAddress,
      isSuspicious: true,
      createdAt: { $gte: oneHourAgo }
    });

    if (suspiciousActivities >= 3) {
      logger.warn(`Security alert: IP ${ipAddress} has ${suspiciousActivities} suspicious activities`);
      return {
        alert: true,
        suspiciousActivities,
        message: 'Suspicious IP activity detected'
      };
    }

    return {
      alert: false,
      suspiciousActivities
    };
  } catch (error) {
    logger.error('IP monitoring error:', error);
    return { alert: false, error: error.message };
  }
};

/**
 * Get security dashboard statistics
 */
export const getSecurityStats = async (institutionId = null, timeRange = '24h') => {
  try {
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '1h':
        startDate = new Date(now - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 24 * 60 * 60 * 1000);
    }

    const query = {
      createdAt: { $gte: startDate },
      ...(institutionId && { institutionId })
    };

    const [
      totalEvents,
      criticalEvents,
      highEvents,
      suspiciousActivities,
      failedAuth,
      unauthorizedAccess
    ] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.countDocuments({ ...query, severity: 'critical' }),
      AuditLog.countDocuments({ ...query, severity: 'high' }),
      AuditLog.countDocuments({ ...query, isSuspicious: true }),
      AuditLog.countDocuments({ ...query, action: 'authentication_failure' }),
      AuditLog.countDocuments({ ...query, action: 'authorization_failure' })
    ]);

    return {
      success: true,
      stats: {
        totalEvents,
        criticalEvents,
        highEvents,
        suspiciousActivities,
        failedAuth,
        unauthorizedAccess,
        timeRange
      }
    };
  } catch (error) {
    logger.error('Get security stats error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  monitorFailedAuthAttempts,
  monitorSuspiciousIP,
  getSecurityStats
};

