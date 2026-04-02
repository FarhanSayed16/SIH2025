# Auto-Refresh Progress Tracking - Implementation Plan

## 📋 Overview

Implement automatic data refresh for student progress on both **Parent** and **Teacher** screens, ensuring data is always up-to-date without manual refresh.

---

## 🎯 Goals

1. **Auto-Refresh Progress Data**: Parents and teachers see updated scores automatically
2. **Periodic Updates**: Data refreshes every 30-60 seconds
3. **Background Refresh**: Updates happen in background, no user action needed
4. **Fresh Data on View**: Data is always current when viewing progress screens
5. **Efficient Polling**: Smart refresh intervals to avoid unnecessary API calls

---

## 📊 Current State Analysis

### ✅ What Exists

#### Backend
- ✅ **Preparedness Score Service**: Calculates scores correctly
- ✅ **Parent Service**: `getChildProgress()` - Returns progress data
- ✅ **Teacher Service**: `getStudentProgress()` - Returns class progress
- ✅ **API Endpoints**: All endpoints exist and work

#### Web
- ✅ **Parent Dashboard**: Has polling for status (30s), but NOT for progress
- ✅ **Parent Child Detail**: Loads once, no auto-refresh
- ✅ **Teacher Class Detail**: Loads once, no auto-refresh
- ✅ **Teacher Student Detail**: Loads once, no auto-refresh

#### Mobile
- ✅ **Parent Dashboard**: Has polling for status (30s), but NOT for progress
- ✅ **Parent Child Detail**: Uses Riverpod providers, but no auto-refresh
- ✅ **Teacher Progress Screen**: Loads once, no auto-refresh

### ❌ What's Missing

#### Web
- ❌ **No Progress Auto-Refresh**: Progress data doesn't refresh automatically
- ❌ **No Background Updates**: Data only loads on page load
- ❌ **Stale Data**: Progress can be outdated

#### Mobile
- ❌ **No Progress Auto-Refresh**: Progress providers don't auto-refresh
- ❌ **No Background Updates**: Data only loads on screen open
- ❌ **Stale Data**: Progress can be outdated

---

## 🔧 Implementation Plan

### **Phase 1: Backend - Ensure Data is Fresh** ✅

**Status**: Backend already calculates scores correctly. No changes needed.

**Verification**:
- ✅ Score recalculation works
- ✅ Progress data is accurate
- ✅ API endpoints return latest data

---

### **Phase 2: Web - Auto-Refresh Implementation** ⭐ **CRITICAL**

#### 2.1 Update Parent Dashboard

**File**: `web/app/parent/dashboard/page.tsx`

**Changes**:
- Add `useEffect` hook with `setInterval` for progress refresh
- Refresh child progress every 30-60 seconds
- Update child cards when progress changes
- Show subtle indicator when refreshing

**Implementation**:
```typescript
useEffect(() => {
  // Refresh progress every 30 seconds
  const interval = setInterval(() => {
    loadChildProgress(); // Refresh all children's progress
  }, 30000);
  
  return () => clearInterval(interval);
}, []);
```

#### 2.2 Update Parent Child Detail Page

**File**: `web/app/parent/children/[studentId]/page.tsx`

**Changes**:
- Add auto-refresh for child progress
- Refresh every 30 seconds
- Update all tabs (overview, progress, drills, attendance)
- Show loading indicator during refresh

**Implementation**:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    loadChildDetails();
    if (activeTab === 'drills') loadDrills();
    if (activeTab === 'attendance') loadAttendance();
  }, 30000);
  
  return () => clearInterval(interval);
}, [activeTab, studentId]);
```

#### 2.3 Update Teacher Class Detail Page

**File**: `web/app/teacher/classes/[classId]/page.tsx`

**Changes**:
- Add auto-refresh for student progress
- Refresh every 30-60 seconds
- Update student progress table
- Update summary cards
- Refresh on "Performance" tab

**Implementation**:
```typescript
useEffect(() => {
  if (activeTab === 'performance') {
    const interval = setInterval(() => {
      loadStudentProgress();
    }, 30000);
    
    return () => clearInterval(interval);
  }
}, [activeTab, classId]);
```

#### 2.4 Update Teacher Student Detail Page

**File**: `web/app/teacher/classes/[classId]/students/[studentId]/page.tsx`

**Changes**:
- Add auto-refresh for individual student progress
- Refresh every 30 seconds
- Update all performance metrics
- Update charts

**Implementation**:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    loadStudentDetails();
  }, 30000);
  
  return () => clearInterval(interval);
}, [studentId]);
```

#### 2.5 Create Auto-Refresh Hook (Optional)

**New File**: `web/lib/hooks/useAutoRefresh.ts`

**Features**:
- Reusable hook for auto-refresh
- Configurable interval
- Pause when tab is not visible
- Cleanup on unmount

---

### **Phase 3: Mobile - Auto-Refresh Implementation** ⭐ **CRITICAL**

#### 3.1 Update Parent Dashboard

**File**: `mobile/lib/features/parent/screens/parent_dashboard_screen.dart`

**Changes**:
- Add `Timer` for progress refresh (separate from status refresh)
- Refresh child progress every 30 seconds
- Invalidate Riverpod providers to trigger refresh
- Update child cards when progress changes

**Implementation**:
```dart
Timer? _progressRefreshTimer;

@override
void initState() {
  super.initState();
  // Existing status refresh timer...
  
  // Add progress refresh timer
  _progressRefreshTimer = Timer.periodic(
    const Duration(seconds: 30),
    (_) {
      if (mounted) {
        ref.invalidate(childDetailsProvider); // Refresh all children
      }
    },
  );
}

@override
void dispose() {
  _progressRefreshTimer?.cancel();
  super.dispose();
}
```

#### 3.2 Update Parent Child Detail Screen

**File**: `mobile/lib/features/parent/screens/child_detail_screen.dart`

**Changes**:
- Add auto-refresh timer
- Refresh child details every 30 seconds
- Invalidate providers to trigger refresh
- Update all tabs automatically

**Implementation**:
```dart
Timer? _refreshTimer;

@override
void initState() {
  super.initState();
  _refreshTimer = Timer.periodic(
    const Duration(seconds: 30),
    (_) {
      if (mounted) {
        ref.invalidate(childDetailsProvider(widget.studentId));
        ref.invalidate(childDrillsProvider(widget.studentId));
        // Refresh other providers as needed
      }
    },
  );
}
```

#### 3.3 Update Teacher Progress Screen

**File**: `mobile/lib/features/teacher/screens/student_progress_screen.dart`

**Changes**:
- Add auto-refresh timer
- Refresh progress every 30-60 seconds
- Update student list when data changes
- Show loading indicator during refresh

**Implementation**:
```dart
Timer? _refreshTimer;

@override
void initState() {
  super.initState();
  _loadProgress();
  
  _refreshTimer = Timer.periodic(
    const Duration(seconds: 30),
    (_) {
      if (mounted) {
        _loadProgress();
      }
    },
  );
}
```

#### 3.4 Update Teacher Class Management Screen

**File**: `mobile/lib/features/teacher/screens/class_management_screen.dart`

**Changes**:
- Add auto-refresh for student list
- Refresh every 30 seconds
- Update when returning to screen

**Implementation**:
```dart
@override
void didChangeDependencies() {
  super.didChangeDependencies();
  // Refresh when screen becomes visible
  WidgetsBinding.instance.addPostFrameCallback((_) {
    ref.read(teacherProvider.notifier).selectClass(classId);
  });
}

// Add timer for periodic refresh
Timer? _refreshTimer;

@override
void initState() {
  super.initState();
  _refreshTimer = Timer.periodic(
    const Duration(seconds: 30),
    (_) {
      if (mounted) {
        ref.read(teacherProvider.notifier).selectClass(classId);
      }
    },
  );
}
```

---

## 📁 Files to Modify

### Web (4 files)
1. `web/app/parent/dashboard/page.tsx` - Add progress refresh
2. `web/app/parent/children/[studentId]/page.tsx` - Add auto-refresh
3. `web/app/teacher/classes/[classId]/page.tsx` - Add progress refresh
4. `web/app/teacher/classes/[classId]/students/[studentId]/page.tsx` - Add auto-refresh

### Mobile (4 files)
1. `mobile/lib/features/parent/screens/parent_dashboard_screen.dart` - Add progress refresh
2. `mobile/lib/features/parent/screens/child_detail_screen.dart` - Add auto-refresh
3. `mobile/lib/features/teacher/screens/student_progress_screen.dart` - Add auto-refresh
4. `mobile/lib/features/teacher/screens/class_management_screen.dart` - Add refresh

### Backend (0 files)
- ✅ No changes needed - backend already works correctly

---

## ⚙️ Refresh Strategy

### Refresh Intervals

**Parent Dashboard**:
- Status: Every 30 seconds (already exists)
- Progress: Every 30 seconds (NEW)

**Parent Child Detail**:
- Progress: Every 30 seconds (NEW)
- Drills: Every 60 seconds (when on drills tab)
- Attendance: Every 60 seconds (when on attendance tab)

**Teacher Class Detail**:
- Student Progress: Every 30 seconds (when on performance tab)
- Pending/Approved: Every 60 seconds (when on those tabs)

**Teacher Student Detail**:
- Progress: Every 30 seconds (NEW)

### Smart Refresh Logic

1. **Pause on Tab Switch**: Don't refresh inactive tabs
2. **Pause on Background**: Don't refresh when app is in background (mobile)
3. **Resume on Focus**: Refresh immediately when screen becomes active
4. **Debounce**: Prevent multiple simultaneous refreshes

---

## 🎯 Success Criteria

1. ✅ Parents see updated child progress within 30 seconds
2. ✅ Teachers see updated student progress within 30 seconds
3. ✅ No manual refresh needed
4. ✅ Data is always fresh when viewing
5. ✅ Efficient API usage (not too frequent)
6. ✅ Works on both web and mobile
7. ✅ Proper cleanup (no memory leaks)

---

## 🚨 Edge Cases & Error Handling

### 1. Network Errors
- **Solution**: Continue trying, show error indicator
- **Fallback**: Keep showing last known data

### 2. Screen Not Visible
- **Solution**: Pause refresh when tab/app is not active
- **Resume**: Refresh immediately when screen becomes active

### 3. Multiple Rapid Refreshes
- **Solution**: Debounce refresh calls
- **Prevent**: Block new refresh if one is in progress

### 4. Component Unmount
- **Solution**: Clear all timers in `dispose()`/`cleanup`
- **Prevent**: Check `mounted` before state updates

---

## 📊 Performance Considerations

### API Calls
- **Frequency**: 30-60 seconds (reasonable)
- **Batching**: Group multiple student updates if possible
- **Caching**: Use React Query / Riverpod caching

### Memory
- **Cleanup**: Always clear timers
- **Listeners**: Remove event listeners on unmount
- **State**: Don't accumulate stale data

---

## 🧪 Testing Checklist

- [ ] Parent dashboard refreshes progress automatically
- [ ] Parent child detail refreshes automatically
- [ ] Teacher class detail refreshes progress automatically
- [ ] Teacher student detail refreshes automatically
- [ ] Refresh pauses when tab is not active
- [ ] Refresh resumes when tab becomes active
- [ ] No memory leaks (timers cleaned up)
- [ ] No duplicate API calls
- [ ] Error handling works correctly
- [ ] Works on both web and mobile

---

## 📝 Implementation Order

### Priority 1: Parent Screens (High Visibility)
1. Parent dashboard progress refresh
2. Parent child detail auto-refresh

### Priority 2: Teacher Screens (High Visibility)
1. Teacher class detail progress refresh
2. Teacher student detail auto-refresh
3. Teacher progress screen auto-refresh

### Priority 3: Polish
1. Add loading indicators
2. Add error handling
3. Optimize refresh intervals

---

## ⏱️ Estimated Timeline

- **Phase 2 (Web)**: 2-3 hours
- **Phase 3 (Mobile)**: 2-3 hours
- **Testing & Polish**: 1 hour

**Total**: 5-7 hours

---

**Status**: 📋 **PLANNING COMPLETE - READY FOR IMPLEMENTATION**  
**Priority**: 🔥 **HIGH**  
**Complexity**: ⭐⭐ **LOW-MEDIUM** (Much simpler than WebSocket approach)

