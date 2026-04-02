    # Authentication System Analysis - Phase 1

    **Date:** Current Session  
    **Status:** ✅ Analysis Complete - Ready for Phase 2 Improvements  
    **Purpose:** Comprehensive documentation of current authentication system before enhancements

    ---

    ## 📋 Table of Contents

    1. [Overview](#overview)
    2. [User Model Structure](#user-model-structure)
    3. [Authentication Flows](#authentication-flows)
    4. [Roles and Access Control](#roles-and-access-control)
    5. [Validation System](#validation-system)
    6. [Current State Summary](#current-state-summary)

    ---

    ## 🎯 Overview

    The Kavach authentication system is a **K-12 multi-access system** that supports:
    - **Multiple authentication methods**: Email/password, QR code, Device token
    - **Grade-based access control**: Different access levels for different age groups
    - **Teacher approval system**: 5th+ students require teacher approval before login
    - **Role-based access**: Student, Teacher, Admin, Parent roles with different permissions

    **Key Files:**
    - Backend Model: `backend/src/models/User.js`
    - Backend Routes: `backend/src/routes/auth.routes.js`
    - Backend Controller: `backend/src/controllers/auth.controller.js`
    - Backend Service: `backend/src/services/auth.service.js`
    - Mobile Login: `mobile/lib/features/auth/screens/login_screen.dart`
    - Mobile Register: `mobile/lib/features/auth/screens/register_screen.dart`
    - Mobile Service: `mobile/lib/features/auth/services/auth_service.dart`
    - Web Login: `web/app/login/page.tsx`
    - Web Store: `web/lib/store/auth-store.ts`

    ---

    ## 📊 User Model Structure

    **Location:** `backend/src/models/User.js`

    ### Core Identity Fields

    | Field | Type | Required | Description |
    |-------|------|----------|-------------|
    | `email` | String | Conditional* | Unique email (sparse index) |
    | `password` | String | Conditional* | Min 6 chars, bcrypt hashed |
    | `name` | String | ✅ Yes | User's full name |
    | `role` | Enum | ✅ Yes | `['student', 'teacher', 'admin', 'parent']` |

    *Required for `account_user`, optional for `roster_record`

    ### User Type System (RBAC Refinement)

    | Field | Type | Auto-Determined | Description |
    |-------|------|----------------|-------------|
    | `userType` | Enum | ✅ Yes | `['account_user', 'roster_record']` |

    **Auto-Determination Logic:**
    - **KG-4th students** → `roster_record` (no login credentials)
    - **5th+ students** → `account_user` (can login after approval)
    - **Teachers/Admins** → `account_user` (auto-approved)

    ### K-12 Multi-Access Fields

    | Field | Type | Required | Description |
    |-------|------|----------|-------------|
    | `grade` | Enum | Optional* | `['KG', '1', '2', ..., '12']` |
    | `section` | String | Optional* | Class section (A, B, C, etc.) |
    | `classId` | ObjectId | Optional* | Reference to Class model |
    | `institutionId` | ObjectId | Conditional** | Reference to School model |

    *Currently optional (not enforced)  
    **Required for teachers/parents, optional for students

    ### Access Control Fields

    | Field | Type | Auto-Determined | Description |
    |-------|------|----------------|-------------|
    | `accessLevel` | Enum | ✅ Yes | `['full', 'shared', 'teacher_led', 'none']` |
    | `canUseApp` | Boolean | ✅ Yes | Whether user can use mobile app |
    | `requiresTeacherAuth` | Boolean | ✅ Yes | Whether teacher approval needed |

    **Auto-Determination Logic:**
    - **9th-12th** → `accessLevel: 'full'`, `canUseApp: true`
    - **6th-8th** → `accessLevel: 'shared'`, `canUseApp: true`
    - **KG-5th** → `accessLevel: 'teacher_led'`, `canUseApp: false` (6th+), `requiresTeacherAuth: true`

    ### Approval System Fields

    | Field | Type | Auto-Determined | Description |
    |-------|------|----------------|-------------|
    | `approvalStatus` | Enum | ✅ Yes | `['pending', 'approved', 'rejected']` |
    | `approvedBy` | ObjectId | Manual | Teacher who approved |
    | `approvedAt` | Date | Manual | Approval timestamp |
    | `rejectionReason` | String | Manual | Reason for rejection |

    **Auto-Determination Logic:**
    - **5th+ students** → `approvalStatus: 'pending'` (needs teacher approval)
    - **KG-4th students** → `approvalStatus: 'approved'` (auto-approved, roster records)
    - **Teachers/Admins** → `approvalStatus: 'approved'` (auto-approved)

    ### QR & Device Authentication Fields

    | Field | Type | Description |
    |-------|------|-------------|
    | `qrCode` | String | QR code for student badge (sparse unique index) |
    | `qrBadgeId` | String | QR badge identifier (sparse unique index) |
    | `classroomQRCode` | String | QR code for joining classroom |
    | `joinRequestId` | ObjectId | Reference to ClassroomJoinRequest |

    ### Other Important Fields

    | Field | Type | Description |
    |-------|------|-------------|
    | `parentId` | ObjectId | Reference to parent User |
    | `currentLocation` | GeoJSON Point | User's current GPS location |
    | `safetyStatus` | Enum | `['safe', 'missing', 'at_risk', 'evacuating']` |
    | `deviceToken` | String | FCM push notification token |
    | `refreshToken` | String | JWT refresh token (stored in DB) |
    | `isActive` | Boolean | Account active status (default: true) |
    | `lastLogin` | Date | Last login timestamp |
    | `progress` | Object | Learning progress (modules, badges, scores, etc.) |

    ---

    ## 🔐 Authentication Flows

    ### 1. Email/Password Login

    #### Request
    ```http
    POST /api/auth/login
    Content-Type: application/json

    {
    "email": "student@school.com",
    "password": "password123"
    }
    ```

    #### Backend Flow

    1. **Route Handler** (`auth.routes.js`)
    - Rate limiting: `authLimiter` middleware
    - Validation: `loginValidation` (email format, password required)
    - Middleware: `validate` (express-validator)

    2. **Controller** (`auth.controller.js`)
    ```javascript
    - Extracts: email, password from req.body
    - Calls: loginUser(email, password)
    - Returns: successResponse with user + tokens
    ```

    3. **Service** (`auth.service.js` - `loginUser`)
    ```javascript
    Steps:
    1. Query: User.findOne({ email }).select('+password')
    2. Check: User exists
    3. Check: isActive === true
    4. Check: userType !== 'roster_record' (roster records cannot login)
    5. Check: approvalStatus
        - 'pending' → Error: "Your account is pending teacher approval..."
        - 'rejected' → Error: "Your account has been rejected..."
    6. Verify: user.comparePassword(password) (bcrypt)
    7. Generate: accessToken (15min) + refreshToken (7days)
    8. Update: refreshToken, lastLogin
    9. Save: user.save()
    10. Return: { user, accessToken, refreshToken }
    ```

    #### Response
    ```json
    {
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
        "id": "507f1f77bcf86cd799439011",
        "email": "student@school.com",
        "name": "John Doe",
        "role": "student",
        "userType": "account_user",
        "approvalStatus": "approved",
        "accessLevel": "full",
        "grade": "10",
        "section": "A",
        "institutionId": "...",
        // ... other fields (password excluded)
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    }
    ```

    #### Mobile Flow
    1. **Form Validation** (`login_screen.dart`)
    - Email format check
    - Password required check

    2. **API Call** (`auth_service.dart`)
    - POST to `/api/auth/login`
    - Store tokens in secure storage
    - Set token in API service

    3. **Error Handling**
    - Pending approval → Navigate to `ApprovalPendingScreen`
    - Rejected → Show error message
    - Invalid credentials → Show error
    - Connection error → Show network error

    4. **Success** → Navigation handled by `main.dart` (role-based routing)

    #### Web Flow
    1. **Form** (`login/page.tsx`)
    - Simple email + password form
    - HTML5 validation

    2. **Store** (`auth-store.ts`)
    - POST to `/api/auth/login` via `authApi.login()`
    - Store tokens in localStorage (Zustand persist)
    - Set token in API client

    3. **Success** → Redirect to `/dashboard`

    ---

    ### 2. Registration Flow

    #### Request
    ```http
    POST /api/auth/register
    Content-Type: application/json

    {
    "email": "newstudent@school.com",
    "password": "password123",
    "name": "Jane Doe",
    "role": "student",
    "institutionId": "507f1f77bcf86cd799439011",  // Optional
    "grade": "10",                                 // Optional
    "section": "A",                                // Optional
    "classId": "507f1f77bcf86cd799439012"         // Optional
    }
    ```

    #### Backend Flow

    1. **Route Handler** (`auth.routes.js`)
    - Rate limiting: `authLimiter` middleware
    - Validation: `registerValidation` (all fields validated)
    - Middleware: `validate` (express-validator)

    2. **Controller** (`auth.controller.js`)
    ```javascript
    - Extracts: email, password, name, role, institutionId, grade, section, classId
    - Calls: registerUser({ ...allFields })
    - Returns: successResponse with user + tokens
    ```

    3. **Service** (`auth.service.js` - `registerUser`)
    ```javascript
    Steps:
    1. Check: Email uniqueness (User.findOne({ email }))
    2. Create: userData object with provided fields
    3. For students:
        - Determine userType based on grade:
            - KG-4th → userType: 'roster_record', approvalStatus: 'approved'
            - 5th+ → userType: 'account_user', approvalStatus: 'pending'
    4. Create: User.create(userData)
    5. Password: Auto-hashed by pre-save hook (bcrypt, salt: 10)
    6. Generate: accessToken + refreshToken
    7. Save: refreshToken to user
    8. Return: { user, accessToken, refreshToken }
    ```

    #### Response
    ```json
    {
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
        "id": "507f1f77bcf86cd799439011",
        "email": "newstudent@school.com",
        "name": "Jane Doe",
        "role": "student",
        "userType": "account_user",
        "approvalStatus": "pending",  // 5th+ students need approval
        "accessLevel": "full",
        // ... other fields
        },
        "accessToken": "...",
        "refreshToken": "..."
    }
    }
    ```

    #### Mobile Flow
    1. **3-Step Wizard** (`register_screen.dart`)
    - **Step 1**: Role selection (Student, Teacher, Admin)
    - **Step 2**: Basic info (name, email, password, confirm password)
        - For students: QR scanner to join classroom
    - **Step 3**: Additional info
        - Teachers/Admins: School selection (required)
        - Students: Parent info (optional)

    2. **Validation**
    - Email format (regex)
    - Password: min 8 chars, at least one letter + one number
    - Password match confirmation
    - Name required

    3. **Special Handling**
    - If student scans QR → Navigate to `ClassroomJoinRequestScreen`
    - After registration → Check `approvalStatus`:
        - `pending` → Navigate to `ApprovalPendingScreen`
        - `approved` → Show success, navigate to login

    #### Web Flow
    - **No registration page found** (only login page exists)

    ---

    ### 3. Alternative Authentication Methods

    #### QR Code Login
    - **Route:** `POST /api/auth/qr-login`
    - **Request:** `{ "qrCode": "qr_code_string" }`
    - **Flow:** Validates QR code, returns JWT tokens
    - **Use Case:** Students without devices (KG-4th)

    #### Device Token Login
    - **Route:** `POST /api/auth/device-login`
    - **Request:** `{ "deviceToken": "device_token_string" }`
    - **Flow:** Validates device token, returns device/class context
    - **Use Case:** Shared classroom tablets

    ---

    ## 👥 Roles and Access Control

    ### Roles (4 Types)

    1. **`student`**
    - Can learn, play games, participate in drills
    - Sub-types by grade:
        - **KG-4th**: `roster_record`, no login, teacher-led
        - **5th-8th**: `account_user`, needs approval, shared devices
        - **9th-12th**: `account_user`, needs approval, full access

    2. **`teacher`**
    - Can manage classes, create drills, approve students
    - Always `account_user`, auto-approved
    - Must have `institutionId`

    3. **`admin`**
    - Full system access, manage schools, all users
    - Always `account_user`, auto-approved
    - `institutionId` optional (can manage multiple schools)

    4. **`parent`**
    - Can view child's status and alerts
    - Always `account_user`, auto-approved
    - Must have `institutionId`

    ### Role-Like Flags

    | Flag | Values | Purpose |
    |------|--------|---------|
    | `userType` | `account_user`, `roster_record` | Determines if user can login |
    | `accessLevel` | `full`, `shared`, `teacher_led`, `none` | Determines app features available |
    | `approvalStatus` | `pending`, `approved`, `rejected` | Teacher approval workflow |
    | `canUseApp` | `true`, `false` | Whether user can use mobile app |
    | `requiresTeacherAuth` | `true`, `false` | Whether teacher approval needed |

    ### Access Level Determination

    ```javascript
    if (role === 'student' && grade) {
    const gradeNum = parseInt(grade) || 0;
    if (gradeNum >= 9) return 'full';        // 9th-12th: Full access
    if (gradeNum >= 6) return 'shared';       // 6th-8th: Shared devices
    if (gradeNum >= 0 || grade === 'KG') return 'teacher_led';  // KG-5th: Teacher-led
    }
    return 'full';  // Default for non-students
    ```

    ---

    ## ✅ Validation System

    ### Backend Validation

    **Location:** `backend/src/routes/auth.routes.js`

    #### Registration Validation (`registerValidation`)

    | Field | Validation Rules |
    |-------|----------------|
    | `email` | `.isEmail()`, `.normalizeEmail()` |
    | `password` | `.isLength({ min: 6 })` |
    | `name` | `.trim()`, `.notEmpty()` |
    | `role` | `.optional()`, `.isIn(['student', 'teacher', 'admin', 'parent'])` |
    | `institutionId` | `.optional()`, `.isMongoId()` |
    | `grade` | `.optional()`, `.isIn(['KG', '1', '2', ..., '12'])` |
    | `section` | `.optional()`, `.trim()`, `.notEmpty()` |
    | `classId` | `.optional()`, `.isMongoId()` |

    #### Login Validation (`loginValidation`)

    | Field | Validation Rules |
    |-------|----------------|
    | `email` | `.isEmail()`, `.normalizeEmail()` |
    | `password` | `.notEmpty()` |

    #### Validation Middleware

    **Location:** `backend/src/middleware/validator.js`

    ```javascript
    - Uses: express-validator's validationResult()
    - Returns: 400 with error array if validation fails
    - Format: { success: false, message: "Validation failed", errors: [...] }
    ```

    #### Business Logic Validation

    **Location:** `backend/src/services/auth.service.js`

    - Email uniqueness check
    - Active account check (`isActive === true`)
    - User type check (`userType !== 'roster_record'`)
    - Approval status check (`approvalStatus !== 'pending'` or `'rejected'`)
    - Password verification (bcrypt.compare)

    ---

    ### Mobile Validation

    **Location:** `mobile/lib/core/utils/validators.dart`

    #### Validation Functions

    | Function | Validation Rules |
    |----------|----------------|
    | `isValidEmail()` | Regex: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` |
    | `isValidPassword()` | Min 8 chars, at least one letter + one number |
    | `emailError()` | Returns error message or null |
    | `passwordError()` | Returns error message or null |

    #### Usage

    - **Login Screen** (`login_screen.dart`): Email and password validation before API call
    - **Register Screen** (`register_screen.dart`): Email, password, password match, name required

    ---

    ### Web Validation

    **Location:** `web/app/login/page.tsx`

    - **Basic HTML5 validation**: `type="email"`, `required` attributes
    - **No custom validation logic**: Relies on backend validation
    - **Error display**: Shows error from backend response

    ---

    ## 📝 Current State Summary

    ### ✅ What's Working

    1. **Multi-Authentication Methods**
    - ✅ Email/password login
    - ✅ QR code login
    - ✅ Device token login

    2. **K-12 Support**
    - ✅ Grade-based access levels
    - ✅ Teacher approval system
    - ✅ Roster records for KG-4th

    3. **Role-Based Access**
    - ✅ 4 roles (student, teacher, admin, parent)
    - ✅ Access level determination
    - ✅ Feature gating based on access level

    4. **Security**
    - ✅ Password hashing (bcrypt)
    - ✅ JWT tokens (access + refresh)
    - ✅ Rate limiting
    - ✅ Input validation

    5. **Mobile & Web**
    - ✅ Mobile: Full registration flow with 3-step wizard
    - ✅ Mobile: Error handling for approval status
    - ✅ Web: Basic login page
    - ✅ Both: Token storage and management

    ### ⚠️ Potential Issues / Areas for Improvement

    1. **Grade Field Not Enforced**
    - Currently optional for students
    - Should be required for proper access level determination

    2. **Web Registration Missing**
    - Only login page exists
    - No registration flow for web

    3. **Validation Inconsistency**
    - Mobile: Password min 8 chars + letter + number
    - Backend: Password min 6 chars only
    - **Mismatch**: Mobile is stricter than backend

    4. **Approval Workflow**
    - No clear UI for teachers to approve/reject students
    - Approval status checked but approval endpoint not verified

    5. **Error Messages**
    - Some error messages could be more user-friendly
    - Approval pending detection relies on string matching

    ---

    ## 🎯 Next Steps (Phase 2)

    Before making improvements, consider:

    1. **Schema Changes**
    - Make `grade` required for students?
    - Add any new fields?

    2. **Validation Alignment**
    - Align password requirements (mobile vs backend)
    - Add more comprehensive validation?

    3. **Error Handling**
    - Standardize error message format
    - Improve error handling in mobile/web

    4. **Approval System**
    - Verify teacher approval endpoints
    - Add approval UI if missing

    5. **Web Registration**
    - Add registration page for web?
    - Or keep web admin-only?

    ---

    ## 📚 Related Documentation

    - **Architecture**: `docs/shared/ARCHITECTURE.md`
    - **Phase 2.5**: `docs/phase-2/phase-2.5/PHASE_2.5_FINAL_STATUS.md`
    - **RBAC Refinement**: See Phase 2.5 documentation

    ---

    **Last Updated:** Current Session  
    **Status:** ✅ Analysis Complete - Ready for Phase 2 Improvements  
    **Next:** Wait for confirmation before making code changes

