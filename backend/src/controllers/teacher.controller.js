import {
  getTeacherClasses,
  getClassStudents,
  startClassDrill,
  markParticipation,
  getClassAnalytics,
  getStudentProgress,
  getPendingStudents,
  approveStudent,
  rejectStudent,
  getStudentParents,
  getClassParents,
  verifyParentByQR
} from '../services/teacher.service.js';
import {
  markAttendance,
  getClassAttendance,
  getStudentAttendanceStats
} from '../services/attendance.service.js';
import {
  assignGroupXP,
  getClassXPHistory
} from '../services/groupXP.service.js';
import {
  triggerGroupQuiz,
  getActiveGroupQuizzes,
  getGroupQuizResults
} from '../services/groupQuiz.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';
import { createRosterRecord } from '../services/roster-management.service.js';
import Class from '../models/Class.js';

/**
 * Get teacher's classes
 * GET /api/teacher/classes
 */
export const getClasses = async (req, res) => {
  try {
    const teacherId = req.userId;
    const classes = await getTeacherClasses(teacherId);

    return successResponse(
      res,
      { classes },
      'Classes retrieved successfully'
    );
  } catch (error) {
    logger.error('Get classes controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get classes',
      500
    );
  }
};

/**
 * Get students in a class
 * GET /api/teacher/classes/:classId/students
 */
export const getStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.userId;

    const classData = await getClassStudents(classId, teacherId);

    return successResponse(
      res,
      classData,
      'Students retrieved successfully'
    );
  } catch (error) {
    logger.error('Get students controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get students',
      500
    );
  }
};

/**
 * Start drill for class
 * POST /api/teacher/classes/:classId/drills/start
 */
export const startDrill = async (req, res) => {
  try {
    const { classId } = req.params;
    const { drillType } = req.body;
    const teacherId = req.userId;

    if (!drillType) {
      return errorResponse(res, 'Drill type is required', 400);
    }

    const drill = await startClassDrill(classId, drillType, teacherId);

    return successResponse(
      res,
      drill,
      'Drill started successfully',
      201
    );
  } catch (error) {
    logger.error('Start drill controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to start drill',
      500
    );
  }
};

/**
 * Mark student participation
 * POST /api/teacher/classes/:classId/students/:studentId/participate
 */
export const markStudentParticipation = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const { participated } = req.body;
    const teacherId = req.userId;

    if (typeof participated !== 'boolean') {
      return errorResponse(res, 'Participation status (boolean) is required', 400);
    }

    const result = await markParticipation(classId, studentId, participated, teacherId);

    return successResponse(
      res,
      result,
      'Participation marked successfully'
    );
  } catch (error) {
    logger.error('Mark participation controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to mark participation',
      500
    );
  }
};

/**
 * Get class drill summary
 * GET /api/teacher/classes/:classId/drills/summary
 * Phase 1: New endpoint for class-specific drill summaries
 */
export const getClassDrillSummary = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.userId;

    // Verify teacher owns class
    const classData = await Class.findById(classId);
    if (!classData) {
      return errorResponse(res, 'Class not found', 404);
    }

    if (classData.teacherId.toString() !== teacherId) {
      return errorResponse(res, 'Unauthorized: Teacher does not own this class', 403);
    }

    // Get all drills for this class
    const Drill = (await import('../models/Drill.js')).default;
    const drills = await Drill.find({
      institutionId: classData.institutionId,
      'participantSelection.type': 'class',
      'participantSelection.classIds': classId
    })
      .populate('participants.userId', 'name email role grade section')
      .sort({ createdAt: -1 })
      .limit(50); // Last 50 drills

    // Calculate summary statistics
    const summary = {
      totalDrills: drills.length,
      completedDrills: drills.filter(d => d.status === 'completed').length,
      activeDrills: drills.filter(d => d.status === 'in_progress').length,
      scheduledDrills: drills.filter(d => d.status === 'scheduled').length,
      avgParticipationRate: 0,
      totalParticipants: 0,
      drills: drills.map(drill => {
        const acknowledged = drill.participants.filter(p => p.acknowledged).length;
        const total = drill.results?.totalParticipants || drill.participants.length;
        return {
          drillId: drill._id,
          type: drill.type,
          status: drill.status,
          scheduledAt: drill.scheduledAt,
          actualStart: drill.actualStart,
          completedAt: drill.completedAt,
          participationRate: drill.results?.participationRate || 0,
          acknowledgedCount: acknowledged,
          totalParticipants: total,
          avgResponseTime: drill.results?.avgEvacuationTime || null
        };
      })
    };

    // Calculate average participation rate
    const completedDrills = drills.filter(d => d.status === 'completed' && d.results?.participationRate);
    if (completedDrills.length > 0) {
      summary.avgParticipationRate = Math.round(
        completedDrills.reduce((sum, d) => sum + (d.results.participationRate || 0), 0) / completedDrills.length
      );
    }

    return successResponse(
      res,
      summary,
      'Class drill summary retrieved successfully'
    );
  } catch (error) {
    logger.error('Get class drill summary error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get class drill summary',
      500
    );
  }
};

/**
 * Get class analytics
 * GET /api/teacher/classes/:classId/analytics
 */
export const getAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.userId;

    const analytics = await getClassAnalytics(classId, teacherId);

    return successResponse(
      res,
      analytics,
      'Analytics retrieved successfully'
    );
  } catch (error) {
    logger.error('Get analytics controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get analytics',
      500
    );
  }
};

/**
 * Phase 3.4.5: Mark attendance for a class
 * POST /api/teacher/classes/:classId/attendance
 */
export const markClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, records } = req.body;
    const teacherId = req.userId;

    if (!date || !records || !Array.isArray(records)) {
      return errorResponse(res, 'Date and records array are required', 400);
    }

    const result = await markAttendance(classId, teacherId, date, records);

    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(
      res,
      result.attendance,
      'Attendance marked successfully',
      201
    );
  } catch (error) {
    logger.error('Mark attendance controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to mark attendance',
      500
    );
  }
};

/**
 * Phase 3.4.5: Get attendance for a class
 * GET /api/teacher/classes/:classId/attendance
 */
export const getClassAttendanceController = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;
    const teacherId = req.userId;

    // Verify teacher owns class (done in service)
    const result = await getClassAttendance(classId, startDate, endDate);

    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(
      res,
      { attendance: result.attendance },
      'Attendance retrieved successfully'
    );
  } catch (error) {
    logger.error('Get attendance controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get attendance',
      500
    );
  }
};

/**
 * Phase 3.4.5: Assign group XP
 * POST /api/teacher/classes/:classId/xp/assign
 */
export const assignXP = async (req, res) => {
  try {
    const { classId } = req.params;
    const { xpAmount, studentIds, reason } = req.body;
    const teacherId = req.userId;

    if (!xpAmount || typeof xpAmount !== 'number' || xpAmount <= 0) {
      return errorResponse(res, 'Valid XP amount is required', 400);
    }

    const result = await assignGroupXP(classId, teacherId, xpAmount, studentIds, reason);

    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(
      res,
      result,
      'XP assigned successfully',
      201
    );
  } catch (error) {
    logger.error('Assign XP controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to assign XP',
      500
    );
  }
};

/**
 * Phase 3.4.5: Get class XP history
 * GET /api/teacher/classes/:classId/xp/history
 */
export const getClassXPHistoryController = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    const result = await getClassXPHistory(classId, startDate, endDate);

    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(
      res,
      result,
      'XP history retrieved successfully'
    );
  } catch (error) {
    logger.error('Get XP history controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get XP history',
      500
    );
  }
};

/**
 * Phase 3.4.5: Trigger group quiz
 * POST /api/teacher/classes/:classId/quizzes/trigger
 */
export const triggerQuiz = async (req, res) => {
  try {
    const { classId } = req.params;
    const { moduleId, duration, deviceId } = req.body;
    const teacherId = req.userId;

    if (!moduleId) {
      return errorResponse(res, 'Module ID is required', 400);
    }

    const result = await triggerGroupQuiz(classId, teacherId, moduleId, {
      duration,
      deviceId
    });

    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(
      res,
      result.groupActivity,
      'Group quiz triggered successfully',
      201
    );
  } catch (error) {
    logger.error('Trigger quiz controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to trigger quiz',
      500
    );
  }
};

/**
 * Phase 3.4.5: Get active group quizzes
 * GET /api/teacher/classes/:classId/quizzes/active
 */
export const getActiveQuizzes = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.userId;

    const result = await getActiveGroupQuizzes(classId, teacherId);

    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(
      res,
      { quizzes: result.quizzes },
      'Active quizzes retrieved successfully'
    );
  } catch (error) {
    logger.error('Get active quizzes controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get active quizzes',
      500
    );
  }
};

/**
 * Phase 3.4.5: Get group quiz results
 * GET /api/teacher/quizzes/:activityId/results
 */
export const getQuizResults = async (req, res) => {
  try {
    const { activityId } = req.params;
    const teacherId = req.userId;

    const result = await getGroupQuizResults(activityId, teacherId);

    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(
      res,
      result,
      'Quiz results retrieved successfully'
    );
  } catch (error) {
    logger.error('Get quiz results controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get quiz results',
      500
    );
  }
};

/**
 * Phase 3.4.5: Get student progress
 * GET /api/teacher/classes/:classId/progress
 */
export const getProgress = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.userId;

    const progress = await getStudentProgress(classId, teacherId);

    return successResponse(
      res,
      progress,
      'Student progress retrieved successfully'
    );
  } catch (error) {
    logger.error('Get progress controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get student progress',
      500
    );
  }
};

/**
 * PHASE B3.4: Get pending students for a class
 * GET /api/teacher/classes/:classId/students/pending
 */
export const getPendingStudentsController = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.userId;

    const pendingStudents = await getPendingStudents(classId, teacherId);

    return successResponse(
      res,
      { students: pendingStudents },
      'Pending students retrieved successfully'
    );
  } catch (error) {
    logger.error('Get pending students controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get pending students',
      error.message?.includes('Unauthorized') ? 403 : 500
    );
  }
};

/**
 * PHASE B3.4: Approve a student
 * POST /api/teacher/classes/:classId/students/:studentId/approve
 */
export const approveStudentController = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const teacherId = req.userId;
    const { notes } = req.body;

    const student = await approveStudent(classId, studentId, teacherId, notes || null);

    return successResponse(
      res,
      { user: student },
      'Student approved successfully'
    );
  } catch (error) {
    logger.error('Approve student controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to approve student',
      error.message?.includes('Unauthorized') ? 403 : 
      error.message?.includes('not found') ? 404 : 400
    );
  }
};

/**
 * PHASE B3.4: Reject a student
 * POST /api/teacher/classes/:classId/students/:studentId/reject
 */
export const rejectStudentController = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const teacherId = req.userId;
    const { reason } = req.body;

    const student = await rejectStudent(classId, studentId, teacherId, reason);

    return successResponse(
      res,
      { user: student },
      'Student rejected successfully'
    );
  } catch (error) {
    logger.error('Reject student controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to reject student',
      error.message?.includes('Unauthorized') ? 403 : 
      error.message?.includes('not found') ? 404 : 400
    );
  }
};

/**
 * PHASE B4: Create roster student (KG-4)
 * POST /api/teacher/classes/:classId/roster-students
 */
export const createRosterStudentController = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.userId;
    const studentInfo = req.body;

    const rosterStudent = await createRosterRecord(classId, teacherId, studentInfo);

    return successResponse(
      res,
      { user: rosterStudent },
      'Roster student created successfully',
      201
    );
  } catch (error) {
    logger.error('Create roster student controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to create roster student',
      error.message?.includes('Unauthorized') ? 403 : 
      error.message?.includes('not found') ? 404 : 400
    );
  }
};

/**
 * Phase 2: Get all parents for a specific student
 * GET /api/teacher/students/:studentId/parents
 */
export const getStudentParentsController = async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.userId;

    const parents = await getStudentParents(studentId, teacherId);

    return successResponse(
      res,
      { parents },
      'Student parents retrieved successfully'
    );
  } catch (error) {
    logger.error('Get student parents controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve student parents',
      error.message?.includes('Unauthorized') ? 403 : 
      error.message?.includes('not found') ? 404 : 500
    );
  }
};

/**
 * Phase 2: Get all parents for all students in a class
 * GET /api/teacher/classes/:classId/parents
 */
export const getClassParentsController = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.userId;

    const result = await getClassParents(classId, teacherId);

    return successResponse(
      res,
      result,
      'Class parents retrieved successfully'
    );
  } catch (error) {
    logger.error('Get class parents controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve class parents',
      error.message?.includes('Unauthorized') ? 403 : 
      error.message?.includes('not found') ? 404 : 500
    );
  }
};

/**
 * Phase 2: Verify parent by QR code scan
 * POST /api/teacher/parents/verify-qr
 */
export const verifyParentQRController = async (req, res) => {
  try {
    const { qrCodeData, location } = req.body;
    const teacherId = req.userId;

    if (!qrCodeData) {
      return errorResponse(res, 'QR code data is required', 400);
    }

    const verificationResult = await verifyParentByQR(qrCodeData, teacherId, location);

    return successResponse(
      res,
      verificationResult,
      'Parent verified successfully'
    );
  } catch (error) {
    logger.error('Verify parent QR controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to verify parent',
      error.message?.includes('Invalid') || error.message?.includes('expired') ? 400 : 500
    );
  }
};

