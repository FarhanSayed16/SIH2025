# HomeScreen Redesign - Critical Fix

## Issue
HomeScreen is NOT using the new design system components, so UI looks the same as before.

## Solution
Update HomeScreen to use:
- `AppBarCustom` instead of `AppBar`
- `StatCard` for preparedness score
- `FeatureCard` for quick actions  
- `ActionCard` for teacher section
- `ScreenLayout` for consistent layout
- Design system colors, typography, spacing
- `EmergencyButton` or `FABButton` for emergency button

## Files to Update
- `mobile/lib/features/dashboard/screens/home_screen.dart` - Complete redesign needed

## Impact
This will make the UI look COMPLETELY DIFFERENT and visible!

---

**The comprehensive seed script is ready at `backend/scripts/seed-comprehensive.js`**

Run it with:
```bash
cd backend
node scripts/seed-comprehensive.js
```

This creates:
- Admin: admin@school.com / admin123
- Teacher: teacher@kavach.com / teacher123  
- Students: rohan.sharma@student.com / student123 (and 2 more)

---

**Next: Update HomeScreen to actually use the new components!**

