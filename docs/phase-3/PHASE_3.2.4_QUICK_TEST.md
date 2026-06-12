# Phase 3.2.4: Quick Testing Guide

## 🚀 **Quick Start Testing**

### **Step 1: Start Backend**
```bash
cd backend
npm run dev
```

### **Step 2: Test Backend APIs (Optional)**
```bash
# Run automated test (requires test users to exist)
cd backend
node scripts/test-phase3.2.4.js
```

### **Step 3: Manual Mobile Testing**

1. **Open Mobile App**
   - Start Flutter app
   - Login as teacher

2. **Test Group Mode Setup**
   - Go to Games screen
   - Click on any game (Bag Packer, Hazard Hunter, or Earthquake Shake)
   - Choose "Group Mode"
   - Select class and start game

3. **Test Gameplay**
   - Play one turn
   - When game finishes, assignment dialog should appear
   - Select a student
   - View group scores

4. **Test Multiple Turns**
   - Play another turn
   - Assign to different student
   - Verify scores aggregate

---

## ✅ **What to Check**

- [ ] Group mode toggle appears for teachers
- [ ] Group game setup screen works
- [ ] Student assignment dialog appears after each turn
- [ ] Can assign different students to different turns
- [ ] Group scores display correctly
- [ ] Scores are saved to backend
- [ ] Works for all three games

---

## 📝 **If Backend Tests Fail**

The automated tests need:
1. Backend server running (`npm run dev`)
2. Test teacher account: `teacher@test.com` / `password123`
3. Test student account: `student@test.com` / `password123`
4. A class assigned to the teacher

**It's okay to skip automated tests** - focus on **manual mobile testing** instead!

---

## 🎯 **Focus Areas**

1. **UI/UX**: Does everything look good and work smoothly?
2. **Flow**: Can teacher easily set up and manage group games?
3. **Data**: Are scores being saved correctly?
4. **Edge Cases**: What happens with errors or edge cases?

---

**Ready to test?** Follow the manual mobile testing steps above! 🚀

