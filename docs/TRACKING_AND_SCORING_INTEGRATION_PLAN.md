# Tracking and Scoring Integration Plan
## Comprehensive Plan for Integrating New Modules and Games with Existing Tracking Systems

**Date:** 2025-01-XX  
**Status:** Planning Phase - Awaiting Confirmation

---

## Executive Summary

After the recent integration of new modules (NDMA, NDRF, Hearing Impaired) and games (Punjab Safety Game, School Safety Quiz, Flood Escape, School Runner), the existing tracking and scoring systems are no longer functioning properly. This document outlines a comprehensive plan to restore and enhance tracking, scoring, points, completion rates, and level progression for all modules and games.

---

## Current State Analysis

### 1. Existing Tracking Systems (Working)

#### A. Module Tracking (Old System - NDMA Interactive Modules)
- **Model:** `LearningModule` (from `module_models.dart`)
- **Tracking:**
  - Video completion: `VideoLesson.isCompleted`
  - Quiz completion: `LearningModule.isQuizPassed`
  - Points: `LearningModule.points` (default: 100)
  - Progress: Calculated from video completion percentage
- **Backend Integration:**
  - API: `POST /api/modules/:id/complete`
  - Model: `QuizResult` (stores quiz answers, score, passed status)
  - User Progress: `user.progress.completedModules[]` (array of module IDs)
  - Badges: Awarded on module completion
- **Status:** ✅ Working (for NDMA interactive modules only)

#### B. Game Tracking (Old System - Bag Packer, Hazard Hunter, Earthquake Shake)
- **Model:** `GameScore` (backend model)
- **Tracking:**
  - Score, maxScore, level, difficulty
  - Items correct/incorrect
  - Time taken
  - XP earned (calculated via `calculateXP()` method)
- **Backend Integration:**
  - API: `POST /api/games/scores`
  - Model: `GameScore` (stores all game data)
  - XP Calculation:
    - Base XP = score / 10
    - Difficulty multiplier: easy (1x), medium (1.5x), hard (2x)
    - Perfect score bonus: +50 XP
    - Time bonus: +10 XP if completed < 60 seconds
- **Status:** ✅ Working (for old games only)

#### C. Preparedness Score Calculation
- **Formula:**
  ```
  Total Score = (Module Score × 40%) + (Game Score × 25%) + (Quiz Score × 20%) + (Drill Score × 10%) + (Streak Score × 5%)
  ```
- **Components:**
  1. **Module Score (40%):** Percentage of modules completed
  2. **Game Score (25%):** Average game performance (score/maxScore × 100)
  3. **Quiz Score (20%):** Average quiz scores
  4. **Drill Score (10%):** Drill participation rate + acknowledgment speed
  5. **Streak Score (5%):** Login streak days (normalized to 30 days = 100%)
- **Backend Service:** `preparednessScore.service.js`
- **Status:** ⚠️ Partially Broken (only counts old modules/games)

---

### 2. New Systems (Not Tracked)

#### A. NDRF Modules
- **Structure:** `VideoLesson` list from `ndrf_data.dart`
- **Languages:** 13 languages (English, Hindi, Marathi, etc.)
- **Content:** Video-only (no quizzes currently)
- **Tracking:** ❌ None
- **Issues:**
  - No video completion tracking
  - No module completion tracking
  - No points/XP awarded
  - Not counted in preparedness score

#### B. Hearing Impaired Modules
- **Structure:** `VideoLesson` list from `hearing_impaired_data.dart`
- **Content:** Video-only (no quizzes currently)
- **Tracking:** ❌ None
- **Issues:**
  - No video completion tracking
  - No module completion tracking
  - No points/XP awarded
  - Not counted in preparedness score

#### C. New Games
- **Games:**
  1. **Punjab Safety Game** (`punjab_safety_game.dart`)
  2. **School Safety Quiz Game** (`school_safety_quiz_game.dart`)
  3. **Flood Escape Game** (`flood_escape_game.dart`)
  4. **School Runner Game** (`school_runner_game.dart`)
- **Current Tracking:**
  - Local only via `GameManager` (high scores, total games played, lifetime score)
  - No backend sync
  - No XP calculation
  - No preparedness score contribution
- **Issues:**
  - Scores not saved to backend
  - No XP earned
  - Not counted in preparedness score
  - No leaderboard integration

---

## Proposed Solution Architecture

### Phase 1: Module Tracking Enhancement

#### 1.1 Create Unified Module Tracking System

**Goal:** Track all module types (NDMA Interactive, NDRF, Hearing Impaired) uniformly.

**Implementation:**

1. **Create Module Completion Service**
   - Location: `mobile/lib/features/modules/services/module_completion_service.dart`
   - Purpose: Unified service to track module completion across all types
   - Methods:
     ```dart
     // Track video completion
     Future<void> markVideoCompleted(String moduleId, String videoId, String moduleType);
     
     // Track module completion (all videos watched)
     Future<void> markModuleCompleted(String moduleId, String moduleType);
     
     // Get module progress
     Future<ModuleProgress> getModuleProgress(String moduleId, String moduleType);
     
     // Submit quiz (for modules with quizzes)
     Future<QuizResult> submitQuiz(String moduleId, List<Map<String, dynamic>> answers);
     ```

2. **Create Module Progress Model**
   - Location: `mobile/lib/features/modules/models/module_progress_model.dart`
   - Structure:
     ```dart
     class ModuleProgress {
       final String moduleId;
       final String moduleType; // 'ndma', 'ndrf', 'hearing_impaired'
       final String language; // For NDRF modules
       final List<String> completedVideos;
       final bool isCompleted;
       final int pointsEarned;
       final DateTime? completedAt;
       final double progressPercentage;
     }
     ```

3. **Backend API Extensions**
   - **New Endpoint:** `POST /api/modules/progress`
     - Body: `{ moduleId, moduleType, language?, videoId?, action: 'video_complete' | 'module_complete' }`
     - Response: Updated progress, points earned, XP awarded
   - **New Endpoint:** `GET /api/modules/progress/:moduleId`
     - Query: `?moduleType=ndrf&language=Hindi`
     - Response: Current progress for the module

4. **Backend Model: ModuleProgress**
   - Location: `backend/src/models/ModuleProgress.js`
   - Schema:
     ```javascript
     {
       userId: ObjectId,
       moduleId: String,
       moduleType: String, // 'ndma', 'ndrf', 'hearing_impaired'
       language: String, // For NDRF modules
       completedVideos: [String], // Array of video IDs/titles
       isCompleted: Boolean,
       pointsEarned: Number,
       completedAt: Date,
       lastUpdated: Date
     }
     ```

#### 1.2 Integrate NDRF Module Tracking

**Implementation Steps:**

1. **Update `NdrfModuleDetailScreen`**
   - Add video completion tracking
   - Track when user watches a video (via `YoutubePlayerScreen`)
   - Mark video as completed after watching >80% of duration
   - Show progress indicator per video
   - Show overall module progress

2. **Video Completion Logic**
   ```dart
   // In YoutubePlayerScreen or NdrfModuleDetailScreen
   void _onVideoCompleted(String videoTitle, String language) {
     final moduleId = 'ndrf_${language}_${videoTitle}';
     moduleCompletionService.markVideoCompleted(
       moduleId: 'ndrf',
       videoId: videoTitle,
       moduleType: 'ndrf',
       language: language,
     );
   }
   ```

3. **Points/XP Calculation for NDRF**
   - **Per Video:** 10 points (watching a video)
   - **Module Completion:** 50 bonus points (all videos in a language watched)
   - **Total per Language:** ~300-350 points (23 videos × 10 + 50 bonus)
   - **XP Conversion:** 1 point = 1 XP (or use existing formula)

#### 1.3 Integrate Hearing Impaired Module Tracking

**Implementation Steps:**

1. **Update `HearingImpairedList` and detail screen**
   - Similar to NDRF tracking
   - Track video completion
   - Show progress indicators

2. **Points/XP Calculation**
   - **Per Video:** 10 points
   - **Module Completion:** 50 bonus points
   - **Total:** Depends on number of videos

#### 1.4 Update Preparedness Score Calculation

**Backend Changes (`preparednessScore.service.js`):**

```javascript
// Updated calculateModuleScore function
const calculateModuleScore = async (userId) => {
  // Get all module types
  const ndmaModules = await Module.countDocuments({ isActive: true, type: 'interactive' });
  const ndrfModules = await ModuleProgress.countDocuments({ 
    userId, 
    moduleType: 'ndrf', 
    isCompleted: true 
  });
  const hearingImpairedModules = await ModuleProgress.countDocuments({ 
    userId, 
    moduleType: 'hearing_impaired', 
    isCompleted: true 
  });
  
  const totalModules = ndmaModules + ndrfModules + hearingImpairedModules;
  const completedModules = 
    (user.progress?.completedModules?.length || 0) + // NDMA interactive
    ndrfModules + 
    hearingImpairedModules;
  
  if (totalModules === 0) return 100;
  const completionRate = (completedModules / totalModules) * 100;
  return Math.min(100, Math.round(completionRate));
};
```

---

### Phase 2: Game Tracking Enhancement

#### 2.1 Integrate New Games with Backend

**Goal:** All games (old and new) should submit scores to backend and earn XP.

**Implementation:**

1. **Update Game Types in Backend**
   - **File:** `backend/src/models/GameScore.js`
   - **Change:** Update `gameType` enum to include:
     ```javascript
     enum: [
       'bag-packer', 
       'hazard-hunter', 
       'earthquake-shake', 
       'punjab-safety-game',
       'school-safety-quiz',
       'flood-escape',
       'school-runner',
       'manual-xp-assignment'
     ]
     ```

2. **Update Game Service Calls**
   - **File:** `mobile/lib/features/games/services/game_service.dart`
   - **Action:** Ensure all games use `GameService.submitScore()`
   - **Current Issue:** New games don't call this service

3. **Update Each New Game**

   **A. Punjab Safety Game**
   - **File:** `mobile/lib/features/games/screens/punjab_safety_game.dart`
   - **Changes:**
     ```dart
     // After game ends, submit score
     void _onGameEnd(int finalScore) async {
       final gameScore = GameScore(
         gameType: 'punjab-safety-game',
         score: finalScore,
         maxScore: 1000, // Or calculate based on max possible
         level: 1,
         difficulty: 'medium',
         itemsCorrect: _session.totalScore,
         itemsIncorrect: 0,
         timeTaken: _calculateTimeTaken(),
         xpEarned: 0, // Will be calculated by backend
       );
       
       final gameService = GameService();
       await gameService.submitScore(gameScore);
       
       // Trigger preparedness score update
       ref.read(preparednessScoreProvider.notifier).recalculateScore();
     }
     ```

   **B. School Safety Quiz Game**
   - **File:** `mobile/lib/features/games/screens/school_safety_quiz_game.dart`
   - **Similar changes as Punjab Safety Game**
   - `gameType: 'school-safety-quiz'`

   **C. Flood Escape Game**
   - **File:** `mobile/lib/features/games/screens/flood_escape_game.dart`
   - **Similar changes**
   - `gameType: 'flood-escape'`
   - Track level, difficulty, time taken

   **D. School Runner Game**
   - **File:** `mobile/lib/features/games/screens/school_runner_game.dart`
   - **Similar changes**
   - `gameType: 'school-runner'`
   - Track level, difficulty, time taken

4. **Update GameManager**
   - **File:** `mobile/lib/managers/game_manager.dart`
   - **Changes:**
     - Remove local-only tracking
     - Integrate with `GameService` for all score submissions
     - Keep local cache for offline support

#### 2.2 XP Calculation for New Games

**Backend (`GameScore.calculateXP()`):**

```javascript
gameScoreSchema.methods.calculateXP = function() {
  const baseXP = Math.floor(this.score / 10);
  const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 };
  const multiplier = difficultyMultiplier[this.difficulty] || 1;
  let xp = Math.floor(baseXP * multiplier);
  
  // Perfect score bonus
  if (this.maxScore > 0 && this.score >= this.maxScore) {
    xp += 50;
  }
  
  // Time bonus
  if (this.timeTaken && this.timeTaken < 60) {
    xp += 10;
  }
  
  // Game-specific bonuses
  if (this.gameType === 'punjab-safety-game' || this.gameType === 'school-safety-quiz') {
    // AI-driven games: bonus for high scores
    if (this.score >= 800) xp += 25;
  }
  
  if (this.gameType === 'flood-escape' || this.gameType === 'school-runner') {
    // Action games: bonus for level completion
    if (this.level > 5) xp += (this.level - 5) * 5;
  }
  
  this.xpEarned = xp;
  return xp;
};
```

---

### Phase 3: Points and XP System

#### 3.1 Unified Points/XP System

**Goal:** All activities (modules, games, quizzes) award points and XP consistently.

**Points Structure:**

| Activity | Points | XP Conversion |
|----------|--------|---------------|
| Watch NDMA Video | 5 | 1:1 |
| Complete NDMA Module (with quiz) | 100 | 1:1 |
| Watch NDRF Video | 10 | 1:1 |
| Complete NDRF Language Module | 50 bonus | 1:1 |
| Watch Hearing Impaired Video | 10 | 1:1 |
| Complete Hearing Impaired Module | 50 bonus | 1:1 |
| Play Game (base) | Score/10 | Score/10 |
| Perfect Game Score | +50 bonus | +50 |
| Complete Quiz | Score/10 | Score/10 |
| Pass Quiz (>70%) | +20 bonus | +20 |

**Backend Model: User Points/XP**
- Already exists in `User.progress`
- Fields: `points`, `xp`, `totalXP`
- Update on every activity completion

#### 3.2 Level Progression System

**Goal:** Students level up based on XP earned.

**Level Formula:**
```
Level = floor(sqrt(totalXP / 100)) + 1
```

**Example:**
- 0-99 XP: Level 1
- 100-399 XP: Level 2
- 400-899 XP: Level 3
- 900-1599 XP: Level 4
- etc.

**Implementation:**
- Backend: Calculate level on XP update
- Frontend: Display level badge, progress to next level

---

### Phase 4: Completion Rate Tracking

#### 4.1 Module Completion Rates

**Tracking Metrics:**
1. **Per Module Type:**
   - NDMA Interactive: X/Y completed
   - NDRF (per language): X/Y videos watched
   - Hearing Impaired: X/Y videos watched

2. **Overall Completion:**
   - Total modules available vs. completed
   - Percentage calculation

**Backend Endpoint:**
```
GET /api/users/:userId/progress
Response: {
  modules: {
    ndma: { completed: 5, total: 10, percentage: 50 },
    ndrf: { completed: 2, total: 13, percentage: 15.4 },
    hearing_impaired: { completed: 1, total: 5, percentage: 20 }
  },
  overall: { completed: 8, total: 28, percentage: 28.6 }
}
```

#### 4.2 Game Completion Rates

**Tracking Metrics:**
- Games played per game type
- Average score per game type
- Best score per game type
- Total games played

**Backend Endpoint:**
```
GET /api/users/:userId/game-stats
Response: {
  totalGames: 25,
  byType: {
    'punjab-safety-game': { played: 5, avgScore: 750, bestScore: 950 },
    'school-runner': { played: 10, avgScore: 1200, bestScore: 2500 },
    ...
  }
}
```

---

### Phase 5: UI/UX Updates

#### 5.1 Progress Indicators

**Add to All Module Screens:**
- Progress bar showing completion percentage
- Checkmarks on completed videos
- "Completed" badge on finished modules
- Points/XP earned display

**Add to All Game Screens:**
- XP earned after game completion
- Level progress indicator
- Leaderboard position (if applicable)

#### 5.2 Dashboard Updates

**Home Screen:**
- Show total modules completed
- Show total games played
- Show current level and XP
- Show preparedness score breakdown

**Profile Screen:**
- Detailed progress statistics
- Module completion by type
- Game statistics
- Achievement badges

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create `ModuleCompletionService`
- [ ] Create `ModuleProgress` model (backend)
- [ ] Create backend API endpoints for module progress
- [ ] Update `NdrfModuleDetailScreen` with tracking
- [ ] Update `HearingImpairedList` with tracking

### Phase 2: Game Integration (Week 1-2)
- [ ] Update backend `GameScore` model with new game types
- [ ] Integrate `GameService` into all new games
- [ ] Update XP calculation for new games
- [ ] Test score submission for all games

### Phase 3: Points & XP (Week 2)
- [ ] Implement unified points/XP system
- [ ] Update user progress on all activities
- [ ] Implement level progression
- [ ] Add level display to UI

### Phase 4: Preparedness Score (Week 2-3)
- [ ] Update `calculateModuleScore` to include all module types
- [ ] Update `calculateGameScore` to include all game types
- [ ] Test preparedness score calculation
- [ ] Verify score updates in real-time

### Phase 5: UI Updates (Week 3)
- [ ] Add progress indicators to all module screens
- [ ] Add XP/points display to game completion screens
- [ ] Update dashboard with new statistics
- [ ] Update profile screen with detailed progress

### Phase 6: Testing & Refinement (Week 3-4)
- [ ] End-to-end testing of all tracking
- [ ] Verify offline sync works
- [ ] Performance testing
- [ ] Bug fixes and refinements

---

## Database Schema Changes

### New Collections

**ModuleProgress**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  moduleId: String,
  moduleType: String, // 'ndma', 'ndrf', 'hearing_impaired'
  language: String?, // For NDRF modules
  completedVideos: [String],
  isCompleted: Boolean,
  pointsEarned: Number,
  xpEarned: Number,
  completedAt: Date?,
  lastUpdated: Date,
  createdAt: Date
}
```

**Indexes:**
- `{ userId: 1, moduleId: 1, moduleType: 1 }` (unique)
- `{ userId: 1, moduleType: 1, isCompleted: 1 }`
- `{ userId: 1, completedAt: -1 }`

### Updated Collections

**User.progress**
- Already has: `completedModules[]`, `points`, `xp`, `totalXP`
- Add: `level` (calculated from totalXP)
- Add: `moduleProgress` (summary stats)

**GameScore**
- Update `gameType` enum to include new games
- No other changes needed

---

## Migration Strategy

### For Existing Users

1. **Module Progress Migration:**
   - Scan existing `user.progress.completedModules[]`
   - Create `ModuleProgress` entries for completed NDMA modules
   - Set `isCompleted: true` for these modules

2. **Game Score Migration:**
   - No migration needed (new games start fresh)

3. **Preparedness Score Recalculation:**
   - Trigger recalculation for all users after migration
   - This will include new modules/games in the calculation

---

## Testing Checklist

### Module Tracking
- [ ] NDMA module completion tracked
- [ ] NDRF video completion tracked (all languages)
- [ ] NDRF module completion tracked (all videos in language)
- [ ] Hearing Impaired video completion tracked
- [ ] Points/XP awarded correctly
- [ ] Progress indicators update in real-time
- [ ] Offline completion syncs when online

### Game Tracking
- [ ] Punjab Safety Game scores submitted
- [ ] School Safety Quiz scores submitted
- [ ] Flood Escape scores submitted
- [ ] School Runner scores submitted
- [ ] XP calculated correctly for all games
- [ ] Leaderboard updated
- [ ] Offline scores sync when online

### Preparedness Score
- [ ] Includes NDMA modules
- [ ] Includes NDRF modules (all languages)
- [ ] Includes Hearing Impaired modules
- [ ] Includes all game types
- [ ] Updates in real-time after activities
- [ ] Breakdown shows correct percentages

### UI/UX
- [ ] Progress bars show correct percentages
- [ ] Completion badges appear correctly
- [ ] Points/XP display correctly
- [ ] Level progression displays correctly
- [ ] Dashboard statistics accurate

---

## Risk Assessment

### High Risk
1. **Data Migration:** Existing user progress must be preserved
   - **Mitigation:** Comprehensive backup before migration, rollback plan

2. **Performance:** Tracking every video watch could be expensive
   - **Mitigation:** Batch updates, debounce video completion events

### Medium Risk
1. **Offline Sync:** Complex sync logic for module progress
   - **Mitigation:** Use existing offline sync infrastructure

2. **Backward Compatibility:** Old modules must continue working
   - **Mitigation:** Maintain old API endpoints, gradual migration

### Low Risk
1. **UI Updates:** Cosmetic changes
   - **Mitigation:** Incremental rollout, A/B testing

---

## Success Metrics

1. **Tracking Coverage:**
   - 100% of modules tracked (NDMA, NDRF, Hearing Impaired)
   - 100% of games tracked (old + new)

2. **User Engagement:**
   - Increase in module completion rates
   - Increase in game play frequency
   - Increase in preparedness scores

3. **System Performance:**
   - <500ms response time for progress updates
   - 99.9% sync success rate
   - Zero data loss

---

## Open Questions

1. **Quiz Integration for NDRF/Hearing Impaired:**
   - Should we add quizzes to these modules?
   - If yes, when? (Phase 1 or later?)

2. **Video Completion Threshold:**
   - What percentage of video must be watched to count as "completed"?
   - Proposed: 80% of video duration

3. **Points Balancing:**
   - Are the proposed point values fair?
   - Should different module types have different point values?

4. **Level Cap:**
   - Should there be a maximum level?
   - Proposed: Level 100 (requires 1,000,000 XP)

---

## Next Steps

1. **Review this plan** with the team
2. **Get approval** for the proposed architecture
3. **Clarify open questions** before implementation
4. **Create detailed technical specifications** for each phase
5. **Begin Phase 1 implementation** after confirmation

---

## Appendix

### A. File Structure

```
mobile/lib/features/modules/
├── services/
│   ├── module_completion_service.dart (NEW)
│   └── module_service.dart (UPDATE)
├── models/
│   ├── module_progress_model.dart (NEW)
│   └── module_model.dart (EXISTING)
└── screens/
    ├── ndrf_module_detail_screen.dart (UPDATE)
    └── hearing_impaired_list.dart (UPDATE)

mobile/lib/features/games/
├── services/
│   └── game_service.dart (UPDATE)
└── screens/
    ├── punjab_safety_game.dart (UPDATE)
    ├── school_safety_quiz_game.dart (UPDATE)
    ├── flood_escape_game.dart (UPDATE)
    └── school_runner_game.dart (UPDATE)

backend/src/
├── models/
│   ├── ModuleProgress.js (NEW)
│   └── GameScore.js (UPDATE)
├── controllers/
│   ├── module.controller.js (UPDATE)
│   └── game.controller.js (UPDATE)
└── services/
    └── preparednessScore.service.js (UPDATE)
```

### B. API Endpoints

**New Endpoints:**
- `POST /api/modules/progress` - Track module/video completion
- `GET /api/modules/progress/:moduleId` - Get module progress
- `GET /api/users/:userId/progress` - Get overall progress
- `GET /api/users/:userId/game-stats` - Get game statistics

**Updated Endpoints:**
- `POST /api/modules/:id/complete` - Already exists, may need updates
- `POST /api/games/scores` - Already exists, supports new game types
- `GET /api/preparedness-score/:userId` - Already exists, will include new data

---

**End of Document**

