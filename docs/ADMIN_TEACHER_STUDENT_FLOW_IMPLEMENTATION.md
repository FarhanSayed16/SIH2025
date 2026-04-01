# Admin → Teacher → Class → Student Flow Implementation

## ✅ Implementation Status

### **PHASE 1: Backend Foundation** ✅ COMPLETE

#### 1.1-1.2: Models Verified ✅
- **User Model**: `institutionId` validation for teachers is correct (required for teachers)
- **Class Model**: `teacherId` is optional (can be assigned later)

#### 1.3: Teacher Approval Endpoint ✅
**Created:** `PUT /api/admin/users/:userId/approve`
- **Location:** `backend/src/controllers/user.controller.js`
- **Function:** `approveUser`
- **Features:**
  - Validates user exists and is a teacher
  - Sets `approvalStatus = 'approved'`
  - Sets `approvedBy` and `approvedAt`
  - Sets `isActive = true`
  - Invalidates cache

#### 1.4: Institution Assignment Endpoint ✅
**Created:** `PUT /api/admin/users/:userId/assign-institution`
- **Location:** `backend/src/controllers/user.controller.js`
- **Function:** `assignInstitution`
- **Features:**
  - Validates institution exists
  - Updates user's `institutionId`
  - Invalidates cache

#### 1.5-1.6: Class Services ✅
- **Class Creation:** Already working correctly
  - Validates institutionId, grade, section
  - TeacherId is optional
  - Generates class code automatically
  - Prevents duplicates
  
- **Teacher Assignment:** Already working correctly
  - Allows removing teacher (empty teacherId)
  - Validates teacher exists and belongs to same institution
  - Updates class correctly

#### 1.7: Teacher Service ✅
- **`getTeacherClasses`:** Already working correctly
  - Queries classes where `teacherId` matches
  - Populates related data
  - Returns only active classes

#### 1.8: Student Join Service ✅
- **`joinClassByCode`:** Already working correctly
  - Creates `ClassroomJoinRequest` with status 'pending'
  - Updates student `classId`, `grade`, `section`, `institutionId`
  - Does NOT change `approvalStatus` (keeps it 'approved' for login)
  - Prevents duplicate joins

#### 1.9: Teacher Approval Service ✅
- **`approveStudent`:** Already working correctly
  - Updates `ClassroomJoinRequest.status` to 'approved'
  - Updates student `classId`, `grade`, `section`, `institutionId`
  - Adds student to `Class.studentIds`
  - Does NOT change `User.approvalStatus`

---

### **PHASE 2: Backend Routes** ✅ COMPLETE

#### 2.1 Admin Routes ✅
**File:** `backend/src/routes/admin.routes.js`

**Endpoints:**
- ✅ `POST /api/admin/classes` - Create class
- ✅ `GET /api/admin/classes` - List classes
- ✅ `PUT /api/admin/classes/:id/assign-teacher` - Assign teacher
- ✅ `PUT /api/admin/users/:userId/approve` - **NEW** Approve teacher
- ✅ `PUT /api/admin/users/:userId/assign-institution` - **NEW** Assign institution

#### 2.2 Teacher Routes ✅
**File:** `backend/src/routes/teacher.routes.js`

**Endpoints:**
- ✅ `GET /api/teacher/classes` - Get teacher's classes
- ✅ `GET /api/teacher/classes/:classId/students` - Get class students
- ✅ `GET /api/teacher/classes/:classId/students/pending` - Get pending students
- ✅ `POST /api/teacher/classes/:classId/students/:studentId/approve` - Approve student
- ✅ `POST /api/teacher/classes/:classId/students/:studentId/reject` - Reject student

#### 2.3 Student Routes ✅
**File:** `backend/src/routes/student.routes.js`

**Endpoints:**
- ✅ `POST /api/student/join-class` - Join class by code
- ✅ `POST /api/student/leave-class` - Leave class
- ✅ `GET /api/student/class-info` - Get class info

---

### **PHASE 3: Backend RBAC & Middleware** ✅ COMPLETE

#### 3.1 Teacher Access Control ✅
**Created:** `requireTeacherAccess` middleware
- **Location:** `backend/src/middleware/rbac.middleware.js`
- **Features:**
  - Checks `approvalStatus === 'approved'`
  - Checks `institutionId` exists
  - Checks `isActive === true`
  - Returns clear error messages

**Applied to:** All teacher routes (`backend/src/routes/teacher.routes.js`)

---

### **PHASE 4: Frontend - Admin UI** ✅ COMPLETE

#### 4.1 Admin Users Page ✅
**File:** `web/app/admin/users/page.tsx`

**Fixes:**
- ✅ Teacher approval now uses `usersApi.approveUser()`
- ✅ Institution assignment now uses `usersApi.assignInstitution()`
- ✅ Proper error handling
- ✅ Token management

#### 4.2 Admin Classes Page ✅
**File:** `web/app/admin/classes/page.tsx`

**Status:** Already working correctly
- ✅ Class creation form validation
- ✅ Teacher assignment dropdown
- ✅ Classes list refreshing
- ✅ Error messages displaying

#### 4.3 API Clients ✅
**File:** `web/lib/api/users.ts`

**Added Methods:**
- ✅ `approveUser(userId)` - Approve teacher
- ✅ `assignInstitution(userId, institutionId)` - Assign institution

---

### **PHASE 5: Frontend - Teacher UI** ⏳ PENDING

#### 5.1 Teacher Classes Page
**File:** `web/app/teacher/classes/page.tsx`

**Status:** Needs verification
- Should load classes correctly
- Should handle empty state
- Should handle teacher not approved/no institution errors

#### 5.2 Class Detail Page
**File:** `web/app/classes/[classId]/page.tsx`

**Status:** Needs verification
- Should load pending students
- Should load approved students
- Approve/reject buttons should work

---

### **PHASE 6: Frontend - Student UI** ⏳ PENDING

#### 6.1 Student Join Class Page
**File:** `web/app/student/join-class/page.tsx`

**Status:** Needs verification
- Class code input should work
- Join request should submit
- Status should show correctly

---

### **PHASE 7: Data Migration** ⏳ PENDING

#### 7.1 Data Fix Script
**Status:** Not created yet

**Needed:**
- Script to find teachers without `institutionId`
- Script to find classes without `teacherId`
- Script to find students with pending join requests
- Data integrity verification

---

## 🔧 Key Changes Made

### Backend

1. **New Endpoints:**
   - `PUT /api/admin/users/:userId/approve` - Approve teacher
   - `PUT /api/admin/users/:userId/assign-institution` - Assign institution

2. **New Middleware:**
   - `requireTeacherAccess` - Checks teacher approval + institution

3. **Updated Routes:**
   - Teacher routes now use `requireTeacherAccess` middleware

### Frontend

1. **New API Methods:**
   - `usersApi.approveUser(userId)`
   - `usersApi.assignInstitution(userId, institutionId)`

2. **Updated Admin UI:**
   - Admin users page now uses dedicated endpoints
   - Better error handling

---

## 🎯 Testing Checklist

### Admin Flow
- [ ] Admin can create a class
- [ ] Admin can assign institution to teacher
- [ ] Admin can approve teacher
- [ ] Admin can assign teacher to class
- [ ] Admin can see all classes
- [ ] Admin can see pending teachers

### Teacher Flow
- [ ] Teacher can log in (if approved + has institution)
- [ ] Teacher can see assigned classes
- [ ] Teacher can see students in classes
- [ ] Teacher can see pending students
- [ ] Teacher can approve student
- [ ] Teacher can reject student
- [ ] Teacher blocked if not approved
- [ ] Teacher blocked if no institution

### Student Flow
- [ ] Student can join class via class code
- [ ] Student sees "Pending" status
- [ ] Student is approved by teacher
- [ ] Student sees "Approved" status
- [ ] Student appears in teacher's class list

---

## 🚨 Critical Notes

1. **Teacher Access:**
   - Teachers MUST be approved (`approvalStatus = 'approved'`)
   - Teachers MUST have `institutionId` assigned
   - Teachers MUST be active (`isActive = true`)
   - All teacher routes now enforce these checks

2. **Student Approval:**
   - Students can log in immediately after registration (`approvalStatus = 'approved'`)
   - Class membership is separate (`ClassroomJoinRequest.status`)
   - Teacher approval only affects class membership, not login

3. **Data Flow:**
   - Admin → Approve Teacher → Assign Institution → Assign to Class
   - Teacher → See Classes → See Students → Approve/Reject
   - Student → Join Class → Wait for Approval → Access Class Features

---

## 📝 Next Steps

1. **Test Admin Flow:**
   - Create a class
   - Approve a teacher
   - Assign institution to teacher
   - Assign teacher to class

2. **Test Teacher Flow:**
   - Log in as approved teacher with institution
   - View assigned classes
   - View students
   - Approve/reject students

3. **Test Student Flow:**
   - Join class via class code
   - Wait for teacher approval
   - Access class features after approval

4. **Create Data Migration Script:**
   - Find and list teachers without institutionId
   - Find and list classes without teacherId
   - Find and list pending join requests

---

**Implementation Date:** 2025-01-12
**Status:** Backend Complete, Frontend Admin Complete, Teacher/Student UI Needs Verification

