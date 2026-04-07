# QR Code Permission - Complete Fix
**Date:** 2025-12-01  
**Status:** ✅ **FIXES APPLIED**

---

## 🔍 ROOT CAUSE

The "Insufficient permissions" error is happening because:

1. **Role field might not be selected** in `getUserById` query
2. **Pending requests route** was missing `requireTeacherAccess` middleware
3. **All teacher routes** need consistent middleware chain

---

## ✅ FIXES APPLIED

### 1. Enhanced `getUserById` to Ensure Role is Selected
**File:** `backend/src/services/auth.service.js`

**Change:**
- Added explicit `.select('+role')` to ensure role field is always included
- This ensures `req.user.role` is available in middleware

### 2. Added `requireTeacherAccess` to All Teacher Routes
**File:** `backend/src/routes/classroom-join.routes.js`

**Routes Updated:**
- ✅ `GET /:classId/join-requests` - Get pending requests
- ✅ `POST /join-requests/:requestId/approve` - Approve request
- ✅ `POST /join-requests/:requestId/reject` - Reject request
- ✅ `POST /:classId/qr/expire` - Expire QR code
- ✅ `POST /:classId/qr/generate` - Generate QR code (already had it)

**Result:** All teacher routes now have consistent middleware:
1. `authenticate` - Verify token
2. `requireRole(['teacher', 'admin'])` - Check role
3. `requireTeacherAccess` - For teachers: check approval + institution

---

## 🎯 EXPECTED BEHAVIOR

### For Approved Teachers with Institution:
- ✅ Can generate QR codes
- ✅ Can view pending approvals
- ✅ Can approve/reject requests
- ✅ Can expire QR codes

### For Unapproved Teachers:
- ❌ Get "Account Pending Approval" error (code: `TEACHER_NOT_APPROVED`)

### For Teachers Without Institution:
- ❌ Get "No institution" error (code: `TEACHER_NO_INSTITUTION`)

---

## 📝 FILES CHANGED

1. ✅ `backend/src/services/auth.service.js`
   - Added `.select('+role')` to ensure role is always included

2. ✅ `backend/src/routes/classroom-join.routes.js`
   - Added `requireTeacherAccess` to all teacher routes

---

## 🔍 DEBUGGING

If you still get errors, check the browser console for the debug object:

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "debug": {
    "userRole": "...",
    "jwtRole": "...",
    "dbRole": "...",
    "allowedRoles": ["teacher", "admin"],
    "userId": "..."
  }
}
```

**Common Issues:**
1. **JWT has old role** → User needs to re-login
2. **Teacher not approved** → Admin needs to approve
3. **Teacher has no institution** → Admin needs to assign institution
4. **Role field not in user object** → Should be fixed with `.select('+role')`

---

**Status:** ✅ **FIXES APPLIED - RESTART BACKEND AND TEST**

**Next Steps:**
1. Restart backend server
2. Have teacher log out and log back in (to refresh JWT)
3. Try generating QR code again
4. Check browser console for debug info if still failing

