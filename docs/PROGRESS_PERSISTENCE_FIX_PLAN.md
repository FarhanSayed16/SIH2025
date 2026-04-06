# Progress Persistence Fix Plan
**Date:** 2025-01-02  
**Status:** 📋 Planning Phase  
**Priority:** 🔴 Critical

---

## 🎯 **Problem Statement**

The app currently has a critical issue where user progress is not persisting across app restarts:

1. **Module Completion**: Shows "completed" in UI but resets on app restart
2. **Preparedness Score**: Resets to zero when app restarts
3. **Game Scores**: Updates only in-memory and resets when app is closed
4. **Root Cause**: Progress is saved to Hive but **NOT loaded on app startup/login**

---

## 🔍 **Current State Analysis**

### ✅ **What's Working**

1. **Local Storage Infrastructure**:
   - ✅ Hive is initialized in `main.dart`
   - ✅ All required boxes are opened:
     - `completedModulesBox` - Module completion status
     - `gameScoresBox` - Game scores
     - `quizResultsBox` - Quiz results
     - `userBox` - User data

2. **Saving Logic**:
   - ✅ `LocalCompletionService` saves module completion to Hive
   - ✅ `GameService` saves game scores to Hive via `OfflineGameService`
   - ✅ `PreparednessScoreProvider` has Hive listeners for auto-updates

3. **State Management**:
   - ✅ Riverpod providers are set up
   - ✅ Local score calculation exists (`LocalScoreCalculator`)

### ❌ **What's Missing**

1. **Progress Loading on Startup**:
   - ❌ No explicit loading of module completions on app startup
   - ❌ No explicit loading of game scores on app startup
   - ❌ Score provider loads from API but doesn't restore from Hive first

2. **State Initialization**:
   - ❌ Providers initialize with empty/default values
   - ❌ No restoration of saved state before API calls
   - ❌ Score starts at 0% until API responds

3. **Login/Startup Flow**:
   - ❌ No progress restoration after login
   - ❌ No sync between local Hive data and UI state

---

## 📋 **Implementation Plan**

### **Phase 1: Progress Loading Service** ⏱️ Priority: HIGH

Create a centralized service to load all progress data from Hive on app startup/login.

#### **1.1 Create `ProgressRestorationService`**

**File**: `mobile/lib/features/progress/services/progress_restoration_service.dart`

**Responsibilities**:
- Load module completions from Hive
- Load game scores from Hive
- Load quiz results from Hive
- Calculate initial preparedness score from local data
- Return a `UserProgress` model with all restored data

**Methods**:
```dart
class ProgressRestorationService {
  /// Restore all user progress from local storage
  Future<UserProgress> restoreProgress(String userId) async;
  
  /// Restore module completions
  Future<List<String>> restoreModuleCompletions() async;
  
  /// Restore game scores
  Future<List<GameScore>> restoreGameScores() async;
  
  /// Restore quiz results
  Future<List<QuizResult>> restoreQuizResults() async;
  
  /// Calculate initial score from local data
  Future<PreparednessScore> calculateInitialScore(String userId) async;
}
```

---

### **Phase 2: Update State Providers** ⏱️ Priority: HIGH

Modify existing providers to load from Hive FIRST, then sync with backend.

#### **2.1 Update `PreparednessScoreProvider`**

**File**: `mobile/lib/features/score/providers/preparedness_score_provider.dart`

**Changes**:
1. Load score from Hive in constructor/initState
2. Update state immediately with local score (optimistic)
3. Then fetch from API in background
4. Prevent overwriting with zero on initialization

**Key Changes**:
```dart
PreparednessScoreNotifier(this._service, this._localCalculator)
    : super(PreparednessScoreState(isLoading: true)) {
  // Load from Hive FIRST
  _loadFromLocalStorage();
  _setupHiveListeners();
}

Future<void> _loadFromLocalStorage() async {
  try {
    // Calculate from local data immediately
    final localScore = await _localCalculator.calculateFromLocal(userId);
    state = PreparednessScoreState(
      score: localScore,
      isLoading: false, // Set to false immediately
      lastFetched: DateTime.now(),
    );
    print('✅ Progress restored from local storage: ${localScore.score}%');
  } catch (e) {
    print('⚠️ Error loading from local storage: $e');
    // Don't set score to zero - keep loading state
  }
}
```

#### **2.2 Update Module Completion State**

**File**: `mobile/lib/screens/module_detail_screen.dart`

**Changes**:
1. Load completion status from Hive in `initState`
2. Update UI immediately with saved status
3. Don't reset to "not completed" on navigation

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

#### **2.3 Create/Update Game Score Provider**

**File**: `mobile/lib/features/games/providers/game_provider.dart` (Create if doesn't exist)

**Responsibilities**:
- Load game scores from Hive on initialization
- Maintain list of all game scores
- Update UI when scores change

---

### **Phase 3: App Startup & Login Flow** ⏱️ Priority: HIGH

Integrate progress restoration into app initialization and login flow.

#### **3.1 Update `AuthProvider`**

**File**: `mobile/lib/features/auth/providers/auth_provider.dart`

**Changes**:
1. After successful login, trigger progress restoration
2. Load all progress data before navigating to dashboard

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
    
    // Update all providers with restored data
    // This will be handled by individual providers
    print('✅ User progress restored: ${progress.completedModules.length} modules, ${progress.gameScores.length} games');
  } catch (e) {
    print('⚠️ Error restoring progress: $e');
  }
}
```

#### **3.2 Update `main.dart` / App Initialization**

**File**: `mobile/lib/main.dart`

**Changes**:
1. After Hive initialization, check if user is logged in
2. If logged in, restore progress before showing UI
3. Show loading screen while restoring progress

**Key Changes**:
```dart
void main() async {
  // ... existing initialization ...
  
  // After Hive is initialized
  final authService = AuthService();
  final isAuthenticated = await authService.isAuthenticated();
  
  if (isAuthenticated) {
    final userId = await authService.getCurrentUserId();
    if (userId != null) {
      // Restore progress before showing app
      await _restoreProgressOnStartup(userId);
    }
  }
  
  runApp(...);
}
```

---

### **Phase 4: Prevent Zero Overwrites** ⏱️ Priority: MEDIUM

Ensure initialization doesn't reset progress to zero.

#### **4.1 Update Score Calculation**

**File**: `mobile/lib/features/score/services/local_score_calculator.dart`

**Changes**:
1. Return zero only if NO data exists
2. Don't return zero if data exists but calculation fails
3. Add better error handling

#### **4.2 Update State Initialization**

**File**: `mobile/lib/features/score/providers/preparedness_score_provider.dart`

**Changes**:
1. Don't initialize with zero score
2. Initialize with `isLoading: true` and `score: null`
3. Only set score after loading from Hive or API

---

### **Phase 5: Debug Logging** ⏱️ Priority: MEDIUM

Add comprehensive logging for debugging.

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

### **Phase 6: Efficient Saving & Debouncing** ⏱️ Priority: LOW

Optimize saving operations to prevent performance issues.

#### **6.1 Debounce Score Updates**

**File**: `mobile/lib/features/score/providers/preparedness_score_provider.dart`

**Changes**:
1. Debounce Hive writes when score changes rapidly
2. Batch multiple updates together
3. Use `Timer` for debouncing

#### **6.2 Optimize Hive Writes**

**File**: `mobile/lib/features/modules/services/local_completion_service.dart`

**Changes**:
1. Batch multiple completions together
2. Use transactions for atomic updates
3. Cache frequently accessed data

---

## 📁 **Files to Modify**

### **New Files to Create**

1. `mobile/lib/features/progress/services/progress_restoration_service.dart`
2. `mobile/lib/features/progress/models/user_progress_model.dart`
3. `mobile/lib/features/games/providers/game_provider.dart` (if doesn't exist)

### **Files to Modify**

1. `mobile/lib/features/score/providers/preparedness_score_provider.dart`
2. `mobile/lib/features/auth/providers/auth_provider.dart`
3. `mobile/lib/main.dart`
4. `mobile/lib/screens/module_detail_screen.dart`
5. `mobile/lib/features/score/services/local_score_calculator.dart`
6. `mobile/lib/features/modules/services/local_completion_service.dart`
7. `mobile/lib/features/games/services/game_service.dart`

---

## 🧪 **Testing Checklist**

### **Module Completion**
- [ ] Complete a module
- [ ] Close app completely
- [ ] Reopen app
- [ ] Verify module shows as completed
- [ ] Verify green tick is visible

### **Preparedness Score**
- [ ] Complete a module/game
- [ ] Note the score
- [ ] Close app completely
- [ ] Reopen app
- [ ] Verify score matches previous value
- [ ] Verify score doesn't reset to 0%

### **Game Scores**
- [ ] Play a game and get a score
- [ ] Close app completely
- [ ] Reopen app
- [ ] Verify game score is still visible
- [ ] Verify score contributes to preparedness score

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
   - Don't break authentication
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
   - Local data is source of truth for UI
   - Backend is source of truth for persistence
   - Sync when online

---

## 📊 **Success Metrics**

1. ✅ Module completion persists across app restarts
2. ✅ Preparedness score persists across app restarts
3. ✅ Game scores persist across app restarts
4. ✅ Progress loads within 500ms on app startup
5. ✅ No zero score resets on initialization
6. ✅ All progress visible immediately after login

---

## 🔄 **Implementation Order**

1. **Phase 1**: Create `ProgressRestorationService` (Foundation)
2. **Phase 2**: Update `PreparednessScoreProvider` (Critical)
3. **Phase 2**: Update module completion loading (Critical)
4. **Phase 3**: Integrate into login flow (Critical)
5. **Phase 4**: Prevent zero overwrites (Important)
6. **Phase 5**: Add debug logging (Helpful)
7. **Phase 6**: Optimize and debounce (Nice to have)

---

## 📝 **Notes**

- This plan follows the existing architecture (Riverpod, Hive, existing services)
- No files will be moved unless necessary
- All changes will be in-place updates
- Existing business logic will be preserved
- The plan is incremental and can be implemented phase by phase

---

**Next Steps**: Review this plan and approve before implementation begins.

