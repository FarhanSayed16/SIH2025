/// Socket.io event constants
/// Phase 4.0: Real-Time Alert Engine events
class SocketEvents {
  // Client to Server Events
  static const String joinRoom = 'JOIN_ROOM';
  static const String leaveRoom = 'LEAVE_ROOM';
  static const String clientHeartbeat = 'CLIENT_HEARTBEAT';
  static const String userSafe = 'USER_SAFE';
  static const String userHelp = 'USER_HELP';
  static const String sosAlert = 'SOS_ALERT';
  static const String sosSafe = 'SOS_SAFE';
  static const String userStatusUpdate = 'USER_STATUS_UPDATE';

  // Server to Client Events
  static const String drillScheduled = 'DRILL_SCHEDULED';
  static const String drillStart = 'DRILL_START';
  static const String drillEnd = 'DRILL_END';
  static const String drillSummary = 'DRILL_SUMMARY';
  static const String crisisAlert = 'CRISIS_ALERT';
  static const String alertCancel = 'ALERT_CANCEL';
  static const String alertResolved = 'ALERT_RESOLVED';
  static const String studentStatusUpdate =
      'STUDENT_STATUS_UPDATE'; // Legacy/backward compatibility
  static const String serverHeartbeat = 'SERVER_HEARTBEAT';

  // Phase 4.10: Multi-Source Alerts
  static const String teacherAlertTriggered = 'TEACHER_ALERT_TRIGGERED';
  static const String iotAlertTriggered = 'IOT_ALERT_TRIGGERED';
  static const String aiAlertTriggered = 'AI_ALERT_TRIGGERED';
  static const String ndmaAlertReceived = 'NDMA_ALERT_RECEIVED';

  // Phase 4.8: ML Predictions
  static const String telemetryUpdate = 'TELEMETRY_UPDATE';
  static const String deviceAlert = 'DEVICE_ALERT';

  // Phase 5.7: AR Remote Triggers
  static const String arPathTrigger = 'AR_PATH_TRIGGER';

  // Phase 3: Student Activity Events
  static const String studentActivityUpdate = 'STUDENT_ACTIVITY_UPDATE';
  static const String studentProgressUpdate = 'STUDENT_PROGRESS_UPDATE';
  static const String classActivityUpdate = 'CLASS_ACTIVITY_UPDATE';
  static const String parentNotification = 'PARENT_NOTIFICATION';
  static const String teacherNotification = 'TEACHER_NOTIFICATION';
  static const String parentVerificationRequest = 'PARENT_VERIFICATION_REQUEST';
  static const String qrCodeScanned = 'QR_CODE_SCANNED';

  // Phase 3: Client Events
  static const String trackActivity = 'TRACK_ACTIVITY';
  static const String requestQrCode = 'REQUEST_QR_CODE';
  static const String scanQrCode = 'SCAN_QR_CODE';
}
