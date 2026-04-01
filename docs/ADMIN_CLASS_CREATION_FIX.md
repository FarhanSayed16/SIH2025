# Admin Class Creation & Institution ID Fix

## Issues Fixed

### 1. ✅ Class Creation Validation Error (400 Bad Request)

**Problem:**
- `institutionId: ""` (empty string) was being sent
- `teacherId: "swapna kadam (swapna@gmail.com)"` (display text instead of ID)

**Root Causes:**
- Admin user doesn't have `institutionId` assigned
- Form was sending empty string for `institutionId`
- Teacher select might have been sending display text (though code looks correct)

**Fixes Applied:**
1. ✅ Made `teacherId` optional in backend validation and Class model
2. ✅ Added institution dropdown in admin classes form
3. ✅ Added validation to ensure `institutionId` is selected before submission
4. ✅ Added MongoDB ID validation for `teacherId` with fallback matching
5. ✅ Added warning message if admin doesn't have institutionId

### 2. ✅ Teacher Assignment UI

**Problem:**
- Admin couldn't see "Assign Teacher" option clearly
- Teacher assignment dropdown wasn't prominent

**Fixes Applied:**
1. ✅ Improved teacher assignment dropdown in classes table
2. ✅ Shows "Assign Teacher" when no teacher is assigned
3. ✅ Shows "Change Teacher" when teacher is already assigned
4. ✅ Made dropdown full-width for better visibility

### 3. ✅ Institution ID Management

**Problem:**
- Teachers don't have `institutionId` and can't edit it
- Admin doesn't have `institutionId` and can't edit it
- No way to assign institutionId after registration

**Fixes Applied:**
1. ✅ Created `fix-institution-ids.js` script to list users without institutionId
2. ✅ Added "Set Institution" button in Users page for admins
3. ✅ Added institution dropdown for editing (better UX than prompt)
4. ✅ Added institution selection in admin classes form

### 4. ✅ QR Code Generation for Teachers

**Problem:**
- Teachers couldn't easily generate QR codes for their classes

**Fixes Applied:**
1. ✅ Fixed backend route bug (`req.user.userId` → `req.userId`)
2. ✅ Added "Generate QR Code" button to class detail page
3. ✅ QR code displays prominently when generated
4. ✅ Shows expiration date and QR image

## Files Changed

### Backend:
- `backend/src/routes/admin.routes.js` - Made teacherId optional
- `backend/src/controllers/class.controller.js` - Allow null teacherId
- `backend/src/models/Class.js` - Made teacherId optional in schema
- `backend/src/routes/classroom-join.routes.js` - Fixed req.userId bug
- `backend/scripts/fix-institution-ids.js` - New script to help fix institutionIds

### Frontend:
- `web/app/admin/classes/page.tsx` - Added institution dropdown, improved validation
- `web/app/users/page.tsx` - Added institution editing for teachers/admins
- `web/app/classes/[classId]/page.tsx` - Added QR code generation button
- `web/lib/api/schools.ts` - New API client for schools
- `web/lib/api/classes.ts` - Made teacherId optional in interface

## How to Fix Your Current Issues

### Step 1: Assign Institution ID to Admin

**Option A: Using Web UI (Recommended)**
1. Login as admin
2. Go to `/users` page
3. Find your admin user
4. Click "Set Institution" button
5. Select an institution from dropdown

**Option B: Using MongoDB**
```javascript
db.users.updateOne(
  { _id: ObjectId("6924de10a721bc0188182548") },
  { $set: { institutionId: ObjectId("6924de10a721bc018818253c") } }
)
```

**Option C: Using Script**
```bash
cd backend
node scripts/fix-institution-ids.js
# Then use the MongoDB command shown in output
```

### Step 2: Assign Institution ID to Teachers

1. Login as admin
2. Go to `/users` page
3. Filter by role: "Teachers"
4. For each teacher without institution, click "Set Institution"
5. Select the appropriate institution

### Step 3: Create Classes

1. Go to `/admin/classes`
2. Click "+ Create New Class"
3. **Select Institution** from dropdown (required)
4. Select Grade and Section
5. Optionally select Teacher (can assign later)
6. Click "Create Class"

### Step 4: Assign Teachers to Classes

1. In the classes table, find the class
2. Use the "Assign Teacher" dropdown
3. Select a teacher
4. Teacher will be assigned automatically

## Admin Account Setup

**Default Admin Credentials:**
- Email: `admin@school.com`
- Password: `admin123`

**If admin doesn't exist or password doesn't work:**
```bash
cd backend
node scripts/fix-admin.js
```

This will create/reset the admin account.

## Testing Checklist

- [ ] Admin can login
- [ ] Admin can see `/admin/classes` page
- [ ] Admin can select institution in class creation form
- [ ] Admin can create class without teacher
- [ ] Admin can assign teacher to class via dropdown
- [ ] Admin can edit teacher institutionId in `/users` page
- [ ] Teacher can see "My Classes" page
- [ ] Teacher can generate QR code for their class
- [ ] Teacher can see class code prominently displayed

## Available Schools

From the script output:
1. **Delhi Public School** (ID: `6924de10a721bc018818253c`)
2. **Test School** (ID: `692b78310a043f5e107bf0c4`)

Use these IDs when assigning institutionId to users.

---

**All fixes are complete and ready for testing!**

