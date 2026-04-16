# ✅ Phase 2.5 — Implementation Checklist

Use this checklist to track progress during Phase 2.5 implementation.

---

## 📌 **2.5.1 — Database Schema Expansion**

### Backend
- [ ] Extend User model with:
  - [ ] `grade` field (enum: KG-12)
  - [ ] `section` field (String)
  - [ ] `classId` field (ObjectId ref)
  - [ ] `accessLevel` field (enum: full/shared/teacher_led/none)
  - [ ] `canUseApp` field (Boolean)
  - [ ] `requiresTeacherAuth` field (Boolean)
  - [ ] `qrCode` field (String, unique, sparse)
  - [ ] `qrBadgeId` field (String, unique, sparse)
  - [ ] `parentId` field (ObjectId ref)
- [ ] Add indexes for new fields
- [ ] Create Class model:
  - [ ] `institutionId`, `grade`, `section`, `classCode`
  - [ ] `teacherId`, `studentIds[]`, `deviceIds[]`
  - [ ] `roomNumber`, `capacity`, `isActive`
- [ ] Create Device model:
  - [ ] `deviceId`, `deviceName`, `deviceType`
  - [ ] `institutionId`, `classId`, `registrationToken`
  - [ ] `isActive`, `lastSeen`
- [ ] Extend School model with:
  - [ ] `classes[]`, `totalClasses`
  - [ ] `deviceManagement` object
- [ ] Create migration script for existing users (optional)

### Testing
- [ ] Test User model with new fields
- [ ] Test Class model CRUD
- [ ] Test Device model CRUD
- [ ] Verify indexes work correctly

---

## 📌 **2.5.2 — Multi-Access Authentication System**

### Backend
- [ ] Create QR auth service (`qr-auth.service.js`)
  - [ ] `loginWithQR(qrCode)` function
  - [ ] QR validation logic
- [ ] Create device auth service (`device-auth.service.js`)
  - [ ] `loginWithDevice(deviceToken)` function
  - [ ] Device type handling
- [ ] Create QR generator service (`qr-generator.service.js`)
  - [ ] `generateQRForStudent(studentId)` function
  - [ ] QR image generation
  - [ ] Bulk QR generation
- [ ] Add auth routes:
  - [ ] `POST /api/auth/qr-login`
  - [ ] `POST /api/auth/device-login`
  - [ ] `POST /api/auth/class-pin`
  - [ ] `POST /api/auth/select-class`
- [ ] Add QR routes:
  - [ ] `POST /api/qr/generate/:studentId`
  - [ ] `POST /api/qr/generate-class/:classId`
  - [ ] `GET /api/qr/verify/:qrCode`
  - [ ] `POST /api/qr/regenerate/:studentId`

### Mobile App
- [ ] Create QR login screen (`qr_login_screen.dart`)
  - [ ] QR scanner integration
  - [ ] Student info display
  - [ ] Login confirmation
- [ ] Create device login screen (`device_login_screen.dart`)
  - [ ] Device token input
  - [ ] Auto-login flow
- [ ] Extend auth service:
  - [ ] `loginWithQR(String qrCode)`
  - [ ] `loginWithDevice(String deviceToken)`
  - [ ] `selectClass(String classId)`
- [ ] Add QR scanner package (`mobile_scanner`)

### Testing
- [ ] Test QR login endpoint
- [ ] Test device login endpoint
- [ ] Test QR generation
- [ ] Test QR scanner in mobile app
- [ ] Test invalid QR/device token handling

---

## 📌 **2.5.3 — Role-Based Navigation & UI**

### Mobile App
- [ ] Create app router (`app_router.dart`)
  - [ ] Route generation based on auth state
  - [ ] Role-based routing logic
  - [ ] Access level routing
- [ ] Create access level provider (`access_level_provider.dart`)
  - [ ] `canAccessFeature(user, feature)` method
  - [ ] `getAvailableFeatures(user)` method
- [ ] Update main.dart to use AppRouter
- [ ] Create student dashboard variants:
  - [ ] Full access dashboard (9th-12th)
  - [ ] Shared access screen (6th-8th)
  - [ ] Teacher-assisted screen (KG-5th)
- [ ] Implement feature gating throughout app

### Testing
- [ ] Test navigation for each role
- [ ] Test access level restrictions
- [ ] Test feature gating
- [ ] Verify correct screens show for each access level

---

## 📌 **2.5.4 — Teacher Dashboard & Class Management**

### Backend
- [ ] Create teacher service (`teacher.service.js`)
  - [ ] `getTeacherClasses(teacherId)`
  - [ ] `startClassDrill(classId, drillType, teacherId)`
  - [ ] `markParticipation(classId, studentId, participated)`
  - [ ] `getClassAnalytics(classId)`
- [ ] Create teacher routes (`teacher.routes.js`)
  - [ ] `GET /api/teacher/classes`
  - [ ] `GET /api/teacher/classes/:classId/students`
  - [ ] `POST /api/teacher/classes/:classId/drills/start`
  - [ ] `POST /api/teacher/classes/:classId/students/:studentId/participate`
  - [ ] `GET /api/teacher/classes/:classId/analytics`
- [ ] Integrate FCM for class drill notifications

### Mobile App
- [ ] Create teacher dashboard screen (`teacher_dashboard_screen.dart`)
  - [ ] Class list
  - [ ] Quick actions
  - [ ] Recent activity
- [ ] Create class management screen (`class_management_screen.dart`)
  - [ ] Student list
  - [ ] Attendance marking
  - [ ] Group activity launcher
  - [ ] Student progress view
  - [ ] Projector control
- [ ] Create teacher provider (`teacher_provider.dart`)
  - [ ] `loadClasses()`
  - [ ] `selectClass(classId)`
  - [ ] `startDrill(drillType)`
  - [ ] `markParticipation(studentId, participated)`

### Testing
- [ ] Test teacher dashboard loads classes
- [ ] Test class selection
- [ ] Test drill initiation
- [ ] Test participation marking
- [ ] Test FCM notifications to students

---

## 📌 **2.5.5 — QR Identity System**

### Backend
- [ ] QR generation endpoints working
- [ ] QR verification endpoint working
- [ ] Bulk QR generation for classes
- [ ] QR regeneration endpoint

### Web Admin
- [ ] Create QR badge generator page (`/admin/classes/[classId]/qr-badges`)
  - [ ] Student list display
  - [ ] Individual QR generation
  - [ ] Bulk QR generation
  - [ ] PDF download
  - [ ] Print-friendly layout
- [ ] Create QR badge component (`QRBadge.tsx`)
  - [ ] Student photo (optional)
  - [ ] Student name
  - [ ] Grade & Section
  - [ ] QR code (large)
  - [ ] Badge ID
  - [ ] School logo

### Mobile App
- [ ] Integrate QR scanner (`qr_scanner_screen.dart`)
  - [ ] Real-time scanning
  - [ ] Student info display
  - [ ] Action buttons

### Testing
- [ ] Test QR generation API
- [ ] Test bulk QR generation
- [ ] Test QR verification
- [ ] Test QR badge printing
- [ ] Test QR scanning in mobile app

---

## 📌 **2.5.6 — Class Device Mode**

### Backend
- [ ] Create device service (`device.service.js`)
  - [ ] `registerDevice(deviceData)`
  - [ ] `getDevice(deviceId)`
  - [ ] `updateDevice(deviceId, updates)`
- [ ] Create device routes (`device.routes.js`)
  - [ ] `POST /api/devices/register`
  - [ ] `GET /api/devices/:deviceId`
  - [ ] `PUT /api/devices/:deviceId`

### Mobile App
- [ ] Create device registration screen (`device_registration_screen.dart`)
  - [ ] Device ID detection
  - [ ] School/class selection
  - [ ] Registration token storage
- [ ] Create class device mode screen (`class_device_mode_screen.dart`)
  - [ ] Class selection
  - [ ] Projector mode toggle
  - [ ] Group activity launcher
  - [ ] QR scanner
  - [ ] Teacher control panel
- [ ] Create device mode provider (`device_mode_provider.dart`)
  - [ ] `registerDevice()`
  - [ ] `loginWithDevice()`
  - [ ] `selectClass(classId)`
  - [ ] `isClassDeviceMode()`

### Testing
- [ ] Test device registration
- [ ] Test device auto-login
- [ ] Test class device mode
- [ ] Test class switching
- [ ] Test device mode persistence

---

## 📌 **2.5.7 — Projector Mode**

### Backend
- [ ] Create projector routes (`projector.routes.js`)
  - [ ] `GET /api/projector/session/:sessionId`
  - [ ] `POST /api/projector/session/:sessionId/content`
  - [ ] `POST /api/projector/session/:sessionId/control`
- [ ] Add Socket.io events:
  - [ ] `PROJECTOR_CONNECT`
  - [ ] `PROJECTOR_CONTROL`
  - [ ] `PROJECTOR_UPDATE`

### Web
- [ ] Create projector page (`/projector/[sessionId]`)
  - [ ] Fullscreen display
  - [ ] Large fonts
  - [ ] Animated instructions
  - [ ] Visual drill guides
  - [ ] Socket.io client connection

### Mobile App
- [ ] Create projector controller screen (`projector_controller_screen.dart`)
  - [ ] Create session
  - [ ] Select content
  - [ ] Control slides (Next/Previous/Pause)
  - [ ] End session
  - [ ] Real-time sync

### Testing
- [ ] Test projector web page display
- [ ] Test mobile controller
- [ ] Test real-time sync via Socket.io
- [ ] Test multiple content types

---

## 📌 **2.5.8 — Group Activity Engine**

### Backend
- [ ] Create GroupActivity model (`GroupActivity.js`)
  - [ ] `activityType`, `classId`, `deviceId`
  - [ ] `participants[]` array
  - [ ] `status`, `startedBy`, `results`
- [ ] Create group activity routes (`group-activity.routes.js`)
  - [ ] `POST /api/group-activities/create`
  - [ ] `POST /api/group-activities/:activityId/join`
  - [ ] `POST /api/group-activities/:activityId/submit`
  - [ ] `GET /api/group-activities/:activityId/results`

### Mobile App
- [ ] Create group activity screen (`group_activity_screen.dart`)
  - [ ] Activity type selection
  - [ ] QR scanner for participants
  - [ ] Participant list
  - [ ] Start activity button
- [ ] Create group game screen (`group_game_screen.dart`)
  - [ ] Game UI integration
  - [ ] Turn-based/simultaneous play
  - [ ] Score display
  - [ ] Results summary

### Testing
- [ ] Test group activity creation
- [ ] Test QR-based joining
- [ ] Test score tracking
- [ ] Test results aggregation
- [ ] Test integration with Phase 3 games

---

## 📌 **2.5.9 — Simplified UI for Young Students**

### Mobile App
- [ ] Create kid-friendly theme (`kid_theme.dart`)
  - [ ] Large buttons (min 60x60dp)
  - [ ] Bright, contrasting colors
  - [ ] Cartoon-style icons
  - [ ] Minimal text
  - [ ] Voice narration support
- [ ] Create kid home screen (`kid_home_screen.dart`)
  - [ ] 4 large icon buttons
  - [ ] Visual only
  - [ ] Voice instructions
  - [ ] Touch feedback
- [ ] Create kid module screen (`kid_module_screen.dart`)
  - [ ] Fullscreen animations
  - [ ] Voice narration
  - [ ] Touch to continue
  - [ ] Visual progress

### Testing
- [ ] Test kid theme
- [ ] Test large button usability
- [ ] Test voice narration
- [ ] Test visual-only interface
- [ ] Test with non-literate users (if possible)

---

## 📌 **2.5.10 — Testing & Integration**

### Test Scenarios
- [ ] **Authentication Tests**
  - [ ] QR login flow
  - [ ] Device login flow
  - [ ] Teacher class selection
  - [ ] Invalid token handling
- [ ] **Role-Based Navigation Tests**
  - [ ] Full access student (9th-12th)
  - [ ] Shared access student (6th-8th)
  - [ ] Teacher dashboard
  - [ ] Class device mode
- [ ] **Integration Tests**
  - [ ] Teacher-led drill flow
  - [ ] Group activity flow
  - [ ] QR badge workflow
  - [ ] Projector mode flow
- [ ] **End-to-End Tests**
  - [ ] Complete user journeys for each access level
  - [ ] Cross-feature integration
  - [ ] Error handling

### Documentation
- [ ] Update API documentation
- [ ] Create user guides for each access mode
- [ ] Create teacher manual
- [ ] Create admin setup guide
- [ ] Update architecture diagrams

### Final Verification
- [ ] All Phase 2.5 features working
- [ ] No breaking changes to Phase 1 & 2
- [ ] Integration with existing features verified
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Ready for Phase 3

---

## 📊 **Progress Tracking**

**Overall Progress**: ___ / 10 sub-phases complete

**Week 1**: ___ / 2 tasks (2.5.1, 2.5.2 backend)
**Week 2**: ___ / 2 tasks (2.5.2 mobile, 2.5.3)
**Week 3**: ___ / 2 tasks (2.5.4, 2.5.5)
**Week 4**: ___ / 2 tasks (2.5.6, 2.5.7)
**Week 5**: ___ / 2 tasks (2.5.8, 2.5.9)
**Week 6**: ___ / 1 task (2.5.10)

---

**Last Updated**: _______________
**Status**: 🟡 In Progress / ✅ Complete

