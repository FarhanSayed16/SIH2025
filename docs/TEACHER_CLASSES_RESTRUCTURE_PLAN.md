# Teacher Classes Page Restructure Plan
**Date:** 2025-12-01

---

## 🎯 OBJECTIVES

1. Move class details page from `/classes/[classId]` to `/teacher/classes/[classId]`
2. Update "View Class" button on `/teacher/classes` to navigate to `/teacher/classes/[classId]`
3. Clean up conflicts between `/classes` and `/teacher/classes` pages
4. Ensure proper functionality and navigation flow

---

## 📋 CURRENT STRUCTURE

### Current Pages:
- `/classes` - General classes page (duplicate functionality with `/teacher/classes`)
- `/teacher/classes` - Teacher's view of assigned classes
- `/classes/[classId]` - Class details page (needs to move)
- `/classes/[classId]/approvals` - Class approvals page

### Current Navigation:
- `/teacher/classes` → "View Class" button → `/classes/[classId]` ❌ (wrong path)
- `/classes` → "View Details" button → `/classes/[classId]` ✅ (but page should move)

---

## 🔄 PROPOSED STRUCTURE

### New Pages:
- `/teacher/classes` - Teacher's list of assigned classes ✅ (keep)
- `/teacher/classes/[classId]` - Class details page ✅ (new location)
- `/teacher/classes/[classId]/approvals` - Class approvals page ✅ (move if exists)

### Navigation Flow:
- `/teacher/classes` → "View Class" button → `/teacher/classes/[classId]` ✅
- `/teacher/classes/[classId]` → "Back to Classes" → `/teacher/classes` ✅

### Cleanup:
- `/classes` - Decide: Remove, redirect, or keep for admin use?
- `/classes/[classId]` - Remove after migration ✅
- `/classes/[classId]/approvals` - Move to `/teacher/classes/[classId]/approvals` if exists

---

## 📝 IMPLEMENTATION STEPS

### Step 1: Create New Directory Structure
- Create `web/app/teacher/classes/[classId]/page.tsx`
- Copy content from `web/app/classes/[classId]/page.tsx`
- Update navigation paths in the new file

### Step 2: Update Teacher Classes List Page
- Update "View Class" button link from `/classes/${classId}` to `/teacher/classes/${classId}`
- Ensure all navigation is consistent

### Step 3: Update Class Details Page
- Update "Back to Classes" button to navigate to `/teacher/classes`
- Update any internal navigation links
- Ensure role checks are correct (teacher-only)

### Step 4: Handle Approvals Page (if exists)
- Check if `/classes/[classId]/approvals` exists
- If exists, move to `/teacher/classes/[classId]/approvals`
- Update navigation links

### Step 5: Clean Up Old Pages
- Remove `/classes/[classId]/page.tsx` after migration
- Decide on `/classes` page (remove or keep for admin?)

### Step 6: Update Any Other References
- Search for all references to `/classes/[classId]`
- Update to `/teacher/classes/[classId]`

---

## ✅ EXPECTED OUTCOME

1. **Clean Navigation:**
   - Teacher sees their classes at `/teacher/classes`
   - Clicking "View Class" goes to `/teacher/classes/[classId]`
   - All teacher class management is under `/teacher/classes/*`

2. **No Conflicts:**
   - `/classes` page can be removed or repurposed for admin
   - No duplicate functionality

3. **Proper Role-Based Access:**
   - `/teacher/classes/*` is teacher-only
   - Proper authentication and authorization checks

---

## 🔍 FILES TO MODIFY

1. ✅ Create: `web/app/teacher/classes/[classId]/page.tsx`
2. ✅ Update: `web/app/teacher/classes/page.tsx` (navigation link)
3. ✅ Check: `web/app/classes/[classId]/approvals/page.tsx` (if exists, move it)
4. ✅ Remove: `web/app/classes/[classId]/page.tsx` (after migration)
5. ✅ Review: `web/app/classes/page.tsx` (decide on removal/repurpose)

---

**Status:** Ready for implementation

