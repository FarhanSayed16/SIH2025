# Teacher → Class → Student Flow Implementation Plan

## 📋 Document Purpose

This document outlines the complete implementation plan for the **Teacher → Class → Student** flow in the KAVACH platform. This plan is based on Phase A analysis of the existing codebase and ensures compatibility with the current `userType` refactor (account_user vs roster_record).

**⚠️ CRITICAL CONSTRAINTS:**
- The `userType` + auth refactor is **ALREADY DONE** and must **NOT** be changed
- Only extend existing logic to support classes, class codes, and teacher approval flows
- All changes must be backward compatible

---

## 🔍 PHASE A: CURRENT STATE ANALYSIS

### A1. Existing Models

#### ✅ User Model (`backend/src/models/User.js`)
**Current Fields:**
- `userType`: `'account_user'` | `'roster_record'` ✅ (Already refactored)
- `role`: `'student'` | `'teacher'` | `'admin'` | `'parent'` ✅
- `approvalStatus`: `'pending'` | `'approved'` | `'rejected'` ✅
- `grade`: String (KG, 1-12) ✅
- `section`: String (A, B, C, etc.) ✅
- `classId`: ObjectId (ref: 'Class') ✅ **EXISTS**
- `institutionId`: ObjectId (ref: 'School') ✅
- `email`, `password`: Required for `account_user`, optional for `roster_record` ✅

**Status:** ✅ **READY** - All required fields exist

#### ✅ Class Model (`backend/src/models/Class.js`)
**Current Fields:**
- `_id`: ObjectId ✅
- `institutionId`: ObjectId (ref: 'School') ✅
- `grade`: String (KG, 1-12) ✅
- `section`: String ✅
- `classCode`: String (unique, auto-generated) ✅ **EXISTS**
- `teacherId`: ObjectId (ref: 'User') ✅ **EXISTS** (single teacher)
- `studentIds`: Array of ObjectIds (ref: 'User') ✅
- `joinQRCode`: String (for QR-based joining) ✅
- `joinQRExpiresAt`: Date ✅
- `pendingJoinRequests`: Array of ObjectIds (ref: 'ClassroomJoinRequest') ✅

**Status:** ✅ **READY** - All required fields exist, but:
- ⚠️ **LIMITATION**: Currently supports only **single teacher** (`teacherId`), not multiple teachers
- **DECISION NEEDED**: Do we need to support multiple teachers per class? (For now, assume single teacher)

#### ✅ ClassroomJoinRequest Model (`backend/src/models/ClassroomJoinRequest.js`)
**Current Fields:**
- `studentId`: ObjectId (ref: 'User') ✅
- `classId`: ObjectId (ref: 'Class') ✅
- `teacherId`: ObjectId (ref: 'User') ✅
- `qrCode`: String ✅
- `status`: `'pending'` | `'approved'` | `'rejected'` | `'expired'` ✅
- `requestedAt`, `expiresAt`, `approvedAt`, `rejectedAt` ✅
- `rejectionReason`, `notes` ✅

**Status:** ✅ **EXISTS** - Used for QR-based joining, but NOT for direct classCode registration

---

### A2. Existing Routes & Controllers

#### ✅ Admin Routes (`backend/src/routes/admin.routes.js`)
**Current Endpoints:**
- `POST /api/admin/classes` - Create class ✅
- `GET /api/admin/classes` - List classes ✅
- `GET /api/admin/classes/:id` - Get class by ID ✅
- `PUT /api/admin/classes/:id` - Update class ✅
- `POST /api/admin/users/teacher` - Create teacher ✅
- `POST /api/admin/users/student` - Create student (roster) ✅

**Status:** ✅ **READY** - Admin can create classes and assign teachers

#### ✅ Teacher Routes (`backend/src/routes/teacher.routes.js`)
**Current Endpoints:**
- `GET /api/teacher/classes` - Get teacher's classes ✅
- `GET /api/teacher/classes/:classId/students` - Get students in class ✅
- `POST /api/teacher/classes/:classId/drills/start` - Start drill ✅
- Various other teacher endpoints ✅

**Status:** ⚠️ **PARTIAL** - Missing:
- Endpoint to get pending students for approval
- Endpoint to approve/reject students
- Endpoint to add roster students (KG-4)

#### ✅ Classroom Join Routes (`backend/src/routes/classroom-join.routes.js`)
**Current Endpoints:**
- `POST /api/classroom/:classId/qr/generate` - Generate QR code ✅
- `POST /api/classroom/join/scan` - Scan QR code and create join request ✅
- `GET /api/classroom/:classId/join-requests` - Get pending requests ✅
- `POST /api/classroom/join-requests/:requestId/approve` - Approve request ✅
- `POST /api/classroom/join-requests/:requestId/reject` - Reject request ✅

**Status:** ✅ **EXISTS** - But this is for **QR-based joining**, not direct classCode registration

#### ✅ Auth Routes (`backend/src/routes/auth.routes.js`)
**Current Endpoints:**
- `POST /api/auth/register` - User registration ✅

**Status:** ⚠️ **NEEDS MODIFICATION** - Currently:
- Does NOT require `classCode` for student registration
- Does NOT link student to class during registration
- Sets `approvalStatus = 'pending'` for students ✅ (Already correct)

#### ✅ Roster Routes (`backend/src/routes/roster.routes.js`)
**Current Endpoints:**
- `POST /api/roster/:classId/students` - Create roster record (KG-4) ✅
- `GET /api/roster/:classId/students` - Get class roster ✅

**Status:** ✅ **READY** - Can create roster students for KG-4

---

### A3. Current Registration Flow

**File:** `backend/src/services/auth.service.js` → `registerUser()`

**Current Behavior:**
1. ✅ Accepts `email`, `password`, `name`, `role`, `phone`
2. ✅ Sets `userType = 'account_user'` for all registrations ✅ (Correct)
3. ✅ Sets `approvalStatus = 'pending'` for students ✅ (Correct)
4. ✅ Sets `approvalStatus = 'approved'` for teachers/admins ✅ (Correct)
5. ❌ Does NOT accept `classCode`
6. ❌ Does NOT look up class by `classCode`
7. ❌ Does NOT set `classId` on student
8. ❌ Does NOT set `institutionId` from class

**Status:** ⚠️ **NEEDS MODIFICATION** - Must add classCode support

---

### A4. Current Teacher Approval Flow

**Current State:**
- ✅ Teachers can view their classes via `GET /api/teacher/classes`
- ✅ Teachers can view students in their classes via `GET /api/teacher/classes/:classId/students`
- ✅ Teachers can approve/reject **QR-based join requests** via classroom-join routes
- ❌ Teachers **CANNOT** approve/reject students who registered directly with classCode
- ❌ No endpoint to get pending students (filtered by `approvalStatus = 'pending'`)
- ✅ Admin can approve students via `PUT /api/users/:id` (sets `approvalStatus`)

**Status:** ⚠️ **INCOMPLETE** - Need teacher-specific approval endpoints

---

### A5. Current Roster Creation Flow

**File:** `backend/src/services/roster-management.service.js` → `createRosterRecord()`

**Current Behavior:**
1. ✅ Creates `userType = 'roster_record'` ✅ (Correct)
2. ✅ Sets `approvalStatus = 'approved'` ✅ (Correct)
3. ✅ Links to class via `classId` ✅ (Correct)
4. ✅ Only allows KG-4 grades ✅ (Correct)
5. ✅ No email/password required ✅ (Correct)

**Status:** ✅ **READY** - Already works correctly

---

## 📊 SUMMARY: What Exists vs What's Missing

### ✅ What EXISTS and Works:

1. **Models:**
   - ✅ User model with all required fields (`classId`, `approvalStatus`, `userType`)
   - ✅ Class model with `classCode`, `teacherId`, `studentIds`
   - ✅ ClassroomJoinRequest model (for QR-based joining)

2. **Admin Functionality:**
   - ✅ Admin can create classes
   - ✅ Admin can assign teachers to classes
   - ✅ Admin can create roster students (KG-4)

3. **Teacher Functionality:**
   - ✅ Teachers can view their classes
   - ✅ Teachers can view students in their classes
   - ✅ Teachers can approve/reject QR-based join requests

4. **Registration:**
   - ✅ Registration sets `userType = 'account_user'` correctly
   - ✅ Registration sets `approvalStatus = 'pending'` for students correctly

5. **Roster Management:**
   - ✅ Can create roster records (KG-4) correctly

### ⚠️ What's MISSING or Needs Modification:

1. **Student Registration:**
   - ❌ Registration does NOT accept `classCode`
   - ❌ Registration does NOT look up class by `classCode`
   - ❌ Registration does NOT link student to class (`classId`)
   - ❌ Registration does NOT set `institutionId` from class

2. **Teacher Approval:**
   - ❌ No endpoint to get pending students for a class
   - ❌ No endpoint for teachers to approve students (only QR join requests)
   - ❌ No endpoint for teachers to reject students (only QR join requests)

3. **Teacher Roster Creation:**
   - ⚠️ Roster creation exists but may need to be exposed via teacher routes

4. **Web UI:**
   - ❌ Admin UI may need class management enhancements
   - ❌ Teacher UI missing pending student approval interface
   - ❌ Teacher UI missing roster student creation interface

5. **Mobile UI:**
   - ❌ Registration screen does NOT have classCode field
   - ❌ Registration does NOT send classCode to backend

---

## 🎯 PHASE B: BACKEND IMPLEMENTATION PLAN

### B1. Models & Relationships - NO CHANGES NEEDED ✅

**Decision:** All required models and fields already exist. No model changes required.

**Verification:**
- ✅ User model has `classId`, `approvalStatus`, `userType`
- ✅ Class model has `classCode`, `teacherId`, `studentIds`
- ✅ Relationships are properly defined

**Action:** None required.

---

### B2. Student Registration with ClassCode

**File to Modify:** `backend/src/services/auth.service.js` → `registerUser()`

**Changes Required:**

1. **Accept `classCode` in registration:**
   - Add `classCode` to `userData` parameter validation
   - For `role === 'student'`, require `classCode` (validation middleware)

2. **Look up class by `classCode`:**
   ```javascript
   // In registerUser(), after role check
   if (userData.role === 'student') {
     if (!userData.classCode) {
       throw new Error('Class code is required for student registration');
     }
     
     // Look up class by classCode
     const Class = (await import('../models/Class.js')).default;
     const classData = await Class.findOne({ 
       classCode: userData.classCode.trim(),
       isActive: true 
     });
     
     if (!classData) {
       const error = new Error('Invalid class code');
       error.fieldErrors = { classCode: 'Invalid class code' };
       throw error;
     }
     
     // Set classId and institutionId from class
     userDataToCreate.classId = classData._id;
     userDataToCreate.institutionId = classData.institutionId;
     userDataToCreate.grade = classData.grade;
     userDataToCreate.section = classData.section;
   }
   ```

3. **Link student to class:**
   - After creating user, call `classData.addStudent(user._id)` to add to `studentIds` array

4. **Update validation middleware:**
   - File: `backend/src/routes/auth.routes.js`
   - Add: `body('classCode').trim().notEmpty().withMessage('Class code is required')` for student role

**Files to Modify:**
- `backend/src/services/auth.service.js`
- `backend/src/routes/auth.routes.js` (validation)

**Testing:**
- ✅ Register student with valid classCode → Should link to class
- ✅ Register student with invalid classCode → Should return 400 error
- ✅ Register student without classCode → Should return 400 error
- ✅ Verify `classId`, `institutionId`, `grade`, `section` are set from class
- ✅ Verify student is added to class's `studentIds` array

---

### B3. Teacher Approval Endpoints

**New File:** `backend/src/routes/teacher.routes.js` (extend existing)

**New Endpoints to Add:**

1. **Get Pending Students for a Class:**
   ```
   GET /api/teacher/classes/:classId/students/pending
   ```
   - Returns students with `classId` matching and `approvalStatus = 'pending'`
   - Verify teacher owns the class

2. **Approve Student:**
   ```
   POST /api/teacher/classes/:classId/students/:studentId/approve
   Body: { notes?: string }
   ```
   - Sets student's `approvalStatus = 'approved'`
   - Sets `approvedBy = teacherId`
   - Sets `approvedAt = Date.now()`
   - Verify teacher owns the class
   - Verify student belongs to the class

3. **Reject Student:**
   ```
   POST /api/teacher/classes/:classId/students/:studentId/reject
   Body: { reason?: string }
   ```
   - Sets student's `approvalStatus = 'rejected'`
   - Sets `rejectedBy = teacherId`
   - Sets `rejectedAt = Date.now()`
   - Sets `rejectionReason = reason`
   - Verify teacher owns the class
   - Verify student belongs to the class

**New Service Functions:**

**File:** `backend/src/services/teacher.service.js` (extend existing)

```javascript
// Get pending students for a class
export const getPendingStudents = async (classId, teacherId) => {
  // Verify teacher owns class
  // Query User.find({ classId, approvalStatus: 'pending' })
  // Return students
};

// Approve student
export const approveStudent = async (classId, studentId, teacherId, notes) => {
  // Verify teacher owns class
  // Verify student belongs to class
  // Update student: approvalStatus = 'approved', approvedBy, approvedAt
  // Return updated student
};

// Reject student
export const rejectStudent = async (classId, studentId, teacherId, reason) => {
  // Verify teacher owns class
  // Verify student belongs to class
  // Update student: approvalStatus = 'rejected', rejectedBy, rejectedAt, rejectionReason
  // Return updated student
};
```

**Files to Create/Modify:**
- `backend/src/services/teacher.service.js` (add new functions)
- `backend/src/controllers/teacher.controller.js` (add new controllers)
- `backend/src/routes/teacher.routes.js` (add new routes)

**RBAC Protection:**
- Use `authenticate` middleware
- Use `requireRole(['teacher', 'admin'])` middleware
- In service functions, verify `classData.teacherId === teacherId`

**Testing:**
- ✅ Teacher can get pending students for their class
- ✅ Teacher can approve student in their class
- ✅ Teacher can reject student in their class
- ✅ Teacher CANNOT approve/reject students in other classes
- ✅ Admin can approve/reject any student

---

### B4. Teacher Roster Creation Endpoint

**Decision:** Reuse existing roster service, but expose via teacher routes

**New Endpoint:**
```
POST /api/teacher/classes/:classId/roster-students
Body: {
  name: string,
  parentName?: string,
  parentPhone?: string,
  notes?: string
}
```

**Implementation:**
- Reuse `createRosterRecord()` from `roster-management.service.js`
- Add route in `teacher.routes.js`
- Verify teacher owns the class
- Verify class grade is KG-4

**Files to Modify:**
- `backend/src/routes/teacher.routes.js` (add route)
- `backend/src/controllers/teacher.controller.js` (add controller)

**Testing:**
- ✅ Teacher can create roster student for KG-4 class
- ✅ Teacher CANNOT create roster student for 5th+ class
- ✅ Teacher CANNOT create roster student in other classes

---

### B5. Admin: Assign/Reassign Teachers to Classes

**Current State:** Admin can create class with `teacherId` in `POST /api/admin/classes`

**Enhancement Needed:**
- Add endpoint to reassign teacher: `PUT /api/admin/classes/:classId/assign-teacher`
- Body: `{ teacherId: string }`

**Files to Modify:**
- `backend/src/controllers/class.controller.js` (add controller)
- `backend/src/routes/admin.routes.js` (add route)

**Testing:**
- ✅ Admin can reassign teacher to class
- ✅ Old teacher loses access, new teacher gains access

---

## 🎨 PHASE C: WEB IMPLEMENTATION PLAN

### C1. Admin Web - Class Management

**Files to Check/Create:**
- `web/app/admin/classes/page.tsx` (may exist)
- `web/app/admin/classes/[classId]/page.tsx` (may need)

**Features to Add:**

1. **Create Class Page:**
   - Form: `grade`, `section`, `teacherId` (dropdown), `roomNumber`, `capacity`
   - On submit: `POST /api/admin/classes`
   - Show generated `classCode` after creation

2. **List Classes Page:**
   - Table: Grade, Section, Teacher, Class Code, Student Count, Actions
   - Filter by institution, grade, teacher
   - Actions: View, Edit, Assign Teacher, Delete

3. **Class Details Page:**
   - Show class info
   - Show students (approved + pending)
   - Button: "Reassign Teacher"

**Files to Create/Modify:**
- `web/app/admin/classes/page.tsx`
- `web/app/admin/classes/[classId]/page.tsx`
- `web/lib/api/classes.ts` (if not exists)

---

### C2. Teacher Web - Student Approval

**Files to Check/Create:**
- `web/app/teacher/classes/page.tsx` (may exist)
- `web/app/teacher/classes/[classId]/page.tsx` (may exist)
- `web/app/teacher/classes/[classId]/approvals/page.tsx` (may exist)

**Features to Add:**

1. **My Classes Page:**
   - List teacher's classes
   - Show pending count badge
   - Link to class details

2. **Class Details Page:**
   - Tabs: "All Students", "Pending Approval", "Roster Students"
   - **Pending Approval Tab:**
     - Table: Name, Email, Grade, Section, Requested Date, Actions
     - Actions: Approve, Reject
   - **All Students Tab:**
     - Show approved students
   - **Roster Students Tab (for KG-4 only):**
     - Button: "Add Roster Student"
     - Form: Name, Parent Name, Parent Phone
     - Table: Roster students (cannot login)

3. **Approval Actions:**
   - Approve button → `POST /api/teacher/classes/:classId/students/:studentId/approve`
   - Reject button → `POST /api/teacher/classes/:classId/students/:studentId/reject` (with reason modal)

**Files to Create/Modify:**
- `web/app/teacher/classes/[classId]/page.tsx`
- `web/app/teacher/classes/[classId]/approvals/page.tsx` (if separate page)
- `web/lib/api/teacher.ts` (add approval endpoints)

---

## 📱 PHASE D: MOBILE (FLUTTER) IMPLEMENTATION PLAN

### D1. Registration Screen Enhancement

**File:** `mobile/lib/features/auth/screens/register_screen.dart`

**Changes Required:**

1. **Add ClassCode Field:**
   - Add `_classCodeController` (TextEditingController)
   - Add `_classCodeError` (String?)
   - Add `_classCodeTouched` (bool)
   - Add `TextInputCustom` widget for "Class Code" field
   - Show field only when `_selectedRole == 'student'`
   - Mark as `required: true`

2. **Validation:**
   - `_validateClassCode()`: Check non-empty
   - Add to `_isCurrentStepValid()` check

3. **API Call:**
   - In `_handleRegister()`, add `classCode: _classCodeController.text.trim()` to payload
   - Handle backend errors for invalid classCode

**Files to Modify:**
- `mobile/lib/features/auth/screens/register_screen.dart`
- `mobile/lib/features/auth/providers/auth_provider.dart` (add classCode parameter)
- `mobile/lib/features/auth/services/auth_service.dart` (add classCode to payload)

**Testing:**
- ✅ ClassCode field appears only for student role
- ✅ Validation prevents submission without classCode
- ✅ Invalid classCode shows error message
- ✅ Valid classCode successfully registers student

---

### D2. Post-Registration Approval Pending Screen

**File:** `mobile/lib/features/auth/screens/approval_pending_screen.dart` (already exists)

**Current State:** ✅ Already exists and shows pending approval message

**Enhancement Needed:**
- Verify it shows correct message for classCode-based registration
- Ensure it doesn't auto-login (already fixed in previous refactor)

**Files to Check:**
- `mobile/lib/features/auth/screens/approval_pending_screen.dart`

**Testing:**
- ✅ After registration with classCode, shows "Pending Teacher Approval"
- ✅ User cannot access app features until approved
- ✅ Back button logs out (already implemented)

---

### D3. Login Screen - Approval Status Check

**File:** `mobile/lib/features/auth/screens/login_screen.dart`

**Current State:** ✅ Already checks `approvalStatus` and shows pending message

**Verification Needed:**
- Ensure login blocks students with `approvalStatus !== 'approved'`
- Ensure error message is user-friendly

**Files to Check:**
- `mobile/lib/features/auth/screens/login_screen.dart`
- `mobile/lib/features/auth/services/auth_service.dart` (login error handling)

**Testing:**
- ✅ Pending student cannot access app
- ✅ Approved student can access app
- ✅ Rejected student sees rejection message

---

## 📝 IMPLEMENTATION CHECKLIST

### Backend Tasks:

- [ ] **B2.1** Modify `auth.service.js` → `registerUser()` to accept and validate `classCode`
- [ ] **B2.2** Add class lookup by `classCode` in registration
- [ ] **B2.3** Link student to class (`classId`, `institutionId`, `grade`, `section`)
- [ ] **B2.4** Add student to class's `studentIds` array
- [ ] **B2.5** Update `auth.routes.js` validation middleware for `classCode`
- [ ] **B3.1** Create `getPendingStudents()` service function
- [ ] **B3.2** Create `approveStudent()` service function
- [ ] **B3.3** Create `rejectStudent()` service function
- [ ] **B3.4** Add teacher approval controllers
- [ ] **B3.5** Add teacher approval routes
- [ ] **B4.1** Add teacher roster creation route
- [ ] **B5.1** Add admin teacher reassignment endpoint

### Web Tasks:

- [ ] **C1.1** Create/update admin class management pages
- [ ] **C1.2** Add class creation form
- [ ] **C1.3** Add class list with filters
- [ ] **C1.4** Add teacher reassignment UI
- [ ] **C2.1** Create/update teacher class pages
- [ ] **C2.2** Add pending students approval UI
- [ ] **C2.3** Add approve/reject buttons and modals
- [ ] **C2.4** Add roster student creation UI (KG-4)

### Mobile Tasks:

- [ ] **D1.1** Add classCode field to registration screen
- [ ] **D1.2** Add classCode validation
- [ ] **D1.3** Update registration API call to include classCode
- [ ] **D1.4** Handle classCode validation errors
- [ ] **D2.1** Verify approval pending screen works correctly
- [ ] **D3.1** Verify login approval status check works

---

## 🔄 EXAMPLE FLOWS

### Flow 1: Student (Grade 8) Registers with ClassCode

1. **Student opens mobile app → Registration screen**
2. **Fills form:** Name, Email, Password, Phone, Role = Student
3. **Enters ClassCode:** "S507f1d77e1f8-8-A"
4. **Submits registration**
5. **Backend:**
   - Validates classCode → Finds class
   - Creates user: `userType = 'account_user'`, `approvalStatus = 'pending'`
   - Sets `classId`, `institutionId`, `grade`, `section` from class
   - Adds student to class's `studentIds` array
6. **Mobile:** Shows "Pending Approval" screen
7. **Teacher logs into web → Sees pending student in class**
8. **Teacher clicks "Approve"**
9. **Backend:** Sets `approvalStatus = 'approved'`
10. **Student can now login and access app**

### Flow 2: Teacher Adds KG Roster Student

1. **Teacher logs into web → Selects KG class**
2. **Clicks "Add Roster Student"**
3. **Fills form:** Name, Parent Name, Parent Phone
4. **Submits**
5. **Backend:**
   - Creates user: `userType = 'roster_record'`, `approvalStatus = 'approved'`
   - No email/password
   - Links to class
6. **Student appears in class roster**
7. **Student CANNOT login** (roster_record blocked)

---

## ⚠️ CRITICAL DECISIONS & NOTES

### Decision 1: Single vs Multiple Teachers per Class
**Current:** Class model has `teacherId` (single teacher)
**Decision:** Keep single teacher for now. If needed later, can add `teacherIds` array.

### Decision 2: ClassCode Format
**Current:** Auto-generated as `S{institutionId}-{grade}-{section}`
**Decision:** Keep current format. Students enter this code during registration.

### Decision 3: Registration vs QR Joining
**Current:** Two separate flows:
- QR-based joining → Uses `ClassroomJoinRequest` model
- Direct registration → Will use `classCode` (NEW)

**Decision:** Keep both flows. QR is for in-person scanning, classCode is for manual entry.

### Decision 4: Approval Status on User vs Enrollment
**Current:** `approvalStatus` is on User model
**Decision:** Keep on User model. No separate Enrollment model needed.

### Decision 5: Teacher Access Control
**Current:** Teachers can only see their own classes
**Decision:** Maintain this. Teachers can only approve students in their classes.

---

## 🧪 TESTING STRATEGY

### Backend Testing:
1. **Registration with classCode:**
   - Valid classCode → Success, student linked to class
   - Invalid classCode → 400 error
   - Missing classCode → 400 error

2. **Teacher Approval:**
   - Teacher approves student in their class → Success
   - Teacher tries to approve student in other class → 403 error
   - Admin approves any student → Success

3. **Roster Creation:**
   - Teacher creates roster for KG-4 → Success
   - Teacher tries to create roster for 5th+ → 400 error

### Web Testing:
1. **Admin creates class → ClassCode generated**
2. **Teacher views pending students → Sees only their classes**
3. **Teacher approves student → Student status updates**

### Mobile Testing:
1. **Student registers with classCode → Pending screen shown**
2. **Student tries to login before approval → Blocked**
3. **Student logs in after approval → Success**

---

## 📚 FILES SUMMARY

### Backend Files to Modify:
- `backend/src/services/auth.service.js` (registration with classCode)
- `backend/src/routes/auth.routes.js` (validation)
- `backend/src/services/teacher.service.js` (approval functions)
- `backend/src/controllers/teacher.controller.js` (approval controllers)
- `backend/src/routes/teacher.routes.js` (approval routes)
- `backend/src/controllers/class.controller.js` (teacher reassignment)
- `backend/src/routes/admin.routes.js` (teacher reassignment route)

### Web Files to Create/Modify:
- `web/app/admin/classes/page.tsx`
- `web/app/admin/classes/[classId]/page.tsx`
- `web/app/teacher/classes/[classId]/page.tsx`
- `web/app/teacher/classes/[classId]/approvals/page.tsx`
- `web/lib/api/classes.ts`
- `web/lib/api/teacher.ts`

### Mobile Files to Modify:
- `mobile/lib/features/auth/screens/register_screen.dart`
- `mobile/lib/features/auth/providers/auth_provider.dart`
- `mobile/lib/features/auth/services/auth_service.dart`

---

## ✅ READINESS CHECKLIST

Before starting implementation, verify:

- [x] User model has all required fields
- [x] Class model has `classCode` and `teacherId`
- [x] Registration sets `userType = 'account_user'` correctly
- [x] Registration sets `approvalStatus = 'pending'` for students
- [x] Roster creation works for KG-4
- [x] Teacher routes exist
- [x] Admin routes exist
- [ ] **READY TO PROCEED** ✅

---

## 🚀 NEXT STEPS

1. **Review this plan** with team
2. **Confirm decisions** (single teacher, classCode format, etc.)
3. **Start with Phase B** (Backend implementation)
4. **Test backend** thoroughly before moving to Phase C
5. **Implement Phase C** (Web)
6. **Implement Phase D** (Mobile)
7. **End-to-end testing**

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-30  
**Status:** ✅ Ready for Implementation

