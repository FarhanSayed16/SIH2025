# Kavach Project - Quick Reference Guide
**For Team Members & Documentation**

---

## 🚀 QUICK START

### What We Built
A **School Safety Management System** with:
- User management (Admin, Teacher, Student roles)
- Class management with QR code joining
- Student approval workflow
- Multi-institution support

### Tech Stack
- **Backend:** Node.js + Express + MongoDB
- **Frontend:** Next.js + TypeScript + Tailwind CSS
- **Auth:** JWT tokens
- **Database:** MongoDB with Mongoose

---

## 📋 KEY FEATURES

### ✅ Implemented Features

1. **User Management**
   - Registration & Login
   - Role-based access (SYSTEM_ADMIN, admin, teacher, student)
   - Approval workflow for teachers
   - Institution assignment

2. **Class Management**
   - Create classes (admin)
   - Assign teachers
   - Unique class codes
   - Academic year support

3. **Student Joining**
   - QR code generation (teacher)
   - QR code scanning (student)
   - Approval/rejection workflow
   - Pending requests tracking

4. **Teacher Dashboard**
   - View assigned classes
   - Manage student requests
   - Generate QR codes
   - Approve/reject students

---

## 🔧 MAJOR FIXES COMPLETED

### 1. Duplicate Class Error (E11000)
- **Problem:** 500 error when creating duplicate classes
- **Fix:** Return existing class with 200 OK
- **Files:** `class.controller.js`, `Class.js`

### 2. QR Code Permissions
- **Problem:** Teachers couldn't generate QR codes
- **Fix:** Fixed RBAC middleware, role loading from DB
- **Files:** `rbac.middleware.js`, `auth.service.js`, `classroom-join.routes.js`

### 3. joinQRCode Index Error
- **Problem:** Duplicate key error on null values
- **Fix:** Made index sparse, added migration script
- **Files:** `Class.js`, `fix-joinqrcode-index.js`

### 4. Navigation Restructure
- **Problem:** Conflicting `/classes` and `/teacher/classes` pages
- **Fix:** Moved all teacher pages to `/teacher/classes/*`
- **Files:** Created new pages, updated navigation

---

## 📁 IMPORTANT FILES

### Backend
```
backend/src/
├── controllers/
│   └── class.controller.js      # Class CRUD operations
├── models/
│   ├── User.js                  # User schema
│   ├── Class.js                 # Class schema
│   └── Institution.js           # Institution schema
├── middleware/
│   ├── auth.middleware.js       # JWT authentication
│   └── rbac.middleware.js      # Role-based access control
└── routes/
    ├── classroom-join.routes.js # QR code & join requests
    └── class.routes.js          # Class management
```

### Frontend
```
web/app/
├── admin/
│   ├── users/page.tsx           # User management
│   └── classes/page.tsx         # Class management
└── teacher/
    └── classes/
        ├── page.tsx             # Classes list
        └── [classId]/
            ├── page.tsx         # Class details
            └── approvals/
                └── page.tsx     # Approvals view
```

---

## 🔐 AUTHENTICATION FLOW

1. User logs in → JWT token generated
2. Token stored in Zustand store + localStorage
3. Token sent in `Authorization: Bearer <token>` header
4. Backend validates token → Loads user from DB
5. RBAC middleware checks role & permissions

### Roles & Permissions
- **SYSTEM_ADMIN:** Full access
- **admin:** Manage institution (users, classes)
- **teacher:** Manage assigned classes, approve students
- **student:** Join classes via QR, limited access

---

## 🗄️ DATABASE SCHEMAS

### User
- `email` (unique)
- `role` (SYSTEM_ADMIN | admin | teacher | student)
- `institutionId` (ObjectId reference)
- `approvalStatus` (pending | approved | rejected)

### Class
- `institutionId` + `grade` + `section` + `academicYear` (unique compound)
- `classCode` (unique identifier)
- `teacherId` (assigned teacher)
- `studentIds` (array of students)
- `joinQRCode` (unique, sparse index)

---

## 🛣️ API ENDPOINTS

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user

### Classes
- `GET /api/admin/classes` - List classes (admin)
- `POST /api/admin/classes` - Create class (admin)
- `GET /api/teacher/classes` - Teacher's classes

### QR Codes
- `POST /api/classroom/:classId/qr/generate` - Generate QR (teacher)
- `POST /api/classroom/join/scan` - Scan QR (student)

### Student Requests
- `GET /api/classroom/:classId/join-requests` - Get pending (teacher)
- `POST /api/classroom/join-requests/:id/approve` - Approve (teacher)
- `POST /api/classroom/join-requests/:id/reject` - Reject (teacher)

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: "Insufficient permissions"
**Solution:** Check:
1. User role in database (not just JWT)
2. Teacher approval status = "approved"
3. Teacher has institutionId assigned

### Issue: Duplicate class error
**Solution:** System now returns existing class instead of error

### Issue: QR code not generating
**Solution:** 
1. Check teacher is approved
2. Check teacher has institution
3. Check class is assigned to teacher

---

## 📝 DEVELOPMENT NOTES

### Code Standards
- Use TypeScript for frontend
- Follow MVC pattern for backend
- Use async/await for async operations
- Add proper error handling
- Use logging for debugging

### Testing
- Test authentication flow
- Test class creation (including duplicates)
- Test QR code generation
- Test student approval workflow

---

## 📚 DOCUMENTATION

- **Complete Summary:** `PROJECT_COMPLETE_SUMMARY.md`
- **Restructure Plan:** `TEACHER_CLASSES_RESTRUCTURE_PLAN.md`
- **Class Creation:** `CLASS_CREATION_FINAL_IMPLEMENTATION_SUMMARY.md`

---

## 🎯 NEXT STEPS

1. Test all features end-to-end
2. Remove old `/classes/[classId]` pages
3. Decide on `/classes` page (remove or redirect)
4. Add admin class details page if needed
5. Add error boundaries
6. Add loading states
7. Improve error messages

---

**Last Updated:** December 1, 2025

