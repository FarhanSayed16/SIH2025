/// Phase 3.3.2: Adaptive Scoring Provider
/// Riverpod provider for adaptive scoring state management

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/adaptive_scoring_models.dart';
import '../services/adaptive_scoring_service.dart';
import '../../../core/providers/api_service_provider.dart';

/// Adaptive Scoring Service Provider
final adaptiveScoringServiceProvider = Provider<AdaptiveScoringService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AdaptiveScoringService(apiService: apiService);
});

/// Per-Student Scores State
class PerStudentScoresState {
  final List<StudentScore> scores;
  final bool isLoading;
  final String? error;
  final DateTime? lastFetched;

  PerStudentScoresState({
    this.scores = const [],
    this.isLoading = false,
    this.error,
    this.lastFetched,
  });

  PerStudentScoresState copyWith({
    List<StudentScore>? scores,
    bool? isLoading,
    String? error,
    DateTime? lastFetched,
  }) {
    return PerStudentScoresState(
      scores: scores ?? this.scores,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastFetched: lastFetched ?? this.lastFetched,
    );
  }
}

/// Per-Student Scores Notifier
class PerStudentScoresNotifier extends StateNotifier<PerStudentScoresState> {
  final AdaptiveScoringService _service;

  PerStudentScoresNotifier(this._service) : super(PerStudentScoresState());

  /// Load per-student scores for a class
  Future<void> loadScores({
    required String classId,
    String? gameType,
    String? moduleId,
    DateTime? startDate,
    DateTime? endDate,
    bool forceRefresh = false,
  }) async {
    // Don't reload if recently fetched (unless force refresh)
    if (!forceRefresh &&
        state.lastFetched != null &&
        DateTime.now().difference(state.lastFetched!).inMinutes < 5) {
      return;
    }

    state = state.copyWith(isLoading: true, error: null);

    try {
      final scores = await _service.getPerStudentScores(
        classId,
        gameType: gameType,
        moduleId: moduleId,
        startDate: startDate,
        endDate: endDate,
      );
      state = PerStudentScoresState(
        scores: scores,
        isLoading: false,
        lastFetched: DateTime.now(),
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Per-Student Scores Provider (family for classId)
final perStudentScoresProvider = StateNotifierProvider.family<
    PerStudentScoresNotifier, PerStudentScoresState, String>((ref, classId) {
  final service = ref.watch(adaptiveScoringServiceProvider);
  return PerStudentScoresNotifier(service);
});

/// Shared XP Distribution State
class SharedXPDistributionState {
  final List<SharedXPDistribution> distributions;
  final bool isLoading;
  final String? error;
  final DateTime? lastFetched;

  SharedXPDistributionState({
    this.distributions = const [],
    this.isLoading = false,
    this.error,
    this.lastFetched,
  });

  SharedXPDistributionState copyWith({
    List<SharedXPDistribution>? distributions,
    bool? isLoading,
    String? error,
    DateTime? lastFetched,
  }) {
    return SharedXPDistributionState(
      distributions: distributions ?? this.distributions,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastFetched: lastFetched ?? this.lastFetched,
    );
  }
}

/// Shared XP Distribution Notifier
class SharedXPDistributionNotifier
    extends StateNotifier<SharedXPDistributionState> {
  final AdaptiveScoringService _service;

  SharedXPDistributionNotifier(this._service)
      : super(SharedXPDistributionState());

  /// Load shared XP distribution history for a class
  Future<void> loadDistributions({
    required String classId,
    String? activityType,
    DateTime? startDate,
    DateTime? endDate,
    bool forceRefresh = false,
  }) async {
    // Don't reload if recently fetched (unless force refresh)
    if (!forceRefresh &&
        state.lastFetched != null &&
        DateTime.now().difference(state.lastFetched!).inMinutes < 5) {
      return;
    }

    state = state.copyWith(isLoading: true, error: null);

    try {
      final distributions = await _service.getSharedXPDistribution(
        classId,
        activityType: activityType,
        startDate: startDate,
        endDate: endDate,
      );
      state = SharedXPDistributionState(
        distributions: distributions,
        isLoading: false,
        lastFetched: DateTime.now(),
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Shared XP Distribution Provider (family for classId)
final sharedXPDistributionProvider = StateNotifierProvider.family<
    SharedXPDistributionNotifier, SharedXPDistributionState, String>((ref, classId) {
  final service = ref.watch(adaptiveScoringServiceProvider);
  return SharedXPDistributionNotifier(service);
});

/// Aggregated Student Scores State
class AggregatedStudentScoresState {
  final AggregatedStudentScores? scores;
  final bool isLoading;
  final String? error;
  final DateTime? lastFetched;

  AggregatedStudentScoresState({
    this.scores,
    this.isLoading = false,
    this.error,
    this.lastFetched,
  });

  AggregatedStudentScoresState copyWith({
    AggregatedStudentScores? scores,
    bool? isLoading,
    String? error,
    DateTime? lastFetched,
  }) {
    return AggregatedStudentScoresState(
      scores: scores ?? this.scores,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastFetched: lastFetched ?? this.lastFetched,
    );
  }
}

/// Aggregated Student Scores Notifier
class AggregatedStudentScoresNotifier
    extends StateNotifier<AggregatedStudentScoresState> {
  final AdaptiveScoringService _service;

  AggregatedStudentScoresNotifier(this._service)
      : super(AggregatedStudentScoresState());

  /// Load aggregated student scores
  Future<void> loadScores({
    required String studentId,
    bool forceRefresh = false,
  }) async {
    // Don't reload if recently fetched (unless force refresh)
    if (!forceRefresh &&
        state.lastFetched != null &&
        DateTime.now().difference(state.lastFetched!).inMinutes < 5) {
      return;
    }

    state = state.copyWith(isLoading: true, error: null);

    try {
      final scores = await _service.getAggregatedStudentScores(studentId);
      state = AggregatedStudentScoresState(
        scores: scores,
        isLoading: false,
        lastFetched: DateTime.now(),
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Aggregated Student Scores Provider (family for studentId)
final aggregatedStudentScoresProvider = StateNotifierProvider.family<
    AggregatedStudentScoresNotifier,
    AggregatedStudentScoresState,
    String>((ref, studentId) {
  final service = ref.watch(adaptiveScoringServiceProvider);
  return AggregatedStudentScoresNotifier(service);
});

