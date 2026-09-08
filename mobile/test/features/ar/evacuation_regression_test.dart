import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';
import 'package:kavach/features/ar/models/waypoint.dart';
import 'package:kavach/features/ar/services/ar_evacuation_service.dart';
import 'package:kavach/features/ar_navigation/services/ar_navigation_service.dart';

class RouteServiceFake implements ARNavigationService {
  bool unavailable = false;
  bool empty = false;
  @override
  Future<SafeZone?> findNearestSafeZone({
    required String schoolId,
    required double lat,
    required double lng,
    String? alertType,
  }) async => SafeZone(
    zoneId: 'zone',
    name: 'Assembly',
    location: LocationPoint(lat: 1, lng: 1),
    capacity: 10,
    schoolId: schoolId,
  );
  @override
  Future<ARRoute> calculateRoute({
    required String schoolId,
    required double startLat,
    required double startLng,
    double? endLat,
    double? endLng,
    String? alertType,
  }) async {
    if (unavailable) throw StateError('503 route unavailable');
    return ARRoute(
      routeId: 'route',
      startLocation: LocationPoint(lat: startLat, lng: startLng),
      endLocation: LocationPoint(lat: 1, lng: 1),
      waypoints: empty
          ? []
          : [
              LocationPoint(lat: startLat, lng: startLng),
              LocationPoint(lat: 1, lng: 1),
            ],
      instructions: [
        RouteInstruction(
          step: 1,
          instruction: 'Follow designated exit',
          distance: 1,
          direction: 'exit',
          lat: 1,
          lng: 1,
        ),
      ],
      totalDistance: 1,
      totalDistanceFormatted: '1m',
      estimatedTime: 1,
      estimatedTimeFormatted: '1s',
      alertType: 'fire',
      schoolId: schoolId,
    );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  test(
    'route outage clears previous path and compass target; empty routes cannot create direct fallback',
    () async {
      final navigation = RouteServiceFake();
      final service = AREvacuationService(navigationService: navigation);
      final position = Position(
        latitude: 1,
        longitude: 1,
        timestamp: DateTime.now(),
        accuracy: 0,
        altitude: 0,
        altitudeAccuracy: 0,
        heading: 0,
        headingAccuracy: 0,
        speed: 0,
        speedAccuracy: 0,
      );
    final changes = <ARPath?>[];
      service.onPathChanged = changes.add;
      expect(
        await service.loadEvacuationPath(
          schoolId: 'school',
          startPosition: position,
        ),
        isNotNull,
      );
      expect(service.nextWaypoint, isNotNull);
      navigation.unavailable = true;
      expect(
        await service.loadEvacuationPath(
          schoolId: 'school',
          startPosition: position,
        ),
        isNull,
      );
      expect(service.currentPath, isNull);
      expect(service.nextWaypoint, isNull);
      expect(await service.getCompassNavigationData(), isNull);
      expect(changes.last, isNull);
      navigation.unavailable = false;
      navigation.empty = true;
      expect(
        await service.loadEvacuationPath(
          schoolId: 'school',
          startPosition: position,
        ),
        isNull,
      );
      expect(service.nextWaypoint, isNull);
      service.dispose();
    },
  );
}
