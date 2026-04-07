# QR Code Generation "Insufficient Permissions" Fix
**Date:** 2025-12-01  
**Status:** 🔧 **ENHANCED LOGGING ADDED**

---

## 🔍 ISSUE

**Error:** "Insufficient permissions" when teacher tries to generate QR code on `/classes/[classId]` page

**Route:** `POST /api/classroom/:classId/qr/generate`

---

## 🔍 ROOT CAUSE ANALYSIS

The error "Insufficient permissions" is coming from the `requireRole` middleware, which means:
1. The user's role is not in the allowed roles list `['teacher', 'admin']`
2. OR there's a mismatch between JWT role and DB role
3. OR the role field is missing/undefined

**Middleware Chain:**
1. `authenticate` - Verifies JWT and loads user from DB
2. `requireRole(['teacher', 'admin'])` - Checks if role is 'teacher' or 'admin'
3. `requireTeacherAccess` - For teachers: checks approvalStatus and institutionId

---

## ✅ FIXES APPLIED

### 1. Enhanced Logging in QR Generate Route
**File:** `backend/src/routes/classroom-join.routes.js`

**Changes:**
- Added detailed logging before role check showing:
  - User ID
  - JWT Role
  - DB Role
  - ApprovalStatus
  - InstitutionId
  - All user object keys

### 2. Enhanced Logging in requireTeacherAccess Middleware
**File:** `backend/src/middleware/rbac.middleware.js`

**Changes:**
- Added debug logging at entry point
- Added detailed logging of fresh user data fetched from DB
- Added info logging when access is granted
- Added warning logging when access is denied with specific reasons

### 3. Enhanced Logging in requireRole Middleware
**File:** `backend/src/middleware/rbac.middleware.js`

**Already has:**
- Debug logging showing JWT role, DB role, and final role used
- Warning logging when access is denied with detailed debug info

---

## 🔍 DEBUGGING STEPS

When the error occurs, check the backend logs for:

1. **`[QR Generate] Auth check`** - Shows user info before role check
2. **`[requireRole]`** - Shows role check result
3. **`[requireTeacherAccess]`** - Shows teacher-specific checks

**Look for:**
- Is the role 'teacher' or something else?
- Is approvalStatus 'approved'?
- Does the teacher have an institutionId?
- Is there a mismatch between JWT role and DB role?

---

## 🎯 EXPECTED BEHAVIOR

1. **Teacher logs in** → Gets JWT token with role 'teacher'
2. **Teacher visits class page** → Frontend sends request with Bearer token
3. **Backend authenticates** → Loads user from DB, checks role
4. **requireRole passes** → Role is 'teacher' or 'admin'
5. **requireTeacherAccess passes** → Teacher is approved and has institution
6. **QR code generated** → Success!

---

## 🚨 COMMON ISSUES

### Issue 1: Role Mismatch
**Symptom:** `requireRole` denies access
**Fix:** Teacher must re-login to get fresh JWT token with correct role

### Issue 2: Not Approved
**Symptom:** `requireTeacherAccess` returns `TEACHER_NOT_APPROVED`
**Fix:** Admin must approve the teacher account

### Issue 3: No Institution
**Symptom:** `requireTeacherAccess` returns `TEACHER_NO_INSTITUTION`
**Fix:** Admin must assign teacher to an institution

### Issue 4: Class Not Assigned to Teacher
**Symptom:** Service returns "Unauthorized: Teacher does not own this class"
**Fix:** Admin must assign the class to the teacher

---

## 📝 FILES CHANGED

1. ✅ `backend/src/routes/classroom-join.routes.js`
   - Enhanced logging in QR generate route

2. ✅ `backend/src/middleware/rbac.middleware.js`
   - Enhanced logging in `requireTeacherAccess` middleware

---

## 🔄 NEXT STEPS

1. **Check backend logs** when teacher tries to generate QR code
2. **Identify the exact failure point** (requireRole or requireTeacherAccess)
3. **Verify teacher's data in database:**
   - `role` = 'teacher'
   - `approvalStatus` = 'approved'
   - `institutionId` is set
   - `isActive` = true
4. **If teacher was recently approved:** Teacher must re-login to get fresh token

---

**Status:** 🔧 **ENHANCED LOGGING ADDED - CHECK BACKEND LOGS FOR DETAILED ERROR INFO**

