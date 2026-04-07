# Quick Fix: UI & Seed Data Issues

## 🔍 **Issues Found:**

1. ❌ **HomeScreen NOT using new design system** - Still using old `Card` widgets
2. ❌ **No comprehensive seed data** - Need dummy users with complete data

---

## ✅ **Solution:**

### **Step 1: Run Comprehensive Seed Script**

```bash
cd backend
node scripts/seed-comprehensive.js
```

This creates:
- 1 Admin: `admin@school.com` / `admin123`
- 1 Teacher: `teacher@kavach.com` / `teacher123`
- 3 Students:
  - `rohan.sharma@student.com` / `student123` (Full Access - Grade 10)
  - `priya.patel@student.com` / `student123` (Shared Access - Grade 8)
  - `arjun.kumar@student.com` / `student123` (Teacher Led - Grade 5)
- School with complete data
- Modules with quizzes
- Badges
- Drills (scheduled & completed)

---

### **Step 2: Update HomeScreen to Use New Design System**

The HomeScreen needs to be updated to use:
- `ScreenLayout` instead of `SingleChildScrollView` with padding
- `AppBarCustom` instead of `AppBar`
- `StatCard` for preparedness score
- `FeatureCard` for quick actions
- Design system colors, typography, spacing

**This will make the UI look COMPLETELY different!**

---

## 📋 **Files to Update:**

1. ✅ `backend/scripts/seed-comprehensive.js` - Created
2. ⏳ `mobile/lib/features/dashboard/screens/home_screen.dart` - Needs update

---

## 🚀 **Next Steps:**

1. Run the seed script to populate database
2. Update HomeScreen to use new components
3. Test with different user roles

---

**The UI will look completely different once HomeScreen uses the new design system!**

