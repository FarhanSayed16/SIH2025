import express from 'express';
import { body } from 'express-validator';
import { sync, getSyncStatus, processQueue, resolveConflictController } from '../controllers/sync.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Sync offline data (Phase 3.1.2 Enhanced, 3.4.0: Queue support)
router.post(
  '/',
  body('quizzes').optional().isArray(),
  body('quizzes.*.moduleId').optional().isMongoId(),
  body('quizzes.*.score').optional().isInt({ min: 0, max: 100 }),
  body('quizzes.*.completedAt').optional().isISO8601(),
  body('drillLogs').optional().isArray(),
  body('drillLogs.*.drillId').optional().isMongoId(),
  body('drillLogs.*.evacuationTime').optional().isInt({ min: 0 }),
  body('drillLogs.*.completedAt').optional().isISO8601(),
  body('games').optional().isArray(), // Phase 3.4.0: Game scores
  body('games.*.gameType').optional().isIn(['bag-packer', 'hazard-hunter', 'earthquake-shake']),
  body('games.*.score').optional().isInt({ min: 0 }),
  body('modules').optional().isArray(), // Phase 3.1.2: Module download requests
  body('modules.*.moduleId').optional().isMongoId(),
  body('useQueue').optional().isBoolean(), // Phase 3.4.0: Queue option
  validate,
  sync
);

// Get sync status (Phase 3.1.2 Enhanced, 3.4.0: Queue status)
router.get('/status', getSyncStatus);

// Phase 3.4.0: Process sync queue
router.post(
  '/process-queue',
  body('batchSize').optional().isInt({ min: 1, max: 100 }),
  validate,
  processQueue
);

// Phase 3.4.0: Resolve conflict
router.post(
  '/resolve-conflict/:queueItemId',
  body('resolution').isIn(['server-wins', 'client-wins', 'merge']),
  body('resolvedData').optional(),
  validate,
  resolveConflictController
);

export default router;

