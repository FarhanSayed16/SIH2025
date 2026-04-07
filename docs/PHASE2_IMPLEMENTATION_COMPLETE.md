# Phase 2 Implementation - Admin User Creation Endpoints

## ✅ Implementation Complete

All Phase 2 requirements have been implemented successfully.

---

## 📋 Updated User Model Fields

### New Fields Added to `backend/src/models/User.js`:

```javascript
// Phase 2: Admin User Creation - Additional fields
phone: {
  type: String,
  trim: true,
  default: null,
  // Unique globally (sparse index)
},
rollNo: {
  type: String,
  trim: true,
  default: null,
  // Unique within institution (compound index)
},
parentName: {
  type: String,
  trim: true,
  default: null
},
parentPhone: {
  type: String,
  trim: true,
  default: null
}
```

### New Indexes Added:

```javascript
// Global unique phone (for parents)
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

// RollNo unique per institution
userSchema.index({ institutionId: 1, rollNo: 1, userType: 1 }, { unique: true, sparse: true });
```

---

## 📁 New Files Created

### 1. Service File: `backend/src/services/admin-user.service.js`

**Functions:**
- `createTeacher(adminId, teacherData)` - Creates a teacher account
- `createStudent(adminId, studentData)` - Creates a roster record student
- `createParent(adminId, parentData)` - Creates a parent account

**Key Features:**
- Extracts admin's `institutionId` automatically
- Handles system-level admins (requires `institutionId` in request)
- Validates all required fields
- Enforces uniqueness constraints (email, phone, rollNo)
- Hashes passwords with bcrypt
- Returns user objects without passwords

### 2. Controller File: `backend/src/controllers/admin-user.controller.js`

**Functions:**
- `createTeacherController(req, res)` - Handles teacher creation requests
- `createStudentController(req, res)` - Handles student creation requests
- `createParentController(req, res)` - Handles parent creation requests

**Key Features:**
- Extracts admin ID from `req.userId` or `req.user._id`
- Handles errors with appropriate status codes
- Returns consistent JSON responses

### 3. Routes Added to: `backend/src/routes/admin.routes.js`

**New Endpoints:**
- `POST /api/admin/users/teacher`
- `POST /api/admin/users/student`
- `POST /api/admin/users/parent`

**Protection:**
- All routes protected with `authenticate` middleware
- All routes protected with `requireAdmin` middleware
- All routes have input validation

---

## 🔐 Endpoint Details

### 1. Create Teacher
**Endpoint:** `POST /api/admin/users/teacher`

**Required Fields:**
- `name` (string) - Teacher's full name
- `email` (string) - Teacher's email (must be unique)
- `password` (string) - Teacher's password (min 6 characters)

**Optional Fields:**
- `phone` (string) - Teacher's phone number
- `institutionId` (ObjectId) - Only required if admin has no institutionId

**Auto-Set Fields:**
- `role` = `'teacher'`
- `userType` = `'account_user'`
- `institutionId` = Admin's institutionId (or from request if admin has none)
- `approvalStatus` = `'approved'`
- `isActive` = `true`

**Example Request:**
```json
POST /api/admin/users/teacher
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "name": "Ms. Priya Sharma",
  "email": "priya.sharma@school.com",
  "password": "teacher123",
  "phone": "+91-9876543210"
}
```

**Example Response (201 Created):**
```json
{
  "success": true,
  "message": "Teacher created successfully",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Ms. Priya Sharma",
      "email": "priya.sharma@school.com",
      "phone": "+91-9876543210",
      "role": "teacher",
      "userType": "account_user",
      "institutionId": "65a1b2c3d4e5f6g7h8i9j0k2",
      "approvalStatus": "approved",
      "isActive": true,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400` - Missing required fields, invalid email, password too short, email already exists
- `401` - Not authenticated
- `403` - Not an admin

---

### 2. Create Student (Roster Record)
**Endpoint:** `POST /api/admin/users/student`

**Required Fields:**
- `name` (string) - Student's full name
- `grade` (string) - Student's grade: `'KG'` or `'1'` through `'12'`
- `section` (string) - Student's section (e.g., `'A'`, `'B'`)

**Optional Fields:**
- `rollNo` (string) - Student's roll number (unique within institution)
- `parentName` (string) - Parent's name
- `parentPhone` (string) - Parent's phone number
- `parentId` (ObjectId) - Existing parent user ID
- `institutionId` (ObjectId) - Only required if admin has no institutionId

**Auto-Set Fields:**
- `role` = `'student'`
- `userType` = `'roster_record'` (cannot login)
- `institutionId` = Admin's institutionId (or from request if admin has none)
- `approvalStatus` = `'approved'`
- `isActive` = `true`
- **NO email or password** (roster records cannot login)

**Example Request:**
```json
POST /api/admin/users/student
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "name": "Rahul Kumar",
  "grade": "3",
  "section": "A",
  "rollNo": "3A-15",
  "parentName": "Rajesh Kumar",
  "parentPhone": "+91-9876543211"
}
```

**Example Response (201 Created):**
```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "name": "Rahul Kumar",
      "role": "student",
      "userType": "roster_record",
      "institutionId": "65a1b2c3d4e5f6g7h8i9j0k2",
      "grade": "3",
      "section": "A",
      "rollNo": "3A-15",
      "parentName": "Rajesh Kumar",
      "parentPhone": "+91-9876543211",
      "approvalStatus": "approved",
      "isActive": true,
      "createdAt": "2025-01-15T10:35:00.000Z",
      "updatedAt": "2025-01-15T10:35:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400` - Missing required fields, invalid grade, rollNo already exists in institution
- `401` - Not authenticated
- `403` - Not an admin

---

### 3. Create Parent
**Endpoint:** `POST /api/admin/users/parent`

**Required Fields:**
- `name` (string) - Parent's full name
- `phone` (string) - Parent's phone number (must be globally unique)
- `password` (string) - Parent's password (min 6 characters)

**Optional Fields:**
- `email` (string) - Parent's email (must be unique if provided)
- `institutionId` (ObjectId) - Only required if admin has no institutionId

**Auto-Set Fields:**
- `role` = `'parent'`
- `userType` = `'account_user'`
- `institutionId` = Admin's institutionId (or from request if admin has none)
- `approvalStatus` = `'approved'`
- `isActive` = `true`

**Example Request:**
```json
POST /api/admin/users/parent
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "name": "Rajesh Kumar",
  "phone": "+91-9876543211",
  "password": "parent123",
  "email": "rajesh.kumar@gmail.com"
}
```

**Example Response (201 Created):**
```json
{
  "success": true,
  "message": "Parent created successfully",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "name": "Rajesh Kumar",
      "phone": "+91-9876543211",
      "email": "rajesh.kumar@gmail.com",
      "role": "parent",
      "userType": "account_user",
      "institutionId": "65a1b2c3d4e5f6g7h8i9j0k2",
      "approvalStatus": "approved",
      "isActive": true,
      "createdAt": "2025-01-15T10:40:00.000Z",
      "updatedAt": "2025-01-15T10:40:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400` - Missing required fields, password too short, phone/email already exists
- `401` - Not authenticated
- `403` - Not an admin

---

## 🔒 Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **Admin Only**: All endpoints require admin role
3. **Password Hashing**: Passwords are hashed with bcrypt (salt rounds: 10)
4. **Uniqueness Constraints**:
   - Email: Global unique
   - Phone: Global unique (sparse index)
   - RollNo: Unique within institution (compound index with userType)
5. **Institution Isolation**: Users are assigned to admin's institution automatically
6. **No Password in Response**: Passwords are never returned in API responses

---

## 🧪 Testing Examples

### Using cURL:

**1. Create Teacher:**
```bash
curl -X POST http://localhost:5000/api/admin/users/teacher \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ms. Priya Sharma",
    "email": "priya.sharma@school.com",
    "password": "teacher123",
    "phone": "+91-9876543210"
  }'
```

**2. Create Student:**
```bash
curl -X POST http://localhost:5000/api/admin/users/student \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rahul Kumar",
    "grade": "3",
    "section": "A",
    "rollNo": "3A-15",
    "parentName": "Rajesh Kumar",
    "parentPhone": "+91-9876543211"
  }'
```

**3. Create Parent:**
```bash
curl -X POST http://localhost:5000/api/admin/users/parent \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rajesh Kumar",
    "phone": "+91-9876543211",
    "password": "parent123",
    "email": "rajesh.kumar@gmail.com"
  }'
```

### Using Postman:

1. Set method to `POST`
2. Set URL to `http://localhost:5000/api/admin/users/{teacher|student|parent}`
3. Add header: `Authorization: Bearer YOUR_ADMIN_JWT_TOKEN`
4. Add header: `Content-Type: application/json`
5. Add body (raw JSON) with the appropriate payload

---

## ⚠️ Important Notes

1. **System-Level Admins**: If admin has no `institutionId`, the `institutionId` field becomes required in the request body.

2. **RollNo Uniqueness**: RollNo must be unique within the same institution. If you try to create a student with an existing rollNo in the same institution, you'll get a 400 error.

3. **Phone Uniqueness**: Phone numbers are globally unique. If a phone number is already used by another user, you'll get a 400 error.

4. **Email Uniqueness**: Email addresses are globally unique. If an email is already used, you'll get a 400 error.

5. **Roster Records Cannot Login**: Students created via this endpoint are roster records (`userType: 'roster_record'`) and cannot log in. They don't have email or password.

6. **Password Requirements**: Passwords must be at least 6 characters long (as per User model validation).

7. **Grade Validation**: Grade must be one of: `'KG'`, `'1'`, `'2'`, `'3'`, `'4'`, `'5'`, `'6'`, `'7'`, `'8'`, `'9'`, `'10'`, `'11'`, `'12'`

---

## ✅ Implementation Checklist

- [x] Added `phone`, `rollNo`, `parentName`, `parentPhone` fields to User model
- [x] Added sparse unique index on `phone`
- [x] Added compound unique index on `{ institutionId, rollNo, userType }`
- [x] Created `admin-user.service.js` with 3 functions
- [x] Created `admin-user.controller.js` with 3 controllers
- [x] Added 3 routes to `admin.routes.js` with validation
- [x] All routes protected with `authenticate` + `requireAdmin`
- [x] Password hashing implemented
- [x] Uniqueness constraints enforced
- [x] Institution assignment logic implemented
- [x] Error handling implemented
- [x] No breaking changes to existing code

---

## 🎯 Summary

**Status**: ✅ **FULLY IMPLEMENTED**

All Phase 2 requirements have been successfully implemented:
- ✅ User model updated with new fields and indexes
- ✅ Service layer created with 3 functions
- ✅ Controller layer created with 3 functions
- ✅ Routes added with proper validation and protection
- ✅ All security requirements met
- ✅ No breaking changes

**Ready for Testing**: Yes
**Production Ready**: Yes (after testing)

