# Phase 3.2.4: Group Mode Testing Guide

**Date**: 2025-11-25  
**Status**: Ready for Testing

---

## 🧪 **Testing Overview**

This guide covers testing of Phase 3.2.4: Group Mode for All Games. Group mode allows multiple students to take turns playing games on shared devices, critical for KG-5 students using teacher-led devices.

---

## 📋 **Pre-Testing Checklist**

### **Backend Setup**
- [ ] Backend server is running (`npm run dev` in `backend/`)
- [ ] MongoDB is connected
- [ ] Group activity routes are registered
- [ ] Test users exist (at least one teacher, one class, multiple students)

### **Mobile Setup**
- [ ] Mobile app is built and running
- [ ] Teacher account is logged in (for group mode setup)
- [ ] At least one class exists with students assigned
- [ ] Network connectivity is available

---

## 🎮 **Test Scenarios**

### **Test 1: Group Game Setup (Teacher)**

**Objective**: Verify teacher can create a group game session

**Steps**:
1. Login as teacher
2. Navigate to Games screen
3. Select "Bag Packer" game
4. Choose "Group Mode" option
5. Select a class from dropdown
6. Optionally select specific students
7. Click "Start Group Game"

**Expected Results**:
- ✅ Group game setup screen appears
- ✅ Class dropdown shows available classes
- ✅ Game launches with group mode enabled
- ✅ Group mode toggle shows "Group Mode: ON"

**Test Result**: ⬜ Pass / ⬜ Fail

---

### **Test 2: Group Mode Toggle**

**Objective**: Verify group mode toggle works in-game

**Steps**:
1. Start a game (any game)
2. If logged in as teacher, look for group mode toggle
3. Toggle between Individual and Group modes

**Expected Results**:
- ✅ Toggle appears for teachers
- ✅ Toggle switches modes correctly
- ✅ UI updates to reflect current mode
- ✅ Toggle is disabled during gameplay (when appropriate)

**Test Result**: ⬜ Pass / ⬜ Fail

---

### **Test 3: Turn-Based Gameplay**

**Objective**: Verify students can take turns in group mode

**Steps**:
1. Start a group game session
2. Play one turn (complete the game)
3. When game finishes, student assignment dialog should appear
4. Select a student from the list
5. Submit the turn
6. Play another turn and assign to different student

**Expected Results**:
- ✅ After each game completion, assignment dialog appears
- ✅ Student list shows available students
- ✅ Can select different students for each turn
- ✅ Scores are recorded for each assigned student
- ✅ Game resets for next turn

**Test Result**: ⬜ Pass / ⬜ Fail

---

### **Test 4: Student Assignment Dialog**

**Objective**: Verify student assignment functionality

**Steps**:
1. Complete a game turn in group mode
2. Assignment dialog appears
3. Browse student list
4. Select a student
5. Click "Assign"
6. Complete another turn and assign to different student

**Expected Results**:
- ✅ Dialog shows list of students
- ✅ Students show name and grade
- ✅ Selection is highlighted
- ✅ "Assign" button enables only when student selected
- ✅ Can cancel assignment

**Test Result**: ⬜ Pass / ⬜ Fail

---

### **Test 5: Group Score Aggregation**

**Objective**: Verify group scores are aggregated correctly

**Steps**:
1. Play multiple turns in group mode
2. Assign different students to each turn
3. After each turn, view group score display
4. Complete 3-5 turns with different students

**Expected Results**:
- ✅ Group score display shows after each turn
- ✅ Total score accumulates correctly
- ✅ Average score calculates correctly
- ✅ Completion rate updates
- ✅ All participants listed with their scores
- ✅ Score breakdown visible

**Test Result**: ⬜ Pass / ⬜ Fail

---

### **Test 6: Score Submission (Group Mode)**

**Objective**: Verify scores are saved correctly for group mode

**Steps**:
1. Play game in group mode
2. Complete a turn
3. Assign student
4. Check backend/database for:
   - GameScore record with `isGroupMode: true`
   - GroupActivity record updated
   - Participant scores recorded

**Expected Results**:
- ✅ GameScore saved with `isGroupMode: true`
- ✅ `groupActivityId` is set
- ✅ GroupActivity participants updated
- ✅ Individual scores linked to students
- ✅ XP calculated and assigned

**Test Result**: ⬜ Pass / ⬜ Fail

---

### **Test 7: All Three Games (Group Mode)**

**Objective**: Verify group mode works for all games

**Games to Test**:
- [ ] Bag Packer
- [ ] Hazard Hunter
- [ ] Earthquake Shake

**For Each Game**:
1. Start group game session
2. Play one turn
3. Assign student
4. Verify score submission
5. Verify group score display

**Expected Results**:
- ✅ All three games support group mode
- ✅ Student assignment works for all games
- ✅ Score aggregation works for all games
- ✅ Game-specific features still work

**Test Result**: ⬜ Pass / ⬜ Fail

---

### **Test 8: Individual Mode (Regression)**

**Objective**: Verify individual mode still works

**Steps**:
1. Start game in Individual mode (default)
2. Play game normally
3. Complete game
4. Verify score submission

**Expected Results**:
- ✅ Individual mode works normally
- ✅ No assignment dialog appears
- ✅ Score saved with `isGroupMode: false`
- ✅ No group activity created
- ✅ Normal gameplay experience

**Test Result**: ⬜ Pass / ⬜ Fail

---

### **Test 9: Group Activity API**

**Objective**: Verify backend APIs work correctly

**API Endpoints to Test**:
- [ ] `POST /api/group-activities/create`
- [ ] `POST /api/group-activities/:id/submit`
- [ ] `GET /api/group-activities/:id/results`

**Steps**:
1. Use API client (Postman, curl, etc.)
2. Create group activity
3. Submit turn result
4. Get activity results

**Expected Results**:
- ✅ All endpoints respond correctly
- ✅ Authentication works
- ✅ Data validation works
- ✅ Responses include correct data
- ✅ Errors handled gracefully

**Test Result**: ⬜ Pass / ⬜ Fail

---

### **Test 10: Edge Cases**

**Objective**: Test error handling and edge cases

**Test Cases**:
- [ ] No students available for assignment
- [ ] Network error during score submission
- [ ] Invalid group activity ID
- [ ] Teacher tries to use group mode without class
- [ ] Multiple turns with same student
- [ ] Very high scores (boundary testing)

**Expected Results**:
- ✅ Appropriate error messages shown
- ✅ App doesn't crash
- ✅ Graceful error handling
- ✅ User can recover from errors

**Test Result**: ⬜ Pass / ⬜ Fail

---

## 🔧 **Backend API Testing Script**

### **Manual API Test**

You can test the backend APIs directly using curl or Postman:

```bash
# 1. Login first to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@test.com","password":"password123"}'

# 2. Create group activity (use token from step 1)
curl -X POST http://localhost:3000/api/group-activities/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "activityType": "game",
    "classId": "CLASS_ID",
    "metadata": {
      "activityName": "bag-packer",
      "duration": 0
    }
  }'

# 3. Submit turn result
curl -X POST http://localhost:3000/api/group-activities/ACTIVITY_ID/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "studentId": "STUDENT_ID",
    "score": 85,
    "completed": true
  }'

# 4. Get results
curl -X GET http://localhost:3000/api/group-activities/ACTIVITY_ID/results \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📱 **Mobile Manual Testing**

### **Bag Packer Game (Group Mode)**

1. **Setup**:
   - Login as teacher
   - Navigate to Games → Bag Packer
   - Select "Group Mode"
   - Choose class and start

2. **Gameplay**:
   - Drag items into bag
   - Complete game
   - Assign student when dialog appears
   - View group scores

3. **Verify**:
   - ✅ Game plays normally
   - ✅ Assignment dialog appears
   - ✅ Scores aggregate
   - ✅ Multiple turns work

---

### **Hazard Hunter Game (Group Mode)**

1. **Setup**: Same as Bag Packer
2. **Gameplay**: Tap hazards in image
3. **Verify**: Same as Bag Packer

---

### **Earthquake Shake Game (Group Mode)**

1. **Setup**: Same as Bag Packer
2. **Gameplay**: Follow Drop, Cover, Hold sequence
3. **Verify**: Same as Bag Packer

---

## 🐛 **Known Issues / Notes**

- [ ] Note any issues found during testing here

---

## ✅ **Test Summary**

**Total Tests**: 10  
**Passed**: ___ / 10  
**Failed**: ___ / 10  
**Blocked**: ___ / 10

**Overall Status**: ⬜ Pass / ⬜ Fail / ⬜ Partial

---

## 📝 **Test Notes**

_Add any additional observations, issues, or recommendations here:_

---

**Testing Completed By**: _________________  
**Date**: _________________  
**Version**: Phase 3.2.4

