# QR Code Generation Permissions
**Route:** `POST /api/classroom/:classId/qr/generate`

---

## 📋 PERMISSION REQUIREMENTS

### For Teachers:

1. **Authentication** ✅
   - Must be logged in with valid JWT token

2. **Role** ✅
   - Must have role: `'teacher'`

3. **Approval Status** ✅
   - `approvalStatus` must be: `'approved'`
   - Cannot be: `'pending'` or `'rejected'`

4. **Institution Assignment** ✅
   - Must have an `institutionId` assigned
   - Cannot be `null` or `undefined`

5. **Account Status** ✅
   - `isActive` must be: `true`

6. **Class Ownership** ✅
   - The class must be assigned to the teacher
   - `class.teacherId` must match the teacher's `userId`
   - If class has no teacher assigned, teacher cannot generate QR

---

### For Admins:

1. **Authentication** ✅
   - Must be logged in with valid JWT token

2. **Role** ✅
   - Must have role: `'admin'` or `'SYSTEM_ADMIN'`

3. **Class Assignment** ⚠️
   - Admin can generate QR for any class
   - BUT: If class has no teacher assigned, the service will throw an error
   - Error: "Class does not have a teacher assigned. Please assign a teacher first."

---

## 🔒 MIDDLEWARE CHAIN

The route goes through these middleware checks in order:

1. **`authenticate`**
   - Verifies JWT token
   - Loads user from database
   - Sets `req.user`, `req.userId`, `req.userRole`

2. **`requireRole(['teacher', 'admin'])`**
   - Checks if user role is 'teacher' or 'admin'
   - Uses DB role (preferred) or JWT role (fallback)
   - Returns 403 "Insufficient permissions" if role doesn't match

3. **`requireTeacherAccess`**
   - **For teachers only:**
     - Fetches fresh user data from DB
     - Checks `approvalStatus === 'approved'`
     - Checks `institutionId` exists
     - Checks `isActive === true`
     - Returns specific error codes:
       - `TEACHER_NOT_APPROVED` (403)
       - `TEACHER_NO_INSTITUTION` (403)
       - `TEACHER_DEACTIVATED` (403)
   - **For admins:**
     - Bypasses all checks (passes through)

4. **Service: `generateClassroomQR(classId, teacherId)`**
   - Verifies class exists
   - **For teachers:** Checks `class.teacherId === teacherId`
   - **For admins:** Allows if class has a teacher assigned
   - Throws error if:
     - Class not found
     - Teacher doesn't own the class
     - Class has no teacher assigned

---

## ❌ COMMON ERROR SCENARIOS

### Error 1: "Insufficient permissions"
**Cause:** Role check failed
- User role is not 'teacher' or 'admin'
- JWT token has old role (need to re-login)
- DB role is missing or incorrect

**Solution:**
- Verify role in database: `db.users.findOne({ _id: ObjectId("...") })`
- Have user re-login to get fresh JWT token

### Error 2: "TEACHER_NOT_APPROVED"
**Cause:** Teacher not approved
- `approvalStatus !== 'approved'`

**Solution:**
- Admin must approve the teacher account
- Teacher must re-login after approval

### Error 3: "TEACHER_NO_INSTITUTION"
**Cause:** Teacher has no institution
- `institutionId` is `null` or `undefined`

**Solution:**
- Admin must assign teacher to an institution

### Error 4: "Unauthorized: Teacher does not own this class"
**Cause:** Class ownership check failed
- `class.teacherId !== teacherId`

**Solution:**
- Admin must assign the class to the teacher
- Or teacher must use the correct class ID

### Error 5: "Class does not have a teacher assigned"
**Cause:** Class has no teacher
- `class.teacherId` is `null` or `undefined`

**Solution:**
- Admin must assign a teacher to the class first
- Then the assigned teacher can generate QR

---

## ✅ PERMISSION CHECKLIST

### For Teachers:
- [ ] Logged in with valid token
- [ ] Role = 'teacher' (in database)
- [ ] approvalStatus = 'approved' (in database)
- [ ] institutionId is set (in database)
- [ ] isActive = true (in database)
- [ ] Class is assigned to this teacher (class.teacherId === teacherId)

### For Admins:
- [ ] Logged in with valid token
- [ ] Role = 'admin' or 'SYSTEM_ADMIN' (in database)
- [ ] Class has a teacher assigned (class.teacherId exists)

---

## 🔍 DEBUGGING

Check backend logs for:
1. `[QR Generate] Auth check` - Shows user info before role check
2. `[authenticate]` - Shows role from DB vs JWT
3. `[requireRole]` - Shows role check result
4. `[requireTeacherAccess]` - Shows teacher-specific checks
5. `[QR Generate]` - Shows service-level checks

---

## 📝 SUMMARY

**Minimum Requirements:**
- **Teachers:** Must be approved, have institution, own the class
- **Admins:** Must be admin, class must have a teacher assigned

**Key Point:** Even admins cannot generate QR for classes without a teacher assigned. The class must have a teacher first, then either the teacher or an admin can generate the QR code.

