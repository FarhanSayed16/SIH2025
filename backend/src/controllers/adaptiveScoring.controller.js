/**
 * Phase 3.3.2: Adaptive Scoring Controller
 * Handles per-student tracking and shared XP distribution
 */

import { 
  distributeSharedXP, 
  getPerStudentScores,
  getSharedXPDistribution,
  getAggregatedStudentScores
} from '../services/adaptiveScoring.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Distribute shared XP to class students
 * POST /api/adaptive-scoring/distribute-xp
 */
export const distributeXP = async (req, res) => {
  try {
    const { classId, moduleId, xpAmount, activityType, activityId } = req.body;

    if (!classId || !moduleId || !xpAmount) {
      return errorResponse(res, 'Class ID, Module ID, and XP amount are required', 400);
    }

    const result = await distributeSharedXP(classId, moduleId, xpAmount, {
      activityType,
      activityId
    });

    return successResponse(res, result, 'Shared XP distributed successfully');
  } catch (error) {
    logger.error('Distribute XP error:', error);
    return errorResponse(res, error.message || 'Failed to distribute shared XP', 500);
  }
};

/**
 * Get per-student scores for a class
 * GET /api/adaptive-scoring/class/:classId/scores
 */
export const getClassStudentScores = async (req, res) => {
  try {
    const { classId } = req.params;
    const { gameType, activityType, moduleId, startDate, endDate } = req.query;

    const filters = {};
    
    if (gameType) filters.gameType = gameType;
    if (moduleId) filters.moduleId = moduleId;
    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    const scores = await getPerStudentScores(classId, filters);

    return successResponse(res, { scores }, 'Per-student scores retrieved successfully');
  } catch (error) {
    logger.error('Get class student scores error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve per-student scores', 500);
  }
};

/**
 * Get shared XP distribution history
 * GET /api/adaptive-scoring/class/:classId/xp-distribution
 */
export const getXPDistribution = async (req, res) => {
  try {
    const { classId } = req.params;
    const { activityType, startDate, endDate } = req.query;

    const filters = {};
    if (activityType) filters.activityType = activityType;
    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    const distributions = await getSharedXPDistribution(classId, filters);

    return successResponse(res, { distributions }, 'XP distribution history retrieved successfully');
  } catch (error) {
    logger.error('Get XP distribution error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve XP distribution', 500);
  }
};

/**
 * Get aggregated scores for a student
 * GET /api/adaptive-scoring/student/:studentId/aggregated
 */
export const getStudentAggregatedScores = async (req, res) => {
  try {
    const { studentId } = req.params;
    const requestingUserId = req.userId || req.user?.id;

    // Check if user is requesting their own scores or is admin/teacher
    if (studentId !== requestingUserId && req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return errorResponse(res, 'Unauthorized to view this student\'s scores', 403);
    }

    const scores = await getAggregatedStudentScores(studentId);

    return successResponse(res, scores, 'Aggregated student scores retrieved successfully');
  } catch (error) {
    logger.error('Get aggregated student scores error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve aggregated scores', 500);
  }
};

