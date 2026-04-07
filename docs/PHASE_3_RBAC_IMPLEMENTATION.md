# Phase 3: Simple RBAC Implementation (Non-Breaking)

## Summary

Implemented role-based access control (RBAC) middleware verification and route protection **without changing any role values or schema structure**. All existing lowercase roles (`'student'`, `'teacher'`, `'admin'`, `'parent'`) are kept as-is.

---

## A. RBAC Middleware Verification & Fixes

### Fixed: `requireRole` Middleware

**File**: `backend/src/middleware/rbac.middleware.js`

**Changes**:
- ✅ Now checks both `req.userRole` (from JWT) **AND** `req.user.role` (from DB) for reliability
- ✅ Returns proper 403 error if role not found
- ✅ Returns proper 403 error if role not in allowed list
- ✅ Logs access denials for security monitoring

**Before**:
```javascript
if (!req.user || !req.userRole) {
  return errorResponse(res, 'Authentication required', 401);
}
if (!allowedRoles.includes(req.userRole)) {
  return errorResponse(res, 'Insufficient permissions', 403);
}
```

**After**:
```javascript
if (!req.user) {
  return errorResponse(res, 'Authentication required', 401);
}

// Get role from JWT (req.userRole) or from user object (req.user.role)
const userRole = req.userRole || req.user.role;

if (!userRole) {
  logger.warn(`User role not found for user ${req.userId || req.user._id} on ${req.path}`);
  return errorResponse(res, 'User role not found', 403);
}

if (!allowedRoles.includes(userRole)) {
  logger.warn(`Access denied for role '${userRole}' to ${req.method} ${req.path}`);
  return errorResponse(res, 'Insufficient permissions', 403);
}
```

### Fixed: Other RBAC Middleware Functions

Updated these functions to also check both `req.userRole` and `req.user.role`:
- ✅ `requireOwnershipOrAdmin`
- ✅ `requireSameInstitution`
- ✅ `requireOwnershipOrTeacherAdmin`

---

## B. Admin Routes Protected

Applied `requireAdmin` middleware to the following admin-only routes:

### 1. User Management Routes (`backend/src/routes/user.routes.js`)
- ✅ `POST /api/users/bulk` - Bulk user operations (already had `requireAdmin`)
- ✅ `GET /api/users/export` - Export users (already had `requireAdmin`)
- ✅ `GET /api/users/` - List users (uses `requireTeacher` - allows teachers and admins)

### 2. Institution Management Routes (`backend/src/routes/school.routes.js`)
- ✅ `POST /api/schools/` - Create school (already had `requireAdmin`)
- ✅ `PUT /api/schools/:id` - Update school (already had `requireAdmin`)

### 3. Admin Dashboard Routes (`backend/src/routes/admin.routes.js`)
- ✅ All routes in `/api/admin/*` (already had `requireAdmin` applied globally)

### 4. Analytics Routes (`backend/src/routes/analytics.routes.js`)
- ✅ `GET /api/analytics/institution` - Institution-level analytics (**NEWLY ADDED**)

### 5. Audit Routes (`backend/src/routes/audit.routes.js`)
- ✅ `GET /api/audit/logs` - Get audit logs (**NEWLY ADDED**)
- ✅ `GET /api/audit/security` - Get security events (**NEWLY ADDED**)
- ✅ `GET /api/audit/suspicious` - Get suspicious activities (**NEWLY ADDED**)

### 6. Security Routes (`backend/src/routes/security.routes.js`)
- ✅ `GET /api/security/stats` - Get security statistics (**NEWLY ADDED**)

### 7. Incident Routes (`backend/src/routes/incident.routes.js`)
- ✅ `GET /api/incidents/export/pdf` - Export incident report (already had `requireAdmin`)

---

## C. Routes NOT Protected (Student/Teacher Access)

These routes remain accessible to authenticated users without role restrictions:

- ✅ Student learning routes (modules, games, quizzes)
- ✅ Teacher lesson routes (classroom management, student approval)
- ✅ Normal login/profile routes (`/api/auth/*`)
- ✅ Personal profile routes (`/api/users/:id` - own profile)
- ✅ Analytics routes (except institution-level)

---

## D. Example Routes with requireRole

### Example 1: Admin Routes (`backend/src/routes/admin.routes.js`)

```javascript
// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

router.post('/classes', ...); // Admin only
router.get('/classes', ...);  // Admin only
router.put('/classes/:id', ...); // Admin only
```

### Example 2: Analytics Institution Route (`backend/src/routes/analytics.routes.js`)

```javascript
router.use(authenticate); // All routes require auth

// Institution analytics - Admin only
router.get('/institution', requireAdmin, getInstitutionMetrics);

// Other analytics - Available to all authenticated users
router.get('/drills', getDrillMetrics);
router.get('/students/progress', getStudentProgress);
```

### Example 3: Audit Routes (`backend/src/routes/audit.routes.js`)

```javascript
// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

router.get('/logs', ...); // Admin only
router.get('/security', ...); // Admin only
router.get('/suspicious', ...); // Admin only
```

---

## E. Verification Checklist

### ✅ Auth Middleware (`backend/src/middleware/auth.middleware.js`)
- Reads JWT from `Authorization: Bearer <token>` header
- Verifies token using existing JWT_SECRET
- Attaches `req.user`, `req.userId`, `req.userRole` to request
- Returns 401 if token missing or invalid

### ✅ RBAC Middleware (`backend/src/middleware/rbac.middleware.js`)
- `requireRole([...])` checks both `req.userRole` and `req.user.role`
- Returns 403 (not 500) for insufficient permissions
- Logs access denials for monitoring

### ✅ Route Protection
- Admin routes protected with `requireAdmin`
- Student/teacher routes remain accessible
- No breaking changes to existing API contracts

---

## Files Modified

1. ✅ `backend/src/middleware/rbac.middleware.js` - Fixed role checking logic
2. ✅ `backend/src/routes/analytics.routes.js` - Added `requireAdmin` to institution route
3. ✅ `backend/src/routes/audit.routes.js` - Added `requireAdmin` to all routes
4. ✅ `backend/src/routes/security.routes.js` - Added `requireAdmin` to all routes

---

## Testing Recommendations

### Test Case 1: Student Login
- ✅ Student can login
- ✅ Student can access student routes (modules, games)
- ✅ Student gets 403 when accessing admin routes

### Test Case 2: Teacher Login
- ✅ Teacher can login
- ✅ Teacher can access teacher routes (classroom management)
- ✅ Teacher can list users (for student approval)
- ✅ Teacher gets 403 when accessing admin-only routes (audit, security)

### Test Case 3: Admin Login
- ✅ Admin can login
- ✅ Admin can access all admin routes (user management, institution management, audit, security)
- ✅ Admin can access student/teacher routes

### Test Case 4: Unauthorized Access
- ✅ Request without token → 401
- ✅ Request with invalid token → 401
- ✅ Student accessing admin route → 403
- ✅ Teacher accessing admin-only route → 403

---

## Summary

✅ **RBAC middleware verified and fixed** - Now checks both JWT role and DB role  
✅ **Admin routes protected** - User management, institution management, audit, security routes  
✅ **No breaking changes** - Existing roles, schema, and API contracts unchanged  
✅ **Proper error handling** - Returns 403 (not 500) for insufficient permissions  
✅ **Security logging** - Access denials are logged for monitoring

The system is now ready for role-based access control without any breaking changes to existing functionality.

