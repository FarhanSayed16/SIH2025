# QR Code Generation Permission Debug Guide
**Date:** 2025-12-01

---

## 🔍 DEBUGGING STEPS

If you're still getting "Insufficient permissions", follow these steps:

### 1. Check Backend Logs

Look for these log messages when you try to generate QR code:

```
[authenticate] User <userId>: role from DB=<role>, role from JWT=<role>
[requireRole] User <userId>: JWT role=<role>, DB role=<role>, final role=<role>, path=/api/classroom/.../qr/generate
[requireRole] Access denied for role 'X' (JWT: Y, DB: Z) to POST /api/classroom/.../qr/generate. Allowed roles: teacher, admin
```

### 2. Verify User Role in Database

Check if the user's role is actually 'teacher' in the database:

```javascript
// In MongoDB shell or via script
db.users.findOne({ _id: ObjectId("your-user-id") }, { role: 1, approvalStatus: 1, institutionId: 1 })
```

### 3. Check JWT Token

The JWT token might have an old role. If the user's role was changed after login, the JWT still has the old role.

**Solution:** User needs to **log out and log back in** to get a new JWT with the correct role.

### 4. Verify Teacher Approval Status

Even if role is correct, teacher must be:
- ✅ `approvalStatus: 'approved'`
- ✅ `institutionId` is set (not null)
- ✅ `isActive: true`

### 5. Check Frontend Token

Make sure the frontend is sending the Authorization header:

```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
}
```

---

## 🛠️ QUICK FIXES

### Fix 1: User Needs to Re-login
If user's role was changed in database:
1. User logs out
2. User logs back in
3. New JWT will have correct role

### Fix 2: Verify Teacher Status
Run this query to check teacher status:
```javascript
db.users.findOne(
  { email: "teacher@example.com" },
  { role: 1, approvalStatus: 1, institutionId: 1, isActive: 1 }
)
```

### Fix 3: Check Class Assignment
Teacher can only generate QR for classes they own:
```javascript
db.classes.findOne(
  { _id: ObjectId("class-id") },
  { teacherId: 1, classCode: 1 }
)
```

---

## 📝 COMMON ISSUES

1. **JWT has old role** → User needs to re-login
2. **User role in DB is not 'teacher'** → Check database
3. **Teacher not approved** → Admin needs to approve
4. **Teacher has no institution** → Admin needs to assign institution
5. **Token not sent** → Check frontend Authorization header

---

**Next Steps:**
1. Check backend logs for detailed error messages
2. Verify user role in database
3. Have user re-login if role was changed
4. Check teacher approval status

