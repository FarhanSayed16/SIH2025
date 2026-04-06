# Root Cause Analysis: Preparedness Score & Persistence Issues

**Date:** 2025-01-27  
**Status:** 🔴 **CRITICAL BUG IDENTIFIED**  
**Priority:** P0 - Blocks core functionality

---

## 📹 **Bug Evidence**

### **Observed Behavior:**
1. ✅ User completes Module (Flood Safety) and passes Quiz
2. ✅ Module UI shows "100%" and Green Ticks
3. ❌ **Home Screen "Preparedness Score" stays at 0%**
4. ❌ **Progress is lost when navigating away** (not persisted to Hive/Backend)

### **Expected Behavior:**
1. Module completion should immediately update preparedness score
2. Progress should persist locally (Hive) for offline access
3. Score should update optimistically (instant UI feedback)
4. Backend sync should happen in background

---

## 🔍 **Root Cause Analysis**

### **Issue #1: No Local Persistence of Module Completion**

**Location:** `mobile/lib/screens/module_detail_screen.dart:292-324`

**Problem:**
```dart
// Current implementation
onQuizFinished: (passed) async {
  if (passed) {
    // 1. Update local state (in-memory only)
    setState(() {
      widget.module.isQuizPassed = true;
    });
    
    // 2. Sync with backend (no local persistence)
    await ref.read(moduleServiceProvider).completeModule(...);
    
    // 3. Refresh Score (API call only)
    await ref.read(preparednessScoreProvider.notifier).recalculateScore();
  }
}
```

**Root Cause:**
- Module completion is **NOT saved to Hive** (`AppConstants.modulesBox`)
- Only in-memory state is updated (`widget.module.isQuizPassed = true`)
- When screen is disposed, progress is lost
- No offline persistence mechanism

**Impact:** 🔴 **CRITICAL** - Progress lost on navigation

---

### **Issue #2: Score Provider Doesn't Calculate Locally**

**Location:** `mobile/lib/features/score/providers/preparedness_score_provider.dart:51-94`

**Problem:**
```dart
// Current implementation
Future<void> loadScore({String? userId, bool forceRefresh = false}) async {
  // Only fetches from API - no local calculation
  final score = await _service.getPreparednessScore(userId: userId);
  state = PreparednessScoreState(score: score, ...);
}

Future<void> recalculateScore({String? userId}) async {
  // Only calls API - no optimistic update
  final score = await _service.recalculatePreparednessScore(userId: userId);
  state = PreparednessScoreState(score: score, ...);
}
```

**Root Cause:**
- Score provider **only fetches from API**
- No local score calculation based on Hive data
- No optimistic UI updates
- Depends entirely on backend response time
- If backend is slow or fails, score stays at 0%

**Impact:** 🔴 **CRITICAL** - Score doesn't update immediately

---

### **Issue #3: Backend Score Calculation is Async (Non-Blocking)**

**Location:** `backend/src/controllers/module.controller.js:252-256`

**Problem:**
```javascript
// Current implementation
// Phase 3.3.1: Trigger preparedness score update (non-blocking)
const { recalculateScore } = await import('../services/preparednessScore.service.js');
recalculateScore(req.userId).catch(err => {
  logger.warn('Failed to update preparedness score after quiz:', err);
});
```

**Root Cause:**
- Score recalculation is **non-blocking** (fire-and-forget)
- Frontend might call `recalculateScore()` before backend finishes
- Race condition: Frontend fetches score before backend updates it
- No guarantee that score is ready when frontend requests it

**Impact:** 🟡 **HIGH** - Score might be stale when fetched

---

### **Issue #4: No Hive Box for Completed Modules**

**Location:** `mobile/lib/core/constants/app_constants.dart`

**Problem:**
- `modulesBox` exists but is used for **downloaded modules**, not **completed modules**
- No dedicated box for tracking completion state
- No persistence of `completedModules` list

**Root Cause:**
- Missing data structure for local completion tracking
- No sync mechanism between local and backend completion state

**Impact:** 🟡 **HIGH** - No offline access to completion data

---

### **Issue #5: Module Service Doesn't Save to Hive**

**Location:** `mobile/lib/features/modules/services/module_service.dart:96-120`

**Problem:**
```dart
// Current implementation
Future<Map<String, dynamic>> completeModule(...) async {
  // Only calls API - no local persistence
  final response = await _apiService.post(...);
  return (data['data'] ?? data) as Map<String, dynamic>;
}
```

**Root Cause:**
- `completeModule()` only calls API
- No Hive persistence after successful completion
- No offline queue for failed syncs

**Impact:** 🟡 **HIGH** - No offline support

---

## 📊 **Data Flow Analysis**

### **Current Flow (Broken):**
```
User Completes Quiz
    ↓
1. Update in-memory state (widget.module.isQuizPassed = true)
    ↓
2. Call API: moduleService.completeModule()
    ↓
3. Backend saves QuizResult + updates User.progress.completedModules
    ↓
4. Backend triggers recalculateScore() (async, non-blocking)
    ↓
5. Frontend calls preparednessScoreProvider.recalculateScore()
    ↓
6. Frontend fetches score from API
    ↓
7. ❌ Backend might not be ready yet → Score = 0%
    ↓
8. ❌ User navigates away → Progress lost (not in Hive)
```

### **Expected Flow (Fixed):**
```
User Completes Quiz
    ↓
1. ✅ Save to Hive immediately (completedModules list)
    ↓
2. ✅ Calculate score locally (optimistic update)
    ↓
3. ✅ Update UI instantly (score shows new value)
    ↓
4. ✅ Call API in background (moduleService.completeModule())
    ↓
5. ✅ Backend saves + triggers recalculateScore()
    ↓
6. ✅ Frontend syncs with backend (reconcile if different)
    ↓
7. ✅ Persist final score to Hive
```

---

## 🛠️ **Fix Plan**

### **Phase 1: Implement Local Persistence** ⏱️ **Priority: P0**

#### **Task 1.1: Create Completed Modules Hive Box**
- **File:** `mobile/lib/core/constants/app_constants.dart`
- **Action:** Add new box constant
```dart
static const String completedModulesBox = 'completedModulesBox';
```

#### **Task 1.2: Create Local Completion Service**
- **File:** `mobile/lib/features/modules/services/local_completion_service.dart` (NEW)
- **Responsibilities:**
  - Save completed module IDs to Hive
  - Track completion timestamps
  - Provide list of completed modules
  - Sync with backend on app start

#### **Task 1.3: Update Module Service to Persist Locally**
- **File:** `mobile/lib/features/modules/services/module_service.dart`
- **Changes:**
  - After successful API call, save to Hive
  - Add offline queue for failed syncs
  - Implement retry mechanism

#### **Task 1.4: Update Module Detail Screen**
- **File:** `mobile/lib/screens/module_detail_screen.dart`
- **Changes:**
  - Save to Hive BEFORE API call (optimistic)
  - Update local state from Hive on init
  - Handle offline scenarios

---

### **Phase 2: Implement Local Score Calculation** ⏱️ **Priority: P0**

#### **Task 2.1: Create Local Score Calculator**
- **File:** `mobile/lib/features/score/services/local_score_calculator.dart` (NEW)
- **Responsibilities:**
  - Calculate score from Hive data (completed modules, games, quizzes)
  - Match backend calculation logic
  - Provide optimistic score updates

#### **Task 2.2: Update Score Provider**
- **File:** `mobile/lib/features/score/providers/preparedness_score_provider.dart`
- **Changes:**
  - Calculate score locally FIRST (from Hive)
  - Update UI immediately (optimistic)
  - Fetch from API in background
  - Reconcile if different (use backend as source of truth)

#### **Task 2.3: Add Hive Listener**
- **File:** `mobile/lib/features/score/providers/preparedness_score_provider.dart`
- **Changes:**
  - Listen to Hive box changes
  - Recalculate score when modules/games completed
  - Auto-update UI without API call

---

### **Phase 3: Fix Backend Response** ⏱️ **Priority: P1**

#### **Task 3.1: Return Score in Module Completion Response**
- **File:** `backend/src/controllers/module.controller.js:159-292`
- **Changes:**
  - Calculate score synchronously (or wait for async)
  - Return `preparednessScore` in response
  - Include score breakdown

#### **Task 3.2: Update Frontend to Use Response Score**
- **File:** `mobile/lib/features/modules/services/module_service.dart`
- **Changes:**
  - Extract score from API response
  - Update score provider with response score
  - Fallback to local calculation if missing

---

### **Phase 4: Add Offline Support** ⏱️ **Priority: P1**

#### **Task 4.1: Implement Offline Queue**
- **File:** `mobile/lib/features/modules/services/offline_sync_service.dart` (NEW)
- **Responsibilities:**
  - Queue failed API calls
  - Retry on network restore
  - Sync completion state

#### **Task 4.2: Add Sync Status Indicator**
- **File:** `mobile/lib/features/dashboard/screens/home_screen.dart`
- **Changes:**
  - Show sync status
  - Indicate if score is from local or backend

---

## 📋 **Implementation Checklist**

### **Critical (P0) - Must Fix Immediately:**
- [ ] **1.1** Create `completedModulesBox` Hive box
- [ ] **1.2** Create `LocalCompletionService`
- [ ] **1.3** Update `ModuleService` to save to Hive
- [ ] **1.4** Update `module_detail_screen.dart` to persist locally
- [ ] **2.1** Create `LocalScoreCalculator`
- [ ] **2.2** Update `preparednessScoreProvider` for local calculation
- [ ] **2.3** Add Hive listener for auto-updates

### **High Priority (P1) - Fix Soon:**
- [ ] **3.1** Return score in backend response
- [ ] **3.2** Use response score in frontend
- [ ] **4.1** Implement offline queue
- [ ] **4.2** Add sync status indicator

---

## 🎯 **Success Criteria**

### **Functional Requirements:**
1. ✅ Module completion persists to Hive immediately
2. ✅ Preparedness score updates instantly (optimistic UI)
3. ✅ Score persists across app restarts
4. ✅ Offline completion tracking works
5. ✅ Backend sync happens in background
6. ✅ Score reconciles with backend when online

### **Performance Requirements:**
1. ✅ Score update < 100ms (local calculation)
2. ✅ No blocking UI during API calls
3. ✅ Smooth transitions between screens

### **Reliability Requirements:**
1. ✅ Progress never lost (always in Hive)
2. ✅ Score always available (local fallback)
3. ✅ Sync retries on failure
4. ✅ Conflict resolution (local vs backend)

---

## 🔧 **Technical Implementation Details**

### **1. Local Completion Service Structure**

```dart
class LocalCompletionService {
  // Save completed module
  Future<void> markModuleCompleted(String moduleId, {
    DateTime? completedAt,
    int? score,
    bool synced = false,
  });
  
  // Get completed modules
  Future<List<String>> getCompletedModules();
  
  // Check if module is completed
  Future<bool> isModuleCompleted(String moduleId);
  
  // Sync with backend
  Future<void> syncWithBackend();
}
```

### **2. Local Score Calculator Structure**

```dart
class LocalScoreCalculator {
  // Calculate score from Hive data
  Future<PreparednessScore> calculateFromLocal({
    required List<String> completedModules,
    required List<GameScore> gameScores,
    required List<QuizResult> quizResults,
  });
  
  // Get score components
  Future<ScoreBreakdown> getBreakdown();
}
```

### **3. Updated Score Provider Structure**

```dart
class PreparednessScoreNotifier extends StateNotifier<PreparednessScoreState> {
  // Calculate locally first
  Future<void> _calculateLocalScore() async {
    final localScore = await _localCalculator.calculateFromLocal(...);
    state = state.copyWith(score: localScore); // Instant update
  }
  
  // Then fetch from API
  Future<void> loadScore({bool forceRefresh = false}) async {
    await _calculateLocalScore(); // Optimistic
    final apiScore = await _service.getPreparednessScore(); // Background
    state = state.copyWith(score: apiScore); // Final update
  }
}
```

---

## 🧪 **Testing Plan**

### **Unit Tests:**
1. Test local completion service (save/retrieve)
2. Test local score calculator (all components)
3. Test score provider (optimistic updates)
4. Test Hive persistence (data survives app restart)

### **Integration Tests:**
1. Test complete flow: Quiz → Hive → Score Update
2. Test offline scenario: Complete module offline → Check score
3. Test sync scenario: Offline completion → Online sync → Score update
4. Test race condition: Multiple completions → Score accuracy

### **Manual Testing:**
1. Complete module → Verify score updates immediately
2. Navigate away → Verify progress persists
3. Restart app → Verify score still correct
4. Complete offline → Verify score works
5. Go online → Verify sync happens

---

## 📝 **Migration Strategy**

### **For Existing Users:**
1. On app start, fetch completed modules from backend
2. Save to Hive for local access
3. Calculate initial score from backend data
4. Migrate to local-first approach gradually

### **For New Users:**
1. Start with local-first approach
2. Sync to backend when online
3. Use local score as primary source

---

## 🚨 **Risk Assessment**

### **Low Risk:**
- Adding Hive persistence (well-tested library)
- Local score calculation (deterministic logic)

### **Medium Risk:**
- Score reconciliation (local vs backend)
- Offline queue management (complexity)

### **High Risk:**
- Migration of existing data
- Race conditions in sync

### **Mitigation:**
- Comprehensive testing
- Gradual rollout
- Fallback to backend if local fails
- Logging for debugging

---

## 📅 **Timeline Estimate**

- **Phase 1 (Local Persistence):** 4-6 hours
- **Phase 2 (Local Score Calculation):** 6-8 hours
- **Phase 3 (Backend Response):** 2-3 hours
- **Phase 4 (Offline Support):** 4-6 hours

**Total:** 16-23 hours

---

## ✅ **Conclusion**

The root cause is a **lack of local persistence and optimistic UI updates**. The fix requires:

1. **Immediate:** Save module completion to Hive
2. **Immediate:** Calculate score locally for instant updates
3. **Soon:** Improve backend response to include score
4. **Soon:** Add offline sync support

This will ensure:
- ✅ Instant score updates (optimistic UI)
- ✅ Progress persistence (Hive storage)
- ✅ Offline functionality
- ✅ Better user experience

---

**Next Steps:**
1. Review and approve this plan
2. Start with Phase 1 (Local Persistence)
3. Test thoroughly before moving to Phase 2
4. Deploy incrementally with monitoring

