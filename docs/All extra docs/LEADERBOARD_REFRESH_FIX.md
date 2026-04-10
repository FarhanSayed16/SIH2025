# Leaderboard Screen Auto-Refresh Fix

## ✅ Problem Identified

The `LeaderboardScreen` was auto-refreshing constantly, causing:
- Screen flickering
- Endless API calls
- Poor user experience

**Root Cause:** The `_buildLeaderboardContent()` method was calling `loadLeaderboard()` inside the `build()` method. Every time the state changed (e.g., `isLoading` becomes true), it triggered a rebuild, which called `build()` again, potentially triggering another load → **infinite loop**.

## ✅ Fixes Applied

### 1. **Removed Fetch Logic from `build()` Method**

**File:** `mobile/lib/features/leaderboard/screens/leaderboard_screen.dart`

**Before:**
```dart
Widget _buildLeaderboardContent(String type) {
  // ... state watching ...
  
  // ❌ BAD: Fetching in build() causes rebuild loop
  if (cacheKey != currentCacheKey && !leaderboardState.isLoading) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(leaderboardProvider.notifier).loadLeaderboard(...);
    });
  }
  
  // ... rest of UI ...
}
```

**After:**
```dart
Widget _buildLeaderboardContent(String type) {
  final leaderboardState = ref.watch(leaderboardProvider);
  final authState = ref.watch(authProvider);
  final currentUserId = authState.user?.id;
  
  // ✅ GOOD: build() only watches state, never triggers fetches
  // Data loading is handled only in:
  // 1. initState() - initial load
  // 2. _onTabChanged() - when user switches tabs
  // 3. Refresh button/RefreshIndicator - manual refresh
  
  // ... rest of UI (only displays state) ...
}
```

### 2. **Optimized Tab Change Handler**

**File:** `mobile/lib/features/leaderboard/screens/leaderboard_screen.dart`

**Enhanced `_onTabChanged()` method:**
- Added cache key checking to avoid unnecessary loads
- Only loads if the tab's data isn't already cached
- Prevents duplicate API calls when switching between tabs

```dart
void _onTabChanged() {
  if (!_tabController.indexIsChanging) {
    // ... get type and gameType ...
    
    // Check if we already have data for this type
    final currentState = ref.read(leaderboardProvider);
    final cacheKey = type == 'games' ? '$type-$gameType' : type;
    final currentCacheKey = currentState.currentType == 'games' 
        ? '${currentState.currentType}-${currentState.currentGameType}'
        : currentState.currentType;

    // Only load if we don't have this type cached
    if (cacheKey != currentCacheKey || currentState.leaderboard == null) {
      ref.read(leaderboardProvider.notifier).loadLeaderboard(...);
    }
  }
}
```

### 3. **Verified Refresh Mechanisms**

✅ **Refresh Button** (AppBar):
- Already uses `forceRefresh: true` ✅
- Located at line 99-112
- Works correctly

✅ **RefreshIndicator** (Pull-to-refresh):
- Already uses `forceRefresh: true` ✅
- Located at line 234-244
- Works correctly

✅ **Initial Load** (`initState`):
- Loads once when screen opens ✅
- Located at line 72-79
- Uses `WidgetsBinding.instance.addPostFrameCallback` to ensure proper timing

## Data Loading Flow (After Fix)

```
Screen Opens
    ↓
initState() → _loadInitialLeaderboard() → loadLeaderboard(forceRefresh: false)
    ↓
build() → Only watches state, displays UI
    ↓
User Switches Tab
    ↓
_onTabChanged() → Checks cache → loadLeaderboard() only if needed
    ↓
User Pulls to Refresh OR Clicks Refresh Button
    ↓
loadLeaderboard(forceRefresh: true) → Always fetches fresh data
```

## Provider Verification

✅ **LeaderboardProvider** (`leaderboard_provider.dart`):
- No loops in state updates
- Cache checking prevents duplicate loads (5-minute cache)
- State updates don't trigger additional fetches
- `isLoading` changes don't cause rebuild loops

## Result

✅ **Stable:** Screen loads once when opened  
✅ **Manual Refresh Only:** Updates only when:
  - User pulls to refresh
  - User clicks refresh button
  - User switches tabs (only if data not cached)
✅ **No Flickering:** No constant rebuilds  
✅ **No Endless API Calls:** Controlled, intentional fetches only  

---

**Status:** ✅ Fixed - Ready for testing

