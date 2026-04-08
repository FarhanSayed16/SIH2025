# Video Progress Persistence Fix Plan

## Problem Analysis

### Current Issues

1. **Type Casting Errors** (Critical)
   - Error: `type '_Map<dynamic, dynamic>' is not a subtype of type 'Map<String, dynamic>' in type cast`
   - Location: 
     - `video_progress_service.dart` - When loading video progress from Hive
     - `game_stats_provider.dart` - When reading game scores from Hive
   - Root Cause: Hive returns `Map<dynamic, dynamic>` but code tries to cast directly to `Map<String, dynamic>`
   - Impact: Progress restoration fails silently, data appears lost

2. **Progress Lost on App Restart** (Critical)
   - Symptom: Video completion status resets to 0% when app is closed and reopened
   - Root Cause Analysis:
     - `ModuleRepository.getModules()` creates **fresh** `LearningModule` objects each time
     - These objects have `VideoLesson.isCompleted = false` by default
     - Progress restoration updates these objects, but they're recreated on next access
     - The restoration happens, but the updated objects are not persisted back to the repository
   - Impact: Users lose all video progress on app restart

3. **Progress Not Reflected in Module List** (Medium)
   - Symptom: Progress bar in module list shows 0% even after videos are completed
   - Root Cause: Module list reads from fresh `LearningModule` objects that haven't been updated with Hive data
   - Impact: Poor UX, users can't see their progress

## Solution Strategy

### Phase 1: Fix Type Casting Errors (IMMEDIATE)

**Goal**: Eliminate all `_Map<dynamic, dynamic>` casting errors

**Changes Required**:

1. **`video_progress_service.dart`**
   - Fix `getModuleVideoProgress()` to properly convert Hive maps
   - Use `Map<String, dynamic>.from()` for all Hive data conversions
   - Add try-catch with proper error handling

2. **`game_stats_provider.dart`**
   - Fix `_recalculateFromScores()` to properly handle Hive map types
   - Ensure all `box.get()` results are properly converted before use
   - Add defensive null checks

**Files to Modify**:
- `mobile/lib/features/modules/services/video_progress_service.dart`
- `mobile/lib/features/games/providers/game_stats_provider.dart`

**Expected Outcome**: No more type casting errors in logs, progress restoration works correctly

---

### Phase 2: Fix Progress Persistence Architecture (CRITICAL)

**Goal**: Ensure video progress persists across app restarts by fixing the data flow

**Problem**: 
- `ModuleRepository.getModules()` creates fresh objects
- Progress restoration updates these objects, but they're not the "source of truth"
- When modules are accessed later, fresh objects are created again

**Solution Options**:

#### Option A: Make ModuleRepository Stateful (RECOMMENDED)
- Convert `ModuleRepository` to a singleton with cached modules
- Load progress from Hive on initialization
- Update cached modules when progress changes
- All screens use the same cached instances

**Pros**:
- Single source of truth
- Progress persists across app restarts
- Minimal changes to existing code

**Cons**:
- Requires refactoring `ModuleRepository`

**Implementation**:
1. Convert `ModuleRepository` to a singleton class
2. Add `_modules` cache field
3. Add `initialize()` method that:
   - Loads modules from `module_data.dart`
   - Loads video progress from Hive
   - Updates `VideoLesson.isCompleted` flags
4. Add `updateModuleProgress()` method to update cached modules
5. Update all callers to use `ModuleRepository.instance.getModules()`

#### Option B: Load Progress on Every Access (ALTERNATIVE)
- Keep `ModuleRepository` as static
- Load progress from Hive every time modules are accessed
- Update `LearningModule` objects before returning

**Pros**:
- Minimal changes to existing code
- No singleton pattern needed

**Cons**:
- Performance overhead (reading Hive on every access)
- Still creates fresh objects, just updates them

**Implementation**:
1. Modify `ModuleRepository.getModules()` to:
   - Create modules as before
   - Load video progress from Hive
   - Update `VideoLesson.isCompleted` flags
   - Return updated modules

#### Option C: Separate Progress State from Module Data (FUTURE)
- Keep modules as static data
- Create separate `ModuleProgressProvider` (Riverpod)
- Load progress from Hive into provider
- UI reads from provider, not from module objects

**Pros**:
- Clean separation of concerns
- Reactive updates
- Follows Riverpod best practices

**Cons**:
- Major refactoring required
- All screens need to be updated

**Recommendation**: **Option A** - Make ModuleRepository stateful with cached modules

---

### Phase 3: Ensure Progress Restoration Timing (IMPORTANT)

**Goal**: Ensure progress is restored before any module data is accessed

**Current Flow**:
1. App starts
2. Auth provider checks auth status
3. If authenticated, calls `_restoreUserProgress()`
4. `ProgressRestorationService` loads progress from Hive
5. Updates `LearningModule` objects
6. **BUT**: Module list might have already been created with fresh objects

**Solution**:
1. Ensure `ProgressRestorationService._restoreVideoProgress()` is called **before** any module list is displayed
2. Make `ModuleRepository` wait for progress restoration if needed
3. Add loading state to module list until progress is restored

**Implementation**:
1. Add `isInitialized` flag to `ModuleRepository`
2. Make `getModules()` wait for initialization if not ready
3. Call `ModuleRepository.initialize()` in `ProgressRestorationService`
4. Update module list to show loading until modules are ready

---

### Phase 4: Add Progress Sync on Video Completion (ENHANCEMENT)

**Goal**: Immediately update cached modules when video is completed

**Current Flow**:
1. User completes video
2. Progress saved to Hive ✅
3. Local `LearningModule` object updated ✅
4. **BUT**: Cached module in repository not updated ❌

**Solution**:
1. When video is completed, update both:
   - Hive (already done)
   - Cached module in `ModuleRepository`
2. This ensures immediate UI updates without waiting for restoration

**Implementation**:
1. Add `ModuleRepository.updateVideoProgress(moduleId, videoTitle, isCompleted)`
2. Call this method in `_onVideoCompleted()` in `module_detail_screen.dart`
3. This updates the cached module immediately

---

## Implementation Plan

### Step 1: Fix Type Casting (Priority: CRITICAL)
**Time Estimate**: 30 minutes

1. Fix `video_progress_service.dart`:
   ```dart
   // BEFORE:
   final data = box.get(progressKey);
   if (data is Map) {
     final progress = ModuleVideoProgress.fromJson(Map<String, dynamic>.from(data));
   }
   
   // AFTER:
   final data = box.get(progressKey);
   if (data != null) {
     try {
       final dataMap = data is Map ? Map<String, dynamic>.from(data as Map) : null;
       if (dataMap != null) {
         final progress = ModuleVideoProgress.fromJson(dataMap);
       }
     } catch (e) {
       print('❌ [VIDEO PROGRESS] Error parsing progress: $e');
       return null;
     }
   }
   ```

2. Fix `game_stats_provider.dart`:
   - Already partially fixed, but ensure all `box.get()` calls use proper conversion
   - Add try-catch around all Hive reads

### Step 2: Refactor ModuleRepository (Priority: CRITICAL)
**Time Estimate**: 2-3 hours

1. Convert to singleton:
   ```dart
   class ModuleRepository {
     static final ModuleRepository _instance = ModuleRepository._internal();
     factory ModuleRepository() => _instance;
     ModuleRepository._internal();
     
     List<LearningModule>? _modules;
     bool _isInitialized = false;
     
     Future<void> initialize() async {
       if (_isInitialized) return;
       
       // Load modules
       _modules = _loadModulesFromData();
       
       // Load progress from Hive
       final videoProgressService = VideoProgressService();
       for (final module in _modules!) {
         final progress = await videoProgressService.getModuleVideoProgress(module.id);
         if (progress != null) {
           for (final video in module.videos) {
             video.isCompleted = progress.isVideoCompleted(video.title);
           }
         }
       }
       
       _isInitialized = true;
     }
     
     List<LearningModule> getModules() {
       if (!_isInitialized) {
         throw StateError('ModuleRepository not initialized. Call initialize() first.');
       }
       return _modules!;
     }
     
     void updateVideoProgress(String moduleId, String videoTitle, bool isCompleted) {
       final module = _modules?.firstWhere((m) => m.id == moduleId);
       if (module != null) {
         final video = module.videos.firstWhere((v) => v.title == videoTitle);
         video.isCompleted = isCompleted;
       }
     }
   }
   ```

2. Update `ProgressRestorationService`:
   ```dart
   Future<void> _restoreVideoProgress() async {
     // Initialize ModuleRepository first
     await ModuleRepository().initialize();
     // Progress is already loaded during initialization
   }
   ```

3. Update all callers:
   - `ndma_module_list.dart`: Use `ModuleRepository().getModules()`
   - `module_detail_screen.dart`: Use `ModuleRepository().getModules()`
   - Any other places that use `ModuleRepository.getModules()`

### Step 3: Update Progress Restoration Flow (Priority: HIGH)
**Time Estimate**: 1 hour

1. Ensure `ModuleRepository.initialize()` is called early:
   - In `ProgressRestorationService.restoreProgress()`
   - Or in `main.dart` after Hive initialization

2. Add loading state to module list:
   ```dart
   Future<void> _loadModules() async {
     setState(() => _isLoading = true);
     await ModuleRepository().initialize();
     setState(() {
       modules = ModuleRepository().getModules();
       _isLoading = false;
     });
   }
   ```

### Step 4: Update Video Completion Handler (Priority: MEDIUM)
**Time Estimate**: 30 minutes

1. Update `_onVideoCompleted()` in `module_detail_screen.dart`:
   ```dart
   Future<void> _onVideoCompleted(VideoLesson video) async {
     // Save to Hive
     await _videoProgressService.markVideoCompleted(...);
     
     // Update cached module in repository
     ModuleRepository().updateVideoProgress(_moduleModel.id, video.title, true);
     
     // Update local state
     setState(() {
       video.isCompleted = true;
     });
   }
   ```

---

## Testing Checklist

### Type Casting Fix
- [ ] No more `_Map<dynamic, dynamic>` errors in logs
- [ ] Video progress loads correctly from Hive
- [ ] Game stats load correctly from Hive

### Progress Persistence
- [ ] Complete a video
- [ ] Close app completely
- [ ] Reopen app
- [ ] Verify video shows as completed
- [ ] Verify progress bar shows correct percentage
- [ ] Verify module list shows correct progress

### Progress Restoration
- [ ] Check logs for "Video progress restoration complete"
- [ ] Verify all modules with progress are restored
- [ ] Verify progress is restored before module list is displayed

### Real-time Updates
- [ ] Complete a video
- [ ] Verify progress bar updates immediately
- [ ] Navigate back to module list
- [ ] Verify progress is reflected in list

---

## Files to Modify

### Critical (Must Fix)
1. `mobile/lib/features/modules/services/video_progress_service.dart` - Fix type casting
2. `mobile/lib/data/module_data.dart` - Convert to singleton
3. `mobile/lib/features/progress/services/progress_restoration_service.dart` - Initialize repository
4. `mobile/lib/screens/ndma_module_list.dart` - Use singleton, add loading state
5. `mobile/lib/screens/module_detail_screen.dart` - Update cached module on completion

### Important (Should Fix)
6. `mobile/lib/features/games/providers/game_stats_provider.dart` - Ensure type casting is fixed
7. `mobile/lib/main.dart` - Initialize ModuleRepository early (optional)

---

## Expected Outcomes

### After Phase 1 (Type Casting Fix)
- ✅ No more type casting errors
- ✅ Progress restoration logs show success
- ⚠️ Progress still lost on restart (architecture issue)

### After Phase 2 (Repository Refactor)
- ✅ Progress persists across app restarts
- ✅ Module list shows correct progress
- ✅ Single source of truth for module data

### After Phase 3 (Restoration Timing)
- ✅ Progress always restored before UI displays
- ✅ No race conditions

### After Phase 4 (Real-time Updates)
- ✅ Immediate UI updates on video completion
- ✅ No need to wait for restoration

---

## Risk Assessment

### Low Risk
- Type casting fixes (isolated changes)
- Adding loading states (UI only)

### Medium Risk
- Converting ModuleRepository to singleton (affects multiple files)
- Need to update all callers

### Mitigation
- Test thoroughly after each phase
- Keep old code commented for rollback
- Incremental deployment

---

## Timeline

1. **Phase 1** (Type Casting): 30 minutes - **IMMEDIATE**
2. **Phase 2** (Repository Refactor): 2-3 hours - **CRITICAL**
3. **Phase 3** (Restoration Timing): 1 hour - **HIGH PRIORITY**
4. **Phase 4** (Real-time Updates): 30 minutes - **ENHANCEMENT**

**Total Estimated Time**: 4-5 hours

---

## Notes

- The type casting errors are blocking progress restoration, so Phase 1 must be done first
- The repository refactor is the core fix for persistence, but requires careful testing
- Consider adding unit tests for ModuleRepository after refactoring
- Monitor logs after each phase to ensure no regressions

