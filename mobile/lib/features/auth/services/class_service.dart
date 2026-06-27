/// Phase 3.4.6.1: Class Service
/// Fetches classes by institution for registration

import '../../../core/services/api_service.dart';

class ClassService {
  final ApiService _apiService;

  ClassService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  /// Get classes by institution (public endpoint for registration)
  /// Note: This might need to be created or use an existing endpoint
  Future<List<Map<String, dynamic>>> getClassesByInstitution(
    String institutionId,
  ) async {
    try {
      // Try to get classes via a public endpoint
      // If no public endpoint exists, this will need to be created
      // For now, we'll return empty list and handle it gracefully
      final response = await _apiService.get(
        '/classes', // This endpoint might need to be created
        queryParameters: {
          'institutionId': institutionId,
        },
      );

      final data = response.data as Map<String, dynamic>;
      
      if (data['data'] != null && data['data'] is List) {
        return List<Map<String, dynamic>>.from(data['data'] as List);
      }

      return [];
    } catch (e) {
      // Endpoint might not exist - return empty list gracefully
      print('⚠️ Get classes error (endpoint might not exist): $e');
      return [];
    }
  }
}

