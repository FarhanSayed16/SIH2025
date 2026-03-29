/**
 * Phase 4.8: ML Prediction Service
 * Provides predictive analytics using rule-based and statistical models
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import Drill from '../models/Drill.js';
import DrillLog from '../models/DrillLog.js';
import EventLog from '../models/EventLog.js';
import Alert from '../models/Alert.js';
import QuizResult from '../models/QuizResult.js';
import Module from '../models/Module.js';
import logger from '../config/logger.js';

/**
 * Predict student risk score (0-100)
 * Higher score = higher risk
 */
export const predictStudentRisk = async (userId, institutionId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get historical data
    const drillStats = await DrillLog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          institutionId: new mongoose.Types.ObjectId(institutionId),
        },
      },
      {
        $group: {
          _id: null,
          avgEvacuationTime: { $avg: '$evacuationTime' },
          totalDrills: { $sum: 1 },
          recentDrills: {
            $sum: {
              $cond: [
                { $gte: ['$completedAt', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const drillData = drillStats[0] || {
      avgEvacuationTime: 300, // Default 5 minutes
      totalDrills: 0,
      recentDrills: 0,
    };

    // Get module completion rate
    const moduleEvents = await EventLog.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      institutionId: new mongoose.Types.ObjectId(institutionId),
      eventType: 'module_complete',
    });

    const totalModules = await Module.countDocuments({
      institutionId: new mongoose.Types.ObjectId(institutionId),
      isActive: true,
    });

    const moduleCompletionRate = totalModules > 0 ? (moduleEvents / totalModules) * 100 : 0;

    // Get quiz performance
    const quizResults = await QuizResult.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          institutionId: new mongoose.Types.ObjectId(institutionId),
        },
      },
      {
        $group: {
          _id: null,
          avgAccuracy: { $avg: '$accuracy' },
          totalQuizzes: { $sum: 1 },
        },
      },
    ]);

    const quizData = quizResults[0] || { avgAccuracy: 0, totalQuizzes: 0 };

    // Get drill participation rate
    const totalDrills = await Drill.countDocuments({
      institutionId: new mongoose.Types.ObjectId(institutionId),
      status: { $in: ['completed', 'in_progress'] },
    });

    const participationRate =
      totalDrills > 0 ? (drillData.totalDrills / totalDrills) * 100 : 0;

    // Calculate age factor (younger students might need more help)
    const ageFactor = user.grade
      ? parseFloat(user.grade) < 5
        ? 30
        : parseFloat(user.grade) < 9
          ? 20
          : 10
      : 20;

    // Location risk (if user has location data, higher risk if in high-risk area)
    const locationRisk = 10; // Default, can be enhanced with location-based risk assessment

    // Calculate risk score
    const responseTimeRisk = Math.min((drillData.avgEvacuationTime / 600) * 30, 30); // Max 30 points
    const moduleRisk = Math.max(0, (100 - moduleCompletionRate) / 100) * 20; // Max 20 points
    const quizRisk = Math.max(0, (100 - quizData.avgAccuracy) / 100) * 20; // Max 20 points
    const participationRisk =
      Math.max(0, (100 - participationRate) / 100) * 15; // Max 15 points
    const ageRisk = ageFactor; // Max 30 points (already scaled)
    const locationRiskScore = locationRisk; // 10 points

    const riskScore = Math.min(
      Math.round(
        responseTimeRisk +
          moduleRisk +
          quizRisk +
          participationRisk +
          ageRisk +
          locationRiskScore
      ),
      100
    );

    // Risk level categorization
    let riskLevel = 'low';
    if (riskScore >= 70) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';

    return {
      riskScore,
      riskLevel,
      factors: {
        responseTime: Math.round(responseTimeRisk),
        moduleCompletion: Math.round(moduleRisk),
        quizPerformance: Math.round(quizRisk),
        participation: Math.round(participationRisk),
        age: ageRisk,
        location: locationRiskScore,
      },
      historicalData: {
        avgEvacuationTime: Math.round(drillData.avgEvacuationTime || 0),
        totalDrills: drillData.totalDrills || 0,
        moduleCompletionRate: Math.round(moduleCompletionRate),
        quizAccuracy: Math.round(quizData.avgAccuracy || 0),
        participationRate: Math.round(participationRate),
      },
    };
  } catch (error) {
    logger.error('Predict student risk error:', error);
    throw error;
  }
};

/**
 * Predict drill performance
 */
export const predictDrillPerformance = async (drillType, institutionId) => {
  try {
    // Get historical drill data
    const historicalDrills = await Drill.aggregate([
      {
        $match: {
          institutionId: new mongoose.Types.ObjectId(institutionId),
          status: 'completed',
          ...(drillType ? { type: drillType } : {}),
        },
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$results.avgEvacuationTime' },
          avgParticipationRate: { $avg: '$results.participationRate' },
          totalDrills: { $sum: 1 },
          bestResponseTime: { $min: '$results.avgEvacuationTime' },
          worstResponseTime: { $max: '$results.avgEvacuationTime' },
        },
      },
    ]);

    const drillData = historicalDrills[0] || {
      avgResponseTime: 300,
      avgParticipationRate: 80,
      totalDrills: 0,
      bestResponseTime: 180,
      worstResponseTime: 600,
    };

    // Get current time factors
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hourOfDay = now.getHours();

    // Day of week factor (weekdays typically better than weekends)
    const dayFactor = dayOfWeek >= 1 && dayOfWeek <= 5 ? 0.95 : 1.1; // Weekend = 10% slower

    // Time of day factor (peak hours = slower)
    let timeFactor = 1.0;
    if (hourOfDay >= 8 && hourOfDay <= 10) {
      timeFactor = 1.15; // Morning rush
    } else if (hourOfDay >= 14 && hourOfDay <= 16) {
      timeFactor = 1.1; // Afternoon
    } else {
      timeFactor = 0.95; // Off-peak
    }

    // Predict response time with factors
    const predictedResponseTime = Math.round(
      (drillData.avgResponseTime || 300) * dayFactor * timeFactor
    );

    // Predict participation rate (slight variation based on day/time)
    const predictedParticipationRate = Math.max(
      50,
      Math.min(
        100,
        Math.round((drillData.avgParticipationRate || 80) * (1 / dayFactor) * 0.98)
      )
    );

    return {
      predictedResponseTime,
      predictedParticipationRate,
      confidence: drillData.totalDrills > 0 ? Math.min(drillData.totalDrills / 10, 1.0) : 0.3,
      factors: {
        dayOfWeek,
        hourOfDay,
        dayFactor: Math.round(dayFactor * 100) / 100,
        timeFactor: Math.round(timeFactor * 100) / 100,
      },
      historicalBaseline: {
        avgResponseTime: Math.round(drillData.avgResponseTime || 300),
        avgParticipationRate: Math.round(drillData.avgParticipationRate || 80),
        totalHistoricalDrills: drillData.totalDrills || 0,
      },
    };
  } catch (error) {
    logger.error('Predict drill performance error:', error);
    throw error;
  }
};

/**
 * Predict optimal drill timing
 */
export const predictOptimalDrillTiming = async (institutionId) => {
  try {
    // Analyze historical drill performance by day/time
    const drillAnalysis = await Drill.aggregate([
      {
        $match: {
          institutionId: new mongoose.Types.ObjectId(institutionId),
          status: 'completed',
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$actualStart' },
            hourOfDay: { $hour: '$actualStart' },
          },
          avgParticipationRate: { $avg: '$results.participationRate' },
          avgResponseTime: { $avg: '$results.avgEvacuationTime' },
          drillCount: { $sum: 1 },
        },
      },
      {
        $sort: { avgParticipationRate: -1, avgResponseTime: 1 },
      },
    ]);

    // If we have historical data, find best times
    if (drillAnalysis.length > 0) {
      const bestSlots = drillAnalysis.slice(0, 5).map((slot) => ({
        dayOfWeek: slot._id.dayOfWeek - 1, // Convert to 0-6 (Sunday-Saturday)
        hourOfDay: slot._id.hourOfDay,
        predictedParticipationRate: Math.round(slot.avgParticipationRate),
        predictedResponseTime: Math.round(slot.avgResponseTime),
        confidence: Math.min(slot.drillCount / 5, 1.0),
      }));

      return {
        optimalTimings: bestSlots,
        recommendation: bestSlots[0] || null,
      };
    }

    // Default recommendations if no historical data
    return {
      optimalTimings: [
        {
          dayOfWeek: 2, // Tuesday
          hourOfDay: 10,
          predictedParticipationRate: 85,
          predictedResponseTime: 250,
          confidence: 0.5,
        },
        {
          dayOfWeek: 3, // Wednesday
          hourOfDay: 14,
          predictedParticipationRate: 82,
          predictedResponseTime: 270,
          confidence: 0.5,
        },
        {
          dayOfWeek: 1, // Monday
          hourOfDay: 11,
          predictedParticipationRate: 80,
          predictedResponseTime: 280,
          confidence: 0.5,
        },
      ],
      recommendation: {
        dayOfWeek: 2,
        hourOfDay: 10,
        predictedParticipationRate: 85,
        predictedResponseTime: 250,
        confidence: 0.5,
      },
    };
  } catch (error) {
    logger.error('Predict optimal drill timing error:', error);
    throw error;
  }
};

/**
 * Detect anomalies in drill performance
 */
export const detectDrillAnomalies = async (institutionId, drillId = null) => {
  try {
    const matchQuery = {
      institutionId: new mongoose.Types.ObjectId(institutionId),
      status: 'completed',
    };

    if (drillId) {
      matchQuery._id = new mongoose.Types.ObjectId(drillId);
    }

    // Get all completed drills
    const drills = await Drill.aggregate([
      { $match: matchQuery },
      {
        $project: {
          type: 1,
          results: 1,
          actualStart: 1,
          scheduledAt: 1,
        },
      },
    ]);

    if (drills.length < 2) {
      return { anomalies: [], message: 'Insufficient data for anomaly detection' };
    }

    // Calculate statistics
    const avgParticipation = drills.reduce((sum, d) => sum + (d.results?.participationRate || 0), 0) / drills.length;
    const avgResponseTime = drills.reduce((sum, d) => sum + (d.results?.avgEvacuationTime || 0), 0) / drills.length;

    // Calculate standard deviations
    const participationVariance = drills.reduce(
      (sum, d) => sum + Math.pow((d.results?.participationRate || 0) - avgParticipation, 2),
      0
    ) / drills.length;
    const participationStdDev = Math.sqrt(participationVariance);

    const responseTimeVariance = drills.reduce(
      (sum, d) => sum + Math.pow((d.results?.avgEvacuationTime || 0) - avgResponseTime, 2),
      0
    ) / drills.length;
    const responseTimeStdDev = Math.sqrt(responseTimeVariance);

    // Detect anomalies (values more than 2 standard deviations from mean)
    const anomalies = [];

    for (const drill of drills) {
      const participation = drill.results?.participationRate || 0;
      const responseTime = drill.results?.avgEvacuationTime || 0;

      const participationZScore = participationStdDev > 0
        ? Math.abs((participation - avgParticipation) / participationStdDev)
        : 0;
      const responseTimeZScore = responseTimeStdDev > 0
        ? Math.abs((responseTime - avgResponseTime) / responseTimeStdDev)
        : 0;

      if (participationZScore > 2 || responseTimeZScore > 2) {
        anomalies.push({
          drillId: drill._id.toString(),
          type: drill.type,
          date: drill.actualStart || drill.scheduledAt,
          anomalyType:
            participationZScore > 2 && responseTimeZScore > 2
              ? 'both'
              : participationZScore > 2
                ? 'participation'
                : 'response_time',
          details: {
            participationRate: Math.round(participation),
            avgParticipationRate: Math.round(avgParticipation),
            participationZScore: Math.round(participationZScore * 100) / 100,
            responseTime: Math.round(responseTime),
            avgResponseTime: Math.round(avgResponseTime),
            responseTimeZScore: Math.round(responseTimeZScore * 100) / 100,
          },
          severity: participationZScore > 3 || responseTimeZScore > 3 ? 'high' : 'medium',
        });
      }
    }

    return {
      anomalies,
      summary: {
        totalDrills: drills.length,
        anomaliesDetected: anomalies.length,
        avgParticipationRate: Math.round(avgParticipation),
        avgResponseTime: Math.round(avgResponseTime),
      },
    };
  } catch (error) {
    logger.error('Detect drill anomalies error:', error);
    throw error;
  }
};

/**
 * Forecast student progress
 */
export const forecastStudentProgress = async (userId, institutionId) => {
  try {
    // Get historical progress data
    const recentEvents = await EventLog.find({
      userId: new mongoose.Types.ObjectId(userId),
      institutionId: new mongoose.Types.ObjectId(institutionId),
    })
      .sort({ timestamp: -1 })
      .limit(100);

    // Calculate engagement rate (events per week)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEventsCount = recentEvents.filter((e) => e.timestamp >= thirtyDaysAgo).length;
    const engagementRate = recentEventsCount / 30; // events per day

    // Get module completion trend
    const moduleCompletions = recentEvents.filter((e) => e.eventType === 'module_complete');
    const completionTrend = moduleCompletions.length > 0 ? 'increasing' : 'stable';

    // Get quiz performance trend
    const quizEvents = recentEvents.filter((e) => e.eventType === 'quiz_complete');
    const quizTrend = quizEvents.length > 0 ? 'improving' : 'stable';

    // Forecast next 30 days
    const predictedModuleCompletions = Math.round(engagementRate * 0.3 * 30); // Assuming 30% of events are modules
    const predictedQuizCompletions = Math.round(engagementRate * 0.2 * 30); // 20% are quizzes

    // Confidence based on historical data
    const confidence = Math.min(recentEvents.length / 50, 1.0);

    return {
      forecast: {
        next30Days: {
          predictedModuleCompletions,
          predictedQuizCompletions,
          predictedEngagementDays: Math.round(engagementRate * 30),
        },
        trends: {
          moduleCompletion: completionTrend,
          quizPerformance: quizTrend,
          engagement: engagementRate > 0.5 ? 'high' : engagementRate > 0.2 ? 'medium' : 'low',
        },
      },
      currentMetrics: {
        recentEngagementRate: Math.round(engagementRate * 100) / 100,
        totalRecentEvents: recentEventsCount,
        moduleCompletions: moduleCompletions.length,
        quizCompletions: quizEvents.length,
      },
      confidence: Math.round(confidence * 100) / 100,
    };
  } catch (error) {
    logger.error('Forecast student progress error:', error);
    throw error;
  }
};

/**
 * Batch predict student risks for multiple users
 */
export const batchPredictStudentRisks = async (institutionId, userIds = null) => {
  try {
    const matchQuery = {
      institutionId: new mongoose.Types.ObjectId(institutionId),
      role: 'student',
    };

    if (userIds && userIds.length > 0) {
      matchQuery._id = { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    const students = await User.find(matchQuery).select('_id name grade');

    const predictions = await Promise.all(
      students.map(async (student) => {
        try {
          const prediction = await predictStudentRisk(student._id, institutionId);
          return {
            userId: student._id.toString(),
            name: student.name,
            grade: student.grade,
            ...prediction,
          };
        } catch (error) {
          logger.error(`Error predicting risk for student ${student._id}:`, error);
          return {
            userId: student._id.toString(),
            name: student.name,
            grade: student.grade,
            riskScore: 50,
            riskLevel: 'medium',
            error: error.message,
          };
        }
      })
    );

    // Sort by risk score (highest first)
    predictions.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

    return {
      predictions,
      summary: {
        total: predictions.length,
        highRisk: predictions.filter((p) => p.riskLevel === 'high').length,
        mediumRisk: predictions.filter((p) => p.riskLevel === 'medium').length,
        lowRisk: predictions.filter((p) => p.riskLevel === 'low').length,
      },
    };
  } catch (error) {
    logger.error('Batch predict student risks error:', error);
    throw error;
  }
};

