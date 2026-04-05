# NDMA Module Video Progress Persistence & Fix Plan
**Date:** 2025-01-02  
**Status:** 📋 Planning Phase  
**Priority:** 🔴 Critical

---

## 🎯 **Problem Statement**

### **Issue 1: Video Progress Not Persisted**

**Current Behavior:**
- NDMA modules have multiple videos (e.g., 3 videos, 7 videos)
- When a student watches a video, `VideoLesson.isCompleted` is set to `true` in memory
- **Problem**: Video completion status is NOT saved to Hive
- **Problem**: On app restart, all videos reset to `isCompleted = false`
- **Problem**: Student has to watch all videos from the beginning every time
- **Example**: Student watches 2 out of 7 videos → closes app → reopens → progress lost, must start from video 1

**What We Want:**
- Video completion status saved to Hive immediately when video is completed
- Video completion status loaded from Hive on app startup
- Progress bar showing how many videos are completed (e.g., "2/7 videos completed")
- Video watch time/resume position saved (optional enhancement)

---

### **Issue 2: No Progress Bar for Video Lectures**

**Current Behavior:**
- Module detail screen shows videos but no progress indicator
- No visual feedback showing "X out of Y videos completed"
- No progress percentage displayed

**What We Want:**
- Progress bar showing video completion (e.g., "2/7 videos completed - 28%")
- Visual indicators on each video card showing completion status
- Overall module progress displayed prominently

---

### **Issue 3: Quiz Completion Not Persisted Properly**

**Current Behavior:**
- Quiz completion is saved to `completedModulesBox` when quiz is passed
- **Problem**: Quiz completion status is not loaded on app startup
- **Problem**: Student has to retake quiz even if they already passed
- **Problem**: Module completion API call fails with 404 for legacy modules (e.g., 'flood')

**What We Want:**
- Quiz completion status loaded from Hive on app startup
- Quiz button shows "Quiz Completed" if already passed
- Module completion persists across app restarts
- Backend API properly handles legacy module IDs

---

### **Issue 4: Hive Type Casting Error**

**Current Error:**
```
Error reading game score from Hive: type '_Map<dynamic, dynamic>' is not a subtype of type 'Map<String, dynamic>?' in type cast
```

**Root Cause:**
- Hive returns `Map<dynamic, dynamic>` but code expects `Map<String, dynamic>`
- Type casting in `game_stats_provider.dart` is not handling Hive's dynamic types correctly

**What We Want:**
- Proper type casting when reading from Hive
- No runtime errors when parsing game scores
- Robust error handling for malformed data

---

### **Issue 5: Module Completion API 404 Error**

**Current Error:**
```
Module not found: flood. Tried ObjectId, type, and title lookup.
```

**Root Cause:**
- Legacy NDMA modules use string IDs like 'flood', 'cyclone', etc.
- Backend tries to find module by ObjectId, type, and title but fails
- Module might not exist in backend database (NDMA modules are local-only)

**What We Want:**
- Handle legacy modules that don't exist in backend
- Save completion locally even if backend sync fails
- Don't show errors for local-only modules

---

## 🔍 **Current Architecture Analysis**

### **Files Involved**

#### **NDMA Module Display**
1. **`mobile/lib/screens/ndma_module_list.dart`**
   - Shows list of NDMA modules
   - Navigates to `LegacyModuleDetailScreen`

2. **`mobile/lib/screens/module_detail_screen.dart`** (LegacyModuleDetailScreen)
   - Displays module details and videos
   - Uses `LearningModule` model with `List<VideoLesson>`
   - Videos have `isCompleted` boolean (in-memory only)
   - No persistence for video completion
   - No progress bar

3. **`mobile/lib/models/module_models.dart`**
   - `VideoLesson` class with `bool isCompleted`
   - `LearningModule` class with `List<VideoLesson> videos`
   - `progress` getter calculates from completed videos (but resets on restart)

#### **Video Player**
4. **`mobile/lib/screens/video_player_view.dart`**
   - Plays video
   - Calls `onVideoCompleted()` callback when video is 95% watched
   - **Problem**: No persistence of completion status
   - **Problem**: No watch time tracking

#### **Persistence**
5. **`mobile/lib/features/modules/services/local_completion_service.dart`**
   - Saves module completion to Hive (`completedModulesBox`)
   - **Problem**: Only saves module-level completion, not individual video completion
   - **Problem**: No video progress tracking

6. **`mobile/lib/core/constants/app_constants.dart`**
   - Has `completedModulesBox` for module completion
   - **Missing**: No box for video progress

#### **Backend**
7. **`backend/src/controllers/module.controller.js`**
   - `completeModule` endpoint tries to find module by ObjectId, type, and title
   - **Problem**: Legacy NDMA modules don't exist in backend database
   - **Problem**: Returns 404 for local-only modules

#### **Game Stats Provider**
8. **`mobile/lib/features/games/providers/game_stats_provider.dart`**
   - Reads game scores from Hive
   - **Problem**: Type casting error when reading `Map<dynamic, dynamic>`

---

## 📋 **Implementation Plan**

### **Phase 1: Create Video Progress Persistence Service** ⏱️ Priority: HIGH

**Goal**: Create a service to save/load individual video completion status.

#### **1.1 Create Video Progress Model**

**File**: `mobile/lib/features/modules/models/video_progress_model.dart` (NEW)

**Purpose**: Model to represent video progress for a module.

**Implementation**:
```dart
/// Video Progress Model
/// Tracks individual video completion for NDMA modules
class VideoProgress {
  final String moduleId;
  final String videoTitle; // Use title as identifier (or URL if unique)
  final String videoUrl;
  final bool isCompleted;
  final DateTime? completedAt;
  final int? watchTimeSeconds; // Optional: track watch time
  final double? lastPosition; // Optional: resume position (0.0 to 1.0)

  VideoProgress({
    required this.moduleId,
    required this.videoTitle,
    required this.videoUrl,
    this.isCompleted = false,
    this.completedAt,
    this.watchTimeSeconds,
    this.lastPosition,
  });

  Map<String, dynamic> toJson() {
    return {
      'moduleId': moduleId,
      'videoTitle': videoTitle,
      'videoUrl': videoUrl,
      'isCompleted': isCompleted,
      'completedAt': completedAt?.toIso8601String(),
      'watchTimeSeconds': watchTimeSeconds,
      'lastPosition': lastPosition,
    };
  }

  factory VideoProgress.fromJson(Map<String, dynamic> json) {
    return VideoProgress(
      moduleId: json['moduleId'] as String,
      videoTitle: json['videoTitle'] as String,
      videoUrl: json['videoUrl'] as String,
      isCompleted: json['isCompleted'] as bool? ?? false,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      watchTimeSeconds: json['watchTimeSeconds'] as int?,
      lastPosition: json['lastPosition'] as double?,
    );
  }
}

/// Module Video Progress
/// Tracks all video progress for a single module
class ModuleVideoProgress {
  final String moduleId;
  final List<VideoProgress> videos;
  final DateTime lastUpdated;

  ModuleVideoProgress({
    required this.moduleId,
    required this.videos,
    DateTime? lastUpdated,
  }) : lastUpdated = lastUpdated ?? DateTime.now();

  int get completedCount => videos.where((v) => v.isCompleted).length;
  double get progressPercentage {
    if (videos.isEmpty) return 0.0;
    return completedCount / videos.length;
  }

  bool isVideoCompleted(String videoTitle) {
    return videos.any((v) => v.videoTitle == videoTitle && v.isCompleted);
  }

  Map<String, dynamic> toJson() {
    return {
      'moduleId': moduleId,
      'videos': videos.map((v) => v.toJson()).toList(),
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }

  factory ModuleVideoProgress.fromJson(Map<String, dynamic> json) {
    return ModuleVideoProgress(
      moduleId: json['moduleId'] as String,
      videos: (json['videos'] as List?)
          ?.map((v) => VideoProgress.fromJson(v as Map<String, dynamic>))
          .toList() ?? [],
      lastUpdated: json['lastUpdated'] != null
          ? DateTime.parse(json['lastUpdated'] as String)
          : DateTime.now(),
    );
  }
}
```

#### **1.2 Create Video Progress Persistence Service**

**File**: `mobile/lib/features/modules/services/video_progress_service.dart` (NEW)

**Purpose**: Service to save/load video progress to/from Hive.

**Implementation**:
```dart
/// Video Progress Service
/// Manages video completion status persistence for NDMA modules
class VideoProgressService {
  final StorageService _storageService;
  static const String _boxName = 'videoProgressBox'; // New Hive box

  VideoProgressService({StorageService? storageService})
      : _storageService = storageService ?? StorageService();

  /// Mark a video as completed
  Future<void> markVideoCompleted({
    required String moduleId,
    required String videoTitle,
    required String videoUrl,
    int? watchTimeSeconds,
  }) async {
    try {
      final box = await _storageService.openBox(_boxName);
      
      // Get existing progress or create new
      final progressKey = 'module_$moduleId';
      final existingData = box.get(progressKey);
      
      ModuleVideoProgress progress;
      if (existingData != null && existingData is Map) {
        progress = ModuleVideoProgress.fromJson(
          Map<String, dynamic>.from(existingData),
        );
      } else {
        progress = ModuleVideoProgress(moduleId: moduleId, videos: []);
      }

      // Update or add video progress
      final existingVideoIndex = progress.videos.indexWhere(
        (v) => v.videoTitle == videoTitle || v.videoUrl == videoUrl,
      );

      if (existingVideoIndex >= 0) {
        // Update existing
        progress.videos[existingVideoIndex] = VideoProgress(
          moduleId: moduleId,
          videoTitle: videoTitle,
          videoUrl: videoUrl,
          isCompleted: true,
          completedAt: DateTime.now(),
          watchTimeSeconds: watchTimeSeconds,
        );
      } else {
        // Add new
        progress.videos.add(VideoProgress(
          moduleId: moduleId,
          videoTitle: videoTitle,
          videoUrl: videoUrl,
          isCompleted: true,
          completedAt: DateTime.now(),
          watchTimeSeconds: watchTimeSeconds,
        ));
      }

      // Save to Hive
      await box.put(progressKey, progress.toJson());
      print('💾 [VIDEO PROGRESS] Saved video completion: $moduleId - $videoTitle');
    } catch (e) {
      print('❌ [VIDEO PROGRESS] Error saving video completion: $e');
      rethrow;
    }
  }

  /// Get video progress for a module
  Future<ModuleVideoProgress?> getModuleVideoProgress(String moduleId) async {
    try {
      final box = await _storageService.openBox(_boxName);
      final progressKey = 'module_$moduleId';
      final data = box.get(progressKey);

      if (data == null) return null;

      if (data is Map) {
        return ModuleVideoProgress.fromJson(
          Map<String, dynamic>.from(data),
        );
      }

      return null;
    } catch (e) {
      print('❌ [VIDEO PROGRESS] Error loading video progress: $e');
      return null;
    }
  }

  /// Check if a specific video is completed
  Future<bool> isVideoCompleted({
    required String moduleId,
    required String videoTitle,
  }) async {
    try {
      final progress = await getModuleVideoProgress(moduleId);
      if (progress == null) return false;
      return progress.isVideoCompleted(videoTitle);
    } catch (e) {
      print('❌ [VIDEO PROGRESS] Error checking video completion: $e');
      return false;
    }
  }

  /// Get all completed videos for a module
  Future<List<String>> getCompletedVideos(String moduleId) async {
    try {
      final progress = await getModuleVideoProgress(moduleId);
      if (progress == null) return [];
      return progress.videos
          .where((v) => v.isCompleted)
          .map((v) => v.videoTitle)
          .toList();
    } catch (e) {
      print('❌ [VIDEO PROGRESS] Error getting completed videos: $e');
      return [];
    }
  }
}
```

#### **1.3 Add Video Progress Box to Constants**

**File**: `mobile/lib/core/constants/app_constants.dart`

**Changes**:
```dart
static const String completedModulesBox = 'completedModulesBox';
static const String videoProgressBox = 'videoProgressBox'; // NEW: Video progress persistence
```

#### **1.4 Initialize Video Progress Box in main.dart**

**File**: `mobile/lib/main.dart`

**Changes**:
```dart
await Hive.openBox(AppConstants.completedModulesBox);
await Hive.openBox(AppConstants.videoProgressBox); // NEW: Video progress
```

---

### **Phase 2: Update Module Detail Screen to Use Video Progress** ⏱️ Priority: HIGH

**Goal**: Load and save video progress in module detail screen.

#### **2.1 Update LegacyModuleDetailScreen**

**File**: `mobile/lib/screens/module_detail_screen.dart`

**Changes**:
1. Inject `VideoProgressService`
2. Load video progress from Hive in `initState`
3. Update `VideoLesson.isCompleted` from loaded progress
4. Save video completion to Hive when video completes
5. Add progress bar showing video completion

**Key Changes**:
```dart
class _LegacyModuleDetailScreenState extends ConsumerState<LegacyModuleDetailScreen> {
  late ModuleModel _moduleModel;
  late LocalCompletionService _localCompletionService;
  late VideoProgressService _videoProgressService; // NEW
  bool _isModuleCompleted = false;
  ModuleVideoProgress? _videoProgress; // NEW
  
  @override
  void initState() {
    super.initState();
    _moduleModel = ModuleAdapter.fromLearningModule(widget.module);
    _localCompletionService = LocalCompletionService();
    _videoProgressService = VideoProgressService(); // NEW
    _loadLocalCompletionState();
    _loadVideoProgress(); // NEW: Load video progress
  }

  /// Load video progress from Hive
  Future<void> _loadVideoProgress() async {
    try {
      final progress = await _videoProgressService.getModuleVideoProgress(_moduleModel.id);
      if (progress != null) {
        setState(() {
          _videoProgress = progress;
          // Update VideoLesson.isCompleted from loaded progress
          for (final video in widget.module.videos) {
            video.isCompleted = progress.isVideoCompleted(video.title);
          }
        });
        print('✅ [MODULE] Loaded video progress: ${progress.completedCount}/${progress.videos.length} videos completed');
      }
    } catch (e) {
      print('⚠️ [MODULE] Error loading video progress: $e');
    }
  }

  /// Save video completion to Hive
  Future<void> _onVideoCompleted(VideoLesson video) async {
    try {
      // Update local state immediately
      setState(() {
        video.isCompleted = true;
      });
      widget.onModuleUpdated();

      // Save to Hive
      await _videoProgressService.markVideoCompleted(
        moduleId: _moduleModel.id,
        videoTitle: video.title,
        videoUrl: video.url,
      );

      // Reload progress to update UI
      await _loadVideoProgress();
      
      print('✅ [MODULE] Video completion saved: ${video.title}');
    } catch (e) {
      print('❌ [MODULE] Error saving video completion: $e');
    }
  }
}
```

#### **2.2 Add Progress Bar to UI**

**File**: `mobile/lib/screens/module_detail_screen.dart`

**Changes**:
1. Add progress bar showing "X/Y videos completed"
2. Show progress percentage
3. Update progress bar when videos are completed

**Key Changes**:
```dart
// In build method, after header section
_buildVideoProgressBar(), // NEW: Progress bar widget

Widget _buildVideoProgressBar() {
  final totalVideos = widget.module.videos.length;
  final completedCount = widget.module.videos.where((v) => v.isCompleted).length;
  final progress = totalVideos > 0 ? completedCount / totalVideos : 0.0;

  return Container(
    margin: const EdgeInsets.all(16),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.blue.shade50,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Colors.blue.shade200),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Video Progress',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.blue.shade900,
              ),
            ),
            Text(
              '$completedCount / $totalVideos videos',
              style: TextStyle(
                fontSize: 14,
                color: Colors.blue.shade700,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: progress,
          backgroundColor: Colors.blue.shade100,
          valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
          minHeight: 8,
        ),
        const SizedBox(height: 4),
        Text(
          '${(progress * 100).round()}% Complete',
          style: TextStyle(
            fontSize: 12,
            color: Colors.blue.shade600,
          ),
        ),
      ],
    ),
  );
}
```

#### **2.3 Update Video Player Callback**

**File**: `mobile/lib/screens/module_detail_screen.dart`

**Changes**:
1. Replace direct `video.isCompleted = true` with `_onVideoCompleted(video)`
2. Ensure video completion is saved to Hive

**Key Changes**:
```dart
onVideoCompleted: () {
  _onVideoCompleted(video); // NEW: Use service method
},
```

---

### **Phase 3: Fix Hive Type Casting Error** ⏱️ Priority: MEDIUM

**Goal**: Fix type casting errors when reading from Hive.

#### **3.1 Fix GameStatsProvider Type Casting**

**File**: `mobile/lib/features/games/providers/game_stats_provider.dart`

**Changes**:
1. Properly cast Hive `Map<dynamic, dynamic>` to `Map<String, dynamic>`
2. Add error handling for malformed data

**Key Changes**:
```dart
// Current (line 153-155):
final data = box.get(key);
if (data is Map) {
  final scoreData = Map<String, dynamic>.from(data);

// Fixed:
final data = box.get(key);
if (data != null) {
  try {
    // Handle both Map<dynamic, dynamic> and Map<String, dynamic>
    final scoreData = data is Map
        ? Map<String, dynamic>.from(data as Map)
        : null;
    
    if (scoreData == null) continue;
    
    // Rest of the logic...
  } catch (e) {
    print('⚠️ [GAME STATS] Error parsing game score entry: $e');
    continue; // Skip malformed entries
  }
}
```

---

### **Phase 4: Fix Module Completion API for Legacy Modules** ⏱️ Priority: MEDIUM

**Goal**: Handle legacy NDMA modules that don't exist in backend.

#### **4.1 Update ModuleService to Handle Legacy Modules**

**File**: `mobile/lib/features/modules/services/module_service.dart`

**Changes**:
1. Check if module is legacy (local-only) before calling API
2. If legacy module, save locally only (don't call API)
3. Don't show errors for legacy modules

**Key Changes**:
```dart
/// Check if module is legacy (local-only, not in backend)
bool _isLegacyModule(String moduleId) {
  // Legacy NDMA modules use string IDs like 'flood', 'cyclone', etc.
  // They don't exist in backend database
  final legacyIds = ['flood', 'cyclone', 'earthquake', 'fire', 'stampede', 'heatwave'];
  return legacyIds.contains(moduleId.toLowerCase());
}

Future<Map<String, dynamic>> completeModule(
  String moduleId,
  List<Map<String, dynamic>> answers, {
  int? timeTaken,
  bool isClassMode = false,
  String? classId,
}) async {
  // ... existing score calculation ...

  // Phase 1: Save to Hive FIRST (optimistic update)
  try {
    await _localCompletionService.markModuleCompleted(
      moduleId,
      score: calculatedScore,
      synced: false,
    );
    print('✅ Module completion saved locally (optimistic): $moduleId');
  } catch (localError) {
    print('⚠️ Failed to save module completion locally: $localError');
  }

  // Check if legacy module (local-only)
  if (_isLegacyModule(moduleId)) {
    print('📂 [MODULE SERVICE] Legacy module detected: $moduleId - skipping backend sync');
    // Mark as synced locally (no backend to sync with)
    await _localCompletionService.markAsSynced(moduleId);
    return {
      'success': true,
      'message': 'Module completed (local-only)',
      'score': calculatedScore ?? 0,
    };
  }

  // For non-legacy modules, sync with backend
  try {
    // ... existing API call logic ...
  } catch (e) {
    // ... existing error handling ...
  }
}
```

---

### **Phase 5: Add Progress Indicators to Video Cards** ⏱️ Priority: MEDIUM

**Goal**: Show visual indicators for video completion status.

#### **5.1 Update Video Card UI**

**File**: `mobile/lib/screens/module_detail_screen.dart`

**Changes**:
1. Add checkmark icon for completed videos
2. Add progress indicator overlay
3. Show "Completed" badge

**Key Changes**:
```dart
// In video card widget
Stack(
  children: [
    // Video thumbnail/placeholder
    Container(
      height: 180,
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.black12,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Center(
        child: Icon(
          video.isCompleted ? Icons.check_circle : Icons.play_circle_fill,
          size: 50,
          color: video.isCompleted ? Colors.green : Colors.grey[700],
        ),
      ),
    ),
    // Completion badge
    if (video.isCompleted)
      Positioned(
        top: 10,
        right: 10,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.green,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check, color: Colors.white, size: 14),
              const SizedBox(width: 4),
              const Text(
                'Completed',
                style: TextStyle(color: Colors.white, fontSize: 10),
              ),
            ],
          ),
        ),
      ),
    // Video label
    Positioned(
      bottom: 10,
      right: 10,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.7),
          borderRadius: BorderRadius.circular(4),
        ),
        child: const Text("Video", style: TextStyle(color: Colors.white, fontSize: 10)),
      ),
    ),
  ],
),
```

---

### **Phase 6: Add Watch Time Tracking (Optional Enhancement)** ⏱️ Priority: LOW

**Goal**: Track how long a student watched each video.

#### **6.1 Update VideoPlayerView**

**File**: `mobile/lib/screens/video_player_view.dart`

**Changes**:
1. Track watch time while video is playing
2. Save watch time when video completes
3. Optional: Save resume position for future "Resume" feature

**Key Changes**:
```dart
class _VideoPlayerViewState extends State<VideoPlayerView> {
  int _watchTimeSeconds = 0;
  Timer? _watchTimeTimer;

  @override
  void initState() {
    super.initState();
    initializePlayer();
    _startWatchTimeTracking();
  }

  void _startWatchTimeTracking() {
    _watchTimeTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_videoPlayerController.value.isPlaying) {
        setState(() {
          _watchTimeSeconds++;
        });
      }
    });
  }

  @override
  void dispose() {
    _watchTimeTimer?.cancel();
    // ... existing dispose logic ...
  }

  // In video completion callback
  if (position >= duration * 0.95) {
    widget.onVideoCompleted(_watchTimeSeconds); // Pass watch time
  }
}
```

---

## 📁 **Files to Create**

1. `mobile/lib/features/modules/models/video_progress_model.dart` - NEW
2. `mobile/lib/features/modules/services/video_progress_service.dart` - NEW

---

## 📁 **Files to Modify**

1. `mobile/lib/core/constants/app_constants.dart` - Add `videoProgressBox`
2. `mobile/lib/main.dart` - Initialize `videoProgressBox`
3. `mobile/lib/screens/module_detail_screen.dart` - Load/save video progress, add progress bar
4. `mobile/lib/features/games/providers/game_stats_provider.dart` - Fix type casting
5. `mobile/lib/features/modules/services/module_service.dart` - Handle legacy modules
6. `mobile/lib/screens/video_player_view.dart` - Optional: Add watch time tracking

---

## 🧪 **Testing Checklist**

### **Video Progress Persistence**
- [ ] Watch 1 video out of 3
- [ ] Close app completely
- [ ] Reopen app
- [ ] Verify video 1 shows as completed
- [ ] Verify progress bar shows "1/3 videos - 33%"
- [ ] Watch video 2
- [ ] Close app
- [ ] Reopen app
- [ ] Verify both videos show as completed
- [ ] Verify progress bar shows "2/3 videos - 67%"

### **Progress Bar Display**
- [ ] Open module with videos
- [ ] Verify progress bar is visible
- [ ] Verify progress bar shows correct count
- [ ] Verify progress bar updates when video completes
- [ ] Verify progress percentage is accurate

### **Quiz Completion Persistence**
- [ ] Complete quiz and pass
- [ ] Close app
- [ ] Reopen app
- [ ] Verify quiz button shows "Quiz Completed"
- [ ] Verify module shows as completed
- [ ] Verify green checkmark is visible

### **Legacy Module Handling**
- [ ] Complete a legacy module (e.g., Flood)
- [ ] Verify no 404 errors in logs
- [ ] Verify completion saved locally
- [ ] Verify completion persists on restart

### **Type Casting Fix**
- [ ] Open app
- [ ] Verify no "type '_Map<dynamic, dynamic>' is not a subtype" errors
- [ ] Verify game stats load correctly
- [ ] Verify score calculation works

---

## 🚨 **Critical Considerations**

1. **Backward Compatibility**:
   - Existing modules should continue to work
   - No breaking changes to existing data structures
   - Graceful migration of existing data

2. **Performance**:
   - Video progress loading should be fast (< 200ms)
   - Don't block UI thread
   - Use async loading

3. **Error Handling**:
   - Handle missing video progress gracefully
   - Don't crash if Hive data is corrupted
   - Log errors for debugging

4. **Data Consistency**:
   - Video progress and module completion should be in sync
   - If all videos completed, module should be marked as ready for quiz
   - Quiz completion should mark module as fully completed

---

## 📊 **Success Metrics**

1. ✅ Video completion persists across app restarts
2. ✅ Progress bar shows accurate video completion
3. ✅ Quiz completion persists across app restarts
4. ✅ No type casting errors in logs
5. ✅ No 404 errors for legacy modules
6. ✅ Video progress loads within 200ms on app startup
7. ✅ All video completion status visible immediately after app restart

---

## 🔄 **Implementation Order**

1. **Phase 1**: Create VideoProgressService and models (Foundation)
2. **Phase 2**: Update ModuleDetailScreen to use VideoProgressService (Critical)
3. **Phase 3**: Fix Hive type casting errors (Important)
4. **Phase 4**: Fix legacy module API handling (Important)
5. **Phase 5**: Add progress indicators to UI (Enhancement)
6. **Phase 6**: Add watch time tracking (Optional)

---

## 📝 **Notes**

- This plan follows the existing architecture (Hive, Riverpod, existing services)
- Video progress is separate from module completion (allows partial progress)
- Legacy modules are handled gracefully (local-only, no backend sync)
- Type casting is fixed to handle Hive's dynamic types properly
- Progress bar provides visual feedback for better UX

---

**Next Steps**: Review this plan and say "start" to begin implementation.

