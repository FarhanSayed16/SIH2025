/// Phase 4.2: Drill Service
/// Handles drill API calls and data management

import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/drill_model.dart';

class DrillService {
  final ApiService _apiService;

  DrillService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  /// Get list of drills
  Future<List<DrillModel>> getDrills({
    String? schoolId,
    String? status,
    String? type,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (schoolId != null) queryParams['schoolId'] = schoolId;
      if (status != null) queryParams['status'] = status;
      if (type != null) queryParams['type'] = type;

      final response = await _apiService.get(
        ApiEndpoints.drills,
        queryParameters: queryParams,
      );

      // Handle 200 OK with success response
      if (response.statusCode == 200 && response.data['success'] == true) {
        final drillsData = response.data['data'] as List<dynamic>?;
        if (drillsData != null) {
          return drillsData
              .map((d) => DrillModel.fromJson(d as Map<String, dynamic>))
              .toList();
        }
      }

      // Return empty list for any other response (including 404)
      return [];
    } catch (e) {
      // Handle 404 gracefully - return empty list instead of throwing
      if (e is DioException && e.response?.statusCode == 404) {
        print('No drills found (404) - returning empty list');
        return [];
      }
      // Handle 401 - token issue, but don't throw - return empty list
      if (e is DioException && e.response?.statusCode == 401) {
        print('Unauthorized (401) - token may be expired');
        return [];
      }
      print('Error getting drills: $e');
      return [];
    }
  }

  /// Get drill by ID
  Future<DrillModel?> getDrillById(String drillId) async {
    try {
      final response = await _apiService.get(ApiEndpoints.drill(drillId));

      if (response.statusCode == 200 && response.data['success'] == true) {
        final drillData = response.data['data']?['drill'];
        if (drillData != null) {
          return DrillModel.fromJson(drillData as Map<String, dynamic>);
        }
      }

      return null;
    } catch (e) {
      print('Error getting drill: $e');
      return null;
    }
  }

  /// Create a new drill
  Future<DrillModel?> createDrill({
    required String institutionId,
    required String type,
    required DateTime scheduledAt,
    int duration = 10,
    ParticipantSelection? participantSelection,
    String? notes,
  }) async {
    try {
      final data = {
        'institutionId': institutionId,
        'type': type,
        'scheduledAt': scheduledAt.toIso8601String(),
        'duration': duration,
        if (participantSelection != null)
          'participantSelection': participantSelection.toJson(),
        if (notes != null) 'notes': notes,
      };

      final response = await _apiService.post(ApiEndpoints.drills, data: data);

      if (response.statusCode == 201 && response.data['success'] == true) {
        final drillData = response.data['data']?['drill'];
        if (drillData != null) {
          return DrillModel.fromJson(drillData as Map<String, dynamic>);
        }
      }

      return null;
    } catch (e) {
      print('Error creating drill: $e');
      return null;
    }
  }

  /// Trigger/start a drill
  Future<DrillModel?> triggerDrill(String drillId) async {
    try {
      final response =
          await _apiService.post(ApiEndpoints.triggerDrill(drillId));

      if (response.statusCode == 200 && response.data['success'] == true) {
        final drillData = response.data['data']?['drill'];
        if (drillData != null) {
          return DrillModel.fromJson(drillData as Map<String, dynamic>);
        }
      }

      return null;
    } catch (e) {
      print('Error triggering drill: $e');
      return null;
    }
  }

  /// Acknowledge drill participation
  Future<bool> acknowledgeDrill(String drillId) async {
    try {
      final response =
          await _apiService.post(ApiEndpoints.acknowledgeDrill(drillId));

      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
      print('Error acknowledging drill: $e');
      return false;
    }
  }

  /// Complete drill participation
  Future<bool> completeDrill({
    required String drillId,
    required int evacuationTime,
    String? route,
    int? score,
  }) async {
    try {
      final data = {
        'evacuationTime': evacuationTime,
        if (route != null) 'route': route,
        if (score != null) 'score': score,
      };

      final response = await _apiService
          .post(ApiEndpoints.completeDrill(drillId), data: data);

      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
      print('Error completing drill: $e');
      return false;
    }
  }

  /// End drill (manual end)
  Future<bool> endDrill(String drillId) async {
    try {
      final response = await _apiService.post(ApiEndpoints.endDrill(drillId));

      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
      print('Error ending drill: $e');
      return false;
    }
  }

  /// Get drill summary
  Future<DrillSummary?> getDrillSummary(String drillId) async {
    try {
      final response =
          await _apiService.get(ApiEndpoints.drillSummary(drillId));

      if (response.statusCode == 200 && response.data['success'] == true) {
        final summaryData = response.data['data'];
        if (summaryData != null) {
          return DrillSummary.fromJson(summaryData as Map<String, dynamic>);
        }
      }

      return null;
    } catch (e) {
      print('Error getting drill summary: $e');
      return null;
    }
  }

  /// Phase 2: Get active drills
  Future<List<DrillModel>> getActiveDrills() async {
    try {
      final response = await _apiService.get(ApiEndpoints.activeDrills);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final drillsData = response.data['data']?['drills'] as List<dynamic>?;
        if (drillsData != null) {
          return drillsData
              .map((d) => DrillModel.fromJson(d as Map<String, dynamic>))
              .toList();
        }
      }

      return [];
    } catch (e) {
      if (e is DioException) {
        final code = e.response?.statusCode;
        if (code == 404 || code == 400) {
          // 400 = user institution not found (backend now returns 200 + empty; this handles older backends)
          return [];
        }
        if (code == 401) {
          print('Unauthorized (401) - token may be expired');
          return [];
        }
      }
      print('Error getting active drills: $e');
      return [];
    }
  }

  /// Phase 2: Check for active drills
  Future<DrillModel?> checkForActiveDrills() async {
    try {
      final activeDrills = await getActiveDrills();
      if (activeDrills.isNotEmpty) {
        // Return the most recent active drill
        return activeDrills.first;
      }
      return null;
    } catch (e) {
      print('Error checking for active drills: $e');
      return null;
    }
  }

  /// Phase 2: Get drill participants with status
  Future<Map<String, dynamic>?> getDrillParticipants(String drillId) async {
    try {
      final response =
          await _apiService.get(ApiEndpoints.drillParticipants(drillId));

      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data['data'] as Map<String, dynamic>?;
      }

      return null;
    } catch (e) {
      print('Error getting drill participants: $e');
      return null;
    }
  }
}

/// Drill Summary Model
class DrillSummary {
  final DrillModel drill;
  final SummaryData summary;
  final SummaryParticipants participants;

  DrillSummary({
    required this.drill,
    required this.summary,
    required this.participants,
  });

  factory DrillSummary.fromJson(Map<String, dynamic> json) {
    return DrillSummary(
      drill: DrillModel.fromJson(json['drill'] as Map<String, dynamic>),
      summary: SummaryData.fromJson(json['summary'] as Map<String, dynamic>),
      participants: SummaryParticipants.fromJson(
          json['participants'] as Map<String, dynamic>),
    );
  }
}

class SummaryData {
  final int totalParticipants;
  final int acknowledgedCount;
  final int notAcknowledgedCount;
  final int participationRate;
  final int? avgResponseTime;
  final int? fastestResponse;
  final int? slowestResponse;
  final int? avgEvacuationTime;

  SummaryData({
    required this.totalParticipants,
    required this.acknowledgedCount,
    required this.notAcknowledgedCount,
    required this.participationRate,
    this.avgResponseTime,
    this.fastestResponse,
    this.slowestResponse,
    this.avgEvacuationTime,
  });

  factory SummaryData.fromJson(Map<String, dynamic> json) {
    return SummaryData(
      totalParticipants: (json['totalParticipants'] as int?) ?? 0,
      acknowledgedCount: (json['acknowledgedCount'] as int?) ?? 0,
      notAcknowledgedCount: (json['notAcknowledgedCount'] as int?) ?? 0,
      participationRate: (json['participationRate'] as int?) ?? 0,
      avgResponseTime: json['avgResponseTime'] as int?,
      fastestResponse: json['fastestResponse'] as int?,
      slowestResponse: json['slowestResponse'] as int?,
      avgEvacuationTime: json['avgEvacuationTime'] as int?,
    );
  }
}

class SummaryParticipants {
  final List<Map<String, dynamic>> acknowledged;
  final List<Map<String, dynamic>> notAcknowledged;

  SummaryParticipants({
    required this.acknowledged,
    required this.notAcknowledged,
  });

  factory SummaryParticipants.fromJson(Map<String, dynamic> json) {
    return SummaryParticipants(
      acknowledged: (json['acknowledged'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
      notAcknowledged: (json['notAcknowledged'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
    );
  }
}
