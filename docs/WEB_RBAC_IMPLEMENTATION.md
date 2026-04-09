# Web Frontend RBAC Implementation

## Overview

This document describes the role-based access control (RBAC) implementation for the Kavach web frontend. The implementation ensures that users can only access routes and features appropriate for their role.

## Implementation Summary

### 1. Role Helper Functions

**File**: `web/lib/store/auth-store.ts`

Added role helper functions to the auth store:
- `isAdmin()` - Returns true if user role is 'admin'
- `isTeacher()` - Returns true if user role is 'teacher'
- `isStudent()` - Returns true if user role is 'student'
- `isParent()` - Returns true if user role is 'parent'
- `hasRole(role: string)` - Generic role checker

These functions are accessible via the `useAuthStore` hook:
```typescript
const { isAdmin, isTeacher, hasRole } = useAuthStore();
```

### 2. Route Guards

**Files**: 
- `web/components/auth/ProtectedRoute.tsx` - Requires authentication
- `web/components/auth/AdminRoute.tsx` - Requires admin role

#### ProtectedRoute
- Checks if user is authenticated
- Redirects to `/login` if not authenticated
- Shows loading state while checking auth

#### AdminRoute
- Checks if user is authenticated AND has admin role
- Redirects to `/login` if not authenticated
- Redirects to `/unauthorized` if authenticated but not admin
- Shows loading state while checking auth

**Usage**:
```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';

// For authenticated routes
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>

// For admin-only routes
<AdminRoute>
  <YourAdminComponent />
</AdminRoute>
```

### 3. Route Protection Applied

The following routes are now protected:

#### Admin-Only Routes (using `AdminRoute`):
- `/admin/crisis-dashboard` - Crisis Command Center
- `/admin/incidents` - Incident Management
- `/analytics` - Analytics Dashboard
- `/users` - User Management
- `/reports` - Reports Page

#### Authenticated Routes (using `ProtectedRoute`):
- `/dashboard` - Main Dashboard

### 4. Navigation Filtering

**File**: `web/components/layout/sidebar.tsx`

Navigation items are now filtered based on user role:

- **Admin-only items**: Crisis Command, Incidents, Analytics, Users, Reports
- **Teacher & Admin items**: Classes, QR Generator, Drills, Devices, Broadcast, Templates
- **All authenticated users**: Dashboard, Map

The sidebar dynamically shows/hides menu items based on the logged-in user's role.

### 5. Error Handling (401/403)

**File**: `web/lib/api/client.ts`

Global error interceptors handle authentication and authorization errors:

#### 401 Unauthorized
- Clears auth state (token, user)
- Redirects to `/login`
- Automatically triggered when token is invalid or expired

#### 403 Forbidden
- Shows error message (toast + alert)
- Redirects to `/unauthorized` page
- Does NOT log the user out (they're authenticated, just not authorized)
- Triggered when user tries to access admin-only resources

**Error handlers are set up in the auth store** (`web/lib/store/auth-store.ts`) and automatically configured when the store is initialized.

### 6. Unauthorized Page

**File**: `web/app/unauthorized/page.tsx`

A dedicated page for access denied scenarios:
- Shows user information (name, email, role)
- Provides navigation options (Go to Dashboard, Go Back)
- Clear messaging about insufficient permissions

## Expected Behavior

### Student Login Flow
1. Student logs in → redirected to `/dashboard`
2. Student tries to visit `/admin/crisis-dashboard` → redirected to `/unauthorized`
3. Student sees only: Dashboard, Map in sidebar
4. Student can access student-specific routes (if any)

### Teacher Login Flow
1. Teacher logs in → redirected to `/dashboard`
2. Teacher sees: Dashboard, Classes, QR Generator, Drills, Devices, Broadcast, Templates, Map
3. Teacher tries to visit `/admin/crisis-dashboard` → redirected to `/unauthorized`
4. Teacher can access teacher-specific routes

### Admin Login Flow
1. Admin logs in → redirected to `/dashboard`
2. Admin sees ALL menu items in sidebar
3. Admin can access all routes including `/admin/*`, `/analytics`, `/users`, `/reports`
4. Admin has full system access

### Unauthenticated User Flow
1. User tries to visit `/dashboard` → redirected to `/login`
2. User tries to visit `/admin/crisis-dashboard` → redirected to `/login`
3. User can only access public routes (currently `/login`)

### 401 Error Flow
1. User's token expires or becomes invalid
2. API call returns 401
3. Auth state is cleared
4. User is redirected to `/login`
5. User must log in again

### 403 Error Flow
1. Authenticated user (e.g., student) tries to access admin route
2. API call returns 403
3. Error message is shown (toast + alert)
4. User is redirected to `/unauthorized` page
5. User remains logged in (can navigate to allowed routes)

## Files Modified

1. `web/lib/store/auth-store.ts` - Added role helpers and error handlers
2. `web/lib/api/client.ts` - Added 401/403 interceptors
3. `web/components/layout/sidebar.tsx` - Added role-based navigation filtering
4. `web/components/auth/ProtectedRoute.tsx` - Created (new file)
5. `web/components/auth/AdminRoute.tsx` - Created (new file)
6. `web/app/unauthorized/page.tsx` - Created (new file)
7. `web/app/dashboard/page.tsx` - Wrapped with ProtectedRoute
8. `web/app/admin/crisis-dashboard/page.tsx` - Wrapped with AdminRoute
9. `web/app/admin/incidents/page.tsx` - Wrapped with AdminRoute
10. `web/app/analytics/page.tsx` - Wrapped with AdminRoute
11. `web/app/users/page.tsx` - Wrapped with AdminRoute
12. `web/app/reports/page.tsx` - Wrapped with AdminRoute

## Testing Checklist

- [ ] Student can log in and access `/dashboard`
- [ ] Student cannot access `/admin/crisis-dashboard` (redirected to `/unauthorized`)
- [ ] Student cannot access `/analytics` (redirected to `/unauthorized`)
- [ ] Student sees only allowed menu items in sidebar
- [ ] Teacher can log in and access `/dashboard`
- [ ] Teacher can access `/classes`, `/drills`, etc.
- [ ] Teacher cannot access `/admin/crisis-dashboard` (redirected to `/unauthorized`)
- [ ] Teacher sees appropriate menu items in sidebar
- [ ] Admin can log in and access all routes
- [ ] Admin sees all menu items in sidebar
- [ ] Unauthenticated user is redirected to `/login` when accessing protected routes
- [ ] 401 error clears auth and redirects to `/login`
- [ ] 403 error shows message and redirects to `/unauthorized` (user stays logged in)

## Notes

- Role values are lowercase: `'admin'`, `'teacher'`, `'student'`, `'parent'`
- The backend already includes `role` in the JWT payload and login response
- Route guards work on the client side (Next.js App Router)
- Server-side route protection would require middleware or API route checks
- The unauthorized page provides a user-friendly way to handle access denied scenarios

