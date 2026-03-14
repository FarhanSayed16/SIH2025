import express from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import GroupActivity from '../models/GroupActivity.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create group activity
router.post(
  '/create',
  body('activityType').isIn(['game', 'quiz', 'drill', 'module']).withMessage('Invalid activity type'),
  body('classId').isMongoId().withMessage('Valid class ID is required'),
  body('deviceId').optional().isMongoId().withMessage('Valid device ID is required'),
  body('metadata').optional().isObject(),
  validate,
  async (req, res) => {
    try {
      const { activityType, classId, deviceId, metadata } = req.body;

      const activity = await GroupActivity.create({
        activityType,
        classId,
        deviceId: deviceId || null,
        startedBy: req.userId,
        metadata: metadata || {}
      });

      logger.info(`Group activity created: ${activity._id} by ${req.userId}`);

      return successResponse(
        res,
        activity,
        'Group activity created successfully',
        201
      );
    } catch (error) {
      logger.error('Create group activity error:', error);
      return errorResponse(res, error.message || 'Failed to create activity', 500);
    }
  }
);

// Join activity (via QR scan)
router.post(
  '/:activityId/join',
  body('qrCode').notEmpty().withMessage('QR code is required'),
  validate,
  async (req, res) => {
    try {
      const { activityId } = req.params;
      const { qrCode } = req.body;

      // Find student by QR code
      const User = mongoose.model('User');
      const student = await User.findOne({ qrCode, role: 'student' });

      if (!student) {
        return errorResponse(res, 'Invalid QR code', 400);
      }

      const activity = await GroupActivity.findById(activityId);
      if (!activity) {
        return errorResponse(res, 'Activity not found', 404);
      }

      if (activity.status !== 'waiting' && activity.status !== 'active') {
        return errorResponse(res, 'Activity is not accepting participants', 400);
      }

      await activity.addParticipant(student._id);

      logger.info(`Student ${student._id} joined activity ${activityId}`);

      return successResponse(
        res,
        {
          activityId: activity._id,
          studentId: student._id,
          studentName: student.name
        },
        'Joined activity successfully'
      );
    } catch (error) {
      logger.error('Join activity error:', error);
      return errorResponse(res, error.message || 'Failed to join activity', 500);
    }
  }
);

// Submit result
router.post(
  '/:activityId/submit',
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('score').isNumeric().withMessage('Score must be a number'),
  body('completed').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const { activityId } = req.params;
      const { studentId, score, completed } = req.body;

      const activity = await GroupActivity.findById(activityId);
      if (!activity) {
        return errorResponse(res, 'Activity not found', 404);
      }

      await activity.updateParticipantScore(studentId, score, completed ?? false);
      await activity.calculateResults();

      return successResponse(
        res,
        activity.results,
        'Result submitted successfully'
      );
    } catch (error) {
      logger.error('Submit result error:', error);
      return errorResponse(res, error.message || 'Failed to submit result', 500);
    }
  }
);

// Get activity results
router.get(
  '/:activityId/results',
  async (req, res) => {
    try {
      const { activityId } = req.params;

      const activity = await GroupActivity.findById(activityId)
        .populate('participants.studentId', 'name grade section')
        .populate('classId', 'grade section classCode')
        .populate('startedBy', 'name');

      if (!activity) {
        return errorResponse(res, 'Activity not found', 404);
      }

      return successResponse(
        res,
        activity,
        'Activity results retrieved successfully'
      );
    } catch (error) {
      logger.error('Get results error:', error);
      return errorResponse(res, error.message || 'Failed to get results', 500);
    }
  }
);

export default router;

