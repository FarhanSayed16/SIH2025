import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/map_models.dart';

class MapDataService {
  final ApiService _apiService;

  MapDataService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  Future<MapDataModel> getMapData(String schoolId, {int? floor}) async {
    try {
      final query = <String, dynamic>{};
      if (floor != null) query['floor'] = floor;

      final Response<dynamic> response = await _apiService.get(
        ApiEndpoints.floorPlanMapData(schoolId),
        queryParameters: query,
      );
      final data = response.data as Map<String, dynamic>;
      final payload = data['data'] ?? data; // some endpoints wrap in data
      return MapDataModel.fromJson(payload as Map<String, dynamic>);
    } catch (e) {
      print('❌ Failed to fetch map data: $e');
      rethrow;
    }
  }

  Future<NavigationRouteModel> getNavigationRoute({
    required String schoolId,
    required double fromX,
    required double fromY,
    required double toX,
    required double toY,
    int? floor,
  }) async {
    try {
      final query = <String, dynamic>{
        'fromX': fromX,
        'fromY': fromY,
        'toX': toX,
        'toY': toY,
      };
      if (floor != null) query['floor'] = floor;

      final Response<dynamic> response = await _apiService.get(
        ApiEndpoints.floorPlanNavigation(schoolId),
        queryParameters: query,
      );
      final data = response.data as Map<String, dynamic>;
      final payload = data['data'] ?? data;
      return NavigationRouteModel.fromJson(payload as Map<String, dynamic>);
    } catch (e) {
      print('❌ Failed to fetch navigation route: $e');
      rethrow;
    }
  }
}
