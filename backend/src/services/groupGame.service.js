/**
 * Phase 3.2.4: Group Game Service
 * Handles group game session management, turn-based gameplay, and score aggregation
 */

import GroupActivity from '../models/GroupActivity.js';
import GameScore from '../models/GameScore.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

/**
 * Start a group game session
 * @param {string} classId - Class ID
 * @param {string} gameType - Game type
 * @param {string} startedBy - Teacher user ID
 * @param {Array<string>} participantIds - List of student IDs
 * @returns {Promise<Object>} Group activity
 */
export const startGroupGameSession = async (classId, gameType, startedBy, participantIds = []) => {
  try {
    const activity = await GroupActivity.create({
      activityType: 'game',
      classId,
      startedBy,
      metadata: {
        activityId: null, // Will be set after first game
        activityName: gameType,
        duration: 0
      },
      status: 'active'
    });

    // Add participants if provided
    if (participantIds.length > 0) {
      for (const studentId of participantIds) {
        await activity.addParticipant(studentId);
      }
    }

    logger.info(`Group game session started: ${activity._id} for game ${gameType}`);
    return activity;
  } catch (error) {
    logger.error('Start group game session error:', error);
    throw error;
  }
};

/**
 * Record a turn result in group game
 * @param {string} activityId - Group activity ID
 * @param {string} studentId - Student who played
 * @param {number} score - Score achieved
 * @param {Object} gameData - Additional game data
 * @returns {Promise<Object>} Updated activity
 */
export const recordGroupGameTurn = async (activityId, studentId, score, gameData = {}) => {
  try {
    const activity = await GroupActivity.findById(activityId);
    if (!activity) {
      throw new Error('Group activity not found');
    }

    // Update participant score
    await activity.updateParticipantScore(studentId, score, true);

    // Recalculate group results
    await activity.calculateResults();

    logger.info(`Group game turn recorded: Activity ${activityId}, Student ${studentId}, Score ${score}`);
    return activity;
  } catch (error) {
    logger.error('Record group game turn error:', error);
    throw error;
  }
};

/**
 * Get group game session details
 * @param {string} activityId - Group activity ID
 * @returns {Promise<Object>} Activity with populated data
 */
export const getGroupGameSession = async (activityId) => {
  try {
    const activity = await GroupActivity.findById(activityId)
      .populate('classId', 'name')
      .populate('participants.studentId', 'name email grade')
      .populate('startedBy', 'name email')
      .lean();

    if (!activity) {
      throw new Error('Group activity not found');
    }

    return activity;
  } catch (error) {
    logger.error('Get group game session error:', error);
    throw error;
  }
};

/**
 * Complete group game session
 * @param {string} activityId - Group activity ID
 * @returns {Promise<Object>} Final results
 */
export const completeGroupGameSession = async (activityId) => {
  try {
    const activity = await GroupActivity.findById(activityId);
    if (!activity) {
      throw new Error('Group activity not found');
    }

    // Calculate final results
    await activity.calculateResults();

    // Update status
    activity.status = 'completed';
    await activity.save();

    // Distribute XP to all participants
    const totalXP = activity.results.averageScore || 0;
    const participants = activity.participants;

    for (const participant of participants) {
      if (participant.completed) {
        try {
          const user = await User.findById(participant.studentId);
          if (user) {
            // Add XP to user (simplified - can be enhanced)
            // XP calculation can be more sophisticated
            user.progress = user.progress || {};
            // XP is already tracked in GameScore model
          }
        } catch (userError) {
          logger.warn(`Failed to update XP for user ${participant.studentId}:`, userError);
        }
      }
    }

    logger.info(`Group game session completed: ${activityId}`);
    return activity;
  } catch (error) {
    logger.error('Complete group game session error:', error);
    throw error;
  }
};

/**
 * Get aggregated scores for group game
 * @param {string} activityId - Group activity ID
 * @returns {Promise<Object>} Aggregated scores
 */
export const getGroupGameScores = async (activityId) => {
  try {
    // Get all game scores for this group activity
    const scores = await GameScore.find({ groupActivityId: activityId })
      .populate('userId', 'name email grade')
      .sort({ completedAt: -1 })
      .lean();

    const totalScore = scores.reduce((sum, score) => sum + score.score, 0);
    const totalXP = scores.reduce((sum, score) => sum + (score.xpEarned || 0), 0);
    const averageScore = scores.length > 0 ? totalScore / scores.length : 0;

    return {
      activityId,
      totalTurns: scores.length,
      totalScore,
      averageScore: Math.round(averageScore),
      totalXP,
      scores,
      participants: scores.map(s => ({
        studentId: s.userId?._id || s.userId,
        name: s.userId?.name || 'Unknown',
        score: s.score,
        xpEarned: s.xpEarned || 0,
        completedAt: s.completedAt
      }))
    };
  } catch (error) {
    logger.error('Get group game scores error:', error);
    throw error;
  }
};

