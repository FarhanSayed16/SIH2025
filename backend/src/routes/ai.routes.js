import express from 'express';
import { body, param, query } from 'express-validator';
import {
  analyzeHazardImage,
  checkEvacuationRouteHandler,
  analyzeFloorPlanHandler,
  scanDamageHandler,
  describeImageHandler,
  summariseDrillController,
  getTodaysTipController,
  askKavachController,
  summariseIncidentReportController,
  draftAlertMessageController,
  crisisParentMessageController,
  summariseGuidelineController,
  getDrillFeedbackController,
  recommendNextModuleController,
  suggestQuizDifficultyController,
  translateController,
  simplifyController,
  scenarioNextController,
  reportCardController
} from '../controllers/ai.controller.js';
import { generateQuiz, getCachedQuizForModule } from '../controllers/quiz.controller.js';
import { optionalAuth, authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// AI analyze endpoint (Add-on 3)
router.post(
  '/analyze',
  apiLimiter,
  optionalAuth,
  body('image').notEmpty().withMessage('Image is required'),
  body('mimeType').optional().isIn(['image/jpeg', 'image/png', 'image/jpg']).withMessage('Invalid MIME type'),
  validate,
  analyzeHazardImage
);

// Category A: Vision & Image
const imageBodyValidators = [
  body('image').notEmpty().withMessage('Image is required'),
  body('mimeType').optional().isIn(['image/jpeg', 'image/png', 'image/jpg']).withMessage('Invalid MIME type')
];

router.post('/evacuation/check', apiLimiter, optionalAuth, imageBodyValidators, validate, checkEvacuationRouteHandler);
router.post('/floorplan/analyze', apiLimiter, optionalAuth, imageBodyValidators, validate, analyzeFloorPlanHandler);
router.post('/damage/scan', apiLimiter, optionalAuth, imageBodyValidators, validate, scanDamageHandler);
router.post('/describe', apiLimiter, optionalAuth, imageBodyValidators, validate, describeImageHandler);

// Phase 3.1.4: AI Quiz Generation
router.get(
  '/quiz/generate/:moduleId',
  apiLimiter, // Rate limit AI requests
  optionalAuth,
  param('moduleId').isMongoId().withMessage('Invalid module ID'),
  query('numQuestions').optional().isInt({ min: 1, max: 10 }).withMessage('numQuestions must be 1-10'),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
  query('gradeLevel').optional().isString().withMessage('Invalid grade level'),
  query('useCache').optional().isBoolean().withMessage('useCache must be boolean'),
  validate,
  generateQuiz
);

// Get cached quiz
router.get(
  '/quiz/cached/:moduleId',
  optionalAuth,
  param('moduleId').isMongoId().withMessage('Invalid module ID'),
  query('numQuestions').optional().isInt({ min: 1, max: 10 }),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  query('gradeLevel').optional().isString(),
  validate,
  getCachedQuizForModule
);

// --- Category B: Text & NLP ---
// B1: Drill report auto-summary
router.post(
  '/drill/summarise',
  apiLimiter,
  authenticate,
  body('type').optional().isString(),
  body('participantCount').optional().isInt({ min: 0 }),
  body('acknowledgedCount').optional().isInt({ min: 0 }),
  body('avgResponseTimeSeconds').optional().isFloat({ min: 0 }),
  body('durationMinutes').optional().isFloat({ min: 0 }),
  body('drillId').optional().isMongoId(),
  validate,
  summariseDrillController
);

// B2: Today's safety tip (cached per day)
router.get(
  '/tip/today',
  apiLimiter,
  optionalAuth,
  query('lang').optional().isString(),
  validate,
  getTodaysTipController
);

// B4: Ask Kavach (Q&A), O6: optional preferredResponseLang (en, hi, mr)
router.post(
  '/ask',
  apiLimiter,
  optionalAuth,
  body('question').notEmpty().trim().withMessage('Question is required'),
  body('preferredResponseLang').optional().isString(),
  body('lang').optional().isString(),
  validate,
  askKavachController
);

// B3: Incident report summariser
router.post(
  '/incident/summarise',
  apiLimiter,
  authenticate,
  body('text').notEmpty().trim().withMessage('Text is required'),
  validate,
  summariseIncidentReportController
);

// B6: AI-generated alert / broadcast message
router.post(
  '/alert/draft',
  apiLimiter,
  authenticate,
  body('type').optional().isString(),
  body('severity').optional().isString(),
  validate,
  draftAlertMessageController
);

// O7: AI Crisis Message to Parents
router.post(
  '/crisis-parent-message',
  apiLimiter,
  authenticate,
  body('incidentType').optional().isString(),
  body('type').optional().isString(),
  body('severity').optional().isString(),
  body('oneLineDescription').optional().isString(),
  body('description').optional().isString(),
  validate,
  crisisParentMessageController
);

// B5: Long guideline summariser
router.post(
  '/guideline/summarise',
  apiLimiter,
  authenticate,
  body('text').notEmpty().trim().withMessage('Text is required'),
  validate,
  summariseGuidelineController
);

// B7: Personalised drill feedback for student
router.post(
  '/drill/feedback',
  apiLimiter,
  authenticate,
  body('acknowledged').isBoolean().withMessage('acknowledged is required'),
  body('responseTimeSeconds').optional().isFloat({ min: 0 }),
  body('drillType').optional().isString(),
  validate,
  getDrillFeedbackController
);

// E1: AI next best module recommendation
router.post(
  '/recommend/next-module',
  apiLimiter,
  authenticate,
  body('completedTitles').optional().isArray(),
  body('completedGrades').optional().isArray(),
  body('availableTitles').optional().isArray(),
  validate,
  recommendNextModuleController
);

// E2: AI suggest quiz difficulty
router.post(
  '/quiz/suggest-difficulty',
  apiLimiter,
  authenticate,
  body('gradeLevel').optional().isString(),
  body('lastQuizScore').optional().isFloat({ min: 0, max: 100 }),
  validate,
  suggestQuizDifficultyController
);

// G1: Translate safety text
router.post(
  '/translate',
  apiLimiter,
  authenticate,
  body('text').notEmpty().withMessage('Text is required'),
  body('targetLang').optional().isString(),
  validate,
  translateController
);

// G2: Simplify content for grade
router.post(
  '/simplify',
  apiLimiter,
  authenticate,
  body('text').notEmpty().withMessage('Text is required'),
  body('ageOrGrade').optional().isInt({ min: 5, max: 18 }),
  body('gradeLevel').optional().isInt({ min: 5, max: 18 }),
  validate,
  simplifyController
);

// O1: AI Disaster Scenario Simulator (Choose Your Own Adventure)
router.post(
  '/scenario/next',
  apiLimiter,
  optionalAuth,
  body('scenarioId').optional().isString(),
  body('stepIndex').optional().isInt({ min: 0 }),
  body('userChoice').optional().isString(),
  body('previousContext').optional().isArray(),
  validate,
  scenarioNextController
);

// O5: AI Safety Report Card for the School
router.post(
  '/report-card',
  apiLimiter,
  authenticate,
  body('institutionId').optional().isString(),
  validate,
  reportCardController
);

export default router;

