/**
 * Phase 3.3.1: Preparedness Score Engine
 * Calculates comprehensive preparedness score based on:
 * - Module Completion (40%)
 * - Game Performance (25%)
 * - Quiz Accuracy (20%)
 * - Drill Participation (10%)
 * - Daily Logins/Streaks (5%)
 */

import User from '../models/User.js';
import Module from '../models/Module.js';
import ModuleProgress from '../models/ModuleProgress.js';
import QuizResult from '../models/QuizResult.js';
import GameScore from '../models/GameScore.js';
import Drill from '../models/Drill.js';
import DrillLog from '../models/DrillLog.js';
import logger from '../config/logger.js';

/**
 * Calculate preparedness score for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Score breakdown and total
 */
export const calculatePreparednessScore = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all score components
    const components = await Promise.all([
      calculateModuleScore(userId),
      calculateGameScore(userId),
      calculateQuizScore(userId),
      calculateDrillScore(userId),
      calculateStreakScore(userId),
    ]);

    const [moduleScore, gameScore, quizScore, drillScore, streakScore] = components;

    // Calculate weighted total
    const totalScore = Math.round(
      moduleScore * 0.4 +
      gameScore * 0.25 +
      quizScore * 0.2 +
      drillScore * 0.1 +
      streakScore * 0.05
    );

    const breakdown = {
      module: { score: moduleScore, weight: 40, max: 100 },
      game: { score: gameScore, weight: 25, max: 100 },
      quiz: { score: quizScore, weight: 20, max: 100 },
      drill: { score: drillScore, weight: 10, max: 100 },
      streak: { score: streakScore, weight: 5, max: 100 },
      total: totalScore,
      lastUpdated: new Date(),
    };

    // Update user's preparedness score
    user.progress = user.progress || {};
    const previousScore = user.progress.preparednessScore || 0;
    user.progress.preparednessScore = totalScore;
    user.progress.scoreBreakdown = breakdown;
    await user.save();

    logger.info(`Preparedness score calculated for user ${userId}: ${totalScore}`);

    // Phase 3.3.4: Check and generate certificates on score milestones (non-blocking)
    // Only check if score increased past milestones
    if (totalScore !== previousScore) {
      const { checkAndGenerateCertificates } = await import('./certificate.service.js');
      checkAndGenerateCertificates(userId, 'score_update', {
        previousScore,
        newScore: totalScore,
        breakdown
      }).catch(err => {
        logger.warn('Failed to check certificates after score update:', err);
      });

      // Phase 3.3.5: Update Redis leaderboard (non-blocking)
      if (user.institutionId) {
        const { updateUserScore } = await import('./leaderboard.service.js');
        const { getSocketIO } = await import('../config/socket.js');
        const io = getSocketIO();
        updateUserScore(userId, totalScore, 'preparedness', user.institutionId, io).catch(err => {
          logger.warn('Failed to update Redis leaderboard:', err);
        });
      }
    }

    return breakdown;
  } catch (error) {
    logger.error('Calculate preparedness score error:', error);
    throw error;
  }
};

/**
 * Calculate module completion score (0-100)
 * Based on percentage of modules completed across all types:
 * - NDMA Interactive modules (from User.progress.completedModules)
 * - NDRF modules (from ModuleProgress)
 * - Hearing Impaired modules (from ModuleProgress)
 */
const calculateModuleScore = async (userId) => {
  try {
    const user = await User.findById(userId).select('progress');
    if (!user) return 0;

    // 1. Get NDMA module completion (legacy - from User.progress.completedModules)
    const totalNdmaModules = await Module.countDocuments({ isActive: true });
    const completedNdmaModules = user.progress?.completedModules?.length || 0;
    const ndmaCompletionRate = totalNdmaModules > 0 
      ? (completedNdmaModules / totalNdmaModules) * 100 
      : 0;

    // 2. Get NDRF module completion (from ModuleProgress)
    const ndrfProgress = await ModuleProgress.find({ 
      userId, 
      moduleType: 'ndrf',
      isCompleted: true 
    });
    
    // Count unique NDRF modules (group by moduleId + language)
    // Each language completion counts as one module completion
    const uniqueNdrfModules = new Set();
    ndrfProgress.forEach(progress => {
      const key = `${progress.moduleId}_${progress.language || 'default'}`;
      uniqueNdrfModules.add(key);
    });
    const completedNdrfModules = uniqueNdrfModules.size;
    
    // Total NDRF modules: Based on actual data, there are ~23 videos per language
    // With multiple languages (Assamese, Bangla, English, Hindi, Marathi, Punjabi, etc.)
    // We count each language as a separate module completion opportunity
    // Estimated: ~10 languages × 1 completion per language = 10 potential completions
    // (Each language has ~23 videos, but completion is tracked per language)
    const estimatedTotalNdrfModules = 10; // One completion per language
    const ndrfCompletionRate = estimatedTotalNdrfModules > 0
      ? (completedNdrfModules / estimatedTotalNdrfModules) * 100
      : 0;

    // 3. Get Hearing Impaired module completion (from ModuleProgress)
    const hearingImpairedProgress = await ModuleProgress.find({ 
      userId, 
      moduleType: 'hearing_impaired',
      isCompleted: true 
    });
    const completedHearingImpairedModules = hearingImpairedProgress.length;
    
    // Total Hearing Impaired modules: Based on actual data, there are 13 videos total
    // Completion is tracked when all videos in the module are watched
    const estimatedTotalHearingImpairedModules = 1; // One module with 13 videos
    const hearingImpairedCompletionRate = estimatedTotalHearingImpairedModules > 0
      ? (completedHearingImpairedModules / estimatedTotalHearingImpairedModules) * 100
      : 0;

    // 4. Calculate weighted average across all module types
    // Weight: NDMA (50%), NDRF (30%), Hearing Impaired (20%)
    // This gives more weight to NDMA as it's the primary module type
    const totalCompletionRate = 
      (ndmaCompletionRate * 0.5) +
      (ndrfCompletionRate * 0.3) +
      (hearingImpairedCompletionRate * 0.2);

    // If no modules exist at all, return 100 (perfect score)
    if (totalNdmaModules === 0 && estimatedTotalNdrfModules === 0 && estimatedTotalHearingImpairedModules === 0) {
      return 100;
    }

    return Math.min(100, Math.round(totalCompletionRate));
  } catch (error) {
    logger.error('Calculate module score error:', error);
    return 0;
  }
};

/**
 * Calculate game performance score (0-100)
 * Based on average game performance across all games (individual + group mode)
 * Phase 3.3.2: Includes group activities where student participated
 */
const calculateGameScore = async (userId) => {
  try {
    // Get all game scores for this user (includes both individual and group mode)
    const gameScores = await GameScore.find({ userId })
      .sort({ completedAt: -1 })
      .limit(50); // Last 50 games

    if (gameScores.length === 0) return 0;

    // Calculate average performance
    let totalPerformance = 0;
    let count = 0;

    gameScores.forEach(gameScore => {
      if (gameScore.maxScore > 0) {
        const performance = (gameScore.score / gameScore.maxScore) * 100;
        totalPerformance += Math.min(100, performance);
        count++;
      }
    });

    if (count === 0) return 0;

    return Math.round(totalPerformance / count);
  } catch (error) {
    logger.error('Calculate game score error:', error);
    return 0;
  }
};

/**
 * Calculate quiz accuracy score (0-100)
 * Based on average quiz scores
 */
const calculateQuizScore = async (userId) => {
  try {
    const quizResults = await QuizResult.find({ userId });

    if (quizResults.length === 0) return 0;

    const totalScore = quizResults.reduce((sum, result) => sum + result.score, 0);
    const averageScore = totalScore / quizResults.length;

    return Math.round(averageScore);
  } catch (error) {
    logger.error('Calculate quiz score error:', error);
    return 0;
  }
};

/**
 * Calculate drill participation score (0-100)
 * Based on drill participation rate and acknowledgment speed
 */
const calculateDrillScore = async (userId) => {
  try {
    const user = await User.findById(userId).select('institutionId');
    if (!user || !user.institutionId) return 0;

    // Get completed drills at user's institution
    const totalDrills = await Drill.countDocuments({
      institutionId: user.institutionId,
      status: 'completed',
      createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
    });

    if (totalDrills === 0) return 0;

    // Get user's drill logs
    const drillLogs = await DrillLog.find({ userId });

    const participatedDrills = drillLogs.length;
    const participationRate = (participatedDrills / totalDrills) * 100;

    // Calculate average acknowledgment time (faster = better)
    let avgAckTime = null;
    if (drillLogs.length > 0) {
      const ackTimes = drillLogs
        .filter(log => log.acknowledgedAt && log.drillId)
        .map(log => {
          // Calculate time from drill start to acknowledgment
          // This is simplified - actual implementation may vary
          return 60; // Placeholder: assume 60 seconds average
        });

      if (ackTimes.length > 0) {
        avgAckTime = ackTimes.reduce((sum, time) => sum + time, 0) / ackTimes.length;
      }
    }

    // Participation rate contributes 70% of score
    let score = Math.min(100, participationRate * 0.7);

    // Fast acknowledgment contributes 30% (10s = 100%, 60s+ = 0%)
    if (avgAckTime !== null) {
      const ackScore = Math.max(0, (60 - avgAckTime) / 60 * 30);
      score += ackScore;
    }

    return Math.round(score);
  } catch (error) {
    logger.error('Calculate drill score error:', error);
    return 0;
  }
};

/**
 * Calculate streak/login score (0-100)
 * Based on login streak days
 */
const calculateStreakScore = async (userId) => {
  try {
    const user = await User.findById(userId).select('progress lastLoginAt');
    if (!user) return 0;

    // Calculate current streak
    // For now, use a simplified version
    // Full implementation would track daily logins
    const streakDays = user.progress?.loginStreak || 0;

    // Normalize: 30 days = 100 points
    const score = Math.min(100, (streakDays / 30) * 100);

    return Math.round(score);
  } catch (error) {
    logger.error('Calculate streak score error:', error);
    return 0;
  }
};

/**
 * Recalculate preparedness score for a user
 * Triggered after: module completion, game end, quiz submit, drill ack
 * @param {string} userId - User ID
 */
export const recalculateScore = async (userId) => {
  try {
    return await calculatePreparednessScore(userId);
  } catch (error) {
    logger.error('Recalculate score error:', error);
    throw error;
  }
};

/**
 * Get score history for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of history entries
 * @returns {Promise<Array>} Score history
 */
export const getScoreHistory = async (userId, limit = 30) => {
  try {
    // For now, we'll track score history in user's progress
    // In future, can create separate ScoreHistory model
    const user = await User.findById(userId).select('progress');
    
    const history = user.progress?.scoreHistory || [];
    
    return history
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  } catch (error) {
    logger.error('Get score history error:', error);
    return [];
  }
};

/**
 * Add score history entry
 * @param {string} userId - User ID
 * @param {number} score - Score value
 */
export const addScoreHistory = async (userId, score) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.progress = user.progress || {};
    user.progress.scoreHistory = user.progress.scoreHistory || [];
    
    user.progress.scoreHistory.push({
      score,
      date: new Date(),
    });

    // Keep only last 100 entries
    if (user.progress.scoreHistory.length > 100) {
      user.progress.scoreHistory = user.progress.scoreHistory.slice(-100);
    }

    await user.save();
  } catch (error) {
    logger.error('Add score history error:', error);
  }
};

