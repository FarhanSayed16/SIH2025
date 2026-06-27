/// Phase 3.3.3: Badge Provider
/// Riverpod provider for badge state management

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/badge_model.dart';
import '../services/badge_service.dart';
import '../../../core/providers/api_service_provider.dart';

/// Badge Service Provider
final badgeServiceProvider = Provider<BadgeService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return BadgeService(apiService: apiService);
});

/// All Badges State
class AllBadgesState {
  final List<Badge> badges;
  final bool isLoading;
  final String? error;
  final DateTime? lastFetched;

  AllBadgesState({
    this.badges = const [],
    this.isLoading = false,
    this.error,
    this.lastFetched,
  });

  AllBadgesState copyWith({
    List<Badge>? badges,
    bool? isLoading,
    String? error,
    DateTime? lastFetched,
  }) {
    return AllBadgesState(
      badges: badges ?? this.badges,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastFetched: lastFetched ?? this.lastFetched,
    );
  }
}

/// All Badges Notifier
class AllBadgesNotifier extends StateNotifier<AllBadgesState> {
  final BadgeService _service;

  AllBadgesNotifier(this._service) : super(AllBadgesState());

  /// Load all badges
  Future<void> loadBadges({
    String? category,
    String? gradeLevel,
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
      final badges = await _service.getAllBadges(
        category: category,
        gradeLevel: gradeLevel,
      );
      state = AllBadgesState(
        badges: badges,
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

/// All Badges Provider
final allBadgesProvider =
    StateNotifierProvider<AllBadgesNotifier, AllBadgesState>((ref) {
  final service = ref.watch(badgeServiceProvider);
  return AllBadgesNotifier(service);
});

/// My Badges State
class MyBadgesState {
  final List<Badge> badges;
  final bool isLoading;
  final String? error;
  final DateTime? lastFetched;

  MyBadgesState({
    this.badges = const [],
    this.isLoading = false,
    this.error,
    this.lastFetched,
  });

  MyBadgesState copyWith({
    List<Badge>? badges,
    bool? isLoading,
    String? error,
    DateTime? lastFetched,
  }) {
    return MyBadgesState(
      badges: badges ?? this.badges,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastFetched: lastFetched ?? this.lastFetched,
    );
  }
}

/// My Badges Notifier
class MyBadgesNotifier extends StateNotifier<MyBadgesState> {
  final BadgeService _service;

  MyBadgesNotifier(this._service) : super(MyBadgesState());

  /// Load user's earned badges
  Future<void> loadMyBadges({bool forceRefresh = false}) async {
    // Don't reload if recently fetched (unless force refresh)
    if (!forceRefresh &&
        state.lastFetched != null &&
        DateTime.now().difference(state.lastFetched!).inMinutes < 5) {
      return;
    }

    state = state.copyWith(isLoading: true, error: null);

    try {
      final badges = await _service.getMyBadges();
      state = MyBadgesState(
        badges: badges,
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

/// My Badges Provider
final myBadgesProvider =
    StateNotifierProvider<MyBadgesNotifier, MyBadgesState>((ref) {
  final service = ref.watch(badgeServiceProvider);
  return MyBadgesNotifier(service);
});

/// Badge History State
class BadgeHistoryState {
  final List<BadgeHistory> history;
  final bool isLoading;
  final String? error;
  final DateTime? lastFetched;
  final Map<String, dynamic>? pagination;

  BadgeHistoryState({
    this.history = const [],
    this.isLoading = false,
    this.error,
    this.lastFetched,
    this.pagination,
  });

  BadgeHistoryState copyWith({
    List<BadgeHistory>? history,
    bool? isLoading,
    String? error,
    DateTime? lastFetched,
    Map<String, dynamic>? pagination,
  }) {
    return BadgeHistoryState(
      history: history ?? this.history,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastFetched: lastFetched ?? this.lastFetched,
      pagination: pagination ?? this.pagination,
    );
  }
}

/// Badge History Notifier
class BadgeHistoryNotifier extends StateNotifier<BadgeHistoryState> {
  final BadgeService _service;

  BadgeHistoryNotifier(this._service) : super(BadgeHistoryState());

  /// Load badge history
  Future<void> loadHistory({
    int page = 1,
    int limit = 20,
    String? badgeId,
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
      final result = await _service.getBadgeHistory(
        page: page,
        limit: limit,
        badgeId: badgeId,
      );
      state = BadgeHistoryState(
        history: result['history'] as List<BadgeHistory>,
        pagination: result['pagination'] as Map<String, dynamic>?,
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

/// Badge History Provider
final badgeHistoryProvider =
    StateNotifierProvider<BadgeHistoryNotifier, BadgeHistoryState>((ref) {
  final service = ref.watch(badgeServiceProvider);
  return BadgeHistoryNotifier(service);
});

