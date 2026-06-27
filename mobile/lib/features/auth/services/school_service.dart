/// Phase 3.4.6.1: School Service
/// Fetches list of schools/institutions for registration

import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';

class SchoolService {
  final ApiService _apiService;

  SchoolService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  /// Get list of schools
  Future<List<Map<String, dynamic>>> getSchools({
    String? search,
    int limit = 100,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
      };
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final response = await _apiService.get(
        ApiEndpoints.schools,
        queryParameters: queryParams,
      );

      final data = response.data as Map<String, dynamic>;
      
      // Handle paginated response
      if (data['data'] != null && data['data'] is List) {
        return List<Map<String, dynamic>>.from(data['data'] as List);
      }
      
      // Handle direct array response
      if (data['schools'] != null && data['schools'] is List) {
        return List<Map<String, dynamic>>.from(data['schools'] as List);
      }

      return [];
    } catch (e) {
      print('❌ Get schools error: $e');
      rethrow;
    }
  }
}

