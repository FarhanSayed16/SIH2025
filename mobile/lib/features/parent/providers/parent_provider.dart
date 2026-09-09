/// Parent Provider
/// Manages parent state and data
/// Parent Monitoring System - Phase 3

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../services/parent_service.dart';
import '../models/parent_models.dart';

final parentServiceProvider = Provider<ParentService>((ref) {
  final apiService = ApiService();
  return ParentService(apiService);
});

final childrenProvider = FutureProvider<List<ParentChild>>((ref) async {
  final service = ref.read(parentServiceProvider);
  return await service.getChildren();
});

final childDetailsProvider =
    FutureProvider.family<ChildProgress, String>((ref, studentId) async {
  final service = ref.read(parentServiceProvider);
  return await service.getChildDetails(studentId);
});

final childLocationProvider =
    FutureProvider.family<ChildLocation, String>((ref, studentId) async {
  final service = ref.read(parentServiceProvider);
  return await service.getChildLocation(studentId);
});

final childDrillsProvider =
    FutureProvider.family<List<DrillParticipation>, String>((ref, studentId) async {
  final service = ref.read(parentServiceProvider);
  return await service.getChildDrills(studentId);
});

final childAttendanceProvider = FutureProvider.family<AttendanceData, Map<String, String?>>(
    (ref, params) async {
  final service = ref.read(parentServiceProvider);
  final studentId = params['studentId']!;
  final startDate = params['startDate'];
  final endDate = params['endDate'];
  return await service.getChildAttendance(
    studentId,
    startDate: startDate,
    endDate: endDate,
  );
});

final notificationsProvider = FutureProvider<List<ParentNotification>>((ref) async {
  final service = ref.read(parentServiceProvider);
  return await service.getNotifications();
});

final unreadNotificationsCountProvider = Provider<int?>((ref) {
  final notifications = ref.watch(notificationsProvider);
  return notifications.when(
    data: (notifications) => notifications.where((n) => !n.read).length,
    loading: () => null,
    error: (_, __) => null,
  );
});

