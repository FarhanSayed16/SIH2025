# Current Roster Record vs Account User Logic

## 📋 CURRENT LOGIC

### 1. **Registration via Mobile App (`/auth/register`)**

**For Students:**
```javascript
if (role === 'student') {
  const gradeNum = parseInt(grade) || 0;
  if (gradeNum <= 4 || grade === 'KG') {
    userType = 'roster_record';  // ❌ CANNOT LOGIN
    approvalStatus = 'approved';
  } else {
    userType = 'account_user';  // ✅ CAN LOGIN (after approval)
    approvalStatus = 'pending';
  }
}
```

**For Teachers/Admins/Parents:**
```javascript
userType = 'account_user';  // ✅ CAN LOGIN
approvalStatus = 'approved';
```

### 2. **Login Restrictions**

```javascript
if (userType === 'roster_record') {
  throw new Error('Roster records cannot login. Please contact your teacher.');
}
```

### 3. **Admin-Created Students** (via `/api/admin/users/students`)

```javascript
// Always created as roster_record, regardless of grade
userType = 'roster_record';  // ❌ CANNOT LOGIN
```

---

## ⚠️ PROBLEMS IDENTIFIED

### **Problem 1: Contradiction in Mobile Registration**

**Issue:** If a user registers via mobile app with email/password, they should be able to login. But current logic makes KG-4th students `roster_record` even if they provide credentials.

**Example:**
- User registers via mobile app
- Provides: email, password, name, phone, grade = "3"
- Result: `userType = 'roster_record'` → **CANNOT LOGIN** ❌
- **This is wrong!** If they provided email/password, they should be `account_user`

### **Problem 2: Grade-Based Logic May Be Wrong**

**Current Logic:**
- KG-4th = `roster_record` (no login)
- 5th+ = `account_user` (can login)

**Question:** Is this the correct business rule?
- Should ALL mobile registrations be `account_user` regardless of grade?
- Or should grade-based logic only apply to admin-created students?

### **Problem 3: Admin-Created Students Always Roster**

**Current Logic:**
```javascript
// In admin-user.service.js
const userType = (gradeNum <= 4 || grade === 'KG') 
  ? 'roster_record' 
  : 'roster_record'; // Always roster for admin-created students
```

**Issue:** Even if admin creates a 10th-grade student, they're `roster_record` and cannot login.

---

## 🤔 QUESTIONS TO CLARIFY

1. **Mobile Registration:**
   - Should ALL users who register via mobile app (with email/password) be `account_user`?
   - Or should grade-based logic still apply?

2. **Roster Records:**
   - What is the actual purpose of `roster_record`?
   - Are they students who:
     - Don't have email/password (created by teacher/admin)?
     - Are too young to use the app independently?
     - Should never be able to login?

3. **Grade-Based Logic:**
   - Should grade determine `userType`?
   - Or should `userType` be determined by:
     - **How they were created** (mobile registration = account_user, admin import = roster_record)?
     - **Whether they have credentials** (has email/password = account_user)?

4. **Admin-Created Students:**
   - Should admin be able to create `account_user` students (with email/password)?
   - Or should admin-created students always be `roster_record`?

---

## 💡 SUGGESTED LOGIC (Need Your Confirmation)

### **Option A: Credential-Based Logic**
```
If user has email AND password:
  → userType = 'account_user' (CAN LOGIN)
Else:
  → userType = 'roster_record' (CANNOT LOGIN)
```

### **Option B: Creation Method-Based Logic**
```
If created via /auth/register (mobile app):
  → userType = 'account_user' (CAN LOGIN)
If created via admin endpoint:
  → userType = 'roster_record' (CANNOT LOGIN)
```

### **Option C: Grade + Creation Method**
```
If created via /auth/register (mobile app):
  → userType = 'account_user' (CAN LOGIN) - regardless of grade
  
If created via admin endpoint:
  → If grade <= 4 or KG:
      → userType = 'roster_record' (CANNOT LOGIN)
  → If grade >= 5:
      → userType = 'account_user' (CAN LOGIN) - but needs email/password
```

---

## 🔍 CURRENT ISSUE WITH `testuser1@gmail.com`

The user `testuser1@gmail.com` is `roster_record` because:
1. They were created with grade <= 4, OR
2. They were created via admin endpoint, OR
3. They were created before the logic was fixed

**But they have email/password, so they should be `account_user`!**

---

## ✅ RECOMMENDATION

**I recommend Option C** - but need your confirmation:

1. **Mobile Registration (`/auth/register`):**
   - ALL users who register via mobile app should be `account_user`
   - Grade doesn't matter - if they provide credentials, they can login

2. **Admin-Created Students:**
   - If grade <= 4 or KG → `roster_record` (no email/password)
   - If grade >= 5 → `account_user` (requires email/password)

3. **Login:**
   - Only `account_user` can login
   - `roster_record` cannot login (as intended)

**Please confirm:**
- Is this the correct business logic?
- Or do you have different rules?

