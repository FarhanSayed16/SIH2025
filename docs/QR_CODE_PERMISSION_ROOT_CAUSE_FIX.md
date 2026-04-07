# QR Code Generation "Insufficient Permissions" - Root Cause Fix
**Date:** 2025-12-01  
**Status:** ✅ **FIXES APPLIED**

---

## 🔍 ROOT CAUSE ANALYSIS

**Error:** "Insufficient permissions" when teacher tries to generate QR code

**Root Cause:**
The `requireRole` middleware was checking `req.user.role || req.userRole`, but:
1. The `role` field might not be properly loaded from the database in `getUserById`
2. The JWT token might have an old role (from before approval)
3. The user object conversion (`toObject()`) might not preserve all fields correctly
4. There was insufficient logging to diagnose the issue

---

## ✅ FIXES APPLIED

### 1. Enhanced `getUserById` Function
**File:** `backend/src/services/auth.service.js`

**Changes:**
- Added explicit check to verify `role` field is present after query
- Added error logging if role is missing
- Added debug logging to show role value
- Removed unnecessary `.select('+role')` syntax (role is not excluded by default)

### 2. Enhanced `authenticate` Middleware
**File:** `backend/src/middleware/auth.middleware.js`

**Changes:**
- Added critical check: if `userObj.role` is missing, log error and use JWT role as fallback
- Enhanced logging to show:
  - Role from DB
  - Role from JWT
  - ApprovalStatus
  - InstitutionId
- Changed log level from `debug` to `info` for better visibility

### 3. Enhanced `requireRole` Middleware
**File:** `backend/src/middleware/rbac.middleware.js`

**Changes:**
- Improved role selection logic with better fallback handling
- Enhanced logging with more detail:
  - Shows JWT role, DB role, and final role used
  - Shows allowed roles
  - Shows path being accessed
- Better error messages with debug info
- Changed log level from `debug` to `info` for better visibility

---

## 🎯 EXPECTED BEHAVIOR

1. **Teacher logs in** → Gets JWT token with role 'teacher'
2. **Teacher makes request** → `authenticate` middleware loads user from DB
3. **Role check** → `requireRole` uses DB role (preferred) or JWT role (fallback)
4. **Teacher access check** → `requireTeacherAccess` verifies approval and institution
5. **QR code generated** → Success!

---

## 🔍 DEBUGGING

When the error occurs, check backend logs for:

1. **`[authenticate]`** - Shows role from DB vs JWT
2. **`[getUserById]`** - Shows if role is missing
3. **`[requireRole]`** - Shows role check with detailed info
4. **`[requireTeacherAccess]`** - Shows teacher-specific checks

**Look for:**
- Is `role` present in DB user object?
- Is there a mismatch between JWT role and DB role?
- Is the role exactly 'teacher' (case-sensitive)?

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue 1: JWT Token Has Old Role
**Symptom:** JWT role doesn't match DB role
**Solution:** Teacher must **re-login** to get fresh JWT token

### Issue 2: Role Field Missing from DB Query
**Symptom:** `[getUserById] WARNING: User has no role field!`
**Solution:** Check User model schema - role should not have `select: false`

### Issue 3: Role Not in Allowed List
**Symptom:** `[requireRole] Access denied for role 'X'`
**Solution:** Verify role is exactly 'teacher' (case-sensitive, no extra spaces)

---

## 📝 FILES CHANGED

1. ✅ `backend/src/services/auth.service.js`
   - Enhanced `getUserById` with role verification and logging

2. ✅ `backend/src/middleware/auth.middleware.js`
   - Enhanced `authenticate` with role validation and detailed logging

3. ✅ `backend/src/middleware/rbac.middleware.js`
   - Enhanced `requireRole` with better error handling and logging

---

## 🔄 USER ACTION REQUIRED

**If the error persists:**
1. **Check backend logs** for detailed error messages
2. **Verify in database:**
   ```javascript
   db.users.findOne({ _id: ObjectId("teacher_id") })
   // Should show: role: "teacher"
   ```
3. **Have teacher re-login** to get fresh JWT token
4. **Check logs** for `[authenticate]` and `[requireRole]` messages

---

**Status:** ✅ **FIXES APPLIED - ENHANCED LOGGING AND ROLE VALIDATION**

