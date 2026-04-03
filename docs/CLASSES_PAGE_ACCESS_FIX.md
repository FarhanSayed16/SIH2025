# Classes Page Access Fix
**Date:** 2025-12-01

---

## 🔍 ISSUE

Teacher can see classes on `/classes` page but cannot access:
- Generate QR Code
- View Pending Approvals  
- View Details

**Root Cause:**
- `requireRole` middleware is failing before `requireTeacherAccess` runs
- Role check is not working correctly
- User might need to re-login to refresh JWT token

---

## ✅ VERIFICATION

### Routes Status:
1. ✅ `/api/teacher/classes` - Has `requireTeacherAccess` (global)
2. ✅ `/api/classroom/:classId/qr/generate` - Has `requireTeacherAccess` (we added it)
3. ✅ `/api/classroom/:classId/join-requests` - Has `requireTeacherAccess` (we added it)
4. ✅ `/api/teacher/classes/:classId/students` - Has `requireTeacherAccess` (global)

**All routes have proper middleware!**

---

## 🛠️ SOLUTION

### Step 1: Re-login
The teacher MUST log out and log back in to refresh the JWT token with the correct role.

### Step 2: Verify Teacher Status
Check that the teacher in the database has:
- ✅ `role: 'teacher'`
- ✅ `approvalStatus: 'approved'`
- ✅ `institutionId` is set (not null)
- ✅ `isActive: true`

### Step 3: Check Browser Console
When clicking buttons, check the browser console for:
- Error messages
- Debug info showing role mismatch
- 403 errors with debug object

---

## 🔍 DEBUGGING

If still not working after re-login, check:

1. **Browser Console** - Look for error messages with debug info
2. **Backend Logs** - Look for:
   ```
   [requireRole] Access denied for role 'X' (JWT: Y, DB: Z)
   [requireTeacherAccess] Teacher access denied: ...
   ```

3. **Network Tab** - Check the actual API request:
   - Is Authorization header present?
   - What's the response status code?
   - What's the error message?

---

## 📝 COMMON FIXES

1. **JWT has old role** → Log out and log back in
2. **Teacher not approved** → Admin needs to approve
3. **Teacher has no institution** → Admin needs to assign institution
4. **Role field missing** → Should be fixed with `.select('+role')` change

---

**Status:** Routes are correctly configured - user needs to re-login

