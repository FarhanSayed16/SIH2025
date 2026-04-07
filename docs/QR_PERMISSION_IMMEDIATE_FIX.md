# QR Code Permission - Immediate Fix Steps
**Date:** 2025-12-01

---

## 🚨 IMMEDIATE ACTION REQUIRED

You're getting "Insufficient permissions" because the **JWT token has an old role**.

### Quick Fix:
1. **Log out** from the web app
2. **Log back in** as the teacher
3. This will generate a new JWT token with the correct role
4. Try generating QR code again

---

## 🔍 Why This Happens

When a user logs in, a JWT token is created with their role at that moment. If:
- The user's role was changed in the database AFTER they logged in
- The user was created as 'student' but later changed to 'teacher'
- The JWT token still has the old role

**Solution:** User must re-login to get a fresh JWT token.

---

## 📊 Check Your User's Role

To verify the user's role in the database, check the backend logs. You should see:

```
[QR Generate] Auth check - User ID: <id>, JWT Role: <role>, DB Role: <role>
[requireRole] Access denied for role 'X' (JWT: Y, DB: Z)
```

If JWT Role ≠ DB Role, the user needs to re-login.

---

## ✅ After Re-login

The new JWT will have the correct role, and QR generation should work.

---

**Status:** User needs to re-login to refresh JWT token

