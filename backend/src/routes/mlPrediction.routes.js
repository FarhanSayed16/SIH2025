/**
 * Phase 4.8: ML Prediction Routes
 */

import express from 'express';
import { param, query, body } from 'express-validator';
import {
  getStudentRiskPrediction,
  getDrillPerformancePrediction,
  getOptimalDrillTiming,
  getDrillAnomalies,
  getStudentProgressForecast,
  batchPredictStudentRisksController,
} from '../controllers/mlPrediction.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Predict student risk score
 * GET /api/ml-predictions/student-risk/:userId
 */
router.get(
  '/student-risk/:userId',
  param('userId').isMongoId().withMessage('Invalid user ID'),
  validate,
  getStudentRiskPrediction
);

/**
 * Predict drill performance
 * GET /api/ml-predictions/drill-performance?drillType=fire&institutionId=...
 */
router.get(
  '/drill-performance',
  query('drillType')
    .optional()
    .isIn(['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'heatwave'])
    .withMessage('Invalid drill type'),
  query('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  validate,
  getDrillPerformancePrediction
);

/**
 * Predict optimal drill timing
 * GET /api/ml-predictions/optimal-timing?institutionId=...
 */
router.get(
  '/optimal-timing',
  query('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  validate,
  getOptimalDrillTiming
);

/**
 * Detect drill anomalies
 * GET /api/ml-predictions/anomalies?institutionId=...&drillId=...
 */
router.get(
  '/anomalies',
  query('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  query('drillId').optional().isMongoId().withMessage('Invalid drill ID'),
  validate,
  getDrillAnomalies
);

/**
 * Forecast student progress
 * GET /api/ml-predictions/student-progress/:userId
 */
router.get(
  '/student-progress/:userId',
  param('userId').isMongoId().withMessage('Invalid user ID'),
  validate,
  getStudentProgressForecast
);

/**
 * Batch predict student risks
 * POST /api/ml-predictions/batch-predict
 */
router.post(
  '/batch-predict',
  body('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  body('userIds')
    .optional()
    .isArray()
    .withMessage('User IDs must be an array'),
  body('userIds.*').optional().isMongoId().withMessage('Invalid user ID in array'),
  validate,
  batchPredictStudentRisksController
);

export default router;

