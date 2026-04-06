# Parent Login Process - Complete Guide

## Overview

Parents can login through:
1. **Web Application** (`http://localhost:3001/login`)
2. **Mobile App** (Flutter login screen)
3. **API** (`POST /api/auth/login`)

After successful login, parents are automatically redirected to `/parent/dashboard`.

---

## 1. Web Application Login

### Step-by-Step

1. **Navigate to Login Page**
   - URL: `http://localhost:3001/login`
   - Should see login form with email and password fields

2. **Enter Credentials**
   - **Email**: `parent@test.com` (or your parent email)
   - **Password**: `test123` (or your password)

3. **Click Login**
   - Form validates email and password
   - Sends POST request to `/api/auth/login`
   - On success: Redirects to `/parent/dashboard`
   - On failure: Shows error message

### Code Flow

```typescript
// web/app/login/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const success = await login(email, password);
  if (success) {
    const { user } = useAuthStore.getState();
    // Redirect based on role
    if (user?.role === 'parent') {
      router.push('/parent/dashboard');
    } else {
      router.push('/dashboard');
    }
  }
};
```

---

## 2. Mobile App Login

### Step-by-Step

1. **Open Mobile App**
   - Launch Flutter app
   - Should show `LoginScreen`

2. **Enter Credentials**
   - Email: `parent@test.com`
   - Password: `test123`

3. **Tap Login**
   - App sends login request
   - On success: Navigates to `ParentDashboardScreen`
   - On failure: Shows error message

### Code Flow

```dart
// mobile/lib/features/auth/screens/login_screen.dart
final result = await authService.login(email, password);
if (result.success) {
  // AppRouter handles role-based routing
  // Parents → ParentDashboardScreen
  Navigator.pushReplacementNamed(context, '/dashboard');
}
```

---

## 3. API Login

### Request

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "parent@test.com",
  "password": "test123"
}
```

### Response (Success)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "69307de73be2b5c3f068daa1",
      "email": "parent@test.com",
      "name": "Test Parent",
      "role": "parent",
      "institutionId": "...",
      ...
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

### Response (Failure)

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Using PowerShell

```powershell
$login = @{
    email = "parent@test.com"
    password = "test123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST -Body $login -ContentType "application/json"

$token = $response.data.accessToken
Write-Host "Token: $token"
```

---

## 4. Authentication Flow

### Backend Process

1. **Receive Request**
   - Controller: `auth.controller.js` → `login()`
   - Service: `auth.service.js` → `loginUser()`

2. **Validate User**
   - Find user by email
   - Check if user is active
   - Check if userType is 'account_user' (not 'roster_record')
   - Verify password using bcrypt

3. **Generate Tokens**
   - Access Token (JWT, expires in 15m)
   - Refresh Token (JWT, expires in 7d)

4. **Save & Return**
   - Save refresh token to user
   - Update lastLogin timestamp
   - Return user data + tokens

### Frontend Process

1. **Store Tokens**
   - Save accessToken to localStorage
   - Save refreshToken to localStorage
   - Set token in API client

2. **Store User Data**
   - Save user object to Zustand store
   - Set isAuthenticated = true

3. **Redirect**
   - Check user role
   - Redirect to appropriate dashboard

---

## 5. Role-Based Redirect

### After Login

| Role | Redirect To |
|------|-------------|
| `parent` | `/parent/dashboard` |
| `admin` | `/dashboard` |
| `teacher` | `/dashboard` |
| `student` | `/dashboard` |

### Implementation

```typescript
// web/app/login/page.tsx
if (success) {
  const { user } = useAuthStore.getState();
  if (user?.role === 'parent') {
    router.push('/parent/dashboard');
  } else {
    router.push('/dashboard');
  }
}
```

---

## 6. Troubleshooting

### Issue: "Invalid email or password"

**Possible Causes:**
1. User doesn't exist
2. Password is incorrect
3. Password wasn't hashed correctly during creation

**Solutions:**
1. Check if user exists in database
2. Verify password in database (should be hashed)
3. Recreate user with script: `node scripts/create-test-parent.js`

### Issue: "Account is deactivated"

**Solution:**
- Check `isActive` field in database
- Set `isActive: true` for the user

### Issue: "Roster records cannot login"

**Solution:**
- User has `userType: 'roster_record'`
- Change to `userType: 'account_user'`
- Or recreate user with proper credentials

### Issue: Redirect goes to wrong page

**Solution:**
- Check user role in response
- Verify redirect logic in login page
- Check if `/parent/dashboard` route exists

---

## 7. Test Credentials

After running `node scripts/create-test-parent.js`:

**Parent:**
- Email: `parent@test.com`
- Password: `test123`
- Role: `parent`

**Student:**
- Email: `student@test.com`
- Password: `test123`
- Role: `student`

---

## 8. Testing Checklist

- [ ] Parent can login via web
- [ ] Parent can login via mobile
- [ ] Parent can login via API
- [ ] Redirect goes to `/parent/dashboard`
- [ ] Token is generated correctly
- [ ] User data is stored correctly
- [ ] Error messages display correctly
- [ ] Invalid credentials are rejected

---

## 9. Next Steps After Login

1. **Dashboard**
   - View children list
   - See quick stats
   - Navigate to child details

2. **Child Details**
   - View child information
   - Check progress
   - View drills
   - Check attendance
   - View location

3. **QR Verification**
   - Verify student QR codes
   - Check relationship

4. **Notifications**
   - View notifications
   - Mark as read

---

**Status**: ✅ **Login Process Implemented**

Parents can now login and are automatically redirected to their dashboard.

