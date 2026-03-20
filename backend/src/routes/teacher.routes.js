import express from 'express';
import { body } from 'express-validator';
import {
  getClasses,
  getStudents,
  startDrill,
  markStudentParticipation,
  getAnalytics,
  markClassAttendance,
  getClassAttendanceController,
  assignXP,
  getClassXPHistoryController,
  triggerQuiz,
  getActiveQuizzes,
  getQuizResults,
  getProgress,
  getPendingStudentsController,
  approveStudentController,
  rejectStudentController,
  createRosterStudentController,
  getClassDrillSummary,
  getStudentParentsController,
  getClassParentsController,
  verifyParentQRController
} from '../controllers/teacher.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireTeacherAccess } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validator.js';
import { cacheMiddleware, DEFAULT_TTL } from '../middleware/cache.middleware.js'; // Phase 3.5.1

const router = express.Router();

// All teacher routes require authentication and teacher access (approved + has institution)
router.use(authenticate);
router.use(requireTeacherAccess);

// Get teacher's classes
// Phase 3.5.1: Added caching
router.get('/classes', cacheMiddleware({
  prefix: 'teacher_classes',
  ttl: DEFAULT_TTL.TEACHER_CLASSES,
  keyGenerator: (req) => `teacher:classes:${req.userId}`
}), getClasses);

// Get students in a class
router.get('/classes/:classId/students', getStudents);

// Start drill for class
router.post(
  '/classes/:classId/drills/start',
  body('drillType')
    .notEmpty()
    .withMessage('Drill type is required')
    .isIn(['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'heatwave'])
    .withMessage('Invalid drill type'),
  validate,
  startDrill
);

// Get class drill summary - Phase 1
router.get('/classes/:classId/drills/summary', getClassDrillSummary);

// Mark student participation
router.post(
  '/classes/:classId/students/:studentId/participate',
  body('participated')
    .isBoolean()
    .withMessage('Participation status must be boolean'),
  validate,
  markStudentParticipation
);

// Get class analytics
router.get('/classes/:classId/analytics', getAnalytics);

// Phase 3.4.5: Attendance endpoints
router.post(
  '/classes/:classId/attendance',
  body('date').notEmpty().withMessage('Date is required'),
  body('records').isArray().withMessage('Records must be an array'),
  validate,
  markClassAttendance
);
router.get('/classes/:classId/attendance', getClassAttendanceController);

// Phase 3.4.5: Group XP endpoints
router.post(
  '/classes/:classId/xp/assign',
  body('xpAmount').isNumeric().withMessage('XP amount must be a number').custom((value) => {
    if (value <= 0) {
      throw new Error('XP amount must be greater than 0');
    }
    return true;
  }),
  body('reason').optional().isString(),
  body('studentIds').optional().isArray(),
  validate,
  assignXP
);
router.get('/classes/:classId/xp/history', getClassXPHistoryController);

// Phase 3.4.5: Group Quiz endpoints
router.post(
  '/classes/:classId/quizzes/trigger',
  body('moduleId').notEmpty().withMessage('Module ID is required'),
  body('duration').optional().isNumeric(),
  body('deviceId').optional().isString(),
  validate,
  triggerQuiz
);
router.get('/classes/:classId/quizzes/active', getActiveQuizzes);
router.get('/quizzes/:activityId/results', getQuizResults);

// Phase 3.4.5: Student Progress endpoint
router.get('/classes/:classId/progress', getProgress);

// PHASE B3.5: Teacher Approval Endpoints
// Get pending students for a class
router.get('/classes/:classId/students/pending', getPendingStudentsController);

// Approve a student
router.post(
  '/classes/:classId/students/:studentId/approve',
  body('notes').optional().isString().trim(),
  validate,
  approveStudentController
);

// Reject a student
router.post(
  '/classes/:classId/students/:studentId/reject',
  body('reason').optional().isString().trim(),
  validate,
  rejectStudentController
);

// PHASE B4: Create roster student (KG-4)
router.post(
  '/classes/:classId/roster-students',
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('parentName').optional().trim(),
  body('parentPhone').optional().trim(),
  body('notes').optional().trim(),
  validate,
  createRosterStudentController
);

// Phase 2: Parent visibility endpoints
// Get all parents for a specific student
router.get('/students/:studentId/parents', getStudentParentsController);

// Get all parents for all students in a class
router.get('/classes/:classId/parents', getClassParentsController);

// Verify parent by QR code scan
router.post(
  '/parents/verify-qr',
  body('qrCodeData')
    .notEmpty()
    .withMessage('QR code data is required')
    .isString()
    .withMessage('QR code data must be a string'),
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),
  validate,
  verifyParentQRController
);

export default router;

