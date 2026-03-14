/**
 * Phase 3.4.1: Analytics Routes
 * Phase 3.5.6: Enhanced with Content & Game Analytics
 */

import express from 'express';
import {
  getDrillMetrics,
  getStudentProgress,
  getInstitutionMetrics,
  getModuleCompletion,
  getGameAnalytics,
  getQuizAccuracy
} from '../controllers/analytics.controller.js';
import {
  getGameAttempts,
  getModuleCompletion as getModuleCompletionRate,
  getQuizAccuracy as getQuizAccuracyDetailed,
  getDrillParticipation,
  getHazardAccuracy,
  getStreaks,
} from '../controllers/contentGameAnalytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * @route   GET /analytics/drills
 * @desc    Get drill performance metrics
 * @access  Private
 * @query   institutionId, drillId, startDate, endDate
 */
router.get('/drills', getDrillMetrics);

/**
 * @route   GET /analytics/students/progress
 * @desc    Get student progress metrics
 * @access  Private
 * @query   institutionId, classId, userId, startDate, endDate
 */
router.get('/students/progress', getStudentProgress);

/**
 * @route   GET /analytics/institution
 * @desc    Get institution-level analytics
 * @access  Private (Admin only)
 * @query   institutionId, startDate, endDate
 */
router.get('/institution', requireAdmin, getInstitutionMetrics);

/**
 * @route   GET /analytics/modules/completion
 * @desc    Get module completion rates
 * @access  Private
 * @query   institutionId
 */
router.get('/modules/completion', getModuleCompletion);

/**
 * @route   GET /analytics/games
 * @desc    Get game performance analytics
 * @access  Private
 * @query   institutionId, gameType, startDate, endDate
 */
router.get('/games', getGameAnalytics);

/**
 * @route   GET /analytics/quizzes/accuracy
 * @desc    Get quiz accuracy trends
 * @access  Private
 * @query   institutionId, moduleId, startDate, endDate
 */
router.get('/quizzes/accuracy', getQuizAccuracy);

// Report Generation Routes
import {
  generatePDF,
  generateExcel,
  generateCSV,
  downloadReport
} from '../controllers/reportGeneration.controller.js';

/**
 * @route   POST /analytics/reports/pdf
 * @desc    Generate PDF report
 * @access  Private
 */
router.post('/reports/pdf', generatePDF);

/**
 * @route   POST /analytics/reports/excel
 * @desc    Generate Excel report
 * @access  Private
 */
router.post('/reports/excel', generateExcel);

/**
 * @route   POST /analytics/reports/csv
 * @desc    Generate CSV report
 * @access  Private
 */
router.post('/reports/csv', generateCSV);

/**
 * @route   GET /analytics/reports/:filename
 * @desc    Download report file
 * @access  Private
 */
router.get('/reports/:filename', downloadReport);

/**
 * Phase 3.5.6: Content & Game Analytics Routes
 */

/**
 * @route   GET /analytics/content/game-attempts
 * @desc    Get game attempt analytics
 * @access  Private
 * @query   gameType, startDate, endDate
 */
router.get('/content/game-attempts', getGameAttempts);

/**
 * @route   GET /analytics/content/module-completion
 * @desc    Get module completion rate analytics
 * @access  Private
 * @query   startDate, endDate
 */
router.get('/content/module-completion', getModuleCompletionRate);

/**
 * @route   GET /analytics/content/quiz-accuracy
 * @desc    Get quiz accuracy analytics
 * @access  Private
 * @query   moduleId, startDate, endDate
 */
router.get('/content/quiz-accuracy', getQuizAccuracyDetailed);

/**
 * @route   GET /analytics/content/drill-participation
 * @desc    Get drill participation analytics
 * @access  Private
 * @query   startDate, endDate
 */
router.get('/content/drill-participation', getDrillParticipation);

/**
 * @route   GET /analytics/content/hazard-accuracy
 * @desc    Get hazard recognition accuracy analytics
 * @access  Private
 * @query   startDate, endDate
 */
router.get('/content/hazard-accuracy', getHazardAccuracy);

/**
 * @route   GET /analytics/content/streaks
 * @desc    Get streak analytics
 * @access  Private
 * @query   streakType
 */
router.get('/content/streaks', getStreaks);

export default router;

