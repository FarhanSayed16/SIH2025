# Phase 3.3.1: Preparedness Score - Complete Testing Guide

**Date**: 2025-01-27  
**Purpose**: Comprehensive testing of Preparedness Score Engine

---

## 🧪 **Testing Strategy**

### **1. Backend API Tests**
Automated tests for all score endpoints

### **2. Mobile UI Tests**
Manual testing of mobile app score features

### **3. Integration Tests**
End-to-end flow testing

---

## 📋 **BACKEND TESTING**

### **Prerequisites**
1. Backend server running (`npm run dev` in `backend/` directory)
2. MongoDB connected
3. Test user exists (admin@school.com / admin123)
4. Some activities completed (modules, games, quizzes) for score calculation

### **Run Backend Tests**

```bash
cd backend
node scripts/test-phase3.3.1.js
```

### **Test Coverage**

#### ✅ **Test 1: Health Check**
- Verifies server is running
- Checks database connection

#### ✅ **Test 2: Login**
- Authenticates test user
- Obtains auth token

#### ✅ **Test 3: Get Preparedness Score (Current User)**
- Fetches score for authenticated user
- Validates response structure
- Checks breakdown components

#### ✅ **Test 4: Get Preparedness Score (With UserId)**
- Fetches score for specific user ID
- Validates authorization

#### ✅ **Test 5: Recalculate Preparedness Score**
- Triggers score recalculation
- Validates updated score

#### ✅ **Test 6: Get Score History**
- Fetches score history
- Validates history array structure

#### ✅ **Test 7: Get Score History (With Limit)**
- Tests limit parameter
- Validates pagination

#### ✅ **Test 8: Unauthorized Access**
- Tests authentication requirements
- Validates error responses

#### ✅ **Test 9: Score Breakdown Validation**
- Validates all 5 components present
- Checks weight sum equals 100
- Validates score ranges (0-100)

#### ✅ **Test 10: Score Calculation After Activity**
- Tests score recalculation flow
- Compares before/after scores

---

## 📱 **MOBILE UI TESTING**

### **Prerequisites**
1. Mobile app installed and running
2. User logged in
3. Backend server accessible
4. Some activities completed (for score calculation)

### **Test Checklist**

#### **Test 1: HomeScreen Score Display**

**Steps**:
1. Open app and login
2. Navigate to Home screen
3. Observe preparedness score card

**Expected Results**:
- ✅ Score displays (not placeholder "78")
- ✅ Circular progress indicator shows score percentage
- ✅ Color coding: Red (<60), Orange (60-79), Green (≥80)
- ✅ Loading indicator appears briefly on first load
- ✅ No errors displayed

**If Score is 0 or Missing**:
- Complete some activities first (module, game, quiz)
- Tap refresh button
- Check backend logs for errors

---

#### **Test 2: Score Breakdown View**

**Steps**:
1. On HomeScreen, tap on score card
2. View score breakdown screen

**Expected Results**:
- ✅ Total score displayed prominently
- ✅ All 5 components shown:
  - Module Completion (40% weight)
  - Game Performance (25% weight)
  - Quiz Accuracy (20% weight)
  - Drill Participation (10% weight)
  - Login Streak (5% weight)
- ✅ Progress bars for each component
- ✅ Weight percentages displayed
- ✅ Formula explanation visible
- ✅ Last updated timestamp shown

**Verify Components**:
- Each component should have score 0-100
- Progress bar fills according to score
- Weights should sum to 100%

---

#### **Test 3: Score History View**

**Steps**:
1. On HomeScreen, tap history button (or navigate from breakdown)
2. View score history screen

**Expected Results**:
- ✅ Summary stats displayed (Current, Average, Highest)
- ✅ Historical entries list
- ✅ Dates formatted correctly
- ✅ Latest entry highlighted
- ✅ Filter options available (7/30/90 days)

**If No History**:
- Complete activities to generate score changes
- Recalculate score manually
- Check if history appears

---

#### **Test 4: Manual Refresh**

**Steps**:
1. On HomeScreen, tap refresh button
2. Observe score update

**Expected Results**:
- ✅ Loading indicator appears
- ✅ Score updates after refresh
- ✅ No errors displayed
- ✅ Breakdown updates if viewed

---

#### **Test 5: Recalculate Score**

**Steps**:
1. Open score breakdown screen
2. Tap recalculate button
3. Wait for completion

**Expected Results**:
- ✅ Loading indicator appears
- ✅ Score recalculates
- ✅ Breakdown updates
- ✅ Success message (or no errors)
- ✅ History entry added

---

#### **Test 6: Score Update After Game**

**Steps**:
1. Note current score on HomeScreen
2. Play and complete a game (Bag Packer, Hazard Hunter, or Earthquake Shake)
3. Return to HomeScreen
4. Check if score updated

**Expected Results**:
- ✅ Score refreshes automatically
- ✅ New score reflects game completion
- ✅ Game component score should increase
- ✅ No manual refresh needed

---

#### **Test 7: Score Update After Quiz**

**Steps**:
1. Note current score on HomeScreen
2. Complete a module quiz
3. Return to HomeScreen
4. Check if score updated

**Expected Results**:
- ✅ Score refreshes automatically
- ✅ New score reflects quiz completion
- ✅ Module and Quiz component scores should increase
- ✅ No manual refresh needed

---

#### **Test 8: Error Handling**

**Steps**:
1. Disconnect internet/disable network
2. Try to view score
3. Reconnect network
4. Try to refresh

**Expected Results**:
- ✅ Error message displayed when offline
- ✅ Retry button available
- ✅ Score loads after reconnection
- ✅ No app crash

---

#### **Test 9: Score Breakdown Navigation**

**Steps**:
1. From HomeScreen, tap score card
2. View breakdown details
3. Navigate back
4. Tap history button
5. View history
6. Navigate back

**Expected Results**:
- ✅ Navigation smooth
- ✅ Data persists between screens
- ✅ No navigation errors
- ✅ Back button works correctly

---

#### **Test 10: Multiple Score Components**

**Steps**:
1. Complete activities in each category:
   - Complete a module (Module component)
   - Play a game (Game component)
   - Take a quiz (Quiz component)
   - Participate in drill (Drill component - if available)
   - Login daily (Streak component)
2. Check score breakdown

**Expected Results**:
- ✅ All components have non-zero scores (if activities completed)
- ✅ Total score reflects all components
- ✅ Weighted calculation correct
- ✅ Progress bars show accurate percentages

---

## 🔄 **INTEGRATION TESTS**

### **Test: End-to-End Score Flow**

**Scenario**: User completes activities and sees score update

**Steps**:
1. Login to app
2. Note initial score (may be 0)
3. Complete a learning module with quiz
4. Verify score updates
5. Play a game and complete it
6. Verify score updates again
7. Check breakdown - both components should show scores
8. View history - should show score progression

**Expected Results**:
- ✅ Score updates after each activity
- ✅ Breakdown reflects all activities
- ✅ History shows progression
- ✅ Total score increases appropriately

---

## 🐛 **Common Issues & Troubleshooting**

### **Issue 1: Score is 0 or Missing**

**Causes**:
- No activities completed yet
- Backend not calculating score correctly
- User has no progress data

**Solutions**:
1. Complete some activities (module, game, quiz)
2. Tap recalculate button
3. Check backend logs for calculation errors
4. Verify user has `progress` field in database

---

### **Issue 2: Score Not Updating After Activity**

**Causes**:
- Auto-refresh not triggered
- Network error
- Backend score update failed

**Solutions**:
1. Manually refresh score
2. Check network connection
3. Verify backend is running
4. Check backend logs for errors

---

### **Issue 3: Breakdown Shows 0 for All Components**

**Causes**:
- No activities completed
- Backend calculation error
- User data missing

**Solutions**:
1. Complete activities in each category
2. Recalculate score
3. Verify backend calculation service
4. Check user progress in database

---

### **Issue 4: History Empty**

**Causes**:
- Score never recalculated
- History not being saved
- User just created

**Solutions**:
1. Recalculate score (adds to history)
2. Complete activities and recalculate
3. Check backend history saving logic
4. Verify `scoreHistory` field in user document

---

## 📊 **Test Results Template**

Use this template to record test results:

```markdown
### Test Session: [Date]

**Backend Tests**:
- [ ] Health Check: ✅/❌
- [ ] Login: ✅/❌
- [ ] Get Score: ✅/❌
- [ ] Get Score (with userId): ✅/❌
- [ ] Recalculate: ✅/❌
- [ ] Get History: ✅/❌
- [ ] Get History (limit): ✅/❌
- [ ] Unauthorized: ✅/❌
- [ ] Breakdown Validation: ✅/❌
- [ ] Score After Activity: ✅/❌

**Mobile Tests**:
- [ ] HomeScreen Display: ✅/❌
- [ ] Breakdown View: ✅/❌
- [ ] History View: ✅/❌
- [ ] Manual Refresh: ✅/❌
- [ ] Recalculate: ✅/❌
- [ ] Update After Game: ✅/❌
- [ ] Update After Quiz: ✅/❌
- [ ] Error Handling: ✅/❌
- [ ] Navigation: ✅/❌
- [ ] Multiple Components: ✅/❌

**Issues Found**:
- [List any issues]

**Notes**:
- [Additional observations]
```

---

## ✅ **Success Criteria**

### **Backend**
- ✅ All 10 backend tests pass
- ✅ Score calculation returns valid data
- ✅ History tracking works
- ✅ Authorization enforced

### **Mobile**
- ✅ Score displays correctly on HomeScreen
- ✅ Breakdown shows all components
- ✅ History displays entries
- ✅ Auto-refresh works after activities
- ✅ Error handling graceful
- ✅ No crashes or errors

---

## 🚀 **Running Tests**

### **Backend Tests**
```bash
cd backend
node scripts/test-phase3.3.1.js
```

### **Mobile Tests**
1. Start backend server
2. Run Flutter app
3. Follow test checklist above

---

**Good luck with testing!** 🧪

