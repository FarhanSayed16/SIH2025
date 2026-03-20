import express from 'express';
import { body, param, query } from 'express-validator';
import {
  listSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  findNearestSchools,
  getSafeZones
} from '../controllers/school.controller.js';
import {
  getBlueprint,
  uploadBlueprintFile,
  updateBlueprintMetadata,
  deleteBlueprint,
  listSafetyEquipment,
  addSafetyEquipment,
  updateSafetyEquipment,
  deleteSafetyEquipment,
  listExits,
  addExit,
  updateExit,
  deleteExit,
  listRooms,
  addRoom,
  updateRoom,
  deleteRoom,
  getMapData,
  getNavigationRoute
} from '../controllers/floorPlan.controller.js';
import { uploadBlueprint } from '../services/blueprint.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validator.js';
import { cacheMiddleware, DEFAULT_TTL } from '../middleware/cache.middleware.js'; // Phase 3.5.1

const router = express.Router();

// Public routes (with optional auth)
// Phase 3.5.1: Added caching middleware
router.get('/', cacheMiddleware({
  prefix: 'school',
  ttl: DEFAULT_TTL.SCHOOL_LIST,
  skipCache: (req) => !!req.query.search // Don't cache search results
}), listSchools);
router.get('/nearest', findNearestSchools); // Add-on 1: Geo-Spatial (not cached - dynamic)
router.get('/:id', cacheMiddleware({
  prefix: 'school_detail',
  ttl: DEFAULT_TTL.SCHOOL_LIST
}), getSchoolById);
router.get('/:id/safe-zones', cacheMiddleware({
  prefix: 'school_safezones',
  ttl: DEFAULT_TTL.SCHOOL_LIST
}), getSafeZones);

// Protected routes
router.use(authenticate);

// Map / blueprint read routes (authenticated)
router.get(
  '/:id/blueprint',
  param('id').isMongoId().withMessage('Invalid school ID'),
  validate,
  getBlueprint
);

router.get(
  '/:id/floor-plan/map-data',
  param('id').isMongoId().withMessage('Invalid school ID'),
  validate,
  getMapData
);

router.get(
  '/:id/floor-plan/navigation',
  param('id').isMongoId().withMessage('Invalid school ID'),
  query('fromX').exists().withMessage('fromX required'),
  query('fromY').exists().withMessage('fromY required'),
  query('toX').exists().withMessage('toX required'),
  query('toY').exists().withMessage('toY required'),
  validate,
  getNavigationRoute
);

router.get(
  '/:id/floor-plan/safety-equipment',
  param('id').isMongoId().withMessage('Invalid school ID'),
  query('floor').optional().isInt().withMessage('Floor must be an integer'),
  query('status').optional().isString(),
  query('type').optional().isString(),
  validate,
  listSafetyEquipment
);

router.get(
  '/:id/floor-plan/exits',
  param('id').isMongoId().withMessage('Invalid school ID'),
  query('floor').optional().isInt().withMessage('Floor must be an integer'),
  query('type').optional().isString(),
  validate,
  listExits
);

router.get(
  '/:id/floor-plan/rooms',
  param('id').isMongoId().withMessage('Invalid school ID'),
  query('floor').optional().isInt().withMessage('Floor must be an integer'),
  query('roomType').optional().isString(),
  validate,
  listRooms
);

// Admin only routes (write)
router.post(
  '/',
  body('name').trim().notEmpty().withMessage('School name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('location.type').equals('Point').withMessage('Location type must be Point'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be [longitude, latitude]'),
  body('location.coordinates.*').isFloat(),
  validate,
  requireAdmin,
  createSchool
);

router.put(
  '/:id',
  param('id').isMongoId().withMessage('Invalid school ID'),
  validate,
  requireAdmin,
  updateSchool
);

router.post(
  '/:id/blueprint/upload',
  param('id').isMongoId().withMessage('Invalid school ID'),
  uploadBlueprint.single('file'),
  validate,
  requireAdmin,
  uploadBlueprintFile
);

router.put(
  '/:id/blueprint',
  param('id').isMongoId().withMessage('Invalid school ID'),
  validate,
  requireAdmin,
  updateBlueprintMetadata
);

router.delete(
  '/:id/blueprint',
  param('id').isMongoId().withMessage('Invalid school ID'),
  validate,
  requireAdmin,
  deleteBlueprint
);

// Safety equipment
router.post(
  '/:id/floor-plan/safety-equipment',
  param('id').isMongoId().withMessage('Invalid school ID'),
  body('type').notEmpty().withMessage('Equipment type is required'),
  body('name').notEmpty().withMessage('Equipment name is required'),
  validate,
  requireAdmin,
  addSafetyEquipment
);

router.put(
  '/:id/floor-plan/safety-equipment/:equipmentId',
  param('id').isMongoId().withMessage('Invalid school ID'),
  param('equipmentId').notEmpty().withMessage('Equipment ID is required'),
  validate,
  requireAdmin,
  updateSafetyEquipment
);

router.delete(
  '/:id/floor-plan/safety-equipment/:equipmentId',
  param('id').isMongoId().withMessage('Invalid school ID'),
  param('equipmentId').notEmpty().withMessage('Equipment ID is required'),
  validate,
  requireAdmin,
  deleteSafetyEquipment
);

// Exits
router.post(
  '/:id/floor-plan/exits',
  param('id').isMongoId().withMessage('Invalid school ID'),
  body('name').notEmpty().withMessage('Exit name is required'),
  body('type').notEmpty().withMessage('Exit type is required'),
  validate,
  requireAdmin,
  addExit
);

router.put(
  '/:id/floor-plan/exits/:exitId',
  param('id').isMongoId().withMessage('Invalid school ID'),
  param('exitId').notEmpty().withMessage('Exit ID is required'),
  validate,
  requireAdmin,
  updateExit
);

router.delete(
  '/:id/floor-plan/exits/:exitId',
  param('id').isMongoId().withMessage('Invalid school ID'),
  param('exitId').notEmpty().withMessage('Exit ID is required'),
  validate,
  requireAdmin,
  deleteExit
);

// Rooms
router.post(
  '/:id/floor-plan/rooms',
  param('id').isMongoId().withMessage('Invalid school ID'),
  body('name').notEmpty().withMessage('Room name is required'),
  validate,
  requireAdmin,
  addRoom
);

router.put(
  '/:id/floor-plan/rooms/:roomId',
  param('id').isMongoId().withMessage('Invalid school ID'),
  param('roomId').notEmpty().withMessage('Room ID is required'),
  validate,
  requireAdmin,
  updateRoom
);

router.delete(
  '/:id/floor-plan/rooms/:roomId',
  param('id').isMongoId().withMessage('Invalid school ID'),
  param('roomId').notEmpty().withMessage('Room ID is required'),
  validate,
  requireAdmin,
  deleteRoom
);

export default router;

