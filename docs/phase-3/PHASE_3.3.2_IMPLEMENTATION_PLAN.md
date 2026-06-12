# Phase 3.3.2: Adaptive Scoring - Implementation Plan

**Date**: 2025-01-27  
**Status**: 🚧 **READY TO START**

---

## 🎯 **Overview**

**Goal**: Enable per-student scoring and tracking on shared devices, ensuring scores and achievements are correctly attributed to individual students even when multiple students use the same device.

**Why Critical**: 
- Shared device scenarios (KG-5 students use teacher-led tablets)
- Scores must be per-student, not per-device
- Modules completed in Class Mode should distribute shared XP
- Badges must be awarded only when specific child participates

---

## ✅ **What's Already Implemented**

### **Existing Features:**
1. ✅ **Student Assignment Dialog** - Already exists with QR scanning
2. ✅ **Group Mode** - Games support group mode with student assignment
3. ✅ **GroupActivity Model** - Tracks participants with studentId
4. ✅ **Game Scores** - Already support `userId` field
5. ✅ **Preparedness Score** - Calculates per-user

### **What Works:**
- ✅ Games can assign scores to specific students in group mode
- ✅ GroupActivity tracks which student played each turn
- ✅ Student assignment via dialog and QR scanning

---

## 📋 **What Needs to Be Implemented**

### **Backend Tasks**

#### **1. Per-Student Score Tracking Enhancement** ✅ (Mostly Done)
**Status**: GameScore already has `userId` field

**Verify/Enhance**:
- [ ] Ensure all game scores store `userId` correctly
- [ ] Verify quiz results store `userId` 
- [ ] Verify module completions store `userId`
- [ ] Add validation to ensure userId is present for individual scores

#### **2. Student Assignment API** ✅ (Exists via GroupActivity)
**Status**: Group activity endpoints exist

**Verify/Enhance**:
- [ ] Review existing `/group-activities/create` endpoint
- [ ] Verify `/group-activities/submit` handles student assignment
- [ ] Add dedicated student assignment endpoint if needed
- [ ] Document student assignment flow

#### **3. Shared XP Distribution** ❌ (Not Implemented)
**Status**: Not implemented

**Required**:
- [ ] Design shared XP logic for class mode
- [ ] Create service to distribute XP to all class students
- [ ] Trigger shared XP on module completion in class mode
- [ ] Add endpoint to distribute shared XP

#### **4. Multi-Source Score Aggregation** ❌ (Partially Implemented)
**Status**: Preparedness score only looks at individual activities

**Required**:
- [ ] Enhance preparedness score to include group activity scores
- [ ] Aggregate scores from individual + group activities
- [ ] Update score calculation service
- [ ] Test multi-source aggregation

---

### **Mobile Tasks**

#### **1. Student Assignment System** ✅ (Already Exists)
**Status**: StudentAssignmentDialog with QR scanning exists

**Enhancements**:
- [ ] Verify it works for all game types
- [ ] Add student assignment to module completion in class mode
- [ ] Improve UI/UX if needed

#### **2. Per-Student Tracking UI** ❌ (Not Implemented)
**Status**: No UI to view per-student scores

**Required**:
- [ ] Create student score tracking screen
- [ ] Show individual student scores
- [ ] Display score breakdown per student
- [ ] Add filter by student

#### **3. Shared XP UI** ❌ (Not Implemented)
**Status**: No UI to show shared XP distribution

**Required**:
- [ ] Create shared XP display component
- [ ] Show XP distribution in class mode
- [ ] Add visual indicator for shared XP
- [ ] Display XP distribution summary

#### **4. Badge Assignment UI** ❌ (Not Implemented)
**Status**: Badge system not implemented yet (Phase 3.3.3)

**Required** (Can prepare for Phase 3.3.3):
- [ ] Design badge assignment UI
- [ ] Create badge display component
- [ ] Add badge notification system

---

## 🔧 **Implementation Strategy**

### **Phase 1: Backend Foundation** (Priority 1)

1. **Verify Score Attribution** (1-2 hours)
   - Check all score models store userId correctly
   - Verify game scores include userId in group mode
   - Add validation if needed

2. **Implement Shared XP Distribution** (4-6 hours)
   - Create shared XP service
   - Add distribution logic for class mode
   - Integrate with module completion

3. **Enhance Multi-Source Aggregation** (4-6 hours)
   - Update preparedness score calculation
   - Include group activity scores
   - Test aggregation logic

### **Phase 2: Mobile UI** (Priority 2)

1. **Per-Student Tracking UI** (6-8 hours)
   - Create student score tracking screen
   - Display individual scores
   - Add filtering options

2. **Shared XP UI** (4-6 hours)
   - Create shared XP component
   - Display XP distribution
   - Add visual indicators

3. **Badge Assignment UI** (4-6 hours)
   - Prepare for Phase 3.3.3
   - Create badge components
   - Design badge display

### **Phase 3: Testing** (Priority 3)

1. **Unit Tests** (4-6 hours)
   - Test shared XP distribution
   - Test multi-source aggregation
   - Test score attribution

2. **Integration Tests** (4-6 hours)
   - Test full flow with multiple students
   - Test shared XP in class mode
   - Test score aggregation

---

## 📊 **Estimated Timeline**

**Total**: 1-2 weeks

- **Backend**: 1-2 days
- **Mobile UI**: 2-3 days  
- **Testing**: 1-2 days

---

## ✅ **Success Criteria**

1. ✅ Scores are correctly attributed to individual students
2. ✅ Shared XP is distributed in class mode
3. ✅ Preparedness scores aggregate from multiple sources
4. ✅ UI shows per-student tracking
5. ✅ UI displays shared XP distribution

---

## 🚀 **Next Steps**

1. Review existing implementation
2. Start with backend foundation
3. Implement shared XP distribution
4. Enhance score aggregation
5. Build mobile UI components
6. Test thoroughly

---

**Ready to begin implementation!** 🎯

