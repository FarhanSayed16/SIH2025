/**
 * Phase 3.4.5: Group XP Assignment Service
 * Allows teachers to manually assign XP to students
 */

import User from '../models/User.js';
import Class from '../models/Class.js';
import GameScore from '../models/GameScore.js';
import logger from '../config/logger.js';

/**
 * Assign XP to multiple students
 * @param {string} classId - Class ID
 * @param {string} teacherId - Teacher ID
 * @param {number} xpAmount - XP amount to assign
 * @param {Array} studentIds - Array of student IDs (optional, if not provided, assign to all students)
 * @param {string} reason - Reason for XP assignment
 * @returns {Promise<Object>} Assignment result
 */
export const assignGroupXP = async (classId, teacherId, xpAmount, studentIds = null, reason = 'Manual assignment') => {
  try {
    // Verify teacher owns class
    const classData = await Class.findById(classId);
    if (!classData) {
      throw new Error('Class not found');
    }

    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // Determine target students
    let targetStudentIds = studentIds;
    if (!targetStudentIds || targetStudentIds.length === 0) {
      // Assign to all students in class
      targetStudentIds = classData.studentIds.map(id => id.toString());
    } else {
      // Verify all students are in class
      const classStudentIds = classData.studentIds.map(id => id.toString());
      const invalidStudents = targetStudentIds.filter(id => !classStudentIds.includes(id));
      if (invalidStudents.length > 0) {
        throw new Error(`Invalid student IDs: ${invalidStudents.join(', ')}`);
      }
    }

    const results = {
      success: [],
      failed: []
    };

    // Assign XP to each student
    for (const studentId of targetStudentIds) {
      try {
        const user = await User.findById(studentId);
        if (!user) {
          results.failed.push({ studentId, reason: 'User not found' });
          continue;
        }

        // Create a GameScore record for tracking (optional, but good for audit)
        // Or track XP directly in user model
        // For now, we'll create a GameScore with type 'manual-xp'
        const gameScore = await GameScore.create({
          userId: studentId,
          institutionId: classData.institutionId,
          gameType: 'manual-xp-assignment',
          score: xpAmount,
          maxScore: xpAmount,
          level: 1,
          difficulty: 'easy',
          xpEarned: xpAmount,
          gameData: {
            reason,
            assignedBy: teacherId,
            classId,
            assignedAt: new Date().toISOString()
          },
          completedAt: new Date()
        });

        results.success.push({
          studentId: user._id.toString(),
          name: user.name,
          xpAssigned: xpAmount
        });

        logger.info(`XP assigned: ${xpAmount} to student ${studentId} by teacher ${teacherId}`);
      } catch (error) {
        logger.error(`Failed to assign XP to student ${studentId}:`, error);
        results.failed.push({ studentId, reason: error.message });
      }
    }

    return {
      success: true,
      totalAssigned: results.success.length,
      totalFailed: results.failed.length,
      results
    };
  } catch (error) {
    logger.error('Assign group XP error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get XP history for students in a class
 * @param {string} classId - Class ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} XP history
 */
export const getClassXPHistory = async (classId, startDate, endDate) => {
  try {
    const classData = await Class.findById(classId);
    if (!classData) {
      throw new Error('Class not found');
    }

    const query = {
      userId: { $in: classData.studentIds },
      institutionId: classData.institutionId
    };

    if (startDate || endDate) {
      query.completedAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.completedAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.completedAt.$lte = end;
      }
    }

    const xpRecords = await GameScore.find(query)
      .populate('userId', 'name email grade section')
      .sort({ completedAt: -1 })
      .limit(100);

    // Group by student
    const studentXP = {};
    xpRecords.forEach(record => {
      const studentId = record.userId._id.toString();
      if (!studentXP[studentId]) {
        studentXP[studentId] = {
          student: record.userId,
          totalXP: 0,
          records: []
        };
      }
      studentXP[studentId].totalXP += record.xpEarned || 0;
      studentXP[studentId].records.push({
        xp: record.xpEarned || 0,
        date: record.completedAt,
        type: record.gameType,
        reason: record.gameData?.reason || 'Game/Activity'
      });
    });

    return {
      success: true,
      classId,
      studentXP: Object.values(studentXP)
    };
  } catch (error) {
    logger.error('Get class XP history error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  assignGroupXP,
  getClassXPHistory
};

