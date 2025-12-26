import Drill from '../models/Drill.js';
import User from '../models/User.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import {
  scheduleDrill,
  triggerDrill,
  acknowledgeDrill,
  completeDrillParticipation,
  finalizeDrill,
  endDrill,
  getDrillSummary
} from '../services/drill.service.js';
import logger from '../config/logger.js';

/**
 * Schedule a drill
 * POST /api/drills
 */
export const createDrill = async (req, res) => {
  try {
    const drillData = {
      ...req.body,
      institutionId: req.body.institutionId || req.user.institutionId
    };

    const drill = await scheduleDrill(drillData);

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      const { broadcastToSchool } = await import('../socket/rooms.js');
      const { createDrillScheduledEvent } = await import('../socket/events.js');
      broadcastToSchool(io, drill.institutionId, 'DRILL_SCHEDULED', createDrillScheduledEvent(drill));
    }

    // Send push notification via FCM
    try {
      const { sendDrillScheduledNotification } = await import('../services/fcm.service.js');
      await sendDrillScheduledNotification(drill);
    } catch (error) {
      logger.warn('Failed to send push notification:', error);
      // Don't fail the request if push notification fails
    }

    return successResponse(res, { drill }, 'Drill scheduled successfully', 201);
  } catch (error) {
    logger.error('Create drill error:', error);
    return errorResponse(res, error.message || 'Failed to schedule drill', 400);
  }
};

/**
 * List drills
 * GET /api/drills
 */
export const listDrills = async (req, res) => {
  try {
    const { page = 1, limit = 10, schoolId, status, type, classId } = req.query;

    // Build base query with institution filter
    const baseQuery = {};
    if (schoolId) baseQuery.institutionId = schoolId;
    else if (req.user.institutionId && req.user.role !== 'admin') {
      baseQuery.institutionId = req.user.institutionId;
    }
    
    // Build participant filter
    const participantFilter = [];
    
    // RBAC Refinement: Filter drills for students by their classId
    if (req.user.role === 'student' && req.user.classId) {
      // Students should see drills for their class, grade, or all drills
      participantFilter.push(
        { 'participantSelection.type': 'all' },
        { 'participantSelection.type': 'class', 'participantSelection.classIds': { $in: [req.user.classId] } },
        { 'participantSelection.type': 'grade', 'participantSelection.grades': { $in: [req.user.grade] } },
        { 'participantSelection.type': 'specific', 'participantSelection.userIds': { $in: [req.userId] } }
      );
    }
    
    // Teachers can filter by classId query parameter
    if (classId && req.user.role === 'teacher') {
      participantFilter.push(
        { 'participantSelection.type': 'all' },
        { 'participantSelection.type': 'class', 'participantSelection.classIds': { $in: [classId] } }
      );
    }
    
    // Combine filters: institution AND (participant filter OR no participant filter)
    const query = { ...baseQuery };
    if (participantFilter.length > 0) {
      query.$or = participantFilter;
    }
    
    if (status) query.status = status;
    if (type) query.type = type;

    const drills = await Drill.find(query)
      .populate('institutionId', 'name')
      .populate('triggeredBy', 'name email')
      .populate('participantSelection.classIds', 'grade section classCode')
      .sort({ scheduledAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Drill.countDocuments(query);

    return paginatedResponse(res, drills, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }, 'Drills retrieved successfully');
  } catch (error) {
    logger.error('List drills error:', error);
    return errorResponse(res, 'Failed to list drills', 500);
  }
};

/**
 * Get drill by ID
 * GET /api/drills/:id
 */
export const getDrillById = async (req, res) => {
  try {
    const { id } = req.params;

    const drill = await Drill.findById(id)
      .populate('institutionId', 'name address location')
      .populate('participants.userId', 'name email role')
      .populate('triggeredBy', 'name email');

    if (!drill) {
      return errorResponse(res, 'Drill not found', 404);
    }

    return successResponse(res, { drill }, 'Drill retrieved successfully');
  } catch (error) {
    logger.error('Get drill error:', error);
    return errorResponse(res, 'Failed to get drill', 500);
  }
};

/**
 * Trigger drill immediately
 * POST /api/drills/:id/trigger
 */
export const triggerDrillNow = async (req, res) => {
  try {
    const { id } = req.params;

    const drill = await triggerDrill(id, req.userId);

    // Phase 4.0: Use crisis alert service for drill start broadcast
    try {
      const { broadcastDrillStart } = await import('../services/crisisAlert.service.js');
      await broadcastDrillStart(drill);
    } catch (error) {
      logger.warn('Failed to broadcast drill start via Socket.io:', error);
      // Don't fail the request if broadcast fails
    }

    // Phase 1: Send FCM push notification for drill start
    try {
      const { sendDrillStartNotification } = await import('../services/fcm.service.js');
      await sendDrillStartNotification(drill);
    } catch (error) {
      logger.warn('Failed to send drill start push notification:', error);
      // Don't fail the request if push notification fails
    }

    return successResponse(res, { drill }, 'Drill triggered successfully');
  } catch (error) {
    logger.error('Trigger drill error:', error);
    return errorResponse(res, error.message || 'Failed to trigger drill', 400);
  }
};

/**
 * Acknowledge drill
 * POST /api/drills/:id/acknowledge
 * Phase 1: Enhanced with real-time participation updates
 */
export const acknowledgeDrillParticipation = async (req, res) => {
  try {
    const { id } = req.params;

    const drill = await acknowledgeDrill(id, req.userId);

    // Phase 1: Broadcast participation update via Socket.io
    try {
      const { broadcastDrillParticipationUpdate } = await import('../services/crisisAlert.service.js');
      const acknowledged = drill.participants.filter(p => p.acknowledged);
      const notAcknowledged = drill.participants.filter(p => !p.acknowledged);
      
      // Calculate average response time
      const responseTimes = acknowledged
        .filter(p => p.responseTime !== null)
        .map(p => p.responseTime);
      const avgResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
        : null;

      // Get recent acknowledgment info
      const recentParticipant = acknowledged[acknowledged.length - 1];
      let recentAcknowledgment = null;
      if (recentParticipant) {
        const user = await import('../models/User.js').then(m => m.default.findById(recentParticipant.userId).select('name'));
        recentAcknowledgment = {
          userId: recentParticipant.userId.toString(),
          userName: user?.name || 'Unknown',
          responseTime: recentParticipant.responseTime,
          timestamp: recentParticipant.acknowledgedAt
        };
      }

      await broadcastDrillParticipationUpdate(drill._id, drill.institutionId, {
        acknowledgedCount: acknowledged.length,
        notAcknowledgedCount: notAcknowledged.length,
        totalParticipants: drill.results.totalParticipants,
        participationRate: drill.results.participationRate,
        avgResponseTime,
        recentAcknowledgment
      });
    } catch (error) {
      logger.warn('Failed to broadcast participation update:', error);
      // Don't fail the request if broadcast fails
    }

    return successResponse(res, { drill }, 'Drill acknowledged successfully');
  } catch (error) {
    logger.error('Acknowledge drill error:', error);
    return errorResponse(res, error.message || 'Failed to acknowledge drill', 400);
  }
};

/**
 * Complete drill participation
 * POST /api/drills/:id/complete
 * Phase 1: Enhanced with real-time participation updates
 */
export const completeDrill = async (req, res) => {
  try {
    const { id } = req.params;
    const { evacuationTime, route, score } = req.body;

    if (!evacuationTime) {
      return errorResponse(res, 'Evacuation time is required', 400);
    }

    const drill = await completeDrillParticipation(id, req.userId, {
      evacuationTime,
      route,
      score
    });

    // Phase 1: Broadcast participation update via Socket.io
    try {
      const { broadcastDrillParticipationUpdate } = await import('../services/crisisAlert.service.js');
      const acknowledged = drill.participants.filter(p => p.acknowledged);
      const notAcknowledged = drill.participants.filter(p => !p.acknowledged);
      
      // Calculate average response time
      const responseTimes = acknowledged
        .filter(p => p.responseTime !== null)
        .map(p => p.responseTime);
      const avgResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
        : null;

      await broadcastDrillParticipationUpdate(drill._id, drill.institutionId, {
        acknowledgedCount: acknowledged.length,
        notAcknowledgedCount: notAcknowledged.length,
        totalParticipants: drill.results.totalParticipants,
        participationRate: drill.results.participationRate,
        avgResponseTime,
        recentAcknowledgment: null // Completion doesn't need recent acknowledgment
      });
    } catch (error) {
      logger.warn('Failed to broadcast participation update:', error);
      // Don't fail the request if broadcast fails
    }

    return successResponse(res, { drill }, 'Drill participation completed successfully');
  } catch (error) {
    logger.error('Complete drill error:', error);
    return errorResponse(res, error.message || 'Failed to complete drill', 400);
  }
};

/**
 * Finalize drill
 * POST /api/drills/:id/finalize
 */
/**
 * End drill (manual end)
 * POST /api/drills/:id/end
 * Phase 4.2: New endpoint for manual drill ending
 */
export const endDrillNow = async (req, res) => {
  try {
    const { id } = req.params;

    const drill = await endDrill(id);

    // Phase 4.0: Broadcast drill end and summary
    try {
      const { broadcastDrillEnd } = await import('../services/crisisAlert.service.js');
      await broadcastDrillEnd(drill);
      
      // Also broadcast summary
      const io = req.app.get('io');
      if (io) {
        const { broadcastToSchool } = await import('../socket/rooms.js');
        const { createDrillSummaryEvent } = await import('../socket/events.js');
        broadcastToSchool(io, drill.institutionId, 'DRILL_SUMMARY', createDrillSummaryEvent(drill));
      }
    } catch (error) {
      logger.warn('Failed to broadcast drill end/summary:', error);
    }

    // Phase 1: Send FCM push notification for drill end
    try {
      const { sendDrillEndNotification } = await import('../services/fcm.service.js');
      await sendDrillEndNotification(drill);
    } catch (error) {
      logger.warn('Failed to send drill end push notification:', error);
      // Don't fail the request if push notification fails
    }

    return successResponse(res, { drill }, 'Drill ended successfully');
  } catch (error) {
    logger.error('End drill error:', error);
    return errorResponse(res, error.message || 'Failed to end drill', 400);
  }
};

/**
 * Finalize drill
 * POST /api/drills/:id/finalize
 */
export const finalizeDrillNow = async (req, res) => {
  try {
    const { id } = req.params;

    const drill = await finalizeDrill(id);

    // Phase 4.0: Broadcast drill end and summary
    try {
      const { broadcastDrillEnd } = await import('../services/crisisAlert.service.js');
      await broadcastDrillEnd(drill);
      
      // Also broadcast summary
      const io = req.app.get('io');
      if (io) {
        const { broadcastToSchool } = await import('../socket/rooms.js');
        const { createDrillSummaryEvent } = await import('../socket/events.js');
        broadcastToSchool(io, drill.institutionId, 'DRILL_SUMMARY', createDrillSummaryEvent(drill));
      }
    } catch (error) {
      logger.warn('Failed to broadcast drill end/summary:', error);
      // Don't fail the request if broadcast fails
    }

    // Phase 1: Send FCM push notification for drill end
    try {
      const { sendDrillEndNotification } = await import('../services/fcm.service.js');
      await sendDrillEndNotification(drill);
    } catch (error) {
      logger.warn('Failed to send drill end push notification:', error);
      // Don't fail the request if push notification fails
    }

    return successResponse(res, { drill }, 'Drill finalized successfully');
  } catch (error) {
    logger.error('Finalize drill error:', error);
    return errorResponse(res, error.message || 'Failed to finalize drill', 400);
  }
};

/**
 * Get drill summary
 * GET /api/drills/:id/summary
 * Phase 4.2: New endpoint for drill summary
 */
export const getDrillSummaryController = async (req, res) => {
  try {
    const { id } = req.params;

    const summary = await getDrillSummary(id);

    return successResponse(res, summary, 'Drill summary retrieved successfully');
  } catch (error) {
    logger.error('Get drill summary error:', error);
    return errorResponse(res, error.message || 'Failed to get drill summary', 400);
  }
};

/**
 * Get active drills
 * GET /api/drills/active
 * Phase 1: New endpoint for checking active drills
 */
export const getActiveDrills = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    
    if (!institutionId) {
      return errorResponse(res, 'User institution not found', 400);
    }

    // Get all active drills for the institution
    const activeDrills = await Drill.find({
      institutionId,
      status: 'in_progress'
    })
      .populate('institutionId', 'name')
      .populate('triggeredBy', 'name email')
      .select('_id type status actualStart duration participants')
      .sort({ actualStart: -1 });

    return successResponse(res, { drills: activeDrills }, 'Active drills retrieved successfully');
  } catch (error) {
    logger.error('Get active drills error:', error);
    return errorResponse(res, 'Failed to get active drills', 500);
  }
};

/**
 * Get drill participants with status
 * GET /api/drills/:id/participants
 * Phase 1: New endpoint for getting drill participants
 */
export const getDrillParticipants = async (req, res) => {
  try {
    const { id } = req.params;

    const drill = await Drill.findById(id)
      .populate('participants.userId', 'name email role grade section')
      .select('participants results');

    if (!drill) {
      return errorResponse(res, 'Drill not found', 404);
    }

    const participants = drill.participants.map(p => ({
      userId: p.userId?._id || p.userId,
      name: p.userId?.name || 'Unknown',
      email: p.userId?.email,
      role: p.userId?.role || p.role,
      grade: p.userId?.grade,
      section: p.userId?.section,
      acknowledged: p.acknowledged || false,
      acknowledgedAt: p.acknowledgedAt,
      responseTime: p.responseTime,
      completedAt: p.completedAt,
      evacuationTime: p.evacuationTime,
      score: p.score
    }));

    return successResponse(res, {
      participants,
      summary: {
        total: drill.results.totalParticipants,
        acknowledged: drill.participants.filter(p => p.acknowledged).length,
        notAcknowledged: drill.participants.filter(p => !p.acknowledged).length,
        participationRate: drill.results.participationRate
      }
    }, 'Drill participants retrieved successfully');
  } catch (error) {
    logger.error('Get drill participants error:', error);
    return errorResponse(res, 'Failed to get drill participants', 500);
  }
};

