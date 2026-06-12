# Phase 3.3.1: Quick Mobile Testing Checklist

**Date**: 2025-01-27  
**Purpose**: Quick mobile app testing for Preparedness Score

---

## 🚀 **Quick Start**

1. **Ensure Backend is Running**
   ```bash
   cd backend
   npm run dev
   ```

2. **Run Mobile App**
   ```bash
   cd mobile
   flutter run
   ```

---

## ✅ **5-Minute Quick Test**

### **Test 1: Basic Display** ⏱️ 1 min
- [ ] Login to app
- [ ] Go to HomeScreen
- [ ] **Verify**: Score displays (not placeholder)
- [ ] **Verify**: Circular progress indicator shows

### **Test 2: Breakdown View** ⏱️ 1 min
- [ ] Tap on score card
- [ ] **Verify**: Breakdown screen opens
- [ ] **Verify**: All 5 components shown
- [ ] **Verify**: Progress bars display

### **Test 3: History View** ⏱️ 1 min
- [ ] Tap history button
- [ ] **Verify**: History screen opens
- [ ] **Verify**: No crashes (even if empty)

### **Test 4: Manual Refresh** ⏱️ 30 sec
- [ ] Tap refresh button on HomeScreen
- [ ] **Verify**: Loading indicator appears
- [ ] **Verify**: Score refreshes (no errors)

### **Test 5: Auto-Refresh After Activity** ⏱️ 2 min
- [ ] Note current score
- [ ] Complete a game OR quiz
- [ ] Return to HomeScreen
- [ ] **Verify**: Score updates automatically

---

## ✅ **10-Minute Complete Test**

Do the 5-minute test PLUS:

### **Test 6: Score Breakdown Components** ⏱️ 2 min
- [ ] Open breakdown view
- [ ] **Verify**: All components have scores (even if 0)
- [ ] **Verify**: Weights displayed correctly
- [ ] **Verify**: Progress bars accurate

### **Test 7: Recalculate Score** ⏱️ 1 min
- [ ] Open breakdown
- [ ] Tap recalculate button
- [ ] **Verify**: Score recalculates
- [ ] **Verify**: No errors

### **Test 8: Error Handling** ⏱️ 2 min
- [ ] Turn off internet
- [ ] Try to view score
- [ ] **Verify**: Error message shown (not crash)
- [ ] Turn internet back on
- [ ] Refresh score
- [ ] **Verify**: Score loads

### **Test 9: Navigation** ⏱️ 1 min
- [ ] Navigate: Home → Breakdown → Back → History → Back
- [ ] **Verify**: No navigation errors
- [ ] **Verify**: Data persists

### **Test 10: Multiple Activities** ⏱️ 3 min
- [ ] Complete a module with quiz
- [ ] **Verify**: Score updates
- [ ] Play a game
- [ ] **Verify**: Score updates again
- [ ] Check breakdown
- [ ] **Verify**: Both Module and Game components show scores

---

## 🎯 **Success Criteria**

### **Must Pass (Critical)**
- ✅ Score displays on HomeScreen
- ✅ Breakdown view opens without errors
- ✅ History view opens without errors
- ✅ No crashes
- ✅ Basic navigation works

### **Should Pass (Important)**
- ✅ Manual refresh works
- ✅ Auto-refresh after activities
- ✅ Error handling graceful
- ✅ All components visible in breakdown

---

## 🐛 **Common Issues**

### **Issue: Score Shows 0%**
- **Solution**: Complete some activities (module, game, quiz)
- **Then**: Tap refresh or recalculate

### **Issue: Score Not Updating After Activity**
- **Solution**: Manually refresh score
- **Check**: Backend is running and accessible

### **Issue: Breakdown Shows All Zeros**
- **Solution**: Complete activities in each category
- **Then**: Recalculate score

---

## 📊 **Quick Test Results Template**

```
Quick Test Results:
- [ ] Test 1: Basic Display - ✅/❌
- [ ] Test 2: Breakdown View - ✅/❌
- [ ] Test 3: History View - ✅/❌
- [ ] Test 4: Manual Refresh - ✅/❌
- [ ] Test 5: Auto-Refresh - ✅/❌

Issues: [List any]

Status: ✅ PASS / ❌ FAIL
```

---

**Backend tests: ✅ PASSED (10/10)**  
**Mobile tests: [Your results here]**

---

**Ready to test!** 🧪

