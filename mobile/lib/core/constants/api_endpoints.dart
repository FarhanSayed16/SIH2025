/// API endpoint constants
/// Note: These are relative paths - Dio's baseUrl is already set to /api
class ApiEndpoints {
  // Authentication
  static String get login => '/auth/login';
  static String get register => '/auth/register';
  static String get refresh => '/auth/refresh';
  static String get logout => '/auth/logout';
  static String get profile => '/auth/profile';
  static String get forgotPassword => '/auth/forgot-password';
  static String get resetPassword => '/auth/reset-password';
  // Phase 2.5: Multi-Access Authentication
  static String get qrLogin => '/auth/qr-login';
  static String get deviceLogin => '/auth/device-login';
  static String get selectClass => '/auth/select-class';

  // RBAC Refinement: Classroom Join
  static String generateClassroomQR(String classId) =>
      '/classroom/$classId/qr/generate';
  static String getPendingRequests(String classId) =>
      '/classroom/$classId/join-requests';
  static String approveJoinRequest(String requestId) =>
      '/classroom/join-requests/$requestId/approve';
  static String rejectJoinRequest(String requestId) =>
      '/classroom/join-requests/$requestId/reject';
  static String get classroomJoinScan => '/classroom/join/scan';
  static String expireClassroomQR(String classId) =>
      '/classroom/$classId/qr/expire';

  // RBAC Refinement: Roster Management
  static String createRosterRecord(String classId) =>
      '/teacher/classes/$classId/roster-students';
  static String getClassRoster(String classId) => '/roster/$classId/students';
  static String updateRosterRecord(String studentId) =>
      '/roster/students/$studentId';
  static String deleteRosterRecord(String studentId) =>
      '/roster/students/$studentId';
  static String markRosterAttendance(String classId) =>
      '/roster/$classId/attendance';
  static String bulkCheckIn(String classId) => '/roster/$classId/bulk-checkin';

  // Users
  static String user(String id) => '/users/$id';
  static String userLocation(String id) => '/users/$id/location';

  // Phase 5: Activity Tracking
  static String get trackActivity => '/activity/track';
  static String studentActivityTimeline(String studentId) =>
      '/activity/student/$studentId';
  static String classActivity(String classId) => '/activity/class/$classId';
  static String userSafetyStatus(String id) => '/users/$id/safety-status';
  static String userFcmToken(String id) => '/users/$id/fcm-token';
  static String get users => '/users';

  // Schools
  static String get schools => '/schools';
  static String school(String id) => '/schools/$id';
  static String get nearestSchools => '/schools/nearest';
  // Floor plans / blueprints
  static String floorPlanMapData(String schoolId) =>
      '/schools/$schoolId/floor-plan/map-data';
  static String floorPlanBlueprint(String schoolId) =>
      '/schools/$schoolId/blueprint';
  static String floorPlanNavigation(String schoolId) =>
      '/schools/$schoolId/floor-plan/navigation';

  // Drills - Phase 4.2
  static String get drills => '/drills';
  static String drill(String id) => '/drills/$id';
  static String triggerDrill(String id) => '/drills/$id/trigger';
  static String acknowledgeDrill(String id) => '/drills/$id/acknowledge';
  static String completeDrill(String id) => '/drills/$id/complete';
  static String endDrill(String id) => '/drills/$id/end';
  static String finalizeDrill(String id) => '/drills/$id/finalize';
  static String drillSummary(String id) => '/drills/$id/summary';
  // Phase 2: New endpoints
  static String get activeDrills => '/drills/active';
  static String drillParticipants(String id) => '/drills/$id/participants';

  // Alerts
  static String get alerts => '/alerts';
  static String alert(String id) => '/alerts/$id';
  static String resolveAlert(String id) => '/alerts/$id/resolve';
  // Phase 4.4: Emergency Acknowledgment & Triage
  static String alertStatus(String alertId) => '/alerts/$alertId/status';
  static String alertStatusSummary(String alertId) =>
      '/alerts/$alertId/summary';
  static String markMissing(String alertId) => '/alerts/$alertId/mark-missing';

  // Phase 4.10: Teacher Alert Trigger
  static String get teacherAlert => '/alerts/teacher';

  // Phase 4.10: Incidents (Alert History)
  static String get incidents => '/incidents';
  static String incident(String id) => '/incidents/$id';
  static String get incidentStats => '/incidents/stats';
  static String get exportIncidentReport => '/incidents/export/pdf';

  // Modules
  static String get modules => '/modules';
  static String module(String id) => '/modules/$id';
  static String completeModule(String id) => '/modules/$id/complete';
  static String get moduleProgress => '/modules/progress';
  static String moduleProgressById(String moduleId) =>
      '/modules/progress/$moduleId';
  static String userProgress(String userId) => '/users/$userId/progress';

  // Phase 4.7: AR Navigation
  static String get arNavigationRoute => '/ar-navigation/route';
  static String arNavigationMarkers(String schoolId) =>
      '/ar-navigation/markers/$schoolId';
  static String arNavigationInstructions(String routeId) =>
      '/ar-navigation/instructions/$routeId';

  // Phase 4.7: Safe Zones
  static String safeZones(String schoolId) => '/safe-zones/$schoolId';
  static String get safeZonesNearest => '/safe-zones/nearest';
  static String safeZonesWithinRadius(String schoolId) =>
      '/safe-zones/$schoolId/within-radius';

  // Phase 4.8: ML Predictions
  static String studentRiskPrediction(String userId) =>
      '/ml-predictions/student-risk/$userId';
  static String get drillPerformancePrediction =>
      '/ml-predictions/drill-performance';
  static String get optimalDrillTiming => '/ml-predictions/optimal-timing';
  static String get drillAnomalies => '/ml-predictions/anomalies';
  static String studentProgressForecast(String userId) =>
      '/ml-predictions/student-progress/$userId';
  static String get batchStudentRiskPrediction =>
      '/ml-predictions/batch-predict';

  // Phase 4.10: Teacher Alert Trigger
  static String get teacherTriggerAlert => '/alerts/teacher-trigger';

  // QR Code
  static String verifyQR(String qrCode) => '/qr/verify/$qrCode';
  static String generateQR(String studentId) => '/qr/generate/$studentId';

  // Devices / IoT
  static String get deviceHealthMonitoring => '/devices/health/monitoring';
  static String deviceHistory(String deviceId) => '/devices/$deviceId/history';
  static String get registerDevice => '/devices/register';
  static String device(String deviceId) => '/devices/$deviceId';

  // Sync
  static String get sync => '/sync';
  static String get syncStatus => '/sync/status';

  // Scores
  static String preparednessScore(String? userId) =>
      userId != null && userId.isNotEmpty
          ? '/scores/preparedness/$userId'
          : '/scores/preparedness';
  static String recalculateScore(String? userId) =>
      userId != null && userId.isNotEmpty
          ? '/scores/recalculate/$userId'
          : '/scores/recalculate';
  static String scoreHistory(String? userId) =>
      userId != null && userId.isNotEmpty
          ? '/scores/history/$userId'
          : '/scores/history';

  // Games
  static String get gameItems => '/games/items';
  static String get gameScores => '/games/scores';
  static String gameLeaderboard(String gameType) =>
      '/games/leaderboard/$gameType';
  static String get gameHazards => '/games/hazards';
  static String get verifyHazard => '/games/verify-hazard';

  // Group Activities
  static String get groupActivitiesCreate => '/group-activities/create';
  static String groupActivitySubmit(String activityId) =>
      '/group-activities/$activityId/submit';
  static String groupActivityResults(String activityId) =>
      '/group-activities/$activityId/results';

  // Badges
  static String get badges => '/badges';
  static String badge(String badgeId) => '/badges/$badgeId';
  static String get myBadges => '/badges/my-badges';
  static String get badgeHistory => '/badges/my-badges/history';
  static String awardBadge(String badgeId) => '/badges/$badgeId/award';
  static String get checkBadges => '/badges/check';

  // Certificates
  static String get myCertificates => '/certificates/my-certificates';
  static String certificate(String certificateId) =>
      '/certificates/$certificateId';
  static String certificateDownload(String certificateId) =>
      '/certificates/$certificateId/download';
  static String get certificatesGenerate => '/certificates/generate';
  static String get checkCertificates => '/certificates/check';

  // Teacher
  static String get teacherClasses => '/teacher/classes';
  static String classStudents(String classId) =>
      '/teacher/classes/$classId/students';
  static String startClassDrill(String classId) =>
      '/teacher/classes/$classId/drills/start';
  static String markParticipation(String classId, String studentId) =>
      '/teacher/classes/$classId/students/$studentId/participate';
  static String classAnalytics(String classId) =>
      '/teacher/classes/$classId/analytics';
  static String markAttendance(String classId) =>
      '/teacher/classes/$classId/attendance';
  static String getAttendance(String classId) =>
      '/teacher/classes/$classId/attendance';
  static String assignXP(String classId) =>
      '/teacher/classes/$classId/xp/assign';
  static String getXPHistory(String classId) =>
      '/teacher/classes/$classId/xp/history';
  static String triggerQuiz(String classId) =>
      '/teacher/classes/$classId/quizzes/trigger';
  static String getActiveQuizzes(String classId) =>
      '/teacher/classes/$classId/quizzes/active';
  static String getQuizResults(String activityId) =>
      '/teacher/quizzes/$activityId/results';
  static String getStudentProgress(String classId) =>
      '/teacher/classes/$classId/progress';

  // Adaptive Scoring
  static String getPerStudentScores(String classId) =>
      '/adaptive-scoring/class/$classId/scores';
  static String getSharedXPDistribution(String classId) =>
      '/adaptive-scoring/class/$classId/xp-distribution';
  static String getAggregatedStudentScores(String studentId) =>
      '/adaptive-scoring/student/$studentId/aggregated';
  static String get distributeSharedXP => '/adaptive-scoring/distribute-xp';

  // Quiz / AI
  static String generateQuiz(String moduleId) => '/ai/quiz/generate/$moduleId';
  static String getCachedQuiz(String moduleId) => '/ai/quiz/cached/$moduleId';

  // Category A: Vision & Image
  static String get aiAnalyze => '/ai/analyze';
  static String get aiEvacuationCheck => '/ai/evacuation/check';
  static String get aiFloorplanAnalyze => '/ai/floorplan/analyze';
  static String get aiDamageScan => '/ai/damage/scan';
  static String get aiDescribe => '/ai/describe';

  // Category B: Text & NLP
  static String get aiDrillSummarise => '/ai/drill/summarise';
  static String get aiTipToday => '/ai/tip/today';
  static String get aiAsk => '/ai/ask';
  static String get aiDrillFeedback => '/ai/drill/feedback';

  // Category E: Personalisation
  static String get aiRecommendNextModule => '/ai/recommend/next-module';
  static String get aiQuizSuggestDifficulty => '/ai/quiz/suggest-difficulty';

  // Category G: Multilingual & Accessibility
  static String get aiTranslate => '/ai/translate';
  static String get aiSimplify => '/ai/simplify';

  // O1: AI Disaster Scenario Simulator
  static String get aiScenarioNext => '/ai/scenario/next';

  // Leaderboard
  static String get leaderboard => '/leaderboard';
  static String get squadWars => '/leaderboard/squad-wars';
  static String classLeaderboard(String classId) =>
      '/leaderboard/class/$classId';
  static String get refreshLeaderboard => '/leaderboard/refresh';

  // Sync Conflict Resolution
  static String resolveConflict(String queueItemId) =>
      '/sync/resolve-conflict/$queueItemId';

  // Voice Commands
  static String get voiceCommand => '/voice/command';
  static String get voiceCommands => '/voice/commands';

  // Phase 5.3: Mesh Networking
  static String get meshKey => '/mesh/key';
  static String get meshKeyRotate => '/mesh/key/rotate';
  static String get meshSync => '/mesh/sync';

  // Phase 5.7: AR Sessions
  static String get arSession => '/ar/sessions';
  static String arSessionById(String sessionId) => '/ar/sessions/$sessionId';

  // Student endpoints
  static String get studentJoinClass => '/student/join-class';
  static String get studentLeaveClass => '/student/leave-class';

  // Parent endpoints - Parent Monitoring System Phase 3
  static String get parentChildren => '/parent/children';
  static String parentChildDetails(String studentId) =>
      '/parent/children/$studentId';
  static String parentChildProgress(String studentId) =>
      '/parent/children/$studentId/progress';
  static String parentChildLocation(String studentId) =>
      '/parent/children/$studentId/location';
  static String parentChildDrills(String studentId) =>
      '/parent/children/$studentId/drills';
  static String parentChildAttendance(String studentId) =>
      '/parent/children/$studentId/attendance';
  static String get parentVerifyStudentQR => '/parent/verify-student-qr';
  static String get parentNotifications => '/parent/notifications';
  static String parentNotificationRead(String notificationId) =>
      '/parent/notifications/$notificationId/read';
  static String get parentMarkAllNotificationsRead =>
      '/parent/notifications/read-all';
  // Parent Linking
  static String get parentLinkChildByQr => '/parent/children/link/qr';
  static String get parentLinkChildById => '/parent/children/link/id';
  static String get parentLinkRequests => '/parent/children/link-requests';
  static String parentDeleteLinkRequest(String requestId) =>
      '/parent/children/link-requests/$requestId';
  // Parent Management (Phase 1)
  static String parentUnlinkChild(String studentId) =>
      '/parent/children/$studentId/unlink';
  static String parentUpdateRelationship(String studentId) =>
      '/parent/children/$studentId/relationship';
  static String parentChildStatus(String studentId) =>
      '/parent/children/$studentId/status';
  static String get parentDashboardSummary => '/parent/dashboard-summary';
  // Parent Profile (Phase 2)
  static String get parentProfile => '/parent/profile';
  static String get parentChangePassword => '/parent/profile/password';
}
