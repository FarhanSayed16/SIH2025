# Parent Monitoring System - Quick Start Testing Guide

## 🚀 Quick Start: Test Parent System in 5 Steps

---

## Step 1: Create Test Data

### Option A: Using Script (Recommended)

```bash
cd backend
node scripts/create-test-parent.js
```

This will create:
- ✅ Test Parent User (email: `parent@test.com`, password: `test123`)
- ✅ Test Student User (email: `student@test.com`, password: `test123`)
- ✅ Parent-Student Relationship (verified)
- ✅ Test Institution and Class

### Option B: Using Admin Panel

1. **Login as Admin**
   - Go to `http://localhost:3001/login`
   - Login with admin credentials

2. **Create Parent User**
   - Navigate to `/admin/users` or `/users`
   - Click "Create User" or "Add User"
   - Fill in:
     - Name: "Test Parent"
     - Email: "parent@test.com"
     - Role: "parent"
     - Phone: "1234567890"
     - Password: "test123"
     - Institution: Select institution
   - Click "Create"

3. **Create Student User**
   - Navigate to `/admin/users`
   - Click "Create User"
   - Fill in:
     - Name: "Test Student"
     - Email: "student@test.com"
     - Role: "student"
     - Grade: "5"
     - Section: "A"
     - Class: Select class
     - Password: "test123"
   - Click "Create"

4. **Link Parent to Student**
   - Find the student in the users list
   - Click "Link Parent" or similar
   - Select the parent user
   - Verify relationship

---

## Step 2: Login as Parent

### Web Application

1. **Navigate to Login**
   - Go to `http://localhost:3001/login`

2. **Enter Credentials**
   - Email: `parent@test.com`
   - Password: `test123`

3. **Click Login**
   - Should redirect to `/parent/dashboard`

### Mobile App

1. **Open Mobile App**
   - Launch Flutter app

2. **Enter Credentials**
   - Email: `parent@test.com`
   - Password: `test123`

3. **Tap Login**
   - Should show `ParentDashboardScreen`

### API (for Testing)

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

## Step 3: Test Parent Dashboard

### Web

1. **Verify Dashboard Loads**
   - Should see "Parent Dashboard" heading
   - Should see children list (if linked)
   - Should see quick stats

2. **Test Navigation**
   - Click on a child card
   - Should navigate to child detail page

### Mobile

1. **Verify Dashboard Loads**
   - Should see children list
   - Should see quick actions

2. **Test Navigation**
   - Tap on a child card
   - Should navigate to child detail screen

---

## Step 4: Test API Endpoints

### Using PowerShell Script

```powershell
cd backend
.\test-parent-with-auth.ps1
```

This script will:
- ✅ Login as parent
- ✅ Get authentication token
- ✅ Test all parent endpoints
- ✅ Show results

### Manual API Testing

```powershell
# 1. Login and get token
$login = @{
    email = "parent@test.com"
    password = "test123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST -Body $login -ContentType "application/json"

$token = $response.data.accessToken
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Get Children
$children = Invoke-RestMethod -Uri "http://localhost:3000/api/parent/children" `
    -Method GET -Headers $headers

Write-Host "Children: $($children.data.children.Count)"

# 3. Get Child Details (if children exist)
if ($children.data.children.Count -gt 0) {
    $studentId = $children.data.children[0]._id
    $details = Invoke-RestMethod -Uri "http://localhost:3000/api/parent/children/$studentId" `
        -Method GET -Headers $headers
    Write-Host "Child Name: $($details.data.student.name)"
}
```

---

## Step 5: Test Complete Workflow

### Web Workflow

1. **Login** → `/login`
2. **Dashboard** → `/parent/dashboard`
3. **Child Details** → `/parent/children/[studentId]`
4. **QR Verification** → `/parent/verify-student`
5. **Notifications** → `/parent/notifications`

### Mobile Workflow

1. **Login** → `LoginScreen`
2. **Dashboard** → `ParentDashboardScreen`
3. **Child Details** → `ChildDetailScreen`
4. **QR Scanner** → `QRVerificationScreen`
5. **Notifications** → `NotificationsScreen`
6. **Location Map** → `ChildLocationScreen`

---

## Testing Checklist

### ✅ Backend
- [ ] Parent user created
- [ ] Parent can login
- [ ] Token generated
- [ ] `/api/parent/children` works
- [ ] `/api/parent/children/:id` works
- [ ] `/api/parent/verify-student-qr` works
- [ ] `/api/parent/notifications` works

### ✅ Web Frontend
- [ ] Parent can login
- [ ] Dashboard loads
- [ ] Children list displays
- [ ] Child detail page works
- [ ] All tabs work
- [ ] QR verification works
- [ ] Notifications page works

### ✅ Mobile App
- [ ] Parent can login
- [ ] Dashboard loads
- [ ] Children list displays
- [ ] Child detail screen works
- [ ] QR scanner works
- [ ] Notifications screen works
- [ ] Location map works

---

## Common Issues & Solutions

### Issue: "Parent user not found"
**Solution**: Run `node scripts/create-test-parent.js` to create test data

### Issue: "No children displayed"
**Solution**: Link children to parent via ParentStudentRelationship

### Issue: "401 Unauthorized"
**Solution**: 
- Check token is valid
- Re-login to get new token
- Verify token format: `Bearer <token>`

### Issue: "403 Forbidden"
**Solution**: 
- Verify parent is linked to student
- Check relationship is verified
- Verify user role is 'parent'

---

## Test Credentials

After running the script:

**Parent:**
- Email: `parent@test.com`
- Password: `test123`

**Student:**
- Email: `student@test.com`
- Password: `test123`
- QR Code: Check script output

---

## Next Steps

1. ✅ Create test data
2. ✅ Login as parent
3. ✅ Test dashboard
4. ✅ Test child details
5. ✅ Test QR verification
6. ✅ Test notifications
7. ✅ Test location map

**Status**: Ready for testing! 🚀

