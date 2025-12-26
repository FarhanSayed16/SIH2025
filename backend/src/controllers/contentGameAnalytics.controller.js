/**
 * Phase 3.5.6: Content & Game Analytics Controller
 * Handles content and game analytics API endpoints
 */

import {
  getGameAttemptAnalytics,
  getModuleCompletionRateAnalytics,
  getQuizAccuracyAnalytics,
  getDrillParticipationAnalytics,
  getHazardRecognitionAnalytics,
  getStreakAnalytics,
} from '../services/contentGameAnalytics.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Get game attempt analytics
 * GET /api/analytics/content/game-attempts
 */
export const getGameAttempts = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { gameType, startDate, endDate } = req.query;

    const dateRange = (startDate && endDate)
      ? { start: new Date(startDate), end: new Date(endDate) }
      : null;

    const analytics = await getGameAttemptAnalytics(
      institutionId,
      gameType || null,
      dateRange
    );

    return successResponse(
      res,
      analytics,
      'Game attempt analytics retrieved successfully'
    );
  } catch (error) {
    logger.error('Get game attempts analytics error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve game attempt analytics',
      500
    );
  }
};

/**
 * Get module completion rate analytics
 * GET /api/analytics/content/module-completion
 */
export const getModuleCompletion = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { startDate, endDate } = req.query;

    const dateRange = (startDate && endDate)
      ? { start: new Date(startDate), end: new Date(endDate) }
      : null;

    const analytics = await getModuleCompletionRateAnalytics(
      institutionId,
      dateRange
    );

    return successResponse(
      res,
      analytics,
      'Module completion analytics retrieved successfully'
    );
  } catch (error) {
    logger.error('Get module completion analytics error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve module completion analytics',
      500
    );
  }
};

/**
 * Get quiz accuracy analytics
 * GET /api/analytics/content/quiz-accuracy
 */
export const getQuizAccuracy = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { moduleId, startDate, endDate } = req.query;

    const dateRange = (startDate && endDate)
      ? { start: new Date(startDate), end: new Date(endDate) }
      : null;

    const analytics = await getQuizAccuracyAnalytics(
      institutionId,
      moduleId || null,
      dateRange
    );

    return successResponse(
      res,
      analytics,
      'Quiz accuracy analytics retrieved successfully'
    );
  } catch (error) {
    logger.error('Get quiz accuracy analytics error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve quiz accuracy analytics',
      500
    );
  }
};

/**
 * Get drill participation analytics
 * GET /api/analytics/content/drill-participation
 */
export const getDrillParticipation = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { startDate, endDate } = req.query;

    const dateRange = (startDate && endDate)
      ? { start: new Date(startDate), end: new Date(endDate) }
      : null;

    const analytics = await getDrillParticipationAnalytics(
      institutionId,
      dateRange
    );

    return successResponse(
      res,
      analytics,
      'Drill participation analytics retrieved successfully'
    );
  } catch (error) {
    logger.error('Get drill participation analytics error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve drill participation analytics',
      500
    );
  }
};

/**
 * Get hazard recognition analytics
 * GET /api/analytics/content/hazard-accuracy
 */
export const getHazardAccuracy = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { startDate, endDate } = req.query;

    const dateRange = (startDate && endDate)
      ? { start: new Date(startDate), end: new Date(endDate) }
      : null;

    const analytics = await getHazardRecognitionAnalytics(
      institutionId,
      dateRange
    );

    return successResponse(
      res,
      analytics,
      'Hazard recognition analytics retrieved successfully'
    );
  } catch (error) {
    logger.error('Get hazard recognition analytics error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve hazard recognition analytics',
      500
    );
  }
};

/**
 * Get streak analytics
 * GET /api/analytics/content/streaks
 */
export const getStreaks = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { streakType } = req.query;

    const analytics = await getStreakAnalytics(
      institutionId,
      streakType || null
    );

    return successResponse(
      res,
      analytics,
      'Streak analytics retrieved successfully'
    );
  } catch (error) {
    logger.error('Get streak analytics error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve streak analytics',
      500
    );
  }
};

