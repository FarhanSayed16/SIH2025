/**
 * Phase 3.4.1: Analytics Controller
 */

import {
  getDrillPerformanceMetrics,
  getStudentProgressMetrics,
  getInstitutionAnalytics,
  getModuleCompletionRates,
  getGamePerformanceAnalytics,
  getQuizAccuracyTrends
} from '../services/analytics.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Get drill performance metrics
 * GET /analytics/drills
 */
export const getDrillMetrics = async (req, res) => {
  try {
    const { institutionId, drillId, startDate, endDate } = req.query;
    
    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : null;

    // Use user's institutionId if not provided
    const userInstitutionId = req.user?.institutionId?.toString() || req.institutionId;
    const targetInstitutionId = institutionId || userInstitutionId;
    
    if (!targetInstitutionId && req.user?.role !== 'admin') {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    const metrics = await getDrillPerformanceMetrics(
      targetInstitutionId,
      drillId || null,
      dateRange
    );

    return successResponse(res, metrics, 'Drill performance metrics retrieved successfully');
  } catch (error) {
    logger.error('Get drill metrics error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve drill metrics', 500);
  }
};

/**
 * Get student progress metrics
 * GET /analytics/students/progress
 */
export const getStudentProgress = async (req, res) => {
  try {
    const { institutionId, classId, userId, startDate, endDate } = req.query;
    
    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : null;

    // Use user's institutionId if not provided
    const userInstitutionId = req.user?.institutionId?.toString() || req.institutionId;
    const targetInstitutionId = institutionId || userInstitutionId;
    
    if (!targetInstitutionId && req.user?.role !== 'admin') {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    // Students and teachers can only view their own progress
    if (req.user?.role === 'student' && userId && userId !== req.userId) {
      return errorResponse(res, 'Unauthorized: Cannot view other student progress', 403);
    }

    const metrics = await getStudentProgressMetrics(
      targetInstitutionId,
      classId || null,
      userId || null,
      dateRange
    );

    return successResponse(res, metrics, 'Student progress metrics retrieved successfully');
  } catch (error) {
    logger.error('Get student progress error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve student progress', 500);
  }
};

/**
 * Get institution-level analytics
 * GET /analytics/institution
 */
export const getInstitutionMetrics = async (req, res) => {
  try {
    const { institutionId, startDate, endDate } = req.query;
    
    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : null;

    // Use user's institutionId if not provided
    const userInstitutionId = req.user?.institutionId?.toString() || req.institutionId;
    const targetInstitutionId = institutionId || userInstitutionId;
    
    if (!targetInstitutionId && req.user?.role !== 'admin') {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    // Only admins and institution admins can view institution analytics
    if (req.user?.role !== 'admin' && req.user?.role !== 'institution_admin') {
      return errorResponse(res, 'Unauthorized: Only admins can view institution analytics', 403);
    }

    const analytics = await getInstitutionAnalytics(targetInstitutionId, dateRange);

    return successResponse(res, analytics, 'Institution analytics retrieved successfully');
  } catch (error) {
    logger.error('Get institution metrics error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve institution analytics', 500);
  }
};

/**
 * Get module completion rates
 * GET /analytics/modules/completion
 */
export const getModuleCompletion = async (req, res) => {
  try {
    const { institutionId, startDate, endDate } = req.query;
    
    // Use user's institutionId if not provided
    const userInstitutionId = req.user?.institutionId?.toString() || req.institutionId;
    const targetInstitutionId = institutionId || userInstitutionId;
    
    if (!targetInstitutionId && req.user?.role !== 'admin') {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    const completionRates = await getModuleCompletionRates(targetInstitutionId);

    return successResponse(res, completionRates, 'Module completion rates retrieved successfully');
  } catch (error) {
    logger.error('Get module completion error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve module completion rates', 500);
  }
};

/**
 * Get game performance analytics
 * GET /analytics/games
 */
export const getGameAnalytics = async (req, res) => {
  try {
    const { institutionId, gameType, startDate, endDate } = req.query;
    
    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : null;

    // Use user's institutionId if not provided
    const userInstitutionId = req.user?.institutionId?.toString() || req.institutionId;
    const targetInstitutionId = institutionId || userInstitutionId;
    
    if (!targetInstitutionId && req.user?.role !== 'admin') {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    const analytics = await getGamePerformanceAnalytics(
      targetInstitutionId,
      gameType || null,
      dateRange
    );

    return successResponse(res, analytics, 'Game performance analytics retrieved successfully');
  } catch (error) {
    logger.error('Get game analytics error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve game analytics', 500);
  }
};

/**
 * Get quiz accuracy trends
 * GET /analytics/quizzes/accuracy
 */
export const getQuizAccuracy = async (req, res) => {
  try {
    const { institutionId, moduleId, startDate, endDate } = req.query;
    
    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : null;

    // Use user's institutionId if not provided
    const userInstitutionId = req.user?.institutionId?.toString() || req.institutionId;
    const targetInstitutionId = institutionId || userInstitutionId;
    
    if (!targetInstitutionId && req.user?.role !== 'admin') {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    const trends = await getQuizAccuracyTrends(
      targetInstitutionId,
      moduleId || null,
      dateRange
    );

    return successResponse(res, trends, 'Quiz accuracy trends retrieved successfully');
  } catch (error) {
    logger.error('Get quiz accuracy error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve quiz accuracy trends', 500);
  }
};

