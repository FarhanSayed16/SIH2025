# QR Code Class Join Implementation Plan

## Problem Analysis

### Current Issues

1. **Authentication Error**: 
   - Mobile app calls `/api/student/join-class` without authentication token
   - Error: `401 - No token provided`
   - Endpoint requires authentication (student must be logged in)

2. **Missing QR Code Integration**:
   - Settings page has "Join Class" option but no QR code scanning
   - Login page has QR code option but it's for individual login, not class joining
   - QR scanner exists but not properly connected to class join flow

3. **Incorrect API Usage**:
   - Mobile app uses `/api/student/join-class` (requires auth + classCode)
   - Should use authenticated endpoint after student logs in
   - QR code contains classId, not classCode

4. **Flow Issues**:
   - QR code on login page should redirect to login first, then join class
   - Settings page should have QR scanner option for logged-in students
   - Need to extract classId from QR code JSON

---

## Solution Overview

### Flow 1: Join Class via QR Code (Logged-in Student)
1. Student logs in normally
2. Goes to Settings → Join Class
3. Clicks "Scan QR Code" button
4. Opens QR scanner
5. Scans teacher's QR code
6. Extracts `classId` from QR JSON
7. Calls authenticated `/api/student/join-class` with classId
8. Shows success/error message

### Flow 2: Join Class via QR Code (From Login Page)
1. Student clicks "Join via QR Code" on login page
2. Checks if student is logged in:
   - **If logged in**: Open QR scanner → Scan → Join class
   - **If not logged in**: Show message "Please login first" → Redirect to login
3. After login, automatically open QR scanner
4. Scan QR code → Join class

---

## Implementation Plan

### Phase 1: Backend Changes

#### 1.1 Update `/api/student/join-class` Endpoint
**File**: `backend/src/controllers/student.controller.js`

**Current**: Accepts only `classCode` (string)
**New**: Accept both `classCode` (string) OR `classId` (MongoDB ObjectId)

**Changes**:
```javascript
export const joinClass = async (req, res) => {
  try {
    const { classCode, classId } = req.body; // Accept both
    const studentId = req.userId;

    // Validate: must have either classCode or classId
    if (!classCode && !classId) {
      return errorResponse(res, 'Class code or class ID is required', 400);
    }

    // Call service with appropriate parameter
    const student = await joinClassByCodeOrId(studentId, classCode, classId);

    return successResponse(
      res,
      { user: student },
      'Join request sent to your class teacher for approval. You will be notified once approved.',
      200
    );
  } catch (error) {
    // ... error handling
  }
};
```

**File**: `backend/src/services/student.service.js`

**Add new function**:
```javascript
/**
 * Join a class using classCode OR classId
 * @param {string} studentId - Student user ID
 * @param {string} classCode - Class code to join (optional)
 * @param {string} classId - Class ID to join (optional)
 * @returns {Object} Updated student object
 */
export const joinClassByCodeOrId = async (studentId, classCode, classId) => {
  let classData;
  
  // Find class by ID or code
  if (classId) {
    classData = await Class.findById(classId);
    if (!classData) {
      throw new Error('Invalid class ID. Please check and try again.');
    }
  } else if (classCode) {
    classData = await Class.findOne({ 
      classCode: classCode.trim(),
      isActive: true 
    });
    if (!classData) {
      throw new Error('Invalid class code. Please check and try again.');
    }
  } else {
    throw new Error('Class code or class ID is required');
  }

  // Rest of the logic is the same as joinClassByCode
  // (student validation, duplicate check, join request creation, etc.)
  // ... copy from joinClassByCode function
};
```

**Update existing function**: Keep `joinClassByCode` for backward compatibility, but have it call `joinClassByCodeOrId`

**Why**: QR codes contain `classId`, but manual entry uses `classCode`. This supports both methods.

---

#### 1.2 Verify QR Code Format
**File**: `backend/src/services/classroom-join.service.js`

**Check**: Ensure QR code JSON format is:
```json
{
  "type": "classroom_join",
  "classId": "692b78310a04...",
  "grade": "5",
  "section": "C",
  "academicYear": "2025-2026"
}
```

**Action**: Verify `generateClassroomQR` creates this format

---

### Phase 2: Mobile App - API Service Updates

#### 2.1 Update Student Service
**File**: `mobile/lib/features/student/services/student_service.dart`

**Add new method**:
```dart
/// Join a class using classId (from QR code)
/// POST /api/student/join-class
Future<Map<String, dynamic>> joinClassByQR(String classId) async {
  try {
    final response = await _apiService.post(
      ApiEndpoints.studentJoinClass,
      data: {
        'classId': classId, // Use classId instead of classCode
      },
    );
    // ... rest of implementation
  }
}
```

**Update existing method**:
```dart
/// Join a class using classCode (manual entry)
Future<Map<String, dynamic>> joinClass(String classCode) async {
  // Keep existing implementation
  data: {
    'classCode': classCode.trim(),
  },
}
```

---

#### 2.2 Add QR Code Parsing Helper
**File**: `mobile/lib/features/student/services/student_service.dart`

**Add method**:
```dart
/// Parse QR code JSON and extract classId
/// Returns classId if valid, null otherwise
String? parseClassQRCode(String qrCodeString) {
  try {
    final parsed = jsonDecode(qrCodeString) as Map<String, dynamic>;
    if (parsed['type'] == 'classroom_join' && parsed['classId'] != null) {
      return parsed['classId'] as String;
    }
  } catch (e) {
    // Not JSON or invalid format
  }
  return null;
}
```

---

### Phase 3: Mobile App - UI Updates

#### 3.1 Update Join Class Screen
**File**: `mobile/lib/features/student/screens/join_class_screen.dart`

**Add QR Code Scanner Button**:
- Add button next to "Join Class" button
- Icon: `Icons.qr_code_scanner`
- Label: "Scan QR Code"
- Opens `QRScannerScreen` with `isClassroomMode: true`

**Implementation**:
```dart
// Add QR Scanner button
Row(
  children: [
    Expanded(
      child: PrimaryButton(
        label: 'Join Class',
        onPressed: _isLoading ? null : _handleJoinClass,
        isLoading: _isLoading,
        icon: Icons.add,
      ),
    ),
    SizedBox(width: AppSpacing.md),
    IconButton(
      icon: Icon(Icons.qr_code_scanner, size: 32),
      onPressed: _isLoading ? null : _handleScanQR,
      style: IconButton.styleFrom(
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        padding: EdgeInsets.all(16),
      ),
    ),
  ],
)

// Add handler
Future<void> _handleScanQR() async {
  final qrCode = await Navigator.push<String>(
    context,
    MaterialPageRoute(
      builder: (context) => QRScannerScreen(
        title: 'Scan Class QR Code',
        isClassroomMode: true,
      ),
    ),
  );

  if (qrCode != null && mounted) {
    await _handleJoinClassByQR(qrCode);
  }
}

// Add QR join handler
Future<void> _handleJoinClassByQR(String qrCode) async {
  setState(() {
    _isLoading = true;
    _error = null;
    _success = null;
  });

  try {
    // Parse QR code
    final classId = _studentService.parseClassQRCode(qrCode);
    if (classId == null) {
      setState(() {
        _error = 'Invalid QR code format. Please scan a valid class QR code.';
      });
      return;
    }

    // Join class using classId
    final response = await _studentService.joinClassByQR(classId);

    if (response['success'] == true) {
      setState(() {
        _success = 'Join request sent successfully!';
      });
      await _loadCurrentClassInfo();
    } else {
      setState(() {
        _error = response['message'] ?? 'Failed to join class';
      });
    }
  } catch (e) {
    setState(() {
      _error = e.toString().replaceAll('Exception: ', '');
    });
  } finally {
    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }
}
```

---

#### 3.2 Update Settings/Profile Screen
**File**: `mobile/lib/features/profile/screens/profile_screen.dart` (or settings screen)

**Add "Join Class" Section**:
- Add card with "Join Class" option
- Two buttons:
  1. "Enter Class Code" → Navigate to `JoinClassScreen`
  2. "Scan QR Code" → Open QR scanner directly

**Implementation**:
```dart
// In settings section
Card(
  child: Column(
    children: [
      ListTile(
        leading: Icon(Icons.class_outlined, color: AppColors.primaryGreen),
        title: Text('Join Class'),
        subtitle: Text('Join a class using code or QR code'),
        trailing: Icon(Icons.chevron_right),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => JoinClassScreen(),
            ),
          );
        },
      ),
      Divider(),
      ListTile(
        leading: Icon(Icons.qr_code_scanner, color: AppColors.primaryGreen),
        title: Text('Scan QR Code'),
        subtitle: Text('Scan teacher\'s QR code to join'),
        trailing: Icon(Icons.chevron_right),
        onTap: () async {
          final qrCode = await Navigator.push<String>(
            context,
            MaterialPageRoute(
              builder: (context) => QRScannerScreen(
                title: 'Scan Class QR Code',
                isClassroomMode: true,
              ),
            ),
          );
          
          if (qrCode != null && mounted) {
            // Handle QR code join
            await _handleQRJoin(qrCode);
          }
        },
      ),
    ],
  ),
)
```

---

#### 3.3 Update Login Screen QR Code Flow
**File**: `mobile/lib/features/auth/screens/login_screen.dart`

**Current**: QR code button opens scanner for individual login
**New**: Check if QR is classroom QR → Handle accordingly

**Implementation**:
```dart
// Update QR login button handler
onPressed: () async {
  // Check if user is logged in
  final authState = ref.read(authProvider);
  if (authState.isAuthenticated) {
    // User is logged in - open QR scanner for class join
    final qrCode = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (context) => QRScannerScreen(
          title: 'Scan Class QR Code',
          isClassroomMode: true,
        ),
      ),
    );
    
    if (qrCode != null && mounted) {
      // Join class using QR code
      await _handleJoinClassByQR(qrCode);
    }
  } else {
    // User not logged in - show message
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please login first to join a class via QR code'),
          action: SnackBarAction(
            label: 'Login',
            onPressed: () {
              // Focus on login form
            },
          ),
        ),
      );
    }
  }
}
```

**Alternative**: Create separate button "Join Class via QR" that:
1. Checks authentication
2. If not logged in → Shows login prompt
3. If logged in → Opens QR scanner

---

#### 3.4 Update QR Scanner Screen
**File**: `mobile/lib/features/qr/screens/qr_scanner_screen.dart`

**Current**: Handles both individual and classroom QR codes
**Issue**: Returns QR code string, but doesn't handle authenticated class join

**Update**: When `isClassroomMode: true` and QR is scanned:
1. Parse QR code JSON
2. Extract `classId`
3. Return `classId` (or full QR string) to caller
4. Caller handles the join logic

**No changes needed** - Current implementation is correct, just needs proper integration

---

### Phase 4: Error Handling & User Experience

#### 4.1 Error Messages
- "Invalid QR code format" - When QR is not valid JSON or missing classId
- "QR code expired" - When QR code has expired
- "Class not found" - When classId doesn't exist
- "Already in a class" - When student is already in a class
- "Join request pending" - When request is already submitted

#### 4.2 Success Messages
- "Join request submitted successfully"
- "Waiting for teacher approval"
- Show pending status badge

#### 4.3 Loading States
- Show loading spinner during QR scan processing
- Disable buttons during API call
- Show progress indicator

---

## File Changes Summary

### Backend Files
1. `backend/src/controllers/student.controller.js`
   - Update `joinClass` to accept both `classCode` and `classId`

2. `backend/src/services/classroom-join.service.js`
   - Verify QR code generation format (should already be correct)

### Mobile App Files
1. `mobile/lib/features/student/services/student_service.dart`
   - Add `joinClassByQR(String classId)` method
   - Add `parseClassQRCode(String qrCode)` helper

2. `mobile/lib/features/student/screens/join_class_screen.dart`
   - Add QR scanner button
   - Add `_handleScanQR()` method
   - Add `_handleJoinClassByQR(String qrCode)` method

3. `mobile/lib/features/profile/screens/profile_screen.dart` (or settings screen)
   - Add "Join Class" section with QR code option

4. `mobile/lib/features/auth/screens/login_screen.dart`
   - Update QR code button to check authentication
   - Add class join flow for logged-in users

5. `mobile/lib/features/qr/screens/qr_scanner_screen.dart`
   - Verify `isClassroomMode` handling (should already work)

---

## Testing Checklist

### Backend Tests
- [ ] Test `/api/student/join-class` with `classId` parameter
- [ ] Test `/api/student/join-class` with `classCode` parameter (backward compatibility)
- [ ] Verify QR code JSON format from `/api/classroom/:classId/qr/generate`
- [ ] Test error handling for invalid classId
- [ ] Test error handling for expired QR codes

### Mobile App Tests
- [ ] Test QR scanner opens from Join Class screen
- [ ] Test QR scanner opens from Settings screen
- [ ] Test QR code parsing (valid JSON)
- [ ] Test QR code parsing (invalid format)
- [ ] Test class join with valid QR code (logged-in student)
- [ ] Test class join with expired QR code
- [ ] Test class join when already in a class
- [ ] Test error messages display correctly
- [ ] Test success message and status update
- [ ] Test login page QR button (when not logged in)
- [ ] Test login page QR button (when logged in)

### Integration Tests
- [ ] Teacher generates QR code
- [ ] Student scans QR code (logged in)
- [ ] Student successfully joins class
- [ ] Teacher sees join request
- [ ] Teacher approves request
- [ ] Student sees approved status

---

## Implementation Order

1. **Backend**: Update `joinClass` controller to accept `classId`
2. **Mobile Service**: Add `joinClassByQR` and `parseClassQRCode` methods
3. **Join Class Screen**: Add QR scanner button and handlers
4. **Settings Screen**: Add QR code option
5. **Login Screen**: Update QR button flow
6. **Testing**: Test all flows end-to-end

---

## Notes

- **Authentication Required**: All class join operations require student to be logged in
- **QR Code Format**: Must be JSON with `type: "classroom_join"` and `classId`
- **Backward Compatibility**: Keep `classCode` support for manual entry
- **Error Handling**: Provide clear, user-friendly error messages
- **UX**: Show loading states and success/error feedback

---

## Success Criteria

✅ Students can scan QR code from Settings → Join Class  
✅ Students can scan QR code from Join Class screen  
✅ QR code on login page works for logged-in students  
✅ Proper error handling for invalid/expired QR codes  
✅ Success messages and status updates work correctly  
✅ Backend accepts both `classCode` and `classId`  
✅ All flows tested and working end-to-end

---

## Quick Reference

### QR Code Format
```json
{
  "type": "classroom_join",
  "classId": "692b78310a04...",
  "teacherId": "...",
  "classCode": "S692b78310a04-5-C-20252026",
  "year": "2025",
  "timestamp": 1234567890
}
```

### API Endpoints
- **POST** `/api/student/join-class` (requires auth)
  - Body: `{ "classCode": "..." }` OR `{ "classId": "..." }`
  - Returns: Join request created (pending approval)

### Key Files to Modify
1. `backend/src/controllers/student.controller.js` - Accept classId
2. `backend/src/services/student.service.js` - Add joinClassByCodeOrId
3. `mobile/lib/features/student/services/student_service.dart` - Add QR methods
4. `mobile/lib/features/student/screens/join_class_screen.dart` - Add QR button
5. `mobile/lib/features/profile/screens/profile_screen.dart` - Add QR option
6. `mobile/lib/features/auth/screens/login_screen.dart` - Update QR flow

### Authentication Flow
1. **Student must be logged in** before joining class
2. QR scanner can be opened, but join requires auth token
3. If not logged in → Show login prompt
4. After login → Automatically proceed with QR join

### Error Scenarios
- ❌ Not logged in → "Please login first"
- ❌ Invalid QR format → "Invalid QR code format"
- ❌ QR expired → "QR code has expired"
- ❌ Already in class → "You are already in a class"
- ❌ Class not found → "Class not found"
- ✅ Success → "Join request submitted successfully"

