# Games Scoring & Preparedness Score Integration Plan

## Problem Analysis

### Current Issues

1. **Games Not Contributing to Preparedness Score** (CRITICAL)
   - Symptom: Playing games doesn't increase student's preparedness level
   - Root Cause: Game scores may not be properly synced or calculated in preparedness score
   - Impact: Students lose motivation, games feel disconnected from learning

2. **No Real-time Score Updates** (HIGH)
   - Symptom: Preparedness score doesn't update immediately after game completion
   - Root Cause: Score calculation may not be triggered after game score submission
   - Impact: Poor UX, students don't see immediate feedback

3. **Game Stats Not Stateful** (MEDIUM)
   - Symptom: Game statistics may reset or not persist properly
   - Root Cause: Similar to module issue - stats may be in-memory only
   - Impact: Progress lost on app restart

4. **Inconsistent Game Score Tracking** (MEDIUM)
   - Symptom: Different games may handle scoring differently
   - Root Cause: No unified game scoring service/pattern
   - Impact: Some games may not contribute to score at all

---

## Games Inventory

### Identified Games in Application

1. **Bag Packer** (`bag-packer`)
   - Type: Packing/Strategy game
   - Scoring: Points based on items packed correctly

2. **Hazard Hunter** (`hazard-hunter`)
   - Type: Identification/Quiz game
   - Scoring: Points for identifying hazards correctly

3. **Earthquake Shake** (`earthquake-shake`)
   - Type: Action/Reaction game
   - Scoring: Points based on reaction time/accuracy

4. **School Runner** (`school-runner`)
   - Type: Endless runner game
   - Scoring: Distance/score based on survival time

5. **Flood Escape** (`flood-escape`)
   - Type: Escape/Puzzle game
   - Scoring: Points for successful escape/level completion

6. **Punjab Safety** (`punjab-safety`)
   - Type: Quiz/Knowledge game
   - Scoring: Points for correct answers

7. **School Safety Quiz** (`school-safety-quiz`)
   - Type: Quiz game
   - Scoring: Points for quiz accuracy

8. **Fire Extinguisher AR** (`fire-extinguisher-ar`)
   - Type: AR/Simulation game
   - Scoring: Points for correct fire extinguisher usage

9. **Web Games** (`web-game`)
   - Type: External web-based games
   - Scoring: Points from external game completion

---

## Current Architecture Analysis

### Game Score Flow (Current)

1. **Game Completion**:
   - Game screen calls `GameService.submitScore()`
   - Score saved to Hive (offline)
   - API call to `/games/scores` (if online)
   - `GameStatsProvider` updates stats

2. **Preparedness Score Calculation**:
   - `LocalScoreCalculator` reads from Hive boxes
   - Calculates game component from `gameScoresBox`
   - Formula: `(totalGameXP / maxPossibleXP) * 100 * weight(25%)`
   - `PreparednessScoreProvider` triggers recalculation

3. **Issues Identified**:
   - Score calculation may not trigger immediately after game completion
   - Game stats may not persist properly
   - Some games may not call `submitScore()` correctly
   - Preparedness score may not listen to game score changes

---

## Solution Strategy

### Phase 1: Fix Game Score Submission Flow (CRITICAL)

**Goal**: Ensure all games properly submit scores and trigger score recalculation

**Changes Required**:

1. **Audit All Game Screens**
   - Verify each game calls `GameService.submitScore()`
   - Ensure proper error handling
   - Add logging for debugging

2. **Unify Score Submission Pattern**
   - Create a common `_submitGameScore()` helper
   - Ensure all games use the same pattern
   - Add retry logic for failed submissions

3. **Trigger Preparedness Score Recalculation**
   - After successful score submission, trigger `PreparednessScoreProvider.recalculateScore()`
   - Ensure this happens immediately (not deferred)

**Files to Modify**:
- All game screen files in `mobile/lib/features/games/screens/`
- `mobile/lib/features/games/services/game_service.dart`
- `mobile/lib/features/games/providers/game_stats_provider.dart`

---

### Phase 2: Fix Preparedness Score Game Component (CRITICAL)

**Goal**: Ensure game scores properly contribute to preparedness score

**Current Formula Analysis**:
```dart
// From local_score_calculator.dart
double gameScore = (totalXP / maxPossibleXP) * 100 * 0.25; // 25% weight
```

**Issues**:
- `maxPossibleXP` may not be calculated correctly
- `totalXP` may not include all game scores
- Score may not update in real-time

**Solution**:
1. **Fix Game Score Calculation**:
   - Ensure all game scores are read from Hive
   - Calculate total XP correctly
   - Use proper max XP calculation (or dynamic scaling)

2. **Add Real-time Updates**:
   - `PreparednessScoreProvider` should listen to `gameScoresBox` changes
   - Trigger recalculation when new game score is added
   - Update UI immediately

3. **Verify Backend Sync**:
   - Ensure backend recalculates preparedness score after game score submission
   - Frontend should fetch updated score after game completion

**Files to Modify**:
- `mobile/lib/features/score/services/local_score_calculator.dart`
- `mobile/lib/features/score/providers/preparedness_score_provider.dart`
- `mobile/lib/features/games/services/game_service.dart`

---

### Phase 3: Make Game Stats Stateful (HIGH)

**Goal**: Ensure game statistics persist across app restarts

**Current State**:
- `GameStatsProvider` loads from Hive on init ✅
- Stats are saved to Hive ✅
- But: May not be properly restored on app startup

**Solution**:
1. **Ensure Stats Restoration**:
   - `ProgressRestorationService` should restore game stats
   - `GameStatsProvider` should load on app startup
   - Verify stats are loaded before UI displays

2. **Fix Stats Calculation**:
   - Ensure `_recalculateFromScores()` works correctly
   - Handle edge cases (no scores, corrupted data)
   - Add proper error handling

3. **Add Stats Persistence**:
   - Save stats after every game completion
   - Load stats on app startup
   - Update stats in real-time

**Files to Modify**:
- `mobile/lib/features/games/providers/game_stats_provider.dart`
- `mobile/lib/features/progress/services/progress_restoration_service.dart`
- `mobile/lib/features/games/services/game_stats_persistence_service.dart`

---

### Phase 4: Add Real-time Score Updates (HIGH)

**Goal**: Preparedness score updates immediately after game completion

**Current Flow Issues**:
- Score calculation may be deferred
- UI may not update immediately
- No visual feedback after game completion

**Solution**:
1. **Immediate Score Recalculation**:
   - After `GameService.submitScore()` succeeds, immediately call:
     ```dart
     ref.read(preparednessScoreProvider.notifier).recalculateScore(userId: userId);
     ```
   - This should happen in every game's completion handler

2. **Optimistic UI Updates**:
   - Calculate score locally first (from Hive)
   - Update UI immediately
   - Sync with backend in background
   - Update UI again when backend responds

3. **Visual Feedback**:
   - Show "Score Updated!" message after game
   - Display XP earned
   - Show new preparedness score

**Files to Modify**:
- All game screen files
- `mobile/lib/features/games/services/game_service.dart`
- `mobile/lib/features/score/providers/preparedness_score_provider.dart`

---

### Phase 5: Verify Backend Integration (MEDIUM)

**Goal**: Ensure backend properly handles game scores and recalculates preparedness score

**Current Backend Flow**:
1. `POST /games/scores` → `game.controller.js`
2. Creates `GameScore` document
3. Should trigger `preparednessScore.service.js` recalculation
4. Returns updated preparedness score

**Verification Needed**:
1. Check if backend recalculates score after game submission
2. Verify response includes updated preparedness score
3. Ensure frontend uses the updated score

**Files to Check**:
- `backend/src/controllers/game.controller.js`
- `backend/src/services/preparednessScore.service.js`
- `backend/src/services/adaptiveScoring.service.js`

---

## Implementation Plan

### Step 1: Audit All Game Screens (Priority: CRITICAL)
**Time Estimate**: 1 hour

1. List all game screen files
2. Check each game's score submission:
   - Does it call `GameService.submitScore()`?
   - Does it handle errors?
   - Does it trigger score recalculation?
3. Document findings
4. Fix any games missing score submission

**Files to Audit**:
- `mobile/lib/features/games/screens/bag_packer_game.dart`
- `mobile/lib/features/games/screens/hazard_hunter_game.dart`
- `mobile/lib/features/games/screens/earthquake_shake_game.dart`
- `mobile/lib/features/games/screens/school_runner_game.dart`
- `mobile/lib/features/games/screens/flood_escape_game.dart`
- `mobile/lib/features/games/screens/punjab_safety_game.dart`
- `mobile/lib/features/games/screens/school_safety_quiz_game.dart`
- `mobile/lib/features/games/screens/fire_extinguisher_ar_game.dart`
- Any web game handlers

### Step 2: Create Unified Game Score Submission Helper (Priority: CRITICAL)
**Time Estimate**: 30 minutes

Create a helper function that:
- Submits score via `GameService`
- Updates `GameStatsProvider`
- Triggers preparedness score recalculation
- Handles errors gracefully
- Shows user feedback

**Implementation**:
```dart
// In game_service.dart or new game_utils.dart
Future<void> submitGameScoreAndUpdate(
  GameScore score,
  WidgetRef ref,
  BuildContext context,
) async {
  try {
    // 1. Submit score
    await gameService.submitScore(score);
    
    // 2. Update game stats
    ref.read(gameStatsProvider.notifier).updateStats(score);
    
    // 3. Trigger preparedness score recalculation
    final userId = ref.read(authProvider).user?.id;
    if (userId != null) {
      await ref.read(preparednessScoreProvider.notifier).recalculateScore(userId: userId);
    }
    
    // 4. Show success message
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Score submitted! +${score.xpEarned} XP'),
          backgroundColor: Colors.green,
        ),
      );
    }
  } catch (e) {
    // Handle error
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Score saved offline. Will sync when online.'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }
}
```

### Step 3: Fix Preparedness Score Game Component (Priority: CRITICAL)
**Time Estimate**: 1 hour

1. **Fix `_calculateGameScore()` in `local_score_calculator.dart`**:
   - Ensure all game scores are read correctly
   - Calculate total XP properly
   - Use correct max XP (or dynamic scaling)
   - Handle edge cases (no scores, etc.)

2. **Add Real-time Listener**:
   - `PreparednessScoreProvider` should listen to `gameScoresBox`
   - Trigger recalculation when box changes
   - Update state immediately

3. **Verify Calculation Formula**:
   - Game component: 25% weight
   - Formula: `(totalGameXP / maxPossibleXP) * 100 * 0.25`
   - Max XP: Could be dynamic based on games played, or fixed threshold

**Current Implementation Check**:
```dart
// From local_score_calculator.dart
double _calculateGameScore(String? userId) {
  // Read all game scores from Hive
  // Sum up XP
  // Calculate percentage
  // Apply 25% weight
}
```

**Issues to Fix**:
- Ensure all game scores are included
- Handle null/empty scores
- Use proper max XP calculation
- Add logging for debugging

### Step 4: Update All Game Screens (Priority: HIGH)
**Time Estimate**: 2 hours

For each game screen:
1. Ensure it uses the unified score submission helper
2. Add proper error handling
3. Trigger score recalculation
4. Show user feedback
5. Add logging

**Pattern to Apply**:
```dart
// In each game's completion handler
Future<void> _onGameComplete(int score, int maxScore) async {
  final gameScore = GameScore(
    gameType: 'game-type',
    score: score,
    maxScore: maxScore,
    level: currentLevel,
    difficulty: currentDifficulty,
    xpEarned: calculateXP(score, maxScore),
    // ... other fields
  );
  
  // Use unified helper
  await submitGameScoreAndUpdate(gameScore, ref, context);
}
```

### Step 5: Fix Game Stats Persistence (Priority: HIGH)
**Time Estimate**: 1 hour

1. **Verify Stats Restoration**:
   - `ProgressRestorationService` should restore game stats
   - `GameStatsProvider` should load on init
   - Stats should be available before UI displays

2. **Fix Stats Calculation**:
   - Ensure `_recalculateFromScores()` works correctly
   - Handle all game types
   - Calculate stats accurately

3. **Add Stats Persistence**:
   - Save stats after every game completion
   - Load stats on app startup
   - Update UI when stats change

### Step 6: Add Real-time Score Updates (Priority: HIGH)
**Time Estimate**: 1 hour

1. **Immediate Recalculation**:
   - After game score submission, trigger:
     ```dart
     ref.read(preparednessScoreProvider.notifier).recalculateScore(userId: userId);
     ```

2. **Hive Listener**:
   - `PreparednessScoreProvider` should listen to `gameScoresBox`
   - Auto-recalculate when new score is added
   - Update UI immediately

3. **Visual Feedback**:
   - Show XP earned
   - Show new preparedness score
   - Animate score increase

### Step 7: Verify Backend Integration (Priority: MEDIUM)
**Time Estimate**: 30 minutes

1. **Check Backend Response**:
   - Verify `POST /games/scores` returns updated preparedness score
   - Check if backend recalculates score automatically
   - Ensure frontend uses the response

2. **Add Backend Score Sync**:
   - After game completion, fetch latest preparedness score from backend
   - Update local state with backend score
   - This ensures consistency

---

## Detailed Implementation Steps

### Step 1: Create Unified Game Score Helper

**File**: `mobile/lib/features/games/utils/game_score_helper.dart` (NEW)

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/game_models.dart';
import '../services/game_service.dart';
import '../providers/game_stats_provider.dart';
import '../../score/providers/preparedness_score_provider.dart';
import '../../auth/providers/auth_provider.dart';

/// Unified helper for submitting game scores and updating all related state
/// Phase: Games Scoring & Preparedness Integration
class GameScoreHelper {
  final GameService _gameService;
  final WidgetRef _ref;
  final BuildContext? _context;

  GameScoreHelper({
    required GameService gameService,
    required WidgetRef ref,
    BuildContext? context,
  })  : _gameService = gameService,
        _ref = ref,
        _context = context;

  /// Submit game score and update all related state
  /// This ensures:
  /// 1. Score is saved to Hive
  /// 2. Score is synced with backend
  /// 3. Game stats are updated
  /// 4. Preparedness score is recalculated
  /// 5. User gets feedback
  Future<void> submitScoreAndUpdate(GameScore score) async {
    try {
      print('🎮 [GAME SCORE HELPER] Submitting score: ${score.gameType}, ${score.score}');
      
      // 1. Submit score (saves to Hive + syncs with backend)
      await _gameService.submitScore(score);
      print('✅ [GAME SCORE HELPER] Score submitted successfully');
      
      // 2. Update game stats
      _ref.read(gameStatsProvider.notifier).updateStats(score);
      print('✅ [GAME SCORE HELPER] Game stats updated');
      
      // 3. Trigger preparedness score recalculation
      final userId = _ref.read(authProvider).user?.id;
      if (userId != null) {
        await _ref.read(preparednessScoreProvider.notifier).recalculateScore(userId: userId);
        print('✅ [GAME SCORE HELPER] Preparedness score recalculated');
      } else {
        print('⚠️ [GAME SCORE HELPER] No user ID, skipping score recalculation');
      }
      
      // 4. Show success message
      if (_context != null && _context!.mounted) {
        ScaffoldMessenger.of(_context!).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.star, color: Colors.white),
                const SizedBox(width: 8),
                Text('Score submitted! +${score.xpEarned} XP earned'),
              ],
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      print('❌ [GAME SCORE HELPER] Error submitting score: $e');
      
      // Show error message
      if (_context != null && _context!.mounted) {
        ScaffoldMessenger.of(_context!).showSnackBar(
          SnackBar(
            content: const Text('Score saved offline. Will sync when online.'),
            backgroundColor: Colors.orange,
            duration: const Duration(seconds: 3),
          ),
        );
      }
      
      // Still update stats locally (optimistic)
      try {
        _ref.read(gameStatsProvider.notifier).updateStats(score);
      } catch (statsError) {
        print('❌ [GAME SCORE HELPER] Error updating stats: $statsError');
      }
    }
  }
}
```

### Step 2: Fix Local Score Calculator Game Component

**File**: `mobile/lib/features/score/services/local_score_calculator.dart`

**Current Issues**:
- May not read all game scores correctly
- Max XP calculation may be incorrect
- May not handle edge cases

**Fixes Needed**:
1. Ensure all game scores are read from Hive
2. Calculate total XP correctly
3. Use proper max XP (could be dynamic or fixed)
4. Add proper error handling
5. Add logging for debugging

### Step 3: Add Real-time Listener to Preparedness Score Provider

**File**: `mobile/lib/features/score/providers/preparedness_score_provider.dart`

**Current State**:
- May already have Hive listeners
- Need to verify they work correctly
- Need to ensure recalculation happens immediately

**Fixes Needed**:
1. Verify Hive listener for `gameScoresBox`
2. Trigger recalculation when new score is added
3. Update state immediately
4. Add logging

### Step 4: Update All Game Screens

**Pattern to Apply**:
1. Import `GameScoreHelper`
2. Create helper instance in game screen
3. Use helper in game completion handler
4. Remove duplicate score submission logic

**Example**:
```dart
// In game screen
final _gameScoreHelper = GameScoreHelper(
  gameService: ref.read(gameServiceProvider),
  ref: ref,
  context: context,
);

// In completion handler
await _gameScoreHelper.submitScoreAndUpdate(gameScore);
```

---

## Testing Checklist

### Game Score Submission
- [ ] All games submit scores correctly
- [ ] Scores are saved to Hive
- [ ] Scores are synced with backend (when online)
- [ ] Error handling works (offline mode)

### Game Stats
- [ ] Stats update after game completion
- [ ] Stats persist across app restarts
- [ ] Stats are restored on app startup
- [ ] Stats display correctly in UI

### Preparedness Score
- [ ] Score increases after game completion
- [ ] Score updates in real-time
- [ ] Score persists across app restarts
- [ ] Score matches backend (when synced)
- [ ] Game component (25%) is calculated correctly

### Real-time Updates
- [ ] Score updates immediately after game
- [ ] UI reflects new score instantly
- [ ] No delay or lag in updates
- [ ] User sees XP earned message

### Backend Integration
- [ ] Backend receives game scores
- [ ] Backend recalculates preparedness score
- [ ] Frontend fetches updated score
- [ ] Scores are consistent between frontend and backend

---

## Files to Modify

### Critical (Must Fix)
1. `mobile/lib/features/games/utils/game_score_helper.dart` (NEW)
2. `mobile/lib/features/score/services/local_score_calculator.dart`
3. `mobile/lib/features/score/providers/preparedness_score_provider.dart`
4. All game screen files in `mobile/lib/features/games/screens/`

### Important (Should Fix)
5. `mobile/lib/features/games/services/game_service.dart`
6. `mobile/lib/features/games/providers/game_stats_provider.dart`
7. `mobile/lib/features/progress/services/progress_restoration_service.dart`

### Optional (Nice to Have)
8. `mobile/lib/screens/main_menu_screen.dart` - Show real-time stats
9. `mobile/lib/features/dashboard/screens/home_screen.dart` - Show score updates

---

## Expected Outcomes

### After Implementation
- ✅ All games contribute to preparedness score
- ✅ Score updates in real-time after game completion
- ✅ Game stats persist across app restarts
- ✅ Users see immediate feedback (XP earned, score increase)
- ✅ Scores are properly synced with backend
- ✅ No data loss on app restart

### User Experience
- User plays a game → sees "Score submitted! +50 XP"
- Preparedness score increases immediately
- User closes app → reopens → progress is still there
- User sees their game stats (games played, high score, etc.)
- User sees how games contribute to overall preparedness

---

## Risk Assessment

### Low Risk
- Adding helper function (isolated change)
- Adding logging (no functional impact)

### Medium Risk
- Updating all game screens (many files, but pattern is clear)
- Fixing score calculation (needs careful testing)

### High Risk
- Changing score calculation formula (could affect existing scores)
- Backend integration changes (needs coordination)

### Mitigation
- Test thoroughly after each step
- Keep old code commented for rollback
- Incremental deployment
- Monitor logs for errors

---

## Timeline

1. **Step 1** (Audit Games): 1 hour
2. **Step 2** (Create Helper): 30 minutes
3. **Step 3** (Fix Score Calc): 1 hour
4. **Step 4** (Update Games): 2 hours
5. **Step 5** (Fix Stats): 1 hour
6. **Step 6** (Real-time Updates): 1 hour
7. **Step 7** (Backend Verify): 30 minutes

**Total Estimated Time**: 7-8 hours

---

## Notes

- The unified helper pattern will make it easier to maintain
- Real-time updates are crucial for good UX
- Stats persistence is important for user retention
- Backend integration ensures data consistency
- Consider adding analytics to track game engagement

