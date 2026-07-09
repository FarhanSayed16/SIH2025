import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/api_service_provider.dart';
import '../models/leaderboard_model.dart';
import '../services/leaderboard_service.dart';
import 'package:flutter/foundation.dart';

/// Leaderboard Service Provider
final leaderboardServiceProvider = Provider<LeaderboardService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return LeaderboardService(apiService: apiService);
});

/// Leaderboard State
class LeaderboardState {
  final LeaderboardResponse? leaderboard;
  final bool isLoading;
  final String? error;
  final DateTime? lastFetched;
  final String? currentType;
  final String? currentGameType; // Track gameType for games leaderboard

  LeaderboardState({
    this.leaderboard,
    this.isLoading = false,
    this.error,
    this.lastFetched,
    this.currentType,
    this.currentGameType,
  });

  LeaderboardState copyWith({
    LeaderboardResponse? leaderboard,
    bool? isLoading,
    String? error,
    DateTime? lastFetched,
    String? currentType,
    String? currentGameType,
  }) {
    return LeaderboardState(
      leaderboard: leaderboard ?? this.leaderboard,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastFetched: lastFetched ?? this.lastFetched,
      currentType: currentType ?? this.currentType,
      currentGameType: currentGameType ?? this.currentGameType,
    );
  }
}

/// Leaderboard Notifier
class LeaderboardNotifier extends StateNotifier<LeaderboardState> {
  final LeaderboardService _service;

  LeaderboardNotifier(this._service) : super(LeaderboardState());

  /// Load leaderboard
  Future<void> loadLeaderboard({
    String? schoolId,
    String type = 'overall',
    String? gameType,
    int limit = 50,
    bool forceRefresh = false,
  }) async {
    // CRITICAL: Validate gameType is provided when type is 'games'
    if (type == 'games') {
      if (gameType == null || gameType.isEmpty) {
        // Default to 'bag-packer' if not provided
        gameType = 'bag-packer';
        debugPrint('⚠️ Game type not provided for games leaderboard, defaulting to: $gameType');
      }
    }

    // Check cache - include gameType in cache key for games type
    final cacheKey = type == 'games' ? '$type-$gameType' : type;
    final currentCacheKey = state.currentType == 'games' 
        ? '${state.currentType}-${state.currentGameType}'
        : state.currentType;

    if (!forceRefresh &&
        state.lastFetched != null &&
        cacheKey == currentCacheKey &&
        DateTime.now().difference(state.lastFetched!).inMinutes < 5) {
      debugPrint('📦 Using cached leaderboard for: $cacheKey');
      return;
    }

    state = state.copyWith(
      isLoading: true, 
      error: null, 
      currentType: type,
      currentGameType: type == 'games' ? gameType : null,
    );

    try {
      final leaderboard = await _service.getLeaderboard(
        schoolId: schoolId,
        type: type,
        gameType: gameType,
        limit: limit,
      );
      state = LeaderboardState(
        leaderboard: leaderboard,
        isLoading: false,
        lastFetched: DateTime.now(),
        currentType: type,
        currentGameType: type == 'games' ? gameType : null,
      );
    } catch (e) {
      debugPrint('Error loading leaderboard: $e');
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

/// Leaderboard Provider
final leaderboardProvider =
    StateNotifierProvider<LeaderboardNotifier, LeaderboardState>((ref) {
  final service = ref.watch(leaderboardServiceProvider);
  return LeaderboardNotifier(service);
});

/// Squad Wars State
class SquadWarsState {
  final List<SquadWarsEntry> leaderboard;
  final bool isLoading;
  final String? error;
  final DateTime? lastFetched;

  SquadWarsState({
    this.leaderboard = const [],
    this.isLoading = false,
    this.error,
    this.lastFetched,
  });

  SquadWarsState copyWith({
    List<SquadWarsEntry>? leaderboard,
    bool? isLoading,
    String? error,
    DateTime? lastFetched,
  }) {
    return SquadWarsState(
      leaderboard: leaderboard ?? this.leaderboard,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastFetched: lastFetched ?? this.lastFetched,
    );
  }
}

/// Squad Wars Notifier
class SquadWarsNotifier extends StateNotifier<SquadWarsState> {
  final LeaderboardService _service;

  SquadWarsNotifier(this._service) : super(SquadWarsState());

  /// Load Squad Wars leaderboard
  Future<void> loadSquadWars({
    String? schoolId,
    int limit = 20,
    bool forceRefresh = false,
  }) async {
    if (!forceRefresh &&
        state.lastFetched != null &&
        DateTime.now().difference(state.lastFetched!).inMinutes < 5) {
      return;
    }

    state = state.copyWith(isLoading: true, error: null);

    try {
      final leaderboard = await _service.getSquadWars(
        schoolId: schoolId,
        limit: limit,
      );
      state = SquadWarsState(
        leaderboard: leaderboard,
        isLoading: false,
        lastFetched: DateTime.now(),
      );
    } catch (e) {
      debugPrint('Error loading Squad Wars leaderboard: $e');
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

/// Squad Wars Provider
final squadWarsProvider =
    StateNotifierProvider<SquadWarsNotifier, SquadWarsState>((ref) {
  final service = ref.watch(leaderboardServiceProvider);
  return SquadWarsNotifier(service);
});

