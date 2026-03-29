/**
 * Phase 3.4.5: Group Quiz Service
 * Allows teachers to trigger group quizzes for their classes
 */

import Class from '../models/Class.js';
import GroupActivity from '../models/GroupActivity.js';
import Module from '../models/Module.js';
import QuizResult from '../models/QuizResult.js';
import logger from '../config/logger.js';
import { sendNotificationToUser } from '../services/fcm.service.js';

/**
 * Trigger a group quiz for a class
 * @param {string} classId - Class ID
 * @param {string} teacherId - Teacher ID
 * @param {string} moduleId - Module ID (quiz will be from this module)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Created group activity
 */
export const triggerGroupQuiz = async (classId, teacherId, moduleId, options = {}) => {
  try {
    // Verify teacher owns class
    const classData = await Class.findById(classId)
      .populate('studentIds', 'name fcmToken deviceToken');
    if (!classData) {
      throw new Error('Class not found');
    }

    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // Verify module exists
    const module = await Module.findById(moduleId);
    if (!module) {
      throw new Error('Module not found');
    }

    if (!module.quiz || !module.quiz.questions || module.quiz.questions.length === 0) {
      throw new Error('Module does not have a quiz');
    }

    // Create group activity
    const groupActivity = await GroupActivity.create({
      activityType: 'quiz',
      classId,
      deviceId: options.deviceId || null,
      startedBy: teacherId,
      status: 'active',
      metadata: {
        activityId: moduleId,
        activityName: module.title,
        duration: options.duration || null
      },
      participants: classData.studentIds.map(student => ({
        studentId: student._id,
        joinedAt: new Date()
      }))
    });

    // Send push notifications to all students
    const notificationPromises = classData.studentIds
      .filter(student => student.fcmToken || student.deviceToken)
      .map(student => {
        const token = student.fcmToken || student.deviceToken;
        return sendNotificationToUser(
          token,
          {
            title: 'New Group Quiz Available!',
            body: `${module.title} - Join the quiz now!`
          },
          {
            type: 'GROUP_QUIZ',
            activityId: groupActivity._id.toString(),
            moduleId: moduleId,
            classId: classId
          }
        ).catch(err => {
          logger.warn(`Failed to send notification to student ${student._id}:`, err);
          return null;
        });
      });

    await Promise.all(notificationPromises);

    logger.info(`Group quiz triggered for class ${classId} by teacher ${teacherId}`);

    return {
      success: true,
      groupActivity: {
        id: groupActivity._id,
        activityType: groupActivity.activityType,
        status: groupActivity.status,
        module: {
          id: module._id,
          title: module.title
        },
        participants: groupActivity.participants.length,
        createdAt: groupActivity.createdAt
      }
    };
  } catch (error) {
    logger.error('Trigger group quiz error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get active group quizzes for a class
 * @param {string} classId - Class ID
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} Active group activities
 */
export const getActiveGroupQuizzes = async (classId, teacherId) => {
  try {
    // Verify teacher owns class
    const classData = await Class.findById(classId);
    if (!classData) {
      throw new Error('Class not found');
    }

    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    const activeQuizzes = await GroupActivity.find({
      classId,
      activityType: 'quiz',
      status: { $in: ['waiting', 'active'] }
    })
      .populate('metadata.activityId', 'title')
      .sort({ createdAt: -1 });

    return {
      success: true,
      quizzes: activeQuizzes.map(quiz => ({
        id: quiz._id,
        activityType: quiz.activityType,
        status: quiz.status,
        module: quiz.metadata.activityName,
        participants: quiz.participants.length,
        completedParticipants: quiz.participants.filter(p => p.completed).length,
        createdAt: quiz.createdAt
      }))
    };
  } catch (error) {
    logger.error('Get active group quizzes error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get group quiz results
 * @param {string} activityId - Group activity ID
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} Quiz results
 */
export const getGroupQuizResults = async (activityId, teacherId) => {
  try {
    const groupActivity = await GroupActivity.findById(activityId)
      .populate('classId');

    if (!groupActivity) {
      throw new Error('Group activity not found');
    }

    // Verify teacher owns the class
    const classData = await Class.findById(groupActivity.classId._id);
    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // Get quiz results for all participants
    const moduleId = groupActivity.metadata.activityId;
    const studentIds = groupActivity.participants.map(p => p.studentId);

    const quizResults = await QuizResult.find({
      moduleId,
      userId: { $in: studentIds }
    })
      .populate('userId', 'name email grade section')
      .sort({ score: -1, completedAt: -1 });

    return {
      success: true,
      activity: {
        id: groupActivity._id,
        module: groupActivity.metadata.activityName,
        status: groupActivity.status,
        totalParticipants: groupActivity.participants.length,
        completedParticipants: quizResults.length
      },
      results: quizResults.map(result => ({
        student: {
          id: result.userId._id,
          name: result.userId.name,
          email: result.userId.email
        },
        score: result.score,
        passed: result.passed,
        completedAt: result.completedAt
      }))
    };
  } catch (error) {
    logger.error('Get group quiz results error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  triggerGroupQuiz,
  getActiveGroupQuizzes,
  getGroupQuizResults
};

