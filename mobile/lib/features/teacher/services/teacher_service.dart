import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';

/// Teacher Service
/// Phase 2.5: K-12 Multi-Access
class TeacherService {
  final ApiService _apiService;

  TeacherService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  /// Get teacher's classes
  Future<List<Map<String, dynamic>>> getClasses() async {
    try {
      final response = await _apiService.get(ApiEndpoints.teacherClasses);
      final data = response.data as Map<String, dynamic>;
      final classes =
          (data['data'] as Map<String, dynamic>?)?['classes'] as List? ?? [];
      return List<Map<String, dynamic>>.from(classes);
    } catch (e) {
      print('âŒ Get classes error: $e');
      rethrow;
    }
  }

  /// Get students in a class
  Future<Map<String, dynamic>> getClassStudents(String classId) async {
    try {
      final response =
          await _apiService.get(ApiEndpoints.classStudents(classId));
      final data = response.data as Map<String, dynamic>;
      return data['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('âŒ Get class students error: $e');
      rethrow;
    }
  }

  /// Start drill for class
  Future<Map<String, dynamic>> startDrill(
      String classId, String drillType) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.startClassDrill(classId),
        data: {
          'drillType': drillType,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return data['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('âŒ Start drill error: $e');
      rethrow;
    }
  }

  /// Mark student participation
  Future<void> markParticipation(
    String classId,
    String studentId,
    bool participated,
  ) async {
    try {
      await _apiService.post(
        ApiEndpoints.markParticipation(classId, studentId),
        data: {
          'participated': participated,
        },
      );
    } catch (e) {
      print('âŒ Mark participation error: $e');
      rethrow;
    }
  }

  /// Get class analytics
  Future<Map<String, dynamic>> getClassAnalytics(String classId) async {
    try {
      final response =
          await _apiService.get(ApiEndpoints.classAnalytics(classId));
      final data = response.data as Map<String, dynamic>;
      return data['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('âŒ Get analytics error: $e');
      rethrow;
    }
  }

  /// Phase 3.4.5: Mark attendance for a class
  Future<Map<String, dynamic>> markAttendance(
    String classId,
    String date,
    List<Map<String, dynamic>> records,
  ) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.markAttendance(classId),
        data: {
          'date': date,
          'records': records,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return data['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('âŒ Mark attendance error: $e');
      rethrow;
    }
  }

  /// Phase 3.4.5: Get attendance for a class
  Future<List<Map<String, dynamic>>> getAttendance(
    String classId, {
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;

      final response = await _apiService.get(
        ApiEndpoints.getAttendance(classId),
        queryParameters: queryParams,
      );
      final data = response.data as Map<String, dynamic>;
      final attendance =
          (data['data'] as Map<String, dynamic>?)?['attendance'] as List? ?? [];
      return List<Map<String, dynamic>>.from(attendance);
    } catch (e) {
      print('âŒ Get attendance error: $e');
      rethrow;
    }
  }

  /// Phase 3.4.5: Assign XP to students
  Future<Map<String, dynamic>> assignXP(
    String classId,
    int xpAmount, {
    List<String>? studentIds,
    String? reason,
  }) async {
    try {
      final data = <String, dynamic>{
        'xpAmount': xpAmount,
      };
      if (studentIds != null) data['studentIds'] = studentIds;
      if (reason != null) data['reason'] = reason;

      final response = await _apiService.post(
        ApiEndpoints.assignXP(classId),
        data: data,
      );
      final responseData = response.data as Map<String, dynamic>;
      return responseData['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('âŒ Assign XP error: $e');
      rethrow;
    }
  }

  /// Phase 3.4.5: Get XP history for a class
  Future<Map<String, dynamic>> getXPHistory(
    String classId, {
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;

      final response = await _apiService.get(
        ApiEndpoints.getXPHistory(classId),
        queryParameters: queryParams,
      );
      final data = response.data as Map<String, dynamic>;
      return data['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('âŒ Get XP history error: $e');
      rethrow;
    }
  }

  /// Phase 3.4.5: Trigger group quiz
  Future<Map<String, dynamic>> triggerGroupQuiz(
    String classId,
    String moduleId, {
    int? duration,
    String? deviceId,
  }) async {
    try {
      final data = <String, dynamic>{
        'moduleId': moduleId,
      };
      if (duration != null) data['duration'] = duration;
      if (deviceId != null) data['deviceId'] = deviceId;

      final response = await _apiService.post(
        ApiEndpoints.triggerQuiz(classId),
        data: data,
      );
      final responseData = response.data as Map<String, dynamic>;
      return responseData['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('âŒ Trigger quiz error: $e');
      rethrow;
    }
  }

  /// Phase 3.4.5: Get active group quizzes
  Future<List<Map<String, dynamic>>> getActiveQuizzes(String classId) async {
    try {
      final response =
          await _apiService.get(ApiEndpoints.getActiveQuizzes(classId));
      final data = response.data as Map<String, dynamic>;
      final quizzes =
          (data['data'] as Map<String, dynamic>?)?['quizzes'] as List? ?? [];
      return List<Map<String, dynamic>>.from(quizzes);
    } catch (e) {
      print('âŒ Get active quizzes error: $e');
      rethrow;
    }
  }

  /// Phase 3.4.5: Get group quiz results
  Future<Map<String, dynamic>> getQuizResults(String activityId) async {
    try {
      final response =
          await _apiService.get(ApiEndpoints.getQuizResults(activityId));
      final data = response.data as Map<String, dynamic>;
      return data['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('âŒ Get quiz results error: $e');
      rethrow;
    }
  }

  /// Phase 3.4.5: Get student progress
  Future<Map<String, dynamic>> getStudentProgress(String classId) async {
    try {
      final response =
          await _apiService.get(ApiEndpoints.getStudentProgress(classId));
      final data = response.data as Map<String, dynamic>;
      return data['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('âŒ Get student progress error: $e');
      rethrow;
    }
  }

  /// Create roster student (KG-4th grade) - Manual student addition by teacher
  Future<Map<String, dynamic>> createRosterStudent(
    String classId, {
    required String name,
    String? parentName,
    String? parentPhone,
    String? notes,
  }) async {
    try {
      final data = <String, dynamic>{
        'name': name,
      };
      if (parentName != null && parentName.isNotEmpty) {
        data['parentName'] = parentName;
      }
      if (parentPhone != null && parentPhone.isNotEmpty) {
        data['parentPhone'] = parentPhone;
      }
      if (notes != null && notes.isNotEmpty) {
        data['notes'] = notes;
      }

      final response = await _apiService.post(
        ApiEndpoints.createRosterRecord(classId),
        data: data,
      );
      final responseData = response.data as Map<String, dynamic>;
      return responseData['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('âŒ Create roster student error: $e');
      rethrow;
    }
  }

  /// Phase 7: Get parents for a specific student
  /// GET /api/teacher/students/:studentId/parents
  Future<List<Map<String, dynamic>>> getStudentParents(
      String studentId) async {
    try {
      final response = await _apiService.get(
        '/teacher/students/$studentId/parents',
      );
      final data = response.data as Map<String, dynamic>;
      if (data['success'] == true) {
        final parents =
            (data['data'] as Map<String, dynamic>?)?['parents'] as List? ?? [];
        return List<Map<String, dynamic>>.from(parents);
      }
      throw Exception(data['message'] ?? 'Failed to load student parents');
    } catch (e) {
      print('âŒ Get student parents error: $e');
      rethrow;
    }
  }

  /// Phase 7: Get all parents for a class
  /// GET /api/teacher/classes/:classId/parents
  Future<List<Map<String, dynamic>>> getClassParents(String classId) async {
    try {
      final response = await _apiService.get(
        '/teacher/classes/$classId/parents',
      );
      final data = response.data as Map<String, dynamic>;
      if (data['success'] == true) {
        final parents =
            (data['data'] as Map<String, dynamic>?)?['parents'] as List? ?? [];
        return List<Map<String, dynamic>>.from(parents);
      }
      throw Exception(data['message'] ?? 'Failed to load class parents');
    } catch (e) {
      print('âŒ Get class parents error: $e');
      rethrow;
    }
  }

  /// Phase 7: Verify parent by QR code
  /// POST /api/teacher/parents/verify-qr
  Future<Map<String, dynamic>> verifyParentByQR(
    String qrCodeData, {
    Map<String, double>? location,
  }) async {
    try {
      final data = <String, dynamic>{
        'qrCodeData': qrCodeData,
      };
      if (location != null) {
        data['location'] = location;
      }

      final response = await _apiService.post(
        '/teacher/parents/verify-qr',
        data: data,
      );
      final responseData = response.data as Map<String, dynamic>;
      if (responseData['success'] == true) {
        return responseData['data'] as Map<String, dynamic>? ?? {};
      }
      throw Exception(
          responseData['message'] ?? 'Failed to verify parent QR code');
    } catch (e) {
      print('âŒ Verify parent QR error: $e');
      rethrow;
    }
  }
}
