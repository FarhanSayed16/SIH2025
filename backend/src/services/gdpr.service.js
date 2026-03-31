/**
 * Phase 3.4.4: GDPR Compliance Service
 * Handles data export and deletion for GDPR compliance
 */

import User from '../models/User.js';
import School from '../models/School.js';
import Class from '../models/Class.js';
import Drill from '../models/Drill.js';
import Alert from '../models/Alert.js';
import QuizResult from '../models/QuizResult.js';
import GameScore from '../models/GameScore.js';
import SyncQueue from '../models/SyncQueue.js';
import CommunicationLog from '../models/CommunicationLog.js';
import AuditLog from '../models/AuditLog.js';
import logger from '../config/logger.js';

/**
 * Export all user data (GDPR Right to Data Portability)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User data export
 */
export const exportUserData = async (userId) => {
  try {
    // Get user
    const user = await User.findById(userId)
      .populate('institutionId', 'name email')
      .populate('classId', 'grade section classCode');
    
    if (!user) {
      throw new Error('User not found');
    }

    // Gather all user data
    const [
      quizResults,
      gameScores,
      drills,
      alerts,
      syncQueueItems,
      communicationLogs,
      auditLogs
    ] = await Promise.all([
      // Quiz results (module progress is tracked via quiz results)
      QuizResult.find({ userId }).populate('moduleId'),
      
      // Game scores
      GameScore.find({ userId }),
      
      // Drills user participated in
      Drill.find({ 'participants.userId': userId }),
      
      // Alerts user received
      Alert.find({ 'recipients.userId': userId }),
      
      // Sync queue items
      SyncQueue.find({ userId }),
      
      // Communication logs
      CommunicationLog.find({ 'recipient.userId': userId }),
      
      // Audit logs
      AuditLog.find({ userId })
    ]);

    // Compile export data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      institution: user.institutionId ? {
        _id: user.institutionId._id,
        name: user.institutionId.name,
        email: user.institutionId.email
      } : null,
      class: user.classId ? {
        _id: user.classId._id,
        grade: user.classId.grade,
        section: user.classId.section,
        classCode: user.classId.classCode
      } : null,
      progress: {
        quizResults: quizResults.map(q => ({
          moduleId: q.moduleId?._id,
          moduleTitle: q.moduleId?.title,
          score: q.score,
          totalPoints: q.totalPoints,
          passed: q.passed,
          timeTaken: q.timeTaken,
          completedAt: q.completedAt
        })),
        gameScores: gameScores.map(g => ({
          gameType: g.gameType,
          score: g.score,
          maxScore: g.maxScore,
          level: g.level,
          difficulty: g.difficulty,
          xpEarned: g.xpEarned,
          completedAt: g.completedAt
        })),
        userProgress: user.progress || {}
      },
      activities: {
        drills: drills.map(d => ({
          drillId: d._id,
          type: d.type,
          status: d.status,
          startedAt: d.startedAt,
          completedAt: d.completedAt,
          participantData: d.participants.find(p => p.userId.toString() === userId.toString())
        })),
        alerts: alerts.map(a => ({
          alertId: a._id,
          type: a.type,
          severity: a.severity,
          message: a.message,
          receivedAt: a.createdAt
        }))
      },
      technical: {
        syncQueueItems: syncQueueItems.length,
        communicationLogs: communicationLogs.length,
        auditLogs: auditLogs.length
      }
    };

    return {
      success: true,
      data: exportData
    };
  } catch (error) {
    logger.error('GDPR export error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete all user data (GDPR Right to be Forgotten)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteUserData = async (userId) => {
  try {
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Delete user-related data (in order)
    await Promise.all([
      // Delete progress data
      QuizResult.deleteMany({ userId }),
      GameScore.deleteMany({ userId }),
      
      // Remove from drills (soft delete - keep drill but remove participant)
      Drill.updateMany(
        { 'participants.userId': userId },
        { $pull: { participants: { userId } } }
      ),
      
      // Remove from alerts (soft delete)
      Alert.updateMany(
        { 'recipients.userId': userId },
        { $pull: { recipients: { userId } } }
      ),
      
      // Delete sync queue items
      SyncQueue.deleteMany({ userId }),
      
      // Anonymize communication logs (keep for audit but remove personal data)
      CommunicationLog.updateMany(
        { 'recipient.userId': userId },
        {
          $set: {
            'recipient.userId': null,
            'recipient.name': '[Deleted User]',
            'recipient.email': null,
            'recipient.phone': null
          }
        }
      ),
      
      // Anonymize audit logs
      AuditLog.updateMany(
        { userId },
        {
          $set: {
            userId: null,
            metadata: {
              ...user.toObject(),
              deletedAt: new Date().toISOString(),
              reason: 'GDPR deletion request'
            }
          }
        }
      )
    ]);

    // Anonymize user data (don't delete - keep for audit trail)
    user.name = '[Deleted User]';
    user.email = `deleted_${user._id}@deleted.local`;
    user.phone = null;
    user.deviceToken = null;
    user.fcmToken = null;
    user.isActive = false;
    user.deletedAt = new Date();
    user.deletionReason = 'GDPR deletion request';
    await user.save();

    return {
      success: true,
      message: 'User data deleted successfully',
      deletedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('GDPR deletion error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify user identity for GDPR requests
 * @param {string} userId - User ID
 * @param {Object} verificationData - Verification data
 * @returns {Promise<boolean>} True if verified
 */
export const verifyUserIdentity = async (userId, verificationData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }

    // Basic verification - in production, add more robust verification
    // (e.g., email verification code, password confirmation)
    if (verificationData.email && user.email !== verificationData.email) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Identity verification error:', error);
    return false;
  }
};

export default {
  exportUserData,
  deleteUserData,
  verifyUserIdentity
};

