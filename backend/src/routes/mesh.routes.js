import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getMeshKeyController,
  rotateMeshKeyController,
  syncMeshMessagesController,
} from '../controllers/mesh.controller.js';
import {
  registerGatewayController,
  getSchoolGatewaysController,
  getGatewayByIdController,
  updateGatewayStatsController,
} from '../controllers/meshGateway.controller.js'; // Phase 5.9
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Phase 5.3: Mesh Networking Routes
 */

// Get mesh key for current user's school
// GET /api/mesh/key
router.get('/key', getMeshKeyController);

// Rotate mesh key (admin only)
// POST /api/mesh/key/rotate
router.post(
  '/key/rotate',
  requireAdmin,
  rotateMeshKeyController
);

// Sync offline mesh messages
// POST /api/mesh/sync
router.post(
  '/sync',
  body('messages').isArray().withMessage('Messages must be an array'),
  body('messages.*.msgId').optional().isString(),
  body('messages.*.type').optional().isString(),
  body('messages.*.schoolId').optional().isMongoId(),
  body('messages.*.payload').optional(),
  body('messages.*.timestamp').optional().isInt(),
  body('messages.*.ttl').optional().isInt({ min: 0 }),
  validate,
  syncMeshMessagesController
);

/**
 * Phase 5.9: Mesh Gateway Routes
 */

// Register mesh gateway
// POST /api/mesh/gateways
router.post(
  '/gateways',
  authenticate,
  requireAdmin,
  [
    body('gatewayId').notEmpty().withMessage('Gateway ID is required'),
    body('name').notEmpty().withMessage('Gateway name is required'),
    body('schoolId').optional().isMongoId().withMessage('Valid school ID is required'),
    body('location').optional(),
    body('hardwareType').optional().isIn(['raspberry-pi', 'esp32-gateway', 'custom']),
    body('meshProtocol').optional().isIn(['nearby-connections', 'ble-mesh', 'lora', 'wifi-direct']),
  ],
  validate,
  registerGatewayController
);

// Get school gateways
// GET /api/mesh/gateways
router.get(
  '/gateways',
  authenticate,
  [
    query('schoolId').optional().isMongoId().withMessage('Valid school ID is required'),
  ],
  validate,
  getSchoolGatewaysController
);

// Get gateway by ID
// GET /api/mesh/gateways/:gatewayId
router.get(
  '/gateways/:gatewayId',
  authenticate,
  getGatewayByIdController
);

// Update gateway statistics
// POST /api/mesh/gateways/:gatewayId/stats
router.post(
  '/gateways/:gatewayId/stats',
  authenticate,
  [
    param('gatewayId').notEmpty().withMessage('Gateway ID is required'),
    body('messagesBridged').optional().isInt({ min: 0 }),
    body('bytesTransferred').optional().isInt({ min: 0 }),
  ],
  validate,
  updateGatewayStatsController
);

export default router;

