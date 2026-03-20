import express from 'express';
import { body, param, query } from 'express-validator';
import {
  listModules,
  getModuleById,
  completeModule,
  trackModuleProgress,
  getModuleProgress,
  getUserProgress
} from '../controllers/module.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';
import { cacheMiddleware, DEFAULT_TTL } from '../middleware/cache.middleware.js'; // Phase 3.5.1

const router = express.Router();

// List modules (public with optional auth)
// Phase 3.1.1: Enhanced with more filter options
// Phase 3.5.1: Added caching middleware
router.get(
  '/',
  optionalAuth,
  cacheMiddleware({
    prefix: 'module',
    ttl: DEFAULT_TTL.MODULE_LIST,
    skipCache: (req) => !!req.query.search // Don't cache search results
  }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['earthquake', 'flood', 'fire', 'cyclone', 'stampede', 'heatwave', 'general']),
  query('category').optional().isIn(['safety', 'preparedness', 'response', 'recovery', 'prevention']),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  query('gradeLevel').optional().isIn(['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'all']),
  query('tags').optional().isString(),
  query('region').optional().isString(),
  query('search').optional().isString(),
  query('sortBy').optional().isIn(['order', 'popularity', 'completions', 'createdAt', 'title']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  validate,
  listModules
);

// Get module by ID (public with optional auth)
// Phase 3.1.1: Enhanced with version support
// Phase 3.5.1: Added caching middleware
router.get(
  '/:id',
  optionalAuth,
  cacheMiddleware({
    prefix: 'module_detail',
    ttl: DEFAULT_TTL.MODULE_DETAIL,
    includeUser: false // Module details are not user-specific
  }),
  param('id').isMongoId().withMessage('Invalid module ID'),
  query('version').optional().isString(),
  validate,
  getModuleById
);

// Complete module (requires auth)
// FIXED: Allow both MongoDB ObjectId and legacy string IDs (like 'flood', 'cyclone')
router.post(
  '/:id/complete',
  authenticate,
  param('id').notEmpty().withMessage('Module ID is required'),
  body('answers').isArray().withMessage('Answers array is required'),
  body('answers.*.selectedAnswer').isInt({ min: 0 }).withMessage('Invalid answer'),
  body('timeTaken').optional().isInt({ min: 0 }),
  validate,
  completeModule
);

// Track module progress (requires auth)
router.post(
  '/progress',
  authenticate,
  body('moduleId').notEmpty().withMessage('moduleId is required'),
  body('moduleType').isIn(['ndma', 'ndrf', 'hearing_impaired']).withMessage('Invalid moduleType'),
  body('action').isIn(['video_complete', 'module_complete']).withMessage('Invalid action'),
  body('videoId').optional().isString(),
  body('language').optional().isString(),
  body('totalVideos').optional().isInt({ min: 0 }),
  validate,
  trackModuleProgress
);

// Get module progress (requires auth)
router.get(
  '/progress/:moduleId',
  authenticate,
  param('moduleId').notEmpty().withMessage('moduleId is required'),
  query('moduleType').isIn(['ndma', 'ndrf', 'hearing_impaired']).withMessage('Invalid moduleType'),
  query('language').optional().isString(),
  validate,
  getModuleProgress
);

export default router;

