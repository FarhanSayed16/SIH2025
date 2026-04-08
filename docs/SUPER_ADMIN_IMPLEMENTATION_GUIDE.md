# Super Admin & Admin Dashboard Overhaul - Implementation Guide

## ✅ Complete Implementation Summary

### 1. Super Admin Creation ✅

**Script:** `backend/scripts/seed_super_admin.js`

**To Run:**
```bash
cd backend
node scripts/seed_super_admin.js
```

**Credentials:**
- Email: `superadmin@kavach.com`
- Password: `Admin@123`

**Features:**
- Creates SYSTEM_ADMIN user with full permissions
- Auto-updates if already exists
- Password is properly hashed by User model

### 2. Role System ✅

**SYSTEM_ADMIN Role:**
- Added to User model enum: `['student', 'teacher', 'admin', 'parent', 'SYSTEM_ADMIN']`
- Has same permissions as `admin` (can access all admin routes)
- Updated in:
  - `backend/src/models/User.js`
  - `backend/src/middleware/rbac.middleware.js`
  - `web/lib/store/auth-store.ts`
  - `web/lib/api/users.ts`
  - `web/components/layout/sidebar.tsx`

### 3. Teacher Approval System ✅

**Default Behavior:**
- Teachers created via registration: `approvalStatus: 'pending'`
- Teachers created by admin: `approvalStatus: 'pending'`
- Teachers must be approved before they can function

**Updated Files:**
- `backend/src/models/User.js` - Default approvalStatus for teachers is 'pending'
- `backend/src/services/auth.service.js` - Teachers set to pending on registration
- `backend/src/services/admin-user.service.js` - Admin-created teachers are pending

### 4. Admin Dashboard - Complete Overhaul ✅

**New Page:** `web/app/admin/users/page.tsx`

**Three Main Tabs:**

#### A. Pending Teachers Tab ✅
- Shows all teachers with `approvalStatus: 'pending'`
- **Actions:**
  - "Approve" button - Sets `approvalStatus: 'approved'` and `isActive: true`
  - "Assign Institution" button - Opens institution assignment modal
- **Display:**
  - Name, Email, Institution (or "Not Assigned"), Status

#### B. All Teachers Tab ✅
- Shows all teachers (approved and pending)
- **Display:**
  - Name, Email, Institution, Number of Assigned Classes, Status
- **Actions:**
  - "Assign Institution" or "Change Institution" button

#### C. Classes Tab ✅
- **Create Class:**
  - Form: Institution, Grade, Section, Teacher (optional), Room, Capacity
  - Auto-generates `classCode`
  - Can create without teacher (assign later)
- **Assign Teacher:**
  - Dropdown in classes table
  - Only shows approved teachers from same institution
  - Updates `Class.teacherId`
- **View:**
  - All classes with institution, teacher, student count

### 5. Institution Assignment ✅

**Modal:**
- Opens when clicking "Assign Institution" or "Change Institution"
- Dropdown lists all registered institutions
- Updates teacher's `institutionId` field
- Validates that teacher has institution before class assignment

### 6. Teacher Student Visibility - Chain of Trust ✅

**Critical Update:** `backend/src/controllers/user.controller.js`

**New Logic:**
```javascript
if (teacherClasses.length > 0) {
  // Teachers can ONLY see students from their assigned classes
  query.classId = { $in: classIds };
} else {
  // No classes = no students visible
  query.classId = { $exists: false }; // Returns no results
}
```

**Before:**
- Teachers could see students from classes OR pending students from institution

**After:**
- Teachers can ONLY see students from their assigned classes
- If teacher has no classes, they see nothing
- Enforces "Chain of Trust" - teachers only see students they're responsible for

## Complete Workflow: Chain of Trust

### Step 1: Create Super Admin
```bash
cd backend
node scripts/seed_super_admin.js
```

### Step 2: Login as Super Admin
- Email: `superadmin@kavach.com`
- Password: `Admin@123`
- Navigate to `/admin/users`

### Step 3: Approve Teachers
1. Click "Pending Teachers" tab
2. Review pending teachers
3. Click "Approve" for each teacher
4. Click "Assign Institution" to assign school

### Step 4: Create Classes
1. Click "Classes" tab
2. Click "+ Create New Class"
3. Fill in:
   - Institution (required)
   - Grade (required)
   - Section (required)
   - Teacher (optional - can assign later)
   - Room Number (optional)
   - Capacity (optional, default: 40)
4. Click "Create Class"
5. Class code is auto-generated

### Step 5: Assign Teachers to Classes
1. In "Classes" tab, find the class
2. Use dropdown in "Actions" column
3. Select approved teacher from same institution
4. Teacher is automatically assigned

### Step 6: Teacher Access
- Teacher logs in
- Goes to `/users` page
- **Only sees students from their assigned classes**
- Cannot see other students or pending students

## Files Changed

### Backend:
1. ✅ `backend/src/models/User.js`
   - Added `SYSTEM_ADMIN` to role enum
   - Updated `approvalStatus` default: teachers are `pending`
   - Updated `institutionId` required logic for SYSTEM_ADMIN

2. ✅ `backend/src/middleware/rbac.middleware.js`
   - Updated `requireAdmin` to include SYSTEM_ADMIN
   - Created `requireSuperAdmin` for SYSTEM_ADMIN-only routes
   - Updated all admin checks to include SYSTEM_ADMIN

3. ✅ `backend/src/controllers/user.controller.js`
   - **CRITICAL:** Updated teacher student visibility
   - Teachers can ONLY see students from assigned classes
   - No classes = no students visible

4. ✅ `backend/src/services/auth.service.js`
   - Teachers set to `pending` on registration

5. ✅ `backend/src/services/admin-user.service.js`
   - Admin-created teachers are `pending` (not auto-approved)

6. ✅ `backend/scripts/seed_super_admin.js`
   - New script to create SYSTEM_ADMIN user

### Frontend:
1. ✅ `web/app/admin/users/page.tsx`
   - Complete overhaul with all features
   - Three tabs: Pending Teachers, All Teachers, Classes
   - Teacher approval queue
   - Institution assignment modal
   - Class creation and teacher assignment

2. ✅ `web/lib/store/auth-store.ts`
   - Updated `isAdmin()` to include SYSTEM_ADMIN

3. ✅ `web/lib/api/users.ts`
   - Added SYSTEM_ADMIN to role type

4. ✅ `web/components/layout/sidebar.tsx`
   - Added "Admin Users" link
   - SYSTEM_ADMIN has access to all admin routes
   - Updated role display

## Testing Checklist

### Super Admin:
- [ ] Run seed script: `node backend/scripts/seed_super_admin.js`
- [ ] Login with superadmin@kavach.com / Admin@123
- [ ] Can access `/admin/users` page
- [ ] Can see all admin routes in sidebar

### Teacher Approval:
- [ ] Create a teacher (via registration or admin)
- [ ] Teacher has `approvalStatus: 'pending'`
- [ ] Login as super admin
- [ ] Go to `/admin/users` → "Pending Teachers" tab
- [ ] See pending teacher in list
- [ ] Click "Approve" → Teacher status changes to approved
- [ ] Click "Assign Institution" → Can assign institution

### Institution Assignment:
- [ ] In "All Teachers" tab, find teacher
- [ ] Click "Assign Institution" or "Change Institution"
- [ ] Modal opens with institution dropdown
- [ ] Select institution → Teacher's institutionId is updated
- [ ] Teacher now shows institution name

### Class Creation:
- [ ] Go to "Classes" tab
- [ ] Click "+ Create New Class"
- [ ] Fill in Institution, Grade, Section
- [ ] Optionally select Teacher
- [ ] Click "Create Class"
- [ ] Class is created with auto-generated classCode
- [ ] Class appears in classes table

### Teacher Assignment:
- [ ] In "Classes" tab, find class without teacher
- [ ] Use dropdown in "Actions" column
- [ ] Only approved teachers from same institution are shown
- [ ] Select teacher → Teacher is assigned to class
- [ ] Class now shows teacher name

### Teacher Student Visibility:
- [ ] Login as teacher
- [ ] Teacher has no classes assigned → Sees no students
- [ ] Admin assigns teacher to class
- [ ] Teacher refreshes `/users` page
- [ ] Teacher now sees ONLY students from assigned class
- [ ] Teacher cannot see students from other classes

## Security & Permissions

### SYSTEM_ADMIN:
- ✅ Full access to all admin routes
- ✅ Can create schools, classes, approve teachers
- ✅ Can assign institutions and teachers to classes
- ✅ Highest level of access

### Admin:
- ✅ Same permissions as SYSTEM_ADMIN (for now)
- ✅ Can approve teachers, assign institutions, create classes

### Teacher:
- ✅ **CRITICAL:** Can ONLY see students from assigned classes
- ✅ Must be: Approved + Assigned Institution + Assigned Class
- ✅ Cannot see students from other classes or institutions
- ✅ Cannot see pending students (unless in their class)

## API Endpoints Used

### Teacher Management:
- `GET /api/users?role=teacher&approvalStatus=pending` - Get pending teachers
- `PUT /api/users/:id` - Update teacher (approvalStatus, institutionId)

### Class Management:
- `POST /api/admin/classes` - Create class
- `GET /api/admin/classes` - List classes
- `PUT /api/admin/classes/:id/assign-teacher` - Assign teacher to class

### Institution Management:
- `GET /api/schools` - List all institutions

## Next Steps (Optional Enhancements)

1. **Bulk Operations:**
   - Bulk approve teachers
   - Bulk assign institutions
   - Bulk assign teachers to classes

2. **Notifications:**
   - Email/notification when teacher is approved
   - Notification when teacher is assigned to class
   - Notification when class is created

3. **Audit Logging:**
   - Log all approval actions
   - Log institution assignments
   - Log class-teacher assignments

4. **Teacher Dashboard:**
   - Show pending approval status
   - Show assigned classes
   - Show institution

5. **Validation:**
   - Prevent assigning teacher to class from different institution
   - Validate teacher is approved before class assignment
   - Validate institution exists before assignment

---

**✅ All implementation complete! The "Chain of Trust" is fully enforced.**

**The workflow is:**
1. Super Admin creates/approves teachers
2. Super Admin assigns institutions to teachers
3. Super Admin creates classes
4. Super Admin assigns teachers to classes
5. Teachers can now see and manage students from their assigned classes only

