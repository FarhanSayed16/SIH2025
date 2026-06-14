# Phase 3.3.2: Mobile Implementation Plan

**Date**: 2025-01-27  
**Status**: 🚧 **READY TO START**

---

## 🎯 **Implementation Goals**

1. **Per-Student Tracking UI** - Screen to view individual student scores
2. **Shared XP Distribution UI** - Display XP distribution in class mode
3. **Student Assignment Enhancements** - Verify/enhance existing system
4. **Badge Assignment UI** - Prepare for Phase 3.3.3

---

## 📋 **Mobile Tasks**

### **1. Create Adaptive Scoring Service** ⏳
**File**: `mobile/lib/features/adaptive_scoring/services/adaptive_scoring_service.dart`

- Methods:
  - `getPerStudentScores(classId, filters)`
  - `getSharedXPDistribution(classId, filters)`
  - `getAggregatedStudentScores(studentId)`
  - `distributeSharedXP(classId, moduleId, xpAmount)`

### **2. Create Models** ⏳
**File**: `mobile/lib/features/adaptive_scoring/models/adaptive_scoring_models.dart`

- Models:
  - `StudentScore`
  - `SharedXPDistribution`
  - `AggregatedStudentScores`

### **3. Create Providers** ⏳
**File**: `mobile/lib/features/adaptive_scoring/providers/adaptive_scoring_provider.dart`

- Providers:
  - `adaptiveScoringServiceProvider`
  - `perStudentScoresProvider`
  - `sharedXPDistributionProvider`
  - `aggregatedStudentScoresProvider`

### **4. Per-Student Tracking Screen** ⏳
**File**: `mobile/lib/features/adaptive_scoring/screens/per_student_scores_screen.dart`

- Features:
  - List of students with scores
  - Filter by game type, date range
  - Score breakdown per student
  - Recent games/quizzes

### **5. Shared XP Distribution Screen** ⏳
**File**: `mobile/lib/features/adaptive_scoring/screens/shared_xp_screen.dart`

- Features:
  - XP distribution history
  - Visual indicators for shared XP
  - Distribution summary
  - Filter by activity type, date range

### **6. Update Module Completion** ⏳
**Files**: 
- `mobile/lib/features/modules/screens/quiz_screen.dart`
- `mobile/lib/features/modules/services/module_service.dart`

- Features:
  - Add class mode toggle
  - Support `isClassMode` and `classId` parameters
  - Trigger shared XP distribution on completion

### **7. Update Home Screen** ⏳
**File**: `mobile/lib/features/dashboard/screens/home_screen.dart`

- Features:
  - Link to per-student scores (for teachers)
  - Link to shared XP distribution
  - Show aggregated scores

---

## 🔧 **Implementation Order**

1. **Service Layer** (30 min)
   - Create adaptive scoring service
   - Create models
   - Create providers

2. **Per-Student Tracking UI** (2-3 hours)
   - Create screen
   - Add filters
   - Display scores

3. **Shared XP Distribution UI** (2 hours)
   - Create screen
   - Display history
   - Add visual indicators

4. **Integration** (1 hour)
   - Update module completion
   - Update home screen
   - Add navigation

---

## ✅ **Success Criteria**

- ✅ Teachers can view per-student scores
- ✅ Shared XP distribution is visible
- ✅ Module completion supports class mode
- ✅ All API endpoints are properly integrated
- ✅ UI is user-friendly and responsive

---

**Ready to begin mobile implementation!** 🚀

