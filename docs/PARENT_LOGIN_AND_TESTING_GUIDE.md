# Parent Login and Testing Guide

## Parent Monitoring System - Complete Testing Guide

---

## 📋 Table of Contents

1. [Parent Registration Process](#parent-registration-process)
2. [Parent Login Process](#parent-login-process)
3. [Testing Workflow](#testing-workflow)
4. [Creating Test Data](#creating-test-data)
5. [API Testing with Authentication](#api-testing-with-authentication)
6. [Frontend Testing](#frontend-testing)
7. [Mobile App Testing](#mobile-app-testing)

---

## 1. Parent Registration Process

### Option A: Admin Creates Parent Account (Recommended)

**Step 1: Admin Login**
- Login as admin at `http://localhost:3001/login`
- Use admin credentials

**Step 2: Create Parent User**
- Navigate to `/admin/users` or `/users`
- Click "Create User" or "Add User"
- Fill in parent details:
  - **Name**: Parent's full name
  - **Email**: Parent's email address
  - **Role**: Select "parent"
  - **Phone**: Parent's phone number (required for parents)
  - **Institution**: Select the institution
  - **Password**: Set initial password
- Click "Create" or "Save"

**Step 3: Verify Parent Account**
- Parent account will be created with `approvalStatus: 'approved'` (parents are auto-approved)
- Parent can now login

### Option B: Parent Self-Registration (If Available)

**Step 1: Navigate to Registration**
- Go to `http://localhost:3001/register`
- Fill in registration form:
  - Name
  - Email
  - Phone (required for parents)
  - Password
  - Role: Select "parent"
  - Institution: Select your institution

**Step 2: Account Approval**
- Parent account will be created with `approvalStatus: 'approved'`
- Parent can login immediately

---

## 2. Parent Login Process

### Web Application Login

**Step 1: Navigate to Login Page**
- Go to `http://localhost:3001/login`

**Step 2: Enter Credentials**
- **Email**: Parent's email address
- **Password**: Parent's password

**Step 3: Login**
- Click "Login" button
- System will authenticate and redirect to `/parent/dashboard`

**Step 4: Verify Dashboard**
- Should see "Parent Dashboard"
- Should see list of linked children (if any)
- Should see quick stats

### Mobile App Login

**Step 1: Open Mobile App**
- Launch the Flutter mobile app

**Step 2: Enter Credentials**
- Email: Parent's email
- Password: Parent's password

**Step 3: Login**
- Tap "Login"
- App will authenticate and show `ParentDashboardScreen`

---

## 3. Testing Workflow

### Phase 1: Setup Test Data

#### 1.1 Create Parent User

**Using Admin Panel:**
```bash
# Login as admin
# Navigate to /admin/users
# Create parent user with:
# - Name: "Test Parent"
# - Email: "parent@test.com"
# - Role: "parent"
# - Phone: "1234567890"
# - Password: "test123"
```

**Using API (for testing):**
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Test Parent",
  "email": "parent@test.com",
  "password": "test123",
  "role": "parent",
  "phone": "1234567890",
  "institutionId": "<institution_id>"
}
```

#### 1.2 Create Student User

**Using Admin Panel:**
```bash
# Login as admin
# Navigate to /admin/users
# Create student user with:
# - Name: "Test Student"
# - Email: "student@test.com"
# - Role: "student"
# - Grade: "5"
# - Section: "A"
# - Class: Select appropriate class
```

#### 1.3 Link Parent to Student

**Using Admin Panel:**
- Navigate to `/admin/users`
- Find the student
- Click "Link Parent" or similar action
- Select the parent user
- Verify relationship

**Using API (for testing):**
```bash
# First, get parent and student IDs
# Then link them using the linkChildToParent service
# This requires admin/teacher verification
```

---

### Phase 2: Authentication Testing

#### 2.1 Test Parent Login

**Web:**
1. Go to `http://localhost:3001/login`
2. Enter parent credentials
3. Verify redirect to `/parent/dashboard`
4. Check that parent dashboard loads

**Mobile:**
1. Open mobile app
2. Enter parent credentials
3. Verify redirect to `ParentDashboardScreen`
4. Check that dashboard loads

#### 2.2 Get Authentication Token

**Using API:**
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "parent@test.com",
  "password": "test123"
}

# Response will include:
# {
#   "success": true,
#   "data": {
#     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#     "refreshToken": "...",
#     "user": { ... }
#   }
# }
```

**Save the token for API testing:**
```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Phase 3: API Testing with Authentication

#### 3.1 Test Get Children Endpoint

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/parent/children" `
    -Method GET `
    -Headers $headers
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "children": [
      {
        "_id": "...",
        "name": "Test Student",
        "grade": "5",
        "section": "A",
        "relationship": "father",
        ...
      }
    ]
  },
  "message": "Children retrieved successfully"
}
```

#### 3.2 Test Get Child Details

```powershell
$studentId = "STUDENT_ID_HERE"
Invoke-RestMethod -Uri "http://localhost:3000/api/parent/children/$studentId" `
    -Method GET `
    -Headers $headers
```

#### 3.3 Test Verify Student QR

```powershell
$body = @{
    qrCode = "STUDENT_QR_CODE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/parent/verify-student-qr" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

#### 3.4 Test Get Notifications

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/parent/notifications" `
    -Method GET `
    -Headers $headers
```

---

### Phase 4: Frontend Testing

#### 4.1 Test Parent Dashboard

1. **Login as Parent**
   - Go to `http://localhost:3001/login`
   - Login with parent credentials
   - Should redirect to `/parent/dashboard`

2. **Verify Dashboard Elements**
   - ✅ Children list displayed
   - ✅ Quick stats cards visible
   - ✅ "Verify Student" button works
   - ✅ "Notifications" button works
   - ✅ Child cards are clickable

3. **Test Navigation**
   - Click on a child card
   - Should navigate to `/parent/children/[studentId]`
   - Verify child detail page loads

#### 4.2 Test Child Detail Page

1. **Navigate to Child Details**
   - From dashboard, click on a child
   - Should see child detail page with tabs

2. **Test Each Tab**
   - **Overview Tab**: Verify metrics and student info
   - **Progress Tab**: Verify quiz/game performance
   - **Drills Tab**: Verify drill history
   - **Attendance Tab**: Verify attendance records
   - **Safety Tab**: Verify location data

3. **Test Refresh**
   - Click refresh button
   - Verify data reloads

#### 4.3 Test QR Verification

1. **Navigate to QR Verification**
   - Click "Verify Student" from dashboard
   - Should navigate to `/parent/verify-student`

2. **Test QR Input**
   - Enter a valid QR code (manually or scan)
   - Click "Verify"
   - If linked: Should show student details
   - If not linked: Should show security message

#### 4.4 Test Notifications

1. **Navigate to Notifications**
   - Click "Notifications" from dashboard
   - Should navigate to `/parent/notifications`

2. **Test Filtering**
   - Test "All" filter
   - Test "Unread" filter
   - Test type filters (Drill, Achievement, etc.)

3. **Test Mark as Read**
   - Click "Mark Read" on a notification
   - Verify notification updates
   - Test "Mark All as Read" button

---

### Phase 5: Mobile App Testing

#### 5.1 Test Parent Login

1. **Open Mobile App**
   - Launch Flutter app
   - Should show login screen

2. **Login as Parent**
   - Enter parent email and password
   - Tap "Login"
   - Should navigate to `ParentDashboardScreen`

#### 5.2 Test Parent Dashboard (Mobile)

1. **Verify Dashboard**
   - Children list displayed
   - Quick stats visible
   - Quick actions available

2. **Test Navigation**
   - Tap on a child card
   - Should navigate to `ChildDetailScreen`

#### 5.3 Test QR Scanner (Mobile)

1. **Navigate to QR Scanner**
   - Tap "Verify Student QR" button
   - Should open `QRVerificationScreen`

2. **Test Scanning**
   - Camera should open
   - Scan a student QR code
   - Verify result dialog appears
   - Test navigation to child details

#### 5.4 Test Child Details (Mobile)

1. **Navigate to Child Details**
   - Tap on a child from dashboard
   - Should show `ChildDetailScreen` with tabs

2. **Test Tabs**
   - Swipe between tabs
   - Verify each tab loads correctly
   - Test pull-to-refresh

#### 5.5 Test Location Map (Mobile)

1. **Navigate to Safety Tab**
   - Open child details
   - Go to "Safety" tab
   - Tap "View on Map"

2. **Verify Map**
   - Google Maps should load
   - Child location marker visible
   - Status card displayed
   - Auto-refresh working

---

## 4. Creating Test Data Script

### PowerShell Script for Test Data

```powershell
# test-parent-setup.ps1
# Creates test parent, student, and relationship

$baseUrl = "http://localhost:3000/api"

# Step 1: Login as admin
$adminLogin = @{
    email = "admin@test.com"
    password = "admin123"
} | ConvertTo-Json

$adminResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
    -Method POST `
    -Body $adminLogin `
    -ContentType "application/json"

$adminToken = $adminResponse.data.accessToken
$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

# Step 2: Create parent user
$parentData = @{
    name = "Test Parent"
    email = "parent@test.com"
    password = "test123"
    role = "parent"
    phone = "1234567890"
    institutionId = "INSTITUTION_ID_HERE"
} | ConvertTo-Json

$parentResponse = Invoke-RestMethod -Uri "$baseUrl/users" `
    -Method POST `
    -Headers $headers `
    -Body $parentData

$parentId = $parentResponse.data.user._id
Write-Host "✅ Created parent: $parentId"

# Step 3: Create student user
$studentData = @{
    name = "Test Student"
    email = "student@test.com"
    password = "test123"
    role = "student"
    grade = "5"
    section = "A"
    classId = "CLASS_ID_HERE"
    institutionId = "INSTITUTION_ID_HERE"
} | ConvertTo-Json

$studentResponse = Invoke-RestMethod -Uri "$baseUrl/users" `
    -Method POST `
    -Headers $headers `
    -Body $studentData

$studentId = $studentResponse.data.user._id
Write-Host "✅ Created student: $studentId"

# Step 4: Link parent to student
# This requires using the linkChildToParent service
# Or creating ParentStudentRelationship directly via admin panel

Write-Host "✅ Test data created!"
Write-Host "Parent ID: $parentId"
Write-Host "Student ID: $studentId"
```

---

## 5. Complete Testing Checklist

### Backend Testing
- [ ] Parent user can be created
- [ ] Parent can login
- [ ] Parent receives authentication token
- [ ] `/api/parent/children` returns children list
- [ ] `/api/parent/children/:id` returns child details
- [ ] `/api/parent/children/:id/progress` returns progress
- [ ] `/api/parent/children/:id/location` returns location
- [ ] `/api/parent/children/:id/drills` returns drill history
- [ ] `/api/parent/children/:id/attendance` returns attendance
- [ ] `/api/parent/verify-student-qr` verifies QR code
- [ ] `/api/parent/notifications` returns notifications
- [ ] Relationship verification middleware works
- [ ] Unauthorized access returns 403

### Web Frontend Testing
- [ ] Parent can login via web
- [ ] Parent dashboard loads
- [ ] Children list displays
- [ ] Child detail page loads
- [ ] All tabs work (Overview, Progress, Drills, Attendance, Safety)
- [ ] QR verification page works
- [ ] Notifications page works
- [ ] Navigation between pages works
- [ ] Refresh functionality works
- [ ] Error handling works

### Mobile App Testing
- [ ] Parent can login via mobile app
- [ ] Parent dashboard screen loads
- [ ] Children list displays
- [ ] Child detail screen loads
- [ ] All tabs work
- [ ] QR scanner works
- [ ] Notifications screen works
- [ ] Location map works
- [ ] Pull-to-refresh works
- [ ] Navigation works

---

## 6. Troubleshooting

### Issue: Parent Cannot Login

**Check:**
1. Parent account exists in database
2. Parent account is approved (`approvalStatus: 'approved'`)
3. Parent account is active (`isActive: true`)
4. Password is correct
5. Email is correct

**Solution:**
- Verify parent user in database
- Check approval status
- Reset password if needed

### Issue: No Children Displayed

**Check:**
1. Parent has linked children
2. Relationship is verified (`verified: true`)
3. Children are active (`isActive: true`)

**Solution:**
- Link children to parent via ParentStudentRelationship
- Verify relationship
- Check children are active

### Issue: QR Verification Fails

**Check:**
1. QR code is valid
2. Student exists with that QR code
3. Parent is linked to student
4. Relationship is verified

**Solution:**
- Verify QR code matches student
- Check relationship exists
- Verify relationship is verified

### Issue: 401 Unauthorized

**Check:**
1. Token is valid
2. Token is not expired
3. Token is in Authorization header
4. User role is 'parent'

**Solution:**
- Re-login to get new token
- Check token format: `Bearer <token>`
- Verify user role

---

## 7. Quick Start Testing

### Minimal Test Setup

1. **Create Parent User** (via admin panel)
   - Email: `parent@test.com`
   - Password: `test123`
   - Role: `parent`

2. **Create Student User** (via admin panel)
   - Email: `student@test.com`
   - Password: `test123`
   - Role: `student`

3. **Link Parent to Student** (via admin panel)
   - Navigate to student
   - Link parent
   - Verify relationship

4. **Login as Parent**
   - Web: `http://localhost:3001/login`
   - Mobile: Use login screen
   - API: POST `/api/auth/login`

5. **Test Endpoints**
   - Use token from login response
   - Test all parent endpoints

---

## 8. Test Data Requirements

### Required Test Data

1. **Institution**
   - At least one institution must exist

2. **Class**
   - At least one class must exist
   - Class should have students

3. **Parent User**
   - Email, password, phone
   - Role: parent
   - Institution ID

4. **Student User**
   - Email, password
   - Role: student
   - Grade, section, class
   - QR code (for testing)

5. **Parent-Student Relationship**
   - Parent ID
   - Student ID
   - Relationship type
   - Verified: true

---

## 9. API Testing Examples

### Using PowerShell

```powershell
# 1. Login
$login = @{
    email = "parent@test.com"
    password = "test123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST -Body $login -ContentType "application/json"

$token = $response.data.accessToken
$headers = @{ "Authorization" = "Bearer $token" }

# 2. Get Children
$children = Invoke-RestMethod -Uri "http://localhost:3000/api/parent/children" `
    -Method GET -Headers $headers

# 3. Get Child Details
$studentId = $children.data.children[0]._id
$details = Invoke-RestMethod -Uri "http://localhost:3000/api/parent/children/$studentId" `
    -Method GET -Headers $headers
```

### Using cURL

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"parent@test.com","password":"test123"}' \
  | jq -r '.data.accessToken')

# 2. Get Children
curl -X GET http://localhost:3000/api/parent/children \
  -H "Authorization: Bearer $TOKEN"
```

---

## 10. Next Steps

1. **Create Test Data**: Use admin panel or API to create parent, student, and relationship
2. **Login as Parent**: Test login via web, mobile, and API
3. **Test Endpoints**: Use authentication token to test all endpoints
4. **Test Frontend**: Verify all web pages work correctly
5. **Test Mobile**: Verify all mobile screens work correctly
6. **Test QR Scanner**: Test QR code verification
7. **Test Notifications**: Create test notifications and verify delivery

---

**Status**: ✅ **Ready for Testing**

All components are implemented and ready. Follow this guide to test the complete parent monitoring system.

