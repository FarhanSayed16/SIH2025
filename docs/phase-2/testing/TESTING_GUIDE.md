# Step-by-Step Testing Guide

## Quick Start Testing

### Step 1: Test Student Login & Dashboard

1. **Launch the app**
2. **Login as Student**:
   - Email: `rohan.sharma@student.com`
   - Password: `student123`
3. **Verify Dashboard**:
   - Check if dashboard loads
   - Verify user name is displayed
   - Check if modules are listed
   - Verify no errors in console

### Step 2: Test Module Viewing

1. **Open a Module**:
   - Tap on "Fire Safety" module
   - Verify module content loads
2. **Check Content**:
   - Videos (if any)
   - Images
   - Text content
3. **Navigate**:
   - Try next/previous buttons
   - Check back button works

### Step 3: Test Quiz

1. **Start Quiz**:
   - Find quiz in module
   - Tap to start
2. **Answer Questions**:
   - Select answers
   - Submit quiz
3. **Check Results**:
   - Verify score displayed
   - Check explanations
   - Verify progress updated

### Step 4: Test Profile

1. **Open Profile**:
   - Navigate to profile screen
2. **Check Info**:
   - User name
   - Email
   - Institution
   - Progress/badges
3. **Test Logout**:
   - Tap logout
   - Verify returns to login

### Step 5: Test Teacher Role

1. **Logout** (if logged in)
2. **Login as Teacher**:
   - Email: `teacher@kavach.com`
   - Password: `teacher123`
3. **Check Teacher Dashboard**:
   - Verify teacher-specific features
   - Check class list
   - Check student list

### Step 6: Test Admin Role

1. **Logout** (if logged in)
2. **Login as Admin**:
   - Email: `admin@school.com`
   - Password: `admin123`
3. **Check Admin Dashboard**:
   - Verify admin features
   - Check user management
   - Check system metrics

### Step 7: Test Phase 2.5 Features

1. **QR Login**:
   - Tap "Login with QR Code"
   - Scan QR code (if available)
   - Verify login works

2. **Teacher Dashboard**:
   - Login as teacher
   - Check class management
   - Check student management

---

## What to Look For

### ✅ Good Signs
- No red errors in console
- Smooth navigation
- Data loads correctly
- UI is responsive
- All buttons work

### ❌ Issues to Report
- App crashes
- Blank screens
- API errors (401, 404, 500)
- Navigation not working
- Data not loading
- UI glitches

---

## Reporting Issues

When you find an issue, note:
1. **What you were doing**: (e.g., "Trying to open a module")
2. **What happened**: (e.g., "App crashed" or "Got 401 error")
3. **Error message**: (Copy from console)
4. **Steps to reproduce**: (What you did before the error)

---

## Testing Tips

1. **Test one feature at a time**
2. **Check console for errors** after each action
3. **Try edge cases**: Empty data, network issues
4. **Test different roles**: Each role has different features
5. **Document everything**: Note what works and what doesn't
