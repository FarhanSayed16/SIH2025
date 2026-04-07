# QR Code Generation Permission Fix
**Date:** 2025-12-01  
**Status:** ✅ **FIX APPLIED**

---

## 🔍 ISSUE

**Error:** "Insufficient permissions" when teacher tries to generate QR code

**Root Cause:**
- `requireRole` middleware was checking `req.userRole` (from JWT) first
- JWT token might have stale role data
- Should prefer database role (`req.user.role`) over JWT role for accuracy

---

## ✅ FIX APPLIED

### Enhanced Role Checking
**File:** `backend/src/middleware/rbac.middleware.js`

**Change:**
- Prefer database role (`req.user.role`) over JWT role (`req.userRole`)
- Added better logging to show both JWT and DB roles when access is denied
- This ensures we use the most up-to-date role from the database

**Code:**
```javascript
// Before: Checked JWT role first
const userRole = req.userRole || req.user.role;

// After: Check database role first (more accurate)
const userRole = req.user.role || req.userRole;
```

**Enhanced Logging:**
- Shows both JWT and DB roles when access is denied
- Shows allowed roles for debugging

---

## 🎯 EXPECTED BEHAVIOR

1. **Approved teacher with institution** → Can generate QR code → ✅ Works
2. **Unapproved teacher** → Gets "Account Pending Approval" → ✅ Clear error
3. **Teacher without institution** → Gets "No institution" error → ✅ Clear error
4. **Admin** → Can generate QR code → ✅ Works (bypasses teacher checks)

---

## 📝 FILES CHANGED

1. ✅ `backend/src/middleware/rbac.middleware.js`
   - Prefer database role over JWT role
   - Enhanced logging for debugging

---

## 🔍 DEBUGGING

If you still get "Insufficient permissions", check the backend logs for:
- `Access denied for role 'X' (JWT: Y, DB: Z)`
- This will show if there's a mismatch between JWT and database roles

**Common Issues:**
1. **JWT has old role** → Database role is checked first, so this should be fixed
2. **User role in DB is not 'teacher'** → Check user's role in database
3. **Token not being sent** → Check frontend is sending Authorization header

---

**Status:** ✅ **FIX APPLIED - RESTART BACKEND AND TEST**

