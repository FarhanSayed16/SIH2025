import Drill from '../models/Drill.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import logger from '../config/logger.js';

/**
 * Get participants based on selection criteria
 */
const getParticipantsForDrill = async (institutionId, participantSelection) => {
  const { type, classIds, grades, userIds } = participantSelection || { type: 'all' };
  
  let participants = [];
  
  switch (type) {
    case 'all':
      // Get all active users in the institution
      participants = await User.find({
        institutionId,
        isActive: true,
        role: { $in: ['student', 'teacher'] }
      }).select('_id role');
      break;
      
    case 'class':
      // Get users from specific classes
      if (classIds && classIds.length > 0) {
        const classes = await Class.find({
          _id: { $in: classIds },
          institutionId
        }).populate('studentIds', '_id role');
        
        for (const classData of classes) {
          if (classData.studentIds) {
            participants.push(...classData.studentIds.map(s => ({ _id: s._id, role: s.role || 'student' })));
          }
          // Add teacher
          if (classData.teacherId) {
            const teacher = await User.findById(classData.teacherId).select('_id role');
            if (teacher) participants.push({ _id: teacher._id, role: teacher.role || 'teacher' });
          }
        }
      }
      break;
      
    case 'grade':
      // Get users from specific grades
      if (grades && grades.length > 0) {
        participants = await User.find({
          institutionId,
          grade: { $in: grades },
          isActive: true,
          role: { $in: ['student', 'teacher'] }
        }).select('_id role');
      }
      break;
      
    case 'specific':
      // Get specific users
      if (userIds && userIds.length > 0) {
        participants = await User.find({
          _id: { $in: userIds },
          institutionId,
          isActive: true
        }).select('_id role');
      }
      break;
  }
  
  // Remove duplicates
  const uniqueParticipants = Array.from(
    new Map(participants.map(p => [p._id.toString(), p])).values()
  );
  
  return uniqueParticipants;
};

/**
 * Schedule a drill
 * Phase 4.2: Enhanced with participant selection
 */
export const scheduleDrill = async (drillData) => {
  try {
    const { participantSelection, institutionId, ...restData } = drillData;
    
    // Get participants based on selection
    const participants = await getParticipantsForDrill(institutionId, participantSelection);
    
    // Create drill with participants
    const drill = await Drill.create({
      ...restData,
      institutionId,
      participantSelection: participantSelection || { type: 'all' },
      participants: participants.map(p => ({
        userId: p._id,
        role: p.role || 'student'
      })),
      results: {
        totalParticipants: participants.length
      }
    });
    
    logger.info(`Drill scheduled: ${drill.type} for ${drill.institutionId} at ${drill.scheduledAt} with ${participants.length} participants`);
    
    return drill;
  } catch (error) {
    logger.error('Schedule drill error:', error);
    throw error;
  }
};

/**
 * Trigger drill immediately
 * Phase 4.2: Enhanced with actualStart and auto-end scheduling
 */
export const triggerDrill = async (drillId, triggeredBy) => {
  try {
    const drill = await Drill.findById(drillId);
    
    if (!drill) {
      throw new Error('Drill not found');
    }
    
    if (drill.status !== 'scheduled') {
      throw new Error(`Drill is already ${drill.status}`);
    }
    
    const actualStartTime = new Date();
    drill.status = 'in_progress';
    drill.triggeredBy = triggeredBy;
    drill.triggeredAt = actualStartTime;
    drill.actualStart = actualStartTime; // Phase 4.2: Track actual start time
    
    await drill.save();
    
    // Phase 4.2: Schedule auto-end based on duration (using a more reliable approach)
    // Note: In production, use a job queue (like Bull/BullMQ) instead of setTimeout
    if (drill.duration) {
      const durationMs = drill.duration * 60 * 1000;
      setTimeout(async () => {
        try {
          const currentDrill = await Drill.findById(drillId);
          if (currentDrill && currentDrill.status === 'in_progress') {
            await finalizeDrill(drillId);
            logger.info(`Drill auto-ended: ${drillId} after ${drill.duration} minutes`);
            
            // Broadcast drill end
            try {
              const { broadcastDrillEnd } = await import('../services/crisisAlert.service.js');
              await broadcastDrillEnd(currentDrill);
            } catch (error) {
              logger.warn('Failed to broadcast auto-end:', error);
            }
          }
        } catch (error) {
          logger.error('Auto-end drill error:', error);
        }
      }, durationMs);
    }
    
    logger.info(`Drill triggered: ${drill.type} (ID: ${drill._id}) - Duration: ${drill.duration} minutes`);
    
    return drill;
  } catch (error) {
    logger.error('Trigger drill error:', error);
    throw error;
  }
};

/**
 * Acknowledge drill participation
 */
export const acknowledgeDrill = async (drillId, userId) => {
  try {
    const drill = await Drill.findById(drillId);
    
    if (!drill) {
      throw new Error('Drill not found');
    }
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    await drill.acknowledgeDrill(userId);
    
    logger.info(`Drill acknowledged: User ${userId} for drill ${drillId}`);
    
    return drill;
  } catch (error) {
    logger.error('Acknowledge drill error:', error);
    throw error;
  }
};

/**
 * Complete drill participation
 */
export const completeDrillParticipation = async (drillId, userId, data) => {
  try {
    const drill = await Drill.findById(drillId);
    
    if (!drill) {
      throw new Error('Drill not found');
    }
    
    await drill.completeParticipant(
      userId,
      data.evacuationTime,
      data.route,
      data.score
    );
    
    logger.info(`Drill completed: User ${userId} for drill ${drillId}`);
    
    return drill;
  } catch (error) {
    logger.error('Complete drill participation error:', error);
    throw error;
  }
};

/**
 * End drill (manual end before auto-end)
 * Phase 4.2: New endpoint for manual drill ending
 */
export const endDrill = async (drillId) => {
  try {
    const drill = await Drill.findById(drillId);
    
    if (!drill) {
      throw new Error('Drill not found');
    }
    
    if (drill.status !== 'in_progress') {
      throw new Error(`Cannot end drill with status: ${drill.status}`);
    }
    
    // Calculate final results before finalizing
    await drill.finalize();
    
    logger.info(`Drill ended manually: ${drillId}`);
    
    return drill;
  } catch (error) {
    logger.error('End drill error:', error);
    throw error;
  }
};

/**
 * Finalize drill
 * Phase 4.2: Enhanced with summary calculation
 */
export const finalizeDrill = async (drillId) => {
  try {
    const drill = await Drill.findById(drillId);
    
    if (!drill) {
      throw new Error('Drill not found');
    }
    
    await drill.finalize();
    
    logger.info(`Drill finalized: ${drillId}`);
    
    return drill;
  } catch (error) {
    logger.error('Finalize drill error:', error);
    throw error;
  }
};

/**
 * Get drill summary
 * Phase 4.2: Calculate and return drill summary statistics
 */
export const getDrillSummary = async (drillId) => {
  try {
    const drill = await Drill.findById(drillId)
      .populate('participants.userId', 'name email role grade section')
      .populate('triggeredBy', 'name email');
    
    if (!drill) {
      throw new Error('Drill not found');
    }
    
    const acknowledged = drill.participants.filter(p => p.acknowledged);
    const notAcknowledged = drill.participants.filter(p => !p.acknowledged);
    
    // Calculate average response time
    const responseTimes = acknowledged
      .filter(p => p.responseTime !== null)
      .map(p => p.responseTime);
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : null;
    
    // Calculate fastest and slowest response times
    const fastestResponse = responseTimes.length > 0 ? Math.min(...responseTimes) : null;
    const slowestResponse = responseTimes.length > 0 ? Math.max(...responseTimes) : null;
    
    return {
      drill: {
        _id: drill._id,
        type: drill.type,
        status: drill.status,
        scheduledAt: drill.scheduledAt,
        actualStart: drill.actualStart,
        completedAt: drill.completedAt,
        duration: drill.duration
      },
      summary: {
        totalParticipants: drill.results.totalParticipants,
        acknowledgedCount: acknowledged.length,
        notAcknowledgedCount: notAcknowledged.length,
        participationRate: drill.results.participationRate,
        avgResponseTime,
        fastestResponse,
        slowestResponse,
        avgEvacuationTime: drill.results.avgEvacuationTime
      },
      participants: {
        acknowledged: acknowledged.map(p => ({
          userId: p.userId,
          responseTime: p.responseTime,
          acknowledgedAt: p.acknowledgedAt
        })),
        notAcknowledged: notAcknowledged.map(p => ({
          userId: p.userId
        }))
      }
    };
  } catch (error) {
    logger.error('Get drill summary error:', error);
    throw error;
  }
};

