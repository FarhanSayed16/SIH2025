/**
 * Phase 4.8: ML Prediction Controller
 * Handles ML prediction API endpoints
 */

import {
  predictStudentRisk,
  predictDrillPerformance,
  predictOptimalDrillTiming,
  detectDrillAnomalies,
  forecastStudentProgress,
  batchPredictStudentRisks,
} from '../services/mlPrediction.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Predict student risk score
 * GET /api/ml-predictions/student-risk/:userId
 */
export const getStudentRiskPrediction = async (req, res) => {
  try {
    const { userId } = req.params;
    const institutionId = req.user?.institutionId?.toString() || req.institutionId;

    if (!institutionId && req.user?.role !== 'admin') {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    // Allow teachers/admins to check any student, students can only check themselves
    const targetUserId = req.user?.role === 'student' ? req.user._id.toString() : userId;

    if (req.user?.role === 'student' && targetUserId !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized: Students can only view their own predictions', 403);
    }

    const prediction = await predictStudentRisk(targetUserId, institutionId);

    return successResponse(
      res,
      prediction,
      'Student risk prediction retrieved successfully'
    );
  } catch (error) {
    logger.error('Get student risk prediction error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve student risk prediction',
      500
    );
  }
};

/**
 * Predict drill performance
 * GET /api/ml-predictions/drill-performance
 */
export const getDrillPerformancePrediction = async (req, res) => {
  try {
    const { drillType, institutionId: queryInstitutionId } = req.query;
    const institutionId = queryInstitutionId || req.user?.institutionId?.toString() || req.institutionId;

    if (!institutionId && req.user?.role !== 'admin') {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    const prediction = await predictDrillPerformance(drillType || null, institutionId);

    return successResponse(
      res,
      prediction,
      'Drill performance prediction retrieved successfully'
    );
  } catch (error) {
    logger.error('Get drill performance prediction error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve drill performance prediction',
      500
    );
  }
};

/**
 * Predict optimal drill timing
 * GET /api/ml-predictions/optimal-timing
 */
export const getOptimalDrillTiming = async (req, res) => {
  try {
    const { institutionId: queryInstitutionId } = req.query;
    const institutionId = queryInstitutionId || req.user?.institutionId?.toString() || req.institutionId;

    if (!institutionId && req.user?.role !== 'admin') {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    const optimalTiming = await predictOptimalDrillTiming(institutionId);

    return successResponse(
      res,
      optimalTiming,
      'Optimal drill timing retrieved successfully'
    );
  } catch (error) {
    logger.error('Get optimal drill timing error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve optimal drill timing',
      500
    );
  }
};

/**
 * Detect drill anomalies
 * GET /api/ml-predictions/anomalies
 */
export const getDrillAnomalies = async (req, res) => {
  try {
    const { institutionId: queryInstitutionId, drillId } = req.query;
    const institutionId = queryInstitutionId || req.user?.institutionId?.toString() || req.institutionId;

    if (!institutionId && req.user?.role !== 'admin') {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    const anomalies = await detectDrillAnomalies(institutionId, drillId || null);

    return successResponse(
      res,
      anomalies,
      'Drill anomalies retrieved successfully'
    );
  } catch (error) {
    logger.error('Get drill anomalies error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve drill anomalies',
      500
    );
  }
};

/**
 * Forecast student progress
 * GET /api/ml-predictions/student-progress/:userId
 */
export const getStudentProgressForecast = async (req, res) => {
  try {
    const { userId } = req.params;
    const institutionId = req.user?.institutionId?.toString() || req.institutionId;

    if (!institutionId && req.user?.role !== 'admin') {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    // Allow teachers/admins to check any student, students can only check themselves
    const targetUserId = req.user?.role === 'student' ? req.user._id.toString() : userId;

    if (req.user?.role === 'student' && targetUserId !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized: Students can only view their own forecasts', 403);
    }

    const forecast = await forecastStudentProgress(targetUserId, institutionId);

    return successResponse(
      res,
      forecast,
      'Student progress forecast retrieved successfully'
    );
  } catch (error) {
    logger.error('Get student progress forecast error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve student progress forecast',
      500
    );
  }
};

/**
 * Batch predict student risks
 * POST /api/ml-predictions/batch-predict
 */
export const batchPredictStudentRisksController = async (req, res) => {
  try {
    const { userIds, institutionId: bodyInstitutionId } = req.body;
    const institutionId = bodyInstitutionId || req.user?.institutionId?.toString() || req.institutionId;

    if (!institutionId && req.user?.role !== 'admin') {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    // Only admins and teachers can batch predict
    if (req.user?.role === 'student') {
      return errorResponse(res, 'Unauthorized: Students cannot batch predict', 403);
    }

    const predictions = await batchPredictStudentRisks(institutionId, userIds || null);

    return successResponse(
      res,
      predictions,
      'Batch student risk predictions retrieved successfully'
    );
  } catch (error) {
    logger.error('Batch predict student risks error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to batch predict student risks',
      500
    );
  }
};

