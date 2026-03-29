/**
 * Phase 3.3.5: Leaderboard Service
 * Enhanced leaderboard system with Redis support for high-performance rankings
 */

import { getRedisClient } from '../config/redis.js';
import User from '../models/User.js';
import QuizResult from '../models/QuizResult.js';
import DrillLog from '../models/DrillLog.js';
import GameScore from '../models/GameScore.js';
import Class from '../models/Class.js';
import BadgeHistory from '../models/BadgeHistory.js';
import logger from '../config/logger.js';

// Redis key prefixes
const REDIS_PREFIXES = {
  LEADERBOARD: 'leaderboard',
  SQUAD: 'squad',
  CACHE: 'leaderboard_cache',
};

/**
 * Check if Redis is available
 */
const isRedisAvailable = () => {
  try {
    const client = getRedisClient();
    return client !== null && client.isReady;
  } catch (error) {
    return false;
  }
};

/**
 * Get Redis key for leaderboard
 */
const getLeaderboardKey = (type, scope, scopeId) => {
  if (scope && scopeId) {
    return `${REDIS_PREFIXES.LEADERBOARD}:${type}:${scope}:${scopeId}`;
  }
  return `${REDIS_PREFIXES.LEADERBOARD}:${type}`;
};

/**
 * Update user score in Redis sorted set
 */
const updateRedisScore = async (key, userId, score) => {
  if (!isRedisAvailable()) return false;

  try {
    const client = getRedisClient();
    // Use sorted set - score determines rank (higher is better)
    await client.zAdd(key, {
      score: score,
      value: userId.toString(),
    });
    return true;
  } catch (error) {
    logger.warn(`Redis update failed for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Get leaderboard from Redis
 */
const getRedisLeaderboard = async (key, limit = 50) => {
  if (!isRedisAvailable()) return null;

  try {
    const client = getRedisClient();
    // Get top N members (highest scores first)
    const members = await client.zRangeWithScores(key, 0, limit - 1, {
      REV: true, // Reverse order (highest first)
    });

    return members.map((member, index) => ({
      userId: member.value,
      score: member.score,
      rank: index + 1,
    }));
  } catch (error) {
    logger.warn(`Redis get failed for key ${key}:`, error.message);
    return null;
  }
};

/**
 * Get overall/preparedness score leaderboard
 */
export const getPreparednessLeaderboard = async (
  institutionId,
  limit = 50,
  useRedis = true
) => {
  try {
    const redisKey = getLeaderboardKey('preparedness', 'institution', institutionId);

    // Try Redis first
    if (useRedis && isRedisAvailable()) {
      const redisLeaderboard = await getRedisLeaderboard(redisKey, limit);
      if (redisLeaderboard && redisLeaderboard.length > 0) {
        // Populate user details
        const userIds = redisLeaderboard.map((entry) => entry.userId);
        const users = await User.find({ _id: { $in: userIds } })
          .select('name email')
          .lean();

        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        return redisLeaderboard
          .map((entry) => {
            const user = userMap.get(entry.userId);
            return user
              ? {
                  rank: entry.rank,
                  userId: entry.userId,
                  name: user.name,
                  email: user.email,
                  score: entry.score,
                }
              : null;
          })
          .filter(Boolean);
      }
    }

    // Fallback to MongoDB
    const users = await User.find({
      institutionId,
      role: 'student',
      isActive: true,
      'progress.preparednessScore': { $exists: true },
    })
      .select('name email progress.preparednessScore')
      .sort({ 'progress.preparednessScore': -1 })
      .limit(limit)
      .lean();

    return users.map((user, index) => ({
      rank: index + 1,
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      score: user.progress?.preparednessScore || 0,
    }));
  } catch (error) {
    logger.error('Get preparedness leaderboard error:', error);
    throw error;
  }
};

/**
 * Get quiz leaderboard
 */
export const getQuizLeaderboard = async (institutionId, limit = 50) => {
  try {
    const quizStats = await QuizResult.aggregate([
      {
        $match: {
          institutionId: institutionId instanceof String
            ? institutionId
            : institutionId,
        },
      },
      {
        $group: {
          _id: '$userId',
          avgScore: { $avg: '$score' },
          totalQuizzes: { $sum: 1 },
          totalPoints: { $sum: '$totalPoints' },
        },
      },
      {
        $sort: { avgScore: -1 },
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          avgScore: { $round: ['$avgScore', 2] },
          totalQuizzes: '$totalQuizzes',
          totalPoints: '$totalPoints',
        },
      },
    ]);

    return quizStats.map((stat, index) => ({
      rank: index + 1,
      ...stat,
    }));
  } catch (error) {
    logger.error('Get quiz leaderboard error:', error);
    throw error;
  }
};

/**
 * Get game leaderboard
 */
export const getGameLeaderboard = async (
  gameType,
  institutionId = null,
  limit = 50
) => {
  try {
    const query = { gameType };

    if (institutionId) {
      query.institutionId = institutionId;
    }

    const gameScores = await GameScore.find(query)
      .sort({ score: -1, timeTaken: 1 })
      .limit(limit)
      .populate('userId', 'name email')
      .lean();

    // Group by user and get best score
    const userScoresMap = new Map();

    gameScores.forEach((score) => {
      // Handle null userId (user might be deleted)
      if (!score.userId || !score.userId._id) {
        return; // Skip scores without valid user
      }
      
      const userId = score.userId._id.toString();
      const existing = userScoresMap.get(userId);

      if (
        !existing ||
        score.score > existing.score ||
        (score.score === existing.score && 
         (existing.timeTaken === null || score.timeTaken === null || score.timeTaken < existing.timeTaken))
      ) {
        userScoresMap.set(userId, {
          userId: score.userId._id,
          name: score.userId.name || 'Unknown',
          email: score.userId.email || null,
          score: score.score,
          maxScore: score.maxScore,
          timeTaken: score.timeTaken,
          gameType: score.gameType,
        });
      }
    });

    const leaderboard = Array.from(userScoresMap.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timeTaken - b.timeTaken;
      })
      .slice(0, limit);

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
  } catch (error) {
    logger.error('Get game leaderboard error:', error);
    throw error;
  }
};

/**
 * Get badge leaderboard
 */
export const getBadgeLeaderboard = async (institutionId, limit = 50) => {
  try {
    // Get all students in the institution
    const students = await User.find({
      institutionId,
      role: 'student',
    })
      .select('_id name email')
      .lean();

    const studentIds = students.map((s) => s._id);

    // Get badge counts per user
    const badgeStats = await BadgeHistory.aggregate([
      {
        $match: {
          userId: { $in: studentIds },
        },
      },
      {
        $group: {
          _id: '$userId',
          badgeCount: { $sum: 1 },
        },
      },
    ]);

    // Create a map for badge counts
    const badgeCountMap = new Map(
      badgeStats.map((stat) => [stat._id.toString(), stat.badgeCount])
    );

    // Build leaderboard with user details
    const leaderboard = students
      .map((student) => ({
        userId: student._id,
        name: student.name,
        email: student.email,
        badgeCount: badgeCountMap.get(student._id.toString()) || 0,
      }))
      .filter((entry) => entry.badgeCount > 0) // Only show users with badges
      .sort((a, b) => b.badgeCount - a.badgeCount)
      .slice(0, limit);

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
  } catch (error) {
    logger.error('Get badge leaderboard error:', error);
    // If BadgeHistory doesn't exist or has issues, return empty
    return [];
  }
};

/**
 * Get class leaderboard (aggregated class scores)
 */
export const getClassLeaderboard = async (institutionId, limit = 50) => {
  try {
    const classes = await Class.find({ institutionId, isActive: true })
      .populate('studentIds', 'progress.preparednessScore')
      .lean();

    const classStats = classes.map((classData) => {
      const students = classData.studentIds || [];
      const totalScore = students.reduce(
        (sum, student) =>
          sum + (student?.progress?.preparednessScore || 0),
        0
      );
      const avgScore =
        students.length > 0 ? Math.round(totalScore / students.length) : 0;

      return {
        classId: classData._id,
        classCode: classData.classCode,
        grade: classData.grade,
        section: classData.section,
        studentCount: students.length,
        averageScore: avgScore,
        totalScore: totalScore,
      };
    });

    return classStats
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, limit)
      .map((stat, index) => ({
        rank: index + 1,
        ...stat,
      }));
  } catch (error) {
    logger.error('Get class leaderboard error:', error);
    throw error;
  }
};

/**
 * Get Squad Wars leaderboard (team competitions)
 */
export const getSquadWarsLeaderboard = async (
  institutionId,
  limit = 20
) => {
  try {
    // Squad Wars: Teams compete based on aggregated class performance
    const classes = await Class.find({ institutionId, isActive: true })
      .populate('studentIds', 'progress.preparednessScore')
      .lean();

    const squadStats = classes.map((classData) => {
      const students = classData.studentIds || [];
      const totalScore = students.reduce(
        (sum, student) =>
          sum + (student?.progress?.preparednessScore || 0),
        0
      );
      const avgScore =
        students.length > 0 ? Math.round(totalScore / students.length) : 0;

      // Calculate squad points (combination of avg score, participation, growth)
      const squadPoints = Math.round(
        avgScore * 0.7 + students.length * 2 + avgScore * 0.3
      );

      return {
        squadId: classData._id.toString(),
        squadName: `${classData.grade}-${classData.section}`,
        classCode: classData.classCode,
        grade: classData.grade,
        section: classData.section,
        memberCount: students.length,
        averageScore: avgScore,
        squadPoints: squadPoints,
      };
    });

    return squadStats
      .sort((a, b) => b.squadPoints - a.squadPoints)
      .slice(0, limit)
      .map((stat, index) => ({
        rank: index + 1,
        ...stat,
      }));
  } catch (error) {
    logger.error('Get Squad Wars leaderboard error:', error);
    throw error;
  }
};

/**
 * Update user score in leaderboard (called when scores change)
 * Also emits Socket.io event for real-time updates
 */
export const updateUserScore = async (
  userId,
  score,
  type = 'preparedness',
  institutionId = null,
  io = null
) => {
  try {
    if (isRedisAvailable() && institutionId) {
      const redisKey = getLeaderboardKey(
        type,
        'institution',
        institutionId
      );
      await updateRedisScore(redisKey, userId, score);
    }

    // Phase 3.3.5: Emit real-time leaderboard update via Socket.io (non-blocking)
    if (io && institutionId) {
      try {
        // Emit to school room
        io.to(`school:${institutionId}`).emit('LEADERBOARD_UPDATED', {
          type,
          userId,
          score,
          institutionId,
          timestamp: new Date().toISOString(),
        });
      } catch (socketError) {
        logger.warn('Failed to emit leaderboard update via Socket.io:', socketError.message);
      }
    }
  } catch (error) {
    logger.warn('Failed to update Redis score:', error.message);
  }
};

/**
 * Refresh leaderboard cache (rebuild from MongoDB)
 */
export const refreshLeaderboardCache = async (
  type,
  institutionId,
  limit = 1000
) => {
  try {
    if (!isRedisAvailable()) return false;

    const redisKey = getLeaderboardKey(type, 'institution', institutionId);

    // Get fresh data from MongoDB
    let users;
    if (type === 'preparedness') {
      users = await User.find({
        institutionId,
        role: 'student',
        isActive: true,
        'progress.preparednessScore': { $exists: true },
      })
        .select('_id progress.preparednessScore')
        .sort({ 'progress.preparednessScore': -1 })
        .limit(limit)
        .lean();
    } else {
      return false;
    }

    // Clear and rebuild Redis sorted set
    const client = getRedisClient();
    await client.del(redisKey);

    if (users.length > 0) {
      const members = users.map((user) => ({
        score: user.progress?.preparednessScore || 0,
        value: user._id.toString(),
      }));

      await client.zAdd(redisKey, members);
    }

    return true;
  } catch (error) {
    logger.error('Refresh leaderboard cache error:', error);
    return false;
  }
};

