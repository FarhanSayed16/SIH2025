# 📘 PHASE 2.5 — K–12 Multi-Access & Identity Architecture

## 🎯 **Phase Overview**

**Goal**: Enable KAVACH to support ALL K–12 students (KG to 12th standard) by implementing multiple access modes that accommodate:
- Students without personal devices (KG–5th)
- Students with limited/shared device access (6th–8th)
- Students with full personal device access (9th–12th)
- Teacher-led classroom management
- School-owned shared devices
- QR-based identity for non-literate students

**Why This Phase**: The current system assumes every student has a personal device and can authenticate. This phase removes that assumption and makes KAVACH deployable in real Indian school environments where:
- Schools don't allow personal phones
- Young children (KG–4th) cannot read or operate apps
- Many students (up to 8th standard) don't have personal devices
- Teachers need to manage entire classes

**Position in Roadmap**: 
- ✅ **Phase 1**: Backend foundation, models, services
- ✅ **Phase 2**: Mobile & Web shells, auth, real-time
- 🔄 **Phase 2.5**: K–12 Multi-Access (THIS PHASE)
- ⏳ **Phase 3**: Peace Mode content, gamification, modules
- ⏳ **Phase 4**: Crisis Mode, AR, mesh networking
- ⏳ **Phase 5**: Advanced features, analytics

**Dependencies**:
- ✅ Phase 1 & 2 must be complete
- ✅ Auth system working
- ✅ User model exists
- ✅ Mobile app shell ready

**Deliverables**:
- Enhanced user models with grade/access levels
- Multiple authentication methods
- Role-based navigation system
- Teacher dashboard & class management
- QR identity system
- Projector mode
- Class device mode
- Group activity engine

---

## 📊 **Current State Analysis**

### ✅ **What We Have** (From Phase 1 & 2)

**Backend**:
- ✅ User model with basic roles: `student`, `teacher`, `admin`, `parent`
- ✅ School model with location, safe zones, floor plans
- ✅ Authentication system (JWT, login, register)
- ✅ Socket.io real-time layer
- ✅ FCM push notifications
- ✅ Basic API structure

**Mobile App**:
- ✅ Login/Register screens
- ✅ Basic navigation structure
- ✅ Auth provider (Riverpod)
- ✅ Socket connection
- ✅ FCM integration
- ✅ Dashboard shell

**Web Admin**:
- ✅ Admin dashboard shell
- ✅ Authentication
- ✅ Basic navigation

### ❌ **What's Missing** (To Be Built in Phase 2.5)

**Backend**:
- ❌ Grade/class information in User model
- ❌ Class model (grade + section + teacher mapping)
- ❌ Device model (for class devices)
- ❌ QR identity system
- ❌ Teacher-class-student relationships
- ❌ Access level differentiation
- ❌ Group activity tracking

**Mobile App**:
- ❌ Role-based navigation
- ❌ Teacher dashboard
- ❌ Class selection UI
- ❌ QR scanner for student identity
- ❌ Class device mode
- ❌ Projector mode
- ❌ Simplified UI for young students
- ❌ Group activity screens

**Web Admin**:
- ❌ Class management UI
- ❌ Student enrollment
- ❌ QR badge generation
- ❌ Device registration
- ❌ Teacher assignment

---

## 🏗️ **Architecture Overview**

### **User Access Modes**

```
┌─────────────────────────────────────────────────────────┐
│                    KAVACH ACCESS MODES                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🟦 FULL ACCESS (9th–12th Std)                        │
│     • Personal device login                            │
│     • Individual progress tracking                      │
│     • Full app features                                │
│     • Crisis mode with mesh networking                 │
│                                                         │
│  🟧 SHARED ACCESS (6th–8th Std)                       │
│     • QR badge login                                   │
│     • Class tablet / shared device                     │
│     • Group activities                                 │
│     • Limited personal features                        │
│                                                         │
│  🟨 TEACHER-LED (KG–5th Std)                          │
│     • No student login                                 │
│     • Teacher controls everything                      │
│     • Projector mode for instructions                  │
│     • Group games on shared device                      │
│     • Teacher marks participation                      │
│                                                         │
│  🟩 CLASS DEVICE MODE                                 │
│     • School-owned tablet                              │
│     • Auto-login with device token                     │
│     • Class selection screen                           │
│     • Projector mode                                  │
│     • Group activities                                 │
│                                                         │
│  🟥 TEACHER MODE                                      │
│     • Full teacher dashboard                           │
│     • Class management                                 │
│     • Drill control                                    │
│     • Student progress tracking                        │
│     • Projector control                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### **Data Model Relationships**

```
School
  ├── Classes (Grade + Section)
  │     ├── Teacher (User with role=teacher)
  │     └── Students (User with role=student, grade, section)
  │
  ├── Devices (Class devices, projector devices)
  │     └── Assigned to Class (optional)
  │
  └── QR Badges
        └── Linked to Student ID
```

---

## 📋 **Phase 2.5 Sub-Phases**

### **2.5.1 — Database Schema Expansion**
### **2.5.2 — Multi-Access Authentication System**
### **2.5.3 — Role-Based Navigation & UI**
### **2.5.4 — Teacher Dashboard & Class Management**
### **2.5.5 — QR Identity System**
### **2.5.6 — Class Device Mode**
### **2.5.7 — Projector Mode**
### **2.5.8 — Group Activity Engine**
### **2.5.9 — Simplified UI for Young Students**
### **2.5.10 — Testing & Integration**

---

## 📌 **2.5.1 — Database Schema Expansion**

### **Goal**: Extend User, School models and add new models to support K–12 multi-access

### **Backend Changes**

#### **A. User Model Extensions**

**File**: `backend/src/models/User.js`

**Add Fields**:
```javascript
{
  // Grade information
  grade: {
    type: String,
    enum: ['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    required: function() {
      return this.role === 'student';
    }
  },
  section: {
    type: String, // A, B, C, etc.
    required: function() {
      return this.role === 'student';
    }
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: function() {
      return this.role === 'student';
    }
  },
  
  // Access control
  accessLevel: {
    type: String,
    enum: ['full', 'shared', 'teacher_led', 'none'],
    default: function() {
      if (this.role === 'student') {
        const gradeNum = parseInt(this.grade) || 0;
        if (gradeNum >= 9) return 'full';
        if (gradeNum >= 6) return 'shared';
        if (gradeNum >= 0) return 'teacher_led';
      }
      return 'full';
    }
  },
  canUseApp: {
    type: Boolean,
    default: function() {
      if (this.role === 'student') {
        const gradeNum = parseInt(this.grade) || 0;
        return gradeNum >= 6; // 6th std and above can use app
      }
      return true;
    }
  },
  requiresTeacherAuth: {
    type: Boolean,
    default: function() {
      if (this.role === 'student') {
        const gradeNum = parseInt(this.grade) || 0;
        return gradeNum < 6; // KG-5th require teacher
      }
      return false;
    }
  },
  
  // QR Identity
  qrCode: {
    type: String,
    unique: true,
    sparse: true // Allow null for non-students
  },
  qrBadgeId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Parent linking (for KG-5th communication)
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}
```

**Indexes**:
```javascript
userSchema.index({ classId: 1 });
userSchema.index({ grade: 1, section: 1, institutionId: 1 });
userSchema.index({ qrCode: 1 });
userSchema.index({ qrBadgeId: 1 });
```

#### **B. New Class Model**

**File**: `backend/src/models/Class.js` (NEW)

```javascript
{
  institutionId: { type: ObjectId, ref: 'School', required: true },
  grade: { type: String, enum: ['KG', '1', '2', ..., '12'], required: true },
  section: { type: String, required: true }, // A, B, C
  classCode: { type: String, unique: true }, // e.g., "S1-5-A"
  teacherId: { type: ObjectId, ref: 'User', required: true },
  studentIds: [{ type: ObjectId, ref: 'User' }],
  deviceIds: [{ type: ObjectId, ref: 'Device' }], // Class tablets
  roomNumber: String,
  capacity: Number,
  isActive: { type: Boolean, default: true }
}
```

#### **C. New Device Model**

**File**: `backend/src/models/Device.js` (NEW)

```javascript
{
  deviceId: { type: String, unique: true, required: true }, // Hardware ID
  deviceName: { type: String, required: true }, // "Class 2-A Tablet"
  deviceType: {
    type: String,
    enum: ['class_tablet', 'projector_device', 'teacher_device', 'personal'],
    required: true
  },
  institutionId: { type: ObjectId, ref: 'School', required: true },
  classId: { type: ObjectId, ref: 'Class' }, // Optional - for class devices
  registrationToken: { type: String, unique: true }, // For auto-login
  isActive: { type: Boolean, default: true },
  lastSeen: Date
}
```

#### **D. School Model Extensions**

**File**: `backend/src/models/School.js`

**Add Fields**:
```javascript
{
  classes: [{ type: ObjectId, ref: 'Class' }],
  totalClasses: { type: Number, default: 0 },
  deviceManagement: {
    allowPersonalDevices: { type: Boolean, default: false },
    allowClassDevices: { type: Boolean, default: true },
    maxClassDevices: { type: Number, default: 5 }
  }
}
```

### **Acceptance Criteria**

- [ ] User model has grade, section, classId, accessLevel fields
- [ ] Class model created with teacher-student relationships
- [ ] Device model created for class/projector devices
- [ ] School model extended with class management
- [ ] All indexes created
- [ ] Migration script for existing users (optional grade assignment)
- [ ] API endpoints for class CRUD operations

---

## 📌 **2.5.2 — Multi-Access Authentication System**

### **Goal**: Support multiple login methods beyond email/password

### **Backend Changes**

#### **A. New Auth Endpoints**

**File**: `backend/src/routes/auth.routes.js`

**Add Routes**:
```javascript
// QR Code Login (for students)
POST /api/auth/qr-login
Body: { qrCode: "QR_STRING" }

// Device Auto-Login
POST /api/auth/device-login
Body: { deviceToken: "DEVICE_REGISTRATION_TOKEN" }

// Class PIN Login (for shared devices)
POST /api/auth/class-pin
Body: { classCode: "S1-5-A", pin: "1234" }

// Teacher Class Selection
POST /api/auth/select-class
Headers: { Authorization: "Bearer TOKEN" }
Body: { classId: "CLASS_ID" }
```

#### **B. QR Login Service**

**File**: `backend/src/services/qr-auth.service.js` (NEW)

```javascript
export const loginWithQR = async (qrCode) => {
  // Find user by QR code
  const user = await User.findOne({ qrCode });
  if (!user) throw new Error('Invalid QR code');
  
  // Check if student can use app
  if (!user.canUseApp) {
    throw new Error('Student requires teacher assistance');
  }
  
  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  
  return { user, accessToken, refreshToken };
};
```

#### **C. Device Login Service**

**File**: `backend/src/services/device-auth.service.js` (NEW)

```javascript
export const loginWithDevice = async (deviceToken) => {
  const device = await Device.findOne({ registrationToken: deviceToken });
  if (!device) throw new Error('Invalid device token');
  
  // For class devices, return class context
  if (device.deviceType === 'class_tablet' && device.classId) {
    const classData = await Class.findById(device.classId).populate('teacherId');
    return {
      device,
      class: classData,
      mode: 'class_device',
      // No user token - device operates in class mode
    };
  }
  
  // For projector devices
  if (device.deviceType === 'projector_device') {
    return {
      device,
      mode: 'projector',
      // Projector mode doesn't need user auth
    };
  }
};
```

#### **D. QR Code Generation**

**File**: `backend/src/services/qr-generator.service.js` (NEW)

```javascript
import crypto from 'crypto';
import qrcode from 'qrcode';

export const generateQRForStudent = async (studentId) => {
  const user = await User.findById(studentId);
  if (!user || user.role !== 'student') {
    throw new Error('Only students can have QR codes');
  }
  
  // Generate unique QR code
  const qrData = {
    studentId: user._id.toString(),
    classId: user.classId.toString(),
    schoolId: user.institutionId.toString(),
    timestamp: Date.now()
  };
  
  const qrString = crypto.createHash('sha256')
    .update(JSON.stringify(qrData))
    .digest('hex')
    .substring(0, 32);
  
  // Store QR code in user
  user.qrCode = qrString;
  user.qrBadgeId = `KAVACH-${user.grade}-${user.section}-${qrString.substring(0, 6)}`;
  await user.save();
  
  // Generate QR image
  const qrImage = await qrcode.toDataURL(qrString);
  
  return {
    qrCode: qrString,
    qrBadgeId: user.qrBadgeId,
    qrImage,
    studentName: user.name,
    grade: user.grade,
    section: user.section
  };
};
```

### **Mobile App Changes**

#### **A. QR Scanner Screen**

**File**: `mobile/lib/features/auth/screens/qr_login_screen.dart` (NEW)

- Camera-based QR scanner
- Display scanned student info
- Confirm and login
- Error handling for invalid QR

#### **B. Device Login Screen**

**File**: `mobile/lib/features/auth/screens/device_login_screen.dart` (NEW)

- Device token input
- Auto-login flow
- Class selection after device auth

#### **C. Auth Service Extensions**

**File**: `mobile/lib/features/auth/services/auth_service.dart`

**Add Methods**:
```dart
Future<AuthResponse> loginWithQR(String qrCode);
Future<ClassDeviceAuth> loginWithDevice(String deviceToken);
Future<void> selectClass(String classId); // For teachers
```

### **Acceptance Criteria**

- [ ] QR login endpoint working
- [ ] Device login endpoint working
- [ ] QR code generation API working
- [ ] QR scanner screen implemented
- [ ] Device login screen implemented
- [ ] Auth service supports all methods
- [ ] Error handling for invalid QR/device tokens

---

## 📌 **2.5.3 — Role-Based Navigation & UI**

### **Goal**: Show different screens based on user role and access level

### **Mobile App Changes**

#### **A. Navigation Router**

**File**: `mobile/lib/core/navigation/app_router.dart` (NEW)

```dart
class AppRouter {
  static Route<dynamic> generateRoute(RouteSettings settings, AuthState authState) {
    final user = authState.user;
    
    if (user == null) {
      return MaterialPageRoute(builder: (_) => LoginScreen());
    }
    
    // Route based on role and access level
    switch (user.role) {
      case 'admin':
        return MaterialPageRoute(builder: (_) => AdminDashboardScreen());
      
      case 'teacher':
        return MaterialPageRoute(builder: (_) => TeacherDashboardScreen());
      
      case 'student':
        return _routeStudent(user);
      
      default:
        return MaterialPageRoute(builder: (_) => DashboardScreen());
    }
  }
  
  static Route<dynamic> _routeStudent(UserModel user) {
    // Check access level
    switch (user.accessLevel) {
      case 'full': // 9th-12th
        return MaterialPageRoute(builder: (_) => StudentDashboardScreen());
      
      case 'shared': // 6th-8th
        return MaterialPageRoute(builder: (_) => SharedAccessScreen());
      
      case 'teacher_led': // KG-5th
        // Should not reach here - these students don't login
        return MaterialPageRoute(builder: (_) => TeacherAssistedScreen());
      
      default:
        return MaterialPageRoute(builder: (_) => LoginScreen());
    }
  }
}
```

#### **B. Access Level Provider**

**File**: `mobile/lib/core/providers/access_level_provider.dart` (NEW)

```dart
class AccessLevelProvider {
  static bool canAccessFeature(UserModel user, String feature) {
    switch (user.accessLevel) {
      case 'full':
        return true; // All features
      
      case 'shared':
        return ['modules', 'games', 'quizzes'].contains(feature);
      
      case 'teacher_led':
        return false; // No direct access
      
      default:
        return false;
    }
  }
  
  static List<String> getAvailableFeatures(UserModel user) {
    // Return list of features based on access level
  }
}
```

#### **C. Update Main Navigation**

**File**: `mobile/lib/main.dart`

**Modify**: Use AppRouter instead of direct navigation

### **Acceptance Criteria**

- [ ] AppRouter implemented with role-based routing
- [ ] Access level provider working
- [ ] Different screens for different access levels
- [ ] Navigation updates based on user role
- [ ] Feature gating based on access level

---

## 📌 **2.5.4 — Teacher Dashboard & Class Management**

### **Goal**: Enable teachers to manage classes and control activities

### **Backend Changes**

#### **A. Teacher Endpoints**

**File**: `backend/src/routes/teacher.routes.js` (NEW)

```javascript
// Get teacher's classes
GET /api/teacher/classes

// Get class students
GET /api/teacher/classes/:classId/students

// Start drill for class
POST /api/teacher/classes/:classId/drills/start

// Mark student participation
POST /api/teacher/classes/:classId/students/:studentId/participate

// Get class analytics
GET /api/teacher/classes/:classId/analytics
```

#### **B. Teacher Service**

**File**: `backend/src/services/teacher.service.js` (NEW)

```javascript
export const getTeacherClasses = async (teacherId) => {
  return await Class.find({ teacherId, isActive: true })
    .populate('studentIds', 'name grade section')
    .populate('deviceIds');
};

export const startClassDrill = async (classId, drillType, teacherId) => {
  // Verify teacher owns class
  const classData = await Class.findOne({ _id: classId, teacherId });
  if (!classData) throw new Error('Unauthorized');
  
  // Create drill instance
  const drill = await Drill.create({
    institutionId: classData.institutionId,
    classId,
    type: drillType,
    initiatedBy: teacherId,
    status: 'active'
  });
  
  // Notify all students in class via FCM
  // ... FCM logic
  
  return drill;
};
```

### **Mobile App Changes**

#### **A. Teacher Dashboard Screen**

**File**: `mobile/lib/features/teacher/screens/teacher_dashboard_screen.dart` (NEW)

**Features**:
- List of teacher's classes
- Quick actions: Start Drill, View Progress, Manage Class
- Class selection
- Recent activity

#### **B. Class Management Screen**

**File**: `mobile/lib/features/teacher/screens/class_management_screen.dart` (NEW)

**Features**:
- Student list for selected class
- Mark attendance
- Start group activities
- View student progress
- Projector mode control

#### **C. Teacher Provider**

**File**: `mobile/lib/features/teacher/providers/teacher_provider.dart` (NEW)

```dart
class TeacherNotifier extends StateNotifier<TeacherState> {
  Future<void> loadClasses();
  Future<void> selectClass(String classId);
  Future<void> startDrill(String drillType);
  Future<void> markParticipation(String studentId, bool participated);
}
```

### **Acceptance Criteria**

- [ ] Teacher dashboard shows all classes
- [ ] Teacher can select a class
- [ ] Teacher can view students in class
- [ ] Teacher can start drills for class
- [ ] Teacher can mark student participation
- [ ] Class analytics visible
- [ ] FCM notifications sent to students during drills

---

## 📌 **2.5.5 — QR Identity System**

### **Goal**: Generate and manage QR badges for students

### **Backend Changes**

#### **A. QR Management Endpoints**

**File**: `backend/src/routes/qr.routes.js` (NEW)

```javascript
// Generate QR for student
POST /api/qr/generate/:studentId
// Returns: { qrCode, qrBadgeId, qrImage, studentInfo }

// Bulk generate for class
POST /api/qr/generate-class/:classId
// Returns: Array of QR data

// Verify QR code
GET /api/qr/verify/:qrCode
// Returns: Student info

// Regenerate QR (if lost)
POST /api/qr/regenerate/:studentId
```

### **Web Admin Changes**

#### **A. QR Badge Generator**

**File**: `web/app/admin/classes/[classId]/qr-badges/page.tsx` (NEW)

**Features**:
- View all students in class
- Generate QR for individual student
- Bulk generate for entire class
- Download QR badges as PDF
- Print-friendly badge layout

#### **B. QR Badge Design**

**File**: `web/components/admin/QRBadge.tsx` (NEW)

**Design Elements**:
- Student photo (optional)
- Student name
- Grade & Section
- QR code (large, scannable)
- Badge ID
- School logo
- Lamination-ready format

### **Mobile App Changes**

#### **A. QR Scanner Integration**

**File**: `mobile/lib/features/qr/scanner/qr_scanner_screen.dart` (NEW)

- Uses `mobile_scanner` package
- Real-time scanning
- Student info display
- Action buttons (Mark attendance, Start activity)

### **Acceptance Criteria**

- [ ] QR generation API working
- [ ] Bulk QR generation for classes
- [ ] QR verification endpoint
- [ ] Web admin can generate and download QR badges
- [ ] Mobile app can scan QR codes
- [ ] QR badges are print-ready

---

## 📌 **2.5.6 — Class Device Mode**

### **Goal**: Support school-owned tablets for classroom use

### **Backend Changes**

#### **A. Device Registration**

**File**: `backend/src/routes/device.routes.js` (NEW)

```javascript
// Register device
POST /api/devices/register
Body: { deviceId, deviceName, deviceType, institutionId, classId? }

// Get device info
GET /api/devices/:deviceId

// Update device
PUT /api/devices/:deviceId
```

#### **B. Device Service**

**File**: `backend/src/services/device.service.js` (NEW)

```javascript
export const registerDevice = async (deviceData) => {
  // Generate registration token
  const registrationToken = crypto.randomBytes(32).toString('hex');
  
  const device = await Device.create({
    ...deviceData,
    registrationToken
  });
  
  return device;
};
```

### **Mobile App Changes**

#### **A. Device Registration Screen**

**File**: `mobile/lib/features/device/screens/device_registration_screen.dart` (NEW)

- Device ID detection
- School/class selection
- Registration token storage
- Auto-login setup

#### **B. Class Device Mode Screen**

**File**: `mobile/lib/features/device/screens/class_device_mode_screen.dart` (NEW)

**Features**:
- Class selection (if not pre-assigned)
- Projector mode toggle
- Group activity launcher
- Student QR scanner
- Teacher control panel (if teacher logged in)

#### **C. Device Mode Provider**

**File**: `mobile/lib/features/device/providers/device_mode_provider.dart` (NEW)

```dart
class DeviceModeNotifier extends StateNotifier<DeviceModeState> {
  Future<void> registerDevice();
  Future<void> loginWithDevice();
  Future<void> selectClass(String classId);
  bool isClassDeviceMode();
}
```

### **Acceptance Criteria**

- [ ] Device registration working
- [ ] Device auto-login working
- [ ] Class device mode screen functional
- [ ] Device can switch between classes
- [ ] Device mode persists across app restarts

---

## 📌 **2.5.7 — Projector Mode**

### **Goal**: Large-screen display mode for classroom instruction

### **Backend Changes**

#### **A. Projector Endpoints**

**File**: `backend/src/routes/projector.routes.js` (NEW)

```javascript
// Get projector session
GET /api/projector/session/:sessionId

// Update projector content
POST /api/projector/session/:sessionId/content
Body: { slideIndex, content, type }

// Control projector
POST /api/projector/session/:sessionId/control
Body: { action: 'next' | 'previous' | 'pause' | 'resume' | 'end' }
```

### **Web Changes**

#### **A. Projector Web Page**

**File**: `web/app/projector/[sessionId]/page.tsx` (NEW)

**Features**:
- Fullscreen display
- Large fonts
- Animated instructions
- Visual drill guides
- No interaction needed (teacher controls from app)

#### **B. Projector Controller (Mobile)**

**File**: `mobile/lib/features/projector/screens/projector_controller_screen.dart` (NEW)

**Features**:
- Create projector session
- Select content (drill, module, game)
- Control slides: Next, Previous, Pause
- End session
- Real-time sync with projector display

### **Socket.io Integration**

**File**: `backend/src/handlers/socket.handler.js`

**Add Events**:
```javascript
// Projector events
io.on('PROJECTOR_CONNECT', (sessionId) => { ... });
io.on('PROJECTOR_CONTROL', (sessionId, action) => { ... });
io.on('PROJECTOR_UPDATE', (sessionId, content) => { ... });
```

### **Acceptance Criteria**

- [ ] Projector web page displays content
- [ ] Mobile app can control projector
- [ ] Real-time sync via Socket.io
- [ ] Fullscreen, large-font display
- [ ] Multiple content types supported (drills, modules, games)

---

## 📌 **2.5.8 — Group Activity Engine**

### **Goal**: Enable group-based activities for shared devices

### **Backend Changes**

#### **A. Group Activity Model**

**File**: `backend/src/models/GroupActivity.js` (NEW)

```javascript
{
  activityType: { type: String, enum: ['game', 'quiz', 'drill', 'module'] },
  classId: { type: ObjectId, ref: 'Class' },
  deviceId: { type: ObjectId, ref: 'Device' },
  participants: [{
    studentId: { type: ObjectId, ref: 'User' },
    joinedAt: Date,
    score: Number,
    completed: Boolean
  }],
  status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
  startedBy: { type: ObjectId, ref: 'User' }, // Teacher
  results: {
    totalParticipants: Number,
    averageScore: Number,
    completionRate: Number
  }
}
```

#### **B. Group Activity Endpoints**

**File**: `backend/src/routes/group-activity.routes.js` (NEW)

```javascript
// Create group activity
POST /api/group-activities/create
Body: { activityType, classId, deviceId }

// Join activity (via QR scan)
POST /api/group-activities/:activityId/join
Body: { qrCode }

// Submit result
POST /api/group-activities/:activityId/submit
Body: { studentId, score, completed }

// Get activity results
GET /api/group-activities/:activityId/results
```

### **Mobile App Changes**

#### **A. Group Activity Screen**

**File**: `mobile/lib/features/group/screens/group_activity_screen.dart` (NEW)

**Features**:
- Activity type selection
- QR scanner for participants
- Participant list
- Start activity button
- Real-time participant updates

#### **B. Group Game Screen**

**File**: `mobile/lib/features/group/screens/group_game_screen.dart` (NEW)

**Features**:
- Game UI (from Phase 3)
- Turn-based or simultaneous play
- Score display
- Results summary

### **Acceptance Criteria**

- [ ] Group activity model created
- [ ] Students can join via QR scan
- [ ] Teacher can start group activities
- [ ] Scores tracked per participant
- [ ] Results aggregated and displayed
- [ ] Works with Phase 3 games

---

## 📌 **2.5.9 — Simplified UI for Young Students**

### **Goal**: Create kid-friendly UI for KG–5th students (when they do interact)

### **Mobile App Changes**

#### **A. Kid-Friendly Theme**

**File**: `mobile/lib/core/theme/kid_theme.dart` (NEW)

**Features**:
- Large buttons (min 60x60dp)
- Bright, contrasting colors
- Cartoon-style icons
- No text (or minimal text)
- Voice narration support
- Gesture-friendly

#### **B. Simplified Navigation**

**File**: `mobile/lib/features/kids/screens/kid_home_screen.dart` (NEW)

**Features**:
- 4 large icon buttons
- Visual only (no text)
- Voice instructions
- Touch feedback
- Simple animations

#### **C. Visual Module Player**

**File**: `mobile/lib/features/kids/screens/kid_module_screen.dart` (NEW)

**Features**:
- Fullscreen animations
- Voice narration
- Touch to continue
- No reading required
- Visual progress indicators

### **Acceptance Criteria**

- [ ] Kid theme implemented
- [ ] Large, touch-friendly buttons
- [ ] Voice narration working
- [ ] Minimal text, maximum visuals
- [ ] Works for non-literate students

---

## 📌 **2.5.10 — Testing & Integration**

### **Goal**: Comprehensive testing of all Phase 2.5 features

### **Test Scenarios**

#### **A. Authentication Tests**

1. **QR Login**
   - Generate QR for student
   - Scan QR with mobile app
   - Verify login success
   - Test invalid QR handling

2. **Device Login**
   - Register class device
   - Auto-login with device token
   - Verify class device mode
   - Test device switching classes

3. **Teacher Class Selection**
   - Teacher logs in
   - Selects class
   - Verifies class context

#### **B. Role-Based Navigation Tests**

1. **Full Access Student (9th–12th)**
   - Login → Full dashboard
   - All features accessible
   - Individual progress tracking

2. **Shared Access Student (6th–8th)**
   - QR login → Shared access screen
   - Limited features
   - Group activities available

3. **Teacher**
   - Login → Teacher dashboard
   - Class selection
   - Drill control
   - Student management

4. **Class Device**
   - Device login → Class device mode
   - Class selection
   - Projector mode
   - Group activities

#### **C. Integration Tests**

1. **Teacher-Led Drill Flow**
   - Teacher starts drill for class
   - Projector displays instructions
   - Students follow physically
   - Teacher marks participation

2. **Group Activity Flow**
   - Teacher starts group game
   - Students join via QR
   - Game plays on shared device
   - Scores recorded

3. **QR Badge Workflow**
   - Admin generates QR badges
   - Badges printed
   - Students use badges for login/activities
   - QR verification works

### **Acceptance Criteria**

- [ ] All authentication methods tested
- [ ] Role-based navigation verified
- [ ] Teacher dashboard functional
- [ ] QR system end-to-end tested
- [ ] Class device mode working
- [ ] Projector mode synced
- [ ] Group activities functional
- [ ] Kid-friendly UI tested
- [ ] Integration with Phase 1 & 2 verified

---

## 🔄 **Integration with Future Phases**

### **Phase 3 (Peace Mode Content)**

**Dependencies from Phase 2.5**:
- ✅ Access level system (determines which modules students see)
- ✅ Group activity engine (for multiplayer games)
- ✅ Teacher dashboard (for module assignment)
- ✅ Class device mode (for classroom learning)

**What Phase 3 Will Use**:
- Access level provider to filter content
- Group activity system for multiplayer games
- Teacher module assignment
- Kid-friendly UI for young student modules

### **Phase 4 (Crisis Mode)**

**Dependencies from Phase 2.5**:
- ✅ Class-student relationships (for class-wide alerts)
- ✅ Teacher control (for managing crisis drills)
- ✅ QR system (for student identification during crisis)
- ✅ Access levels (determines crisis features)

**What Phase 4 Will Use**:
- Class model for bulk crisis notifications
- Teacher dashboard for crisis drill control
- QR scanning for student check-in during crisis
- Access level to disable mesh networking for young students

### **Phase 5 (Advanced Features)**

**Dependencies from Phase 2.5**:
- ✅ All access modes
- ✅ Group activity tracking
- ✅ Teacher analytics

**What Phase 5 Will Use**:
- Complete access level system
- Group activity results for analytics
- Teacher dashboard for advanced reporting

---

## 📊 **Implementation Timeline**

### **Week 1: Database & Backend Foundation**
- 2.5.1: Database schema expansion
- 2.5.2: Multi-access authentication (backend)

### **Week 2: Authentication & Navigation**
- 2.5.2: Multi-access authentication (mobile)
- 2.5.3: Role-based navigation

### **Week 3: Teacher Features**
- 2.5.4: Teacher dashboard
- 2.5.5: QR identity system

### **Week 4: Device & Projector Modes**
- 2.5.6: Class device mode
- 2.5.7: Projector mode

### **Week 5: Group Activities & UI**
- 2.5.8: Group activity engine
- 2.5.9: Simplified UI for kids

### **Week 6: Testing & Polish**
- 2.5.10: Comprehensive testing
- Bug fixes
- Documentation

---

## ✅ **Phase 2.5 Completion Checklist**

### **Backend**
- [ ] User model extended with grade, section, accessLevel
- [ ] Class model created
- [ ] Device model created
- [ ] QR authentication endpoints
- [ ] Device authentication endpoints
- [ ] Teacher service and endpoints
- [ ] Group activity model and endpoints
- [ ] QR generation service
- [ ] Projector endpoints

### **Mobile App**
- [ ] QR scanner screen
- [ ] Device login screen
- [ ] Role-based navigation
- [ ] Access level provider
- [ ] Teacher dashboard
- [ ] Class management screen
- [ ] Class device mode screen
- [ ] Projector controller
- [ ] Group activity screens
- [ ] Kid-friendly UI theme

### **Web Admin**
- [ ] Class management UI
- [ ] QR badge generator
- [ ] Device registration UI
- [ ] Teacher assignment UI
- [ ] Student enrollment UI

### **Testing**
- [ ] All authentication methods tested
- [ ] Role-based navigation verified
- [ ] Teacher features tested
- [ ] QR system end-to-end tested
- [ ] Device mode tested
- [ ] Projector mode tested
- [ ] Group activities tested
- [ ] Integration with Phase 1 & 2 verified

---

## 🎯 **Success Metrics**

1. **Coverage**: System supports all K–12 grades (KG to 12th)
2. **Accessibility**: Students without devices can participate
3. **Usability**: Non-literate students (KG–2nd) can use system via teacher/projector
4. **Scalability**: Multiple classes can use system simultaneously
5. **Flexibility**: Works with personal devices, shared devices, and no devices

---

## 📝 **Notes**

- This phase does NOT break existing Phase 1 & 2 functionality
- All new features are additive
- Existing users continue to work (with optional grade assignment)
- Phase 3 can proceed immediately after Phase 2.5
- This phase makes KAVACH truly K–12 compatible

---

**End of Phase 2.5 Plan**

