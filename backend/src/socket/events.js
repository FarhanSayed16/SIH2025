/**
 * Socket.io Event Definitions
 * Phase 4.0: Real-Time Alert Engine - Enhanced Event System
 * 
 * Client -> Server Events:
 * - JOIN_ROOM: Join a school room
 * - LEAVE_ROOM: Leave a school room
 * - DRILL_ACK: Acknowledge drill participation
 * - USER_SAFE: User marks themselves safe (Phase 4.0)
 * - USER_HELP: User requests help (Phase 4.0)
 * - HEARTBEAT: Connection keepalive (Phase 4.0 - renamed from CLIENT_HEARTBEAT)
 * - SAFETY_STATUS_UPDATE: Update user safety status (legacy)
 * 
 * Server -> Client Events:
 * - JOINED_ROOM: Confirmation of room join
 * - DRILL_SCHEDULED: New drill scheduled
 * - DRILL_START: Drill begins (Phase 4.0)
 * - DRILL_END: Drill ends (Phase 4.0)
 * - CRISIS_ALERT: Emergency alert broadcast (enhanced for Phase 4.0)
 * - DRILL_ACK_RECEIVED: Drill acknowledgment received
 * - DRILL_SUMMARY: Drill completion summary
 * - USER_STATUS_UPDATE: Real-time user status changes (Phase 4.0 - renamed from STUDENT_STATUS_UPDATE)
 * - STUDENT_STATUS_UPDATE: Student safety status update (legacy)
 * - ALERT_RESOLVED: Alert resolved notification
 * - ALERT_CANCEL: Alert cancellation (Phase 4.0)
 * - SERVER_HEARTBEAT: Server keep-alive response (Phase 4.0)
 * - ERROR: Error message
 */

export const CLIENT_EVENTS = {
  JOIN_ROOM: 'JOIN_ROOM',
  LEAVE_ROOM: 'LEAVE_ROOM',
  DRILL_ACK: 'DRILL_ACK',
  USER_SAFE: 'USER_SAFE', // Phase 4.0
  USER_HELP: 'USER_HELP', // Phase 4.0
  HEARTBEAT: 'HEARTBEAT', // Phase 4.0 - renamed
  CLIENT_HEARTBEAT: 'CLIENT_HEARTBEAT', // Legacy support
  SAFETY_STATUS_UPDATE: 'SAFETY_STATUS_UPDATE', // Legacy
  // Phase 3: Activity Tracking Events
  TRACK_ACTIVITY: 'TRACK_ACTIVITY', // Client tracks student activity
  REQUEST_QR_CODE: 'REQUEST_QR_CODE', // Parent requests QR code
  SCAN_QR_CODE: 'SCAN_QR_CODE' // Teacher scans QR code
};

export const SERVER_EVENTS = {
  JOINED_ROOM: 'JOINED_ROOM',
  DRILL_SCHEDULED: 'DRILL_SCHEDULED',
  DRILL_START: 'DRILL_START', // Phase 4.0
  DRILL_END: 'DRILL_END', // Phase 4.0
  CRISIS_ALERT: 'CRISIS_ALERT',
  DRILL_ACK_RECEIVED: 'DRILL_ACK_RECEIVED',
  DRILL_PARTICIPATION_UPDATE: 'DRILL_PARTICIPATION_UPDATE', // Phase 1: Real-time participation tracking
  DRILL_SUMMARY: 'DRILL_SUMMARY',
  USER_STATUS_UPDATE: 'USER_STATUS_UPDATE', // Phase 4.0 - new name
  STUDENT_STATUS_UPDATE: 'STUDENT_STATUS_UPDATE', // Legacy support
  ALERT_RESOLVED: 'ALERT_RESOLVED',
  ALERT_CANCEL: 'ALERT_CANCEL', // Phase 4.0
  SERVER_HEARTBEAT: 'SERVER_HEARTBEAT',
  ERROR: 'ERROR',
  // Phase 3: Student Activity Events
  STUDENT_ACTIVITY_UPDATE: 'STUDENT_ACTIVITY_UPDATE', // Real-time student activity updates
  STUDENT_PROGRESS_UPDATE: 'STUDENT_PROGRESS_UPDATE', // Progress changes (XP, badges, score)
  CLASS_ACTIVITY_UPDATE: 'CLASS_ACTIVITY_UPDATE', // Class-wide activity updates
  PARENT_NOTIFICATION: 'PARENT_NOTIFICATION', // Notifications for parents
  TEACHER_NOTIFICATION: 'TEACHER_NOTIFICATION', // Notifications for teachers
  PARENT_VERIFICATION_REQUEST: 'PARENT_VERIFICATION_REQUEST', // Parent verification request
  QR_CODE_SCANNED: 'QR_CODE_SCANNED' // QR code scan notification
};

/**
 * Event payload types
 */
export const createDrillScheduledEvent = (drill) => ({
  drillId: drill._id.toString(),
  type: drill.type,
  scheduledAt: drill.scheduledAt,
  institutionId: drill.institutionId.toString(),
  status: drill.status
});

/**
 * Phase 4.0: Enhanced Crisis Alert Event
 * Includes all Phase 4.0 requirements: drill flag, source, location details
 */
export const createCrisisAlertEvent = (alert, options = {}) => {
  // Determine source type
  let source = 'Admin';
  if (alert.deviceId) {
    source = 'IoT';
  } else if (alert.metadata?.source) {
    source = alert.metadata.source; // AI, Teacher, NDMA, etc.
  } else if (alert.triggeredBy) {
    // Check user role to determine source
    // This would require populating triggeredBy, so defaulting to Admin for now
    source = 'Admin';
  }

  return {
    alertId: alert._id.toString(),
    type: alert.type?.toUpperCase() || alert.type, // FIRE, EARTHQUAKE, etc.
    severity: alert.severity?.toUpperCase() || alert.severity, // LOW, MEDIUM, HIGH, CRITICAL
    source, // IoT, Admin, Teacher, AI, NDMA
    title: alert.title,
    description: alert.description,
    location: alert.location || { coordinates: [0, 0] },
    locationDetails: alert.metadata?.locationDetails || {}, // building, floor, room
    institutionId: alert.institutionId?.toString() || alert.institutionId,
    triggeredBy: alert.triggeredBy?.toString() || alert.triggeredBy || null,
    timestamp: alert.createdAt || new Date().toISOString(),
    drillFlag: options.isDrill || alert.metadata?.isDrill || false, // Phase 4.0: Drill vs Real distinction
    deviceId: alert.deviceId?.toString() || null
  };
};

/**
 * Phase 4.0: Drill Start Event
 */
export const createDrillStartEvent = (drill) => ({
  drillId: drill._id.toString(),
  type: drill.type?.toUpperCase() || drill.type,
  institutionId: drill.institutionId?.toString(),
  startTime: drill.actualStart || new Date().toISOString(),
  duration: drill.duration || 0, // in minutes
  timestamp: new Date().toISOString()
});

/**
 * Phase 4.0: Drill End Event
 */
export const createDrillEndEvent = (drill) => ({
  drillId: drill._id.toString(),
  institutionId: drill.institutionId?.toString(),
  endTime: new Date().toISOString(),
  timestamp: new Date().toISOString()
});

export const createDrillSummaryEvent = (drill) => ({
  drillId: drill._id.toString(),
  ackCount: drill.results.completedParticipants,
  total: drill.results.totalParticipants,
  avgEvacuationTime: drill.results.avgEvacuationTime,
  participationRate: drill.results.participationRate,
  summary: {
    completed: drill.results.completedParticipants,
    total: drill.results.totalParticipants,
    rate: drill.results.participationRate
  }
});

/**
 * Phase 1: Drill Participation Update Event
 * Emitted when a student acknowledges or completes drill participation
 */
export const createDrillParticipationUpdateEvent = (drillId, participationData) => ({
  drillId: drillId.toString(),
  acknowledgedCount: participationData.acknowledgedCount || 0,
  notAcknowledgedCount: participationData.notAcknowledgedCount || 0,
  totalParticipants: participationData.totalParticipants || 0,
  participationRate: participationData.participationRate || 0,
  avgResponseTime: participationData.avgResponseTime || null,
  recentAcknowledgment: participationData.recentAcknowledgment || null,
  timestamp: new Date().toISOString()
});

/**
 * Phase 3: Student Activity Update Event
 * Emitted when a student performs an activity (module complete, quiz, game, etc.)
 */
export const createStudentActivityUpdateEvent = (activityLog) => ({
  activityId: activityLog._id.toString(),
  studentId: activityLog.studentId.toString(),
  activityType: activityLog.activityType,
  activityData: activityLog.activityData,
  priority: activityLog.priority,
  timestamp: activityLog.createdAt.toISOString()
});

/**
 * Phase 3: Student Progress Update Event
 * Emitted when student progress changes (XP, badges, preparedness score)
 */
export const createStudentProgressUpdateEvent = (studentId, progressData) => ({
  studentId: studentId.toString(),
  progress: {
    xp: progressData.xp || 0,
    totalXP: progressData.totalXP || 0,
    badges: progressData.badges || [],
    badgesCount: progressData.badges?.length || 0,
    preparednessScore: progressData.preparednessScore || 0,
    modulesCompleted: progressData.modulesCompleted || 0
  },
  timestamp: new Date().toISOString()
});

/**
 * Phase 3: Parent Verification Request Event
 * Emitted when a parent requests verification or QR code is scanned
 */
export const createParentVerificationRequestEvent = (parentId, studentId, studentName, parentName, relationship) => ({
  parentId: parentId.toString(),
  studentId: studentId.toString(),
  studentName,
  parentName,
  relationship,
  timestamp: new Date().toISOString()
});

/**
 * Phase 3: QR Code Scanned Event
 * Emitted when a teacher scans a parent's QR code
 */
export const createQRCodeScannedEvent = (qrCodeId, scannedBy, parentId, studentId, verified) => ({
  qrCodeId: qrCodeId.toString(),
  scannedBy: scannedBy.toString(),
  parentId: parentId.toString(),
  studentId: studentId.toString(),
  verified,
  timestamp: new Date().toISOString()
});

