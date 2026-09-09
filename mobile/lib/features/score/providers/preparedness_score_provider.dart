/// Phase 3.3.1: Preparedness Score Provider
/// Riverpod provider for preparedness score state management
/// Phase 2: Added local calculation for optimistic updates

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/preparedness_score_model.dart';
import '../services/preparedness_score_service.dart';
import '../services/local_score_calculator.dart';
import '../../../core/providers/api_service_provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../auth/providers/auth_provider.dart';

/// Preparedness Score Service Provider
final preparednessScoreServiceProvider = Provider<PreparednessScoreService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return PreparednessScoreService(apiService: apiService);
});

/// Local Score Calculator Provider
final localScoreCalculatorProvider = Provider<LocalScoreCalculator>((ref) {
  return LocalScoreCalculator();
});

/// Where the currently shown score came from (B4 honesty).
enum ScoreSource {
  /// No valid score object to show.
  none,

  /// Estimated from on-device Hive data — not server-confirmed.
  localEstimate,

  /// Returned by the preparedness score API.
  server,
}

/// Preparedness Score State
class PreparednessScoreState {
  final PreparednessScore? score;
  final ScoreSource source;
  final bool isLoading;
  final String? error;
  final DateTime? lastFetched;

  PreparednessScoreState({
    this.score,
    this.source = ScoreSource.none,
    this.isLoading = false,
    this.error,
    this.lastFetched,
  });

  bool get hasScore => score != null;

  PreparednessScoreState copyWith({
    PreparednessScore? score,
    ScoreSource? source,
    bool? isLoading,
    String? error,
    DateTime? lastFetched,
    bool clearScore = false,
  }) {
    return PreparednessScoreState(
      score: clearScore ? null : (score ?? this.score),
      source: clearScore ? ScoreSource.none : (source ?? this.source),
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastFetched: lastFetched ?? this.lastFetched,
    );
  }
}

/// Preparedness Score Notifier
/// Phase: Progress Persistence Fix
/// Changes:
/// - Loads from Hive FIRST on initialization (optimistic UI)
/// - Prevents zero score resets on app restart
/// - Syncs with GameStatsProvider for unified state
class PreparednessScoreNotifier extends StateNotifier<PreparednessScoreState> {
  final PreparednessScoreService _service;
  final LocalScoreCalculator _localCalculator;
  final Ref _ref;
  Box<dynamic>? _completedModulesBox;
  Box<dynamic>? _gameScoresBox;
  Box<dynamic>? _quizResultsBox;

  PreparednessScoreNotifier(this._service, this._localCalculator, this._ref)
      : super(PreparednessScoreState(isLoading: true)) {
    // Load from Hive FIRST (optimistic UI) before API call
    _loadFromLocalStorage();
    _setupHiveListeners();
  }
  
  /// Load score from local storage FIRST (optimistic update)
  /// This ensures score is visible immediately on app startup
  Future<void> _loadFromLocalStorage() async {
    try {
      final userId = _ref.read(authProvider).user?.id;
      if (userId == null) {
        print('⚠️ [SCORE] No user ID for local score calculation');
        state = state.copyWith(isLoading: false, source: ScoreSource.none);
        return;
      }

      final localScore =
          await _localCalculator.calculateFromLocal(userId: userId);
      state = PreparednessScoreState(
        score: localScore,
        source: ScoreSource.localEstimate,
        isLoading: false,
        lastFetched: DateTime.now(),
      );
      print('✅ [SCORE] Loaded from local storage: ${localScore.score}%');
    } catch (e) {
      print('⚠️ [SCORE] Error loading from local storage: $e');
      state = state.copyWith(
        isLoading: false,
        clearScore: true,
        error: e.toString(),
      );
    }
  }

  /// Phase 2: Setup Hive listeners for auto-updates
  Future<void> _setupHiveListeners() async {
    try {
      // Listen to completed modules box
      _completedModulesBox = await Hive.openBox(AppConstants.completedModulesBox);
      _completedModulesBox!.watch().listen((event) {
        // Recalculate score when modules are completed
        _calculateLocalScore();
      });

      // Listen to game scores box
      _gameScoresBox = await Hive.openBox(AppConstants.gameScoresBox);
      _gameScoresBox!.watch().listen((event) {
        // Recalculate score when game scores are added
        _calculateLocalScore();
      });

      // Listen to quiz results box
      _quizResultsBox = await Hive.openBox(AppConstants.quizResultsBox);
      _quizResultsBox!.watch().listen((event) {
        // Recalculate score when quiz results are added
        _calculateLocalScore();
      });

      print('✅ Hive listeners setup for score auto-updates');
    } catch (e) {
      print('⚠️ Error setting up Hive listeners: $e');
    }
  }

  /// Phase 2: Calculate score locally (optimistic update)
  Future<void> _calculateLocalScore() async {
    try {
      final userId = _ref.read(authProvider).user?.id;
      if (userId == null) {
        print('⚠️ [SCORE] No user ID for local score calculation');
        return;
      }

      final localScore =
          await _localCalculator.calculateFromLocal(userId: userId);
      // Keep server score if we already have one; local is for optimistic / offline.
      if (state.source == ScoreSource.server && state.score != null) {
        return;
      }
      state = PreparednessScoreState(
        score: localScore,
        source: ScoreSource.localEstimate,
        isLoading: false,
        lastFetched: DateTime.now(),
        error: state.error,
      );
      print('✅ [SCORE] Local score calculated: ${localScore.score}%');
    } catch (e) {
      print('⚠️ [SCORE] Error calculating local score: $e');
      // Keep existing score; do not invent zero
    }
  }

  /// Load preparedness score
  /// Phase 2: Calculates locally first (optimistic), then syncs with backend
  Future<void> loadScore({String? userId, bool forceRefresh = false}) async {
    // Don't reload if recently fetched (unless force refresh)
    if (!forceRefresh &&
        state.lastFetched != null &&
        DateTime.now().difference(state.lastFetched!).inMinutes < 5) {
      return;
    }

    state = state.copyWith(isLoading: true, error: null);

    // Local estimate first when we do not yet have a server score
    if (state.source != ScoreSource.server) {
      try {
        await _calculateLocalScore();
      } catch (e) {
        print('⚠️ Local score calculation failed: $e');
      }
    }

    try {
      final apiScore = await _service.getPreparednessScore(userId: userId);
      state = PreparednessScoreState(
        score: apiScore,
        source: ScoreSource.server,
        isLoading: false,
        lastFetched: DateTime.now(),
      );
      print('✅ Score synced with backend: ${apiScore.score}%');
    } catch (e) {
      // Retain labeled local/server cache; surface refresh failure
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      print('⚠️ Backend score fetch failed, using cached score: $e');
    }
  }

  /// Recalculate and reload score
  /// Phase 2: Calculates locally first, then triggers backend recalculation
  Future<void> recalculateScore({String? userId}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // Force local refresh even if a server score exists
      final uid = userId ?? _ref.read(authProvider).user?.id;
      if (uid != null) {
        final localScore =
            await _localCalculator.calculateFromLocal(userId: uid);
        state = PreparednessScoreState(
          score: localScore,
          source: ScoreSource.localEstimate,
          isLoading: true,
          lastFetched: DateTime.now(),
        );
      }
    } catch (e) {
      print('⚠️ Local score calculation failed: $e');
    }

    try {
      final score = await _service.recalculatePreparednessScore(userId: userId);
      state = PreparednessScoreState(
        score: score,
        source: ScoreSource.server,
        isLoading: false,
        lastFetched: DateTime.now(),
      );
      print('✅ Score recalculated and synced: ${score.score}%');
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      print('⚠️ Backend recalculation failed, using cached score: $e');
    }
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Preparedness Score Provider
final preparednessScoreProvider =
    StateNotifierProvider<PreparednessScoreNotifier, PreparednessScoreState>((ref) {
  final service = ref.watch(preparednessScoreServiceProvider);
  final localCalculator = ref.watch(localScoreCalculatorProvider);
  final notifier = PreparednessScoreNotifier(service, localCalculator, ref);

  // Auto-load score on initialization (will load from Hive first, then API)
  Future.microtask(() => notifier.loadScore());

  return notifier;
});

/// Score History State
class ScoreHistoryState {
  final List<ScoreHistoryEntry> entries;
  final bool isLoading;
  final String? error;

  ScoreHistoryState({
    this.entries = const [],
    this.isLoading = false,
    this.error,
  });

  ScoreHistoryState copyWith({
    List<ScoreHistoryEntry>? entries,
    bool? isLoading,
    String? error,
  }) {
    return ScoreHistoryState(
      entries: entries ?? this.entries,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Score History Notifier
class ScoreHistoryNotifier extends StateNotifier<ScoreHistoryState> {
  final PreparednessScoreService _service;

  ScoreHistoryNotifier(this._service) : super(ScoreHistoryState());

  /// Load score history
  Future<void> loadHistory({String? userId, int limit = 30}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final history = await _service.getScoreHistory(userId: userId, limit: limit);
      state = ScoreHistoryState(
        entries: history.entries,
        isLoading: false,
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

/// Score History Provider
final scoreHistoryProvider =
    StateNotifierProvider<ScoreHistoryNotifier, ScoreHistoryState>((ref) {
  final service = ref.watch(preparednessScoreServiceProvider);
  return ScoreHistoryNotifier(service);
});

