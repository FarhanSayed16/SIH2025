# Main Menu Sync & Progress Persistence Fix Plan
**Date:** 2025-01-02  
**Status:** 📋 Planning Phase  
**Priority:** 🔴 Critical

---

## 🎯 **Problem Statement**

### **Issue 1: Main Menu & Home Stats Not in Sync**

**Current Behavior:**
- `HomeScreen` has a "Play Game" button that navigates to `MainMenuScreen`
- `GamesScreen` (bottom nav tab) also redirects to `MainMenuScreen`
- Both use the same screen (`MainMenuScreen`), BUT:
  - `MainMenuScreen` displays stats from `GameManager()` singleton (in-memory)
  - `HomeScreen` displays stats from `PreparednessScoreProvider` (from API/Hive)
  - These are **different data sources** and **not synced**
- When a game is completed:
  - `GameManager` updates its in-memory stats
  - `PreparednessScoreProvider` may not update immediately
  - Home stats and Main Menu stats show different values
- Score Breakdown screen uses `PreparednessScoreProvider` but doesn't reflect `GameManager` stats

**What We Want:**
- Single source of truth for all game/module stats
- Main Menu, Home stats, and Score Breakdown all read from the same data source
- Any progress update should immediately reflect in all three places
- No duplication of local state that gets out of sync

---

### **Issue 2: Module Progress Not Persisting**

**Current Behavior:**
- Module completion is saved to Hive via `LocalCompletionService`
- Game scores are saved to Hive via `OfflineGameService`
- `GameManager` stats (highScore, totalGamesPlayed, lifetimeScore) are **NOT persisted** - they're in-memory only
- On app restart:
  - Module completion status is lost (not loaded from Hive)
  - Game stats reset to zero (GameManager initializes with defaults)
  - Preparedness score resets to 0% (not loaded from Hive on startup)
  - Score Breakdown shows zeros

**What We Want:**
- All progress saved to persistent storage (Hive)
- All progress loaded on app startup/login
- No reset to zero on app restart
- Score Breakdown always reflects persisted progress

---

## 🔍 **Current Architecture Analysis**

### **Files Involved**

#### **Main Menu & Navigation**
1. **`mobile/lib/screens/main_menu_screen.dart`**
   - Main menu screen with all games
   - Uses `GameManager()` singleton for stats
   - Shows: Games Played, Highest Score, Lifetime XP
   - **Problem**: Stats are in-memory only, not persisted

2. **`mobile/lib/features/dashboard/screens/home_screen.dart`**
   - Home screen with preparedness score
   - Uses `PreparednessScoreProvider` for score
   - Has "Play Game" button → navigates to `MainMenuScreen`
   - **Problem**: Uses different data source than MainMenuScreen

3. **`mobile/lib/features/dashboard/screens/games_screen.dart`**
   - Games tab in bottom navigation
   - Simply redirects to `MainMenuScreen`
   - **Status**: ✅ Already using same screen

4. **`mobile/lib/features/dashboard/screens/dashboard_screen.dart`**
   - Main dashboard with bottom navigation
   - Contains: HomeScreen, LearnScreen, GamesScreen, ProfileScreen
   - **Status**: ✅ Navigation structure is correct

#### **State Management**
1. **`mobile/lib/managers/game_manager.dart`**
   - Singleton with in-memory stats:
     - `highScore`, `totalGamesPlayed`, `lifetimeScore`
     - `runnerHighScore`, `floodHighScore`
     - `maxLevelUnlocked`, `currentLevelSelected`
   - **Problem**: Not persisted to Hive
   - **Problem**: Not synced with `PreparednessScoreProvider`

2. **`mobile/lib/features/score/providers/preparedness_score_provider.dart`**
   - Riverpod provider for preparedness score
   - Uses `LocalScoreCalculator` for local calculation
   - Has Hive listeners for auto-updates
   - **Problem**: Not loaded from Hive on startup
   - **Problem**: Doesn't sync with `GameManager` stats

3. **`mobile/lib/features/score/services/local_score_calculator.dart`**
   - Calculates score from Hive data
   - Reads from: `completedModulesBox`, `gameScoresBox`, `quizResultsBox`
   - **Status**: ✅ Logic is correct, but not called on startup

#### **Persistence**
1. **`mobile/lib/features/modules/services/local_completion_service.dart`**
   - Saves module completion to Hive (`completedModulesBox`)
   - **Status**: ✅ Saving works
   - **Problem**: Not loaded on startup

2. **`mobile/lib/features/games/services/offline_game_service.dart`**
   - Saves game scores to Hive (`gameScoresBox`)
   - **Status**: ✅ Saving works
   - **Problem**: GameManager stats not saved

3. **`mobile/lib/core/services/storage_service.dart`**
   - Wrapper for Hive operations
   - **Status**: ✅ Infrastructure is correct

#### **Score Display**
1. **`mobile/lib/features/score/screens/score_breakdown_screen.dart`**
   - Shows detailed score breakdown
   - Uses `PreparednessScoreProvider`
   - **Status**: ✅ Uses correct provider
   - **Problem**: May show zeros if not loaded from Hive

---

## 📋 **Implementation Plan**

### **Phase 1: Unify State Management** ⏱️ Priority: HIGH

**Goal**: Create a single source of truth for all game/module stats.

#### **1.1 Create Unified Game Stats Provider**

**File**: `mobile/lib/features/games/providers/game_stats_provider.dart` (NEW)

**Purpose**: Replace `GameManager` singleton with a Riverpod provider that:
- Reads from Hive (persisted data)
- Syncs with `PreparednessScoreProvider`
- Provides stats to both MainMenuScreen and HomeScreen

**Implementation**:
```dart
/// Unified Game Stats Provider
/// Single source of truth for all game statistics
class GameStatsNotifier extends StateNotifier<GameStatsState> {
  final StorageService _storageService;
  final Ref _ref;
  
  GameStatsNotifier(this._storageService, this._ref)
      : super(GameStatsState()) {
    _loadFromHive(); // Load on initialization
    _setupHiveListeners(); // Auto-update on changes
  }
  
  /// Load stats from Hive
  Future<void> _loadFromHive() async {
    // Load from gameScoresBox
    // Calculate: totalGamesPlayed, highScore, lifetimeScore
  }
  
  /// Save stats to Hive
  Future<void> _saveToHive() async {
    // Save to gameScoresBox
  }
  
  /// Update stats when game is completed
  Future<void> updateStats(GameScore score) async {
    // Update state
    // Save to Hive
    // Trigger PreparednessScoreProvider update
  }
}
```

#### **1.2 Update MainMenuScreen to Use Provider**

**File**: `mobile/lib/screens/main_menu_screen.dart`

**Changes**:
1. Replace `GameManager()` calls with `ref.watch(gameStatsProvider)`
2. Convert to `ConsumerStatefulWidget`
3. Remove dependency on `GameManager` singleton
4. Use provider state for all stats display

**Key Changes**:
```dart
class MainMenuScreen extends ConsumerStatefulWidget {
  const MainMenuScreen({super.key});
  
  @override
  ConsumerState<MainMenuScreen> createState() => _MainMenuScreenState();
}

class _MainMenuScreenState extends ConsumerState<MainMenuScreen> {
  @override
  Widget build(BuildContext context) {
    final gameStats = ref.watch(gameStatsProvider);
    
    // Use gameStats.totalGamesPlayed instead of GameManager().totalGamesPlayed
    // Use gameStats.highScore instead of GameManager().highScore
    // Use gameStats.lifetimeScore instead of GameManager().lifetimeScore
  }
}
```

#### **1.3 Update HomeScreen to Use Same Provider**

**File**: `mobile/lib/features/dashboard/screens/home_screen.dart`

**Changes**:
1. Watch `gameStatsProvider` for game stats
2. Keep `PreparednessScoreProvider` for overall score
3. Ensure both providers are synced

**Key Changes**:
```dart
@override
Widget build(BuildContext context) {
  final gameStats = ref.watch(gameStatsProvider);
  final scoreState = ref.watch(preparednessScoreProvider);
  
  // Use gameStats for game-related stats
  // Use scoreState for overall preparedness score
}
```

#### **1.4 Sync GameStatsProvider with PreparednessScoreProvider**

**File**: `mobile/lib/features/games/providers/game_stats_provider.dart`

**Changes**:
1. When stats update, trigger `PreparednessScoreProvider.recalculateScore()`
2. Listen to `PreparednessScoreProvider` changes to update game stats if needed

**Key Changes**:
```dart
Future<void> updateStats(GameScore score) async {
  // Update local state
  state = state.copyWith(
    totalGamesPlayed: state.totalGamesPlayed + 1,
    highScore: max(state.highScore, score.score),
    lifetimeScore: state.lifetimeScore + score.xpEarned,
  );
  
  // Save to Hive
  await _saveToHive();
  
  // Trigger score recalculation
  _ref.read(preparednessScoreProvider.notifier).recalculateScore();
}
```

---

### **Phase 2: Persist GameManager Stats** ⏱️ Priority: HIGH

**Goal**: Save and load GameManager stats to/from Hive.

#### **2.1 Create GameStats Persistence Service**

**File**: `mobile/lib/features/games/services/game_stats_persistence_service.dart` (NEW)

**Purpose**: Handle saving/loading game stats to/from Hive.

**Implementation**:
```dart
class GameStatsPersistenceService {
  final StorageService _storageService;
  
  /// Save game stats to Hive
  Future<void> saveStats({
    required int totalGamesPlayed,
    required int highScore,
    required int lifetimeScore,
    int? runnerHighScore,
    int? floodHighScore,
    int? maxLevelUnlocked,
  }) async {
    final box = await _storageService.openBox(AppConstants.gameScoresBox);
    await box.put('gameStats', {
      'totalGamesPlayed': totalGamesPlayed,
      'highScore': highScore,
      'lifetimeScore': lifetimeScore,
      'runnerHighScore': runnerHighScore ?? 0,
      'floodHighScore': floodHighScore ?? 0,
      'maxLevelUnlocked': maxLevelUnlocked ?? 1,
      'lastUpdated': DateTime.now().toIso8601String(),
    });
    print('💾 [GAME STATS] Saved stats to Hive');
  }
  
  /// Load game stats from Hive
  Future<GameStatsData?> loadStats() async {
    final box = await _storageService.openBox(AppConstants.gameScoresBox);
    final data = box.get('gameStats');
    if (data != null && data is Map) {
      print('📂 [GAME STATS] Loaded stats from Hive');
      return GameStatsData.fromJson(Map<String, dynamic>.from(data));
    }
    return null;
  }
}
```

#### **2.2 Update GameStatsProvider to Persist**

**File**: `mobile/lib/features/games/providers/game_stats_provider.dart`

**Changes**:
1. Inject `GameStatsPersistenceService`
2. Call `saveStats()` whenever stats change
3. Call `loadStats()` on initialization

---

### **Phase 3: Load Progress on Startup** ⏱️ Priority: HIGH

**Goal**: Restore all progress from Hive on app startup/login.

#### **3.1 Update PreparednessScoreProvider to Load from Hive First**

**File**: `mobile/lib/features/score/providers/preparedness_score_provider.dart`

**Changes**:
1. In constructor, load from Hive FIRST before API call
2. Update state immediately with local data
3. Then fetch from API in background

**Key Changes**:
```dart
PreparednessScoreNotifier(this._service, this._localCalculator)
    : super(PreparednessScoreState(isLoading: true)) {
  // Load from Hive FIRST (optimistic)
  _loadFromLocalStorage();
  _setupHiveListeners();
}

Future<void> _loadFromLocalStorage() async {
  try {
    final userId = _ref.read(authProvider).user?.id;
    if (userId == null) return;
    
    // Calculate from local data immediately
    final localScore = await _localCalculator.calculateFromLocal(userId);
    state = PreparednessScoreState(
      score: localScore,
      isLoading: false, // Set to false immediately
      lastFetched: DateTime.now(),
    );
    print('✅ [SCORE] Loaded from local storage: ${localScore.score}%');
  } catch (e) {
    print('⚠️ [SCORE] Error loading from local storage: $e');
    // Don't set to zero - keep loading state
  }
}
```

#### **3.2 Update GameStatsProvider to Load on Startup**

**File**: `mobile/lib/features/games/providers/game_stats_provider.dart`

**Changes**:
1. Load stats from Hive in constructor
2. Initialize state with loaded data (or defaults if none)

**Key Changes**:
```dart
GameStatsNotifier(this._storageService, this._ref)
    : super(GameStatsState()) {
  _loadFromHive(); // Load immediately
  _setupHiveListeners();
}

Future<void> _loadFromHive() async {
  try {
    final stats = await _persistenceService.loadStats();
    if (stats != null) {
      state = GameStatsState(
        totalGamesPlayed: stats.totalGamesPlayed,
        highScore: stats.highScore,
        lifetimeScore: stats.lifetimeScore,
        runnerHighScore: stats.runnerHighScore,
        floodHighScore: stats.floodHighScore,
        maxLevelUnlocked: stats.maxLevelUnlocked,
      );
      print('✅ [GAME STATS] Loaded from Hive: ${stats.totalGamesPlayed} games');
    } else {
      print('📂 [GAME STATS] No saved stats found, using defaults');
    }
  } catch (e) {
    print('⚠️ [GAME STATS] Error loading from Hive: $e');
  }
}
```

#### **3.3 Update Module Completion Loading**

**File**: `mobile/lib/screens/module_detail_screen.dart`

**Changes**:
1. Load completion status from Hive in `initState`
2. Update UI immediately with saved status

**Key Changes**:
```dart
@override
void initState() {
  super.initState();
  _loadCompletionStatus(); // Load from Hive
}

Future<void> _loadCompletionStatus() async {
  final isCompleted = await _localCompletionService.isModuleCompleted(_moduleModel.id);
  if (mounted) {
    setState(() {
      _isModuleCompleted = isCompleted; // Restore UI state
    });
  }
}
```

#### **3.4 Create Progress Restoration Service**

**File**: `mobile/lib/features/progress/services/progress_restoration_service.dart` (NEW)

**Purpose**: Centralized service to restore all progress on app startup/login.

**Implementation**:
```dart
class ProgressRestorationService {
  final StorageService _storageService;
  final LocalCompletionService _localCompletionService;
  final GameStatsPersistenceService _gameStatsPersistence;
  final LocalScoreCalculator _localScoreCalculator;
  
  /// Restore all user progress from local storage
  Future<UserProgress> restoreProgress(String userId) async {
    print('🔄 [PROGRESS] Starting progress restoration...');
    
    // 1. Load module completions
    final completedModules = await _localCompletionService.getCompletedModules();
    print('✅ [PROGRESS] Restored ${completedModules.length} completed modules');
    
    // 2. Load game stats
    final gameStats = await _gameStatsPersistence.loadStats();
    print('✅ [PROGRESS] Restored game stats: ${gameStats?.totalGamesPlayed ?? 0} games');
    
    // 3. Calculate initial score
    final score = await _localScoreCalculator.calculateFromLocal(userId);
    print('✅ [PROGRESS] Calculated initial score: ${score.score}%');
    
    return UserProgress(
      completedModules: completedModules,
      gameStats: gameStats,
      score: score,
    );
  }
}
```

#### **3.5 Integrate into Login/Startup Flow**

**File**: `mobile/lib/features/auth/providers/auth_provider.dart`

**Changes**:
1. After successful login, trigger progress restoration
2. Update all providers with restored data

**Key Changes**:
```dart
Future<void> login(String email, String password) async {
  // ... existing login logic ...
  
  if (user != null) {
    // Restore progress immediately after login
    await _restoreUserProgress(user.id);
  }
}

Future<void> _restoreUserProgress(String userId) async {
  try {
    final progressService = ProgressRestorationService();
    final progress = await progressService.restoreProgress(userId);
    
    // Update providers with restored data
    // This will be handled by individual providers on initialization
    print('✅ [AUTH] User progress restored');
  } catch (e) {
    print('⚠️ [AUTH] Error restoring progress: $e');
  }
}
```

---

### **Phase 4: Prevent Zero Overwrites** ⏱️ Priority: MEDIUM

**Goal**: Ensure initialization doesn't reset progress to zero.

#### **4.1 Update State Initialization**

**File**: `mobile/lib/features/score/providers/preparedness_score_provider.dart`

**Changes**:
1. Don't initialize with zero score
2. Initialize with `isLoading: true` and `score: null`
3. Only set score after loading from Hive or API

#### **4.2 Update GameStatsProvider Initialization**

**File**: `mobile/lib/features/games/providers/game_stats_provider.dart`

**Changes**:
1. Initialize with `isLoading: true`
2. Load from Hive before setting any values
3. Only use defaults if no saved data exists

---

### **Phase 5: Add Debug Logging** ⏱️ Priority: MEDIUM

**Goal**: Add comprehensive logging for debugging.

#### **5.1 Add Logging Points**

**Where to Add**:
1. When saving progress to Hive
2. When loading progress from Hive
3. When applying restored state
4. When syncing with backend
5. When state changes occur

**Log Format**:
```dart
print('💾 [PROGRESS] Saving module completion: $moduleId');
print('📂 [PROGRESS] Loading module completions from Hive...');
print('✅ [PROGRESS] Restored ${count} module completions');
print('🔄 [PROGRESS] Syncing with backend...');
print('⚠️ [PROGRESS] Failed to load from Hive: $error');
```

---

### **Phase 6: Update Game Completion Flow** ⏱️ Priority: HIGH

**Goal**: Ensure game completion updates both GameStatsProvider and PreparednessScoreProvider.

#### **6.1 Update Game Completion Handlers**

**Files**: All game screen files (e.g., `punjab_safety_game.dart`, `school_safety_quiz_game.dart`)

**Changes**:
1. After game completion, update `GameStatsProvider`
2. `GameStatsProvider` will automatically trigger `PreparednessScoreProvider` update
3. Both providers save to Hive

**Key Changes**:
```dart
// In game completion handler
final gameStatsNotifier = ref.read(gameStatsProvider.notifier);
await gameStatsNotifier.updateStats(gameScore);

// GameStatsProvider will:
// 1. Update its state
// 2. Save to Hive
// 3. Trigger PreparednessScoreProvider.recalculateScore()
```

---

## 📁 **Files to Create**

1. `mobile/lib/features/games/providers/game_stats_provider.dart` - NEW
2. `mobile/lib/features/games/services/game_stats_persistence_service.dart` - NEW
3. `mobile/lib/features/progress/services/progress_restoration_service.dart` - NEW
4. `mobile/lib/features/progress/models/user_progress_model.dart` - NEW

---

## 📁 **Files to Modify**

1. `mobile/lib/screens/main_menu_screen.dart` - Use GameStatsProvider instead of GameManager
2. `mobile/lib/features/dashboard/screens/home_screen.dart` - Use GameStatsProvider for game stats
3. `mobile/lib/features/score/providers/preparedness_score_provider.dart` - Load from Hive on startup
4. `mobile/lib/features/games/providers/game_stats_provider.dart` - Create and implement
5. `mobile/lib/screens/module_detail_screen.dart` - Load completion status on startup
6. `mobile/lib/features/auth/providers/auth_provider.dart` - Trigger progress restoration on login
7. All game screen files - Update to use GameStatsProvider

---

## 🧪 **Testing Checklist**

### **Main Menu Sync**
- [ ] Complete a game from MainMenuScreen
- [ ] Check HomeScreen stats - should update immediately
- [ ] Check Score Breakdown - should update immediately
- [ ] Navigate between Home and Games tab - stats should match
- [ ] Complete a module - all three places should update

### **Progress Persistence**
- [ ] Complete a module
- [ ] Close app completely
- [ ] Reopen app
- [ ] Verify module shows as completed
- [ ] Verify score matches previous value
- [ ] Complete a game
- [ ] Close app completely
- [ ] Reopen app
- [ ] Verify game stats are preserved
- [ ] Verify score includes game progress

### **Login Flow**
- [ ] Logout
- [ ] Login again
- [ ] Verify all progress is restored
- [ ] Verify UI shows correct state

### **Offline Mode**
- [ ] Turn off internet
- [ ] Complete a module/game
- [ ] Close app
- [ ] Reopen app (still offline)
- [ ] Verify progress is saved and visible
- [ ] Turn on internet
- [ ] Verify sync happens

---

## 🚨 **Critical Considerations**

1. **No Breaking Changes**:
   - Don't remove existing business logic
   - Don't break navigation or authentication
   - Maintain backward compatibility

2. **Performance**:
   - Loading should be fast (< 500ms)
   - Use async loading where possible
   - Don't block UI thread

3. **Error Handling**:
   - Gracefully handle Hive read errors
   - Fall back to API if local data is corrupted
   - Log errors for debugging

4. **Data Consistency**:
   - Local data is source of truth for UI (optimistic)
   - Backend is source of truth for persistence
   - Sync when online

5. **State Management**:
   - Use Riverpod providers (existing pattern)
   - Single source of truth for each data type
   - Reactive updates via providers

---

## 📊 **Success Metrics**

1. ✅ Main Menu and Home stats always match
2. ✅ Score Breakdown reflects current progress
3. ✅ Module completion persists across app restarts
4. ✅ Game stats persist across app restarts
5. ✅ Preparedness score persists across app restarts
6. ✅ Progress loads within 500ms on app startup
7. ✅ No zero score resets on initialization
8. ✅ All progress visible immediately after login

---

## 🔄 **Implementation Order**

1. **Phase 1**: Create GameStatsProvider and update MainMenuScreen (Foundation)
2. **Phase 2**: Implement GameStats persistence (Critical)
3. **Phase 3**: Load progress on startup (Critical)
4. **Phase 4**: Prevent zero overwrites (Important)
5. **Phase 5**: Add debug logging (Helpful)
6. **Phase 6**: Update game completion flow (Critical)

---

## 📝 **Notes**

- This plan follows the existing architecture (Riverpod, Hive, existing services)
- No files will be moved unless necessary
- All changes will be in-place updates
- Existing business logic will be preserved
- The plan is incremental and can be implemented phase by phase
- `GameManager` singleton will be gradually replaced by `GameStatsProvider`
- Both can coexist during migration, but `GameManager` will eventually be deprecated

---

**Next Steps**: Review this plan and approve before implementation begins.

