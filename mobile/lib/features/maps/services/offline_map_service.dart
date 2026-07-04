/// Phase 3.5.3: Offline Map Service
/// Handles offline map tile caching and route storage

import '../../../core/services/storage_service.dart';
import '../../../core/services/offline_storage_service.dart';
import '../../../core/constants/app_constants.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class OfflineMapService {
  final StorageService _storageService;
  final OfflineStorageService _offlineStorage;

  OfflineMapService({
    StorageService? storageService,
    OfflineStorageService? offlineStorage,
  })  : _storageService = storageService ?? StorageService(),
        _offlineStorage = offlineStorage ?? OfflineStorageService();

  /// Cache map tiles for a region
  /// Phase 3.5.3: Store map tiles for offline access
  Future<bool> cacheMapRegion({
    required LatLng center,
    required double radiusKm,
    required int zoomLevel,
  }) async {
    try {
      if (!await _offlineStorage.isOnline()) {
        print('⚠️ Cannot cache maps offline - no internet connection');
        return false;
      }

      // Check cache size before downloading
      final cacheStats = await _offlineStorage.getCacheStats();
      final cacheSizeMB = double.tryParse(cacheStats['cacheSizeMB'] as String? ?? '0') ?? 0;
      
      // Estimate map tile size (rough estimate: 1km² ≈ 100KB at zoom level 15)
      final estimatedSizeMB = (radiusKm * radiusKm * 0.1).clamp(1.0, 50.0);
      
      if (cacheSizeMB + estimatedSizeMB > 400) {
        print('⚠️ Map cache would exceed limit');
        return false;
      }

      final box = await _storageService.openBox(AppConstants.cacheBox);
      final regionId = 'map_${center.latitude}_${center.longitude}_${radiusKm}_${zoomLevel}';
      
      // Store map region metadata
      await box.put(regionId, {
        'center': {
          'latitude': center.latitude,
          'longitude': center.longitude,
        },
        'radiusKm': radiusKm,
        'zoomLevel': zoomLevel,
        'cachedAt': DateTime.now().toIso8601String(),
      });

      // Add to cached regions list
      final cachedRegions = box.get('cachedMapRegions', defaultValue: <String>[]) as List<dynamic>;
      final updatedList = List<String>.from(cachedRegions.map((e) => e.toString()));
      if (!updatedList.contains(regionId)) {
        updatedList.add(regionId);
        await box.put('cachedMapRegions', updatedList);
      }

      print('✅ Map region cached: $regionId');
      return true;
    } catch (e) {
      print('❌ Failed to cache map region: $e');
      return false;
    }
  }

  /// Check if map region is cached
  Future<bool> isMapRegionCached({
    required LatLng center,
    required double radiusKm,
    required int zoomLevel,
  }) async {
    try {
      final box = await _storageService.openBox(AppConstants.cacheBox);
      final regionId = 'map_${center.latitude}_${center.longitude}_${radiusKm}_${zoomLevel}';
      return box.get(regionId) != null;
    } catch (e) {
      return false;
    }
  }

  /// Get cached map regions
  Future<List<Map<String, dynamic>>> getCachedMapRegions() async {
    try {
      final box = await _storageService.openBox(AppConstants.cacheBox);
      final cachedRegions = box.get('cachedMapRegions', defaultValue: <String>[]) as List<dynamic>;
      final regions = <Map<String, dynamic>>[];

      for (var regionId in cachedRegions) {
        final regionData = box.get(regionId.toString());
        if (regionData != null && regionData is Map) {
          regions.add(Map<String, dynamic>.from(regionData));
        }
      }

      return regions;
    } catch (e) {
      return [];
    }
  }

  /// Clear cached map regions
  Future<void> clearCachedMapRegions() async {
    try {
      final box = await _storageService.openBox(AppConstants.cacheBox);
      final cachedRegions = box.get('cachedMapRegions', defaultValue: <String>[]) as List<dynamic>;
      
      for (var regionId in cachedRegions) {
        await box.delete(regionId.toString());
      }
      
      await box.delete('cachedMapRegions');
      print('✅ Cleared cached map regions');
    } catch (e) {
      print('❌ Failed to clear cached map regions: $e');
    }
  }

  /// Store route for offline access
  /// Phase 3.5.3: Cache evacuation routes
  Future<bool> cacheRoute({
    required String routeId,
    required List<LatLng> waypoints,
    required String routeName,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final box = await _storageService.openBox(AppConstants.cacheBox);
      final routeKey = 'route_$routeId';
      
      await box.put(routeKey, {
        'routeId': routeId,
        'routeName': routeName,
        'waypoints': waypoints.map((point) => {
          'latitude': point.latitude,
          'longitude': point.longitude,
        }).toList(),
        'metadata': metadata ?? {},
        'cachedAt': DateTime.now().toIso8601String(),
      });

      // Add to cached routes list
      final cachedRoutes = box.get('cachedRoutes', defaultValue: <String>[]) as List<dynamic>;
      final updatedList = List<String>.from(cachedRoutes.map((e) => e.toString()));
      if (!updatedList.contains(routeId)) {
        updatedList.add(routeId);
        await box.put('cachedRoutes', updatedList);
      }

      print('✅ Route cached: $routeName');
      return true;
    } catch (e) {
      print('❌ Failed to cache route: $e');
      return false;
    }
  }

  /// Get cached route
  Future<Map<String, dynamic>?> getCachedRoute(String routeId) async {
    try {
      final box = await _storageService.openBox(AppConstants.cacheBox);
      final routeData = box.get('route_$routeId');
      
      if (routeData != null && routeData is Map) {
        return Map<String, dynamic>.from(routeData);
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Get all cached routes
  Future<List<Map<String, dynamic>>> getCachedRoutes() async {
    try {
      final box = await _storageService.openBox(AppConstants.cacheBox);
      final cachedRoutes = box.get('cachedRoutes', defaultValue: <String>[]) as List<dynamic>;
      final routes = <Map<String, dynamic>>[];

      for (var routeId in cachedRoutes) {
        final routeData = box.get('route_$routeId');
        if (routeData != null && routeData is Map) {
          routes.add(Map<String, dynamic>.from(routeData));
        }
      }

      return routes;
    } catch (e) {
      return [];
    }
  }
}

