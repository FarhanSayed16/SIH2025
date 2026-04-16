# Phase 2.5 — Testing Guide

## 📋 **Testing Checklist**

### **Backend Testing**

#### **1. Database Models**
- [ ] User model with Phase 2.5 fields
- [ ] Class model creation and relationships
- [ ] Device model registration
- [ ] ProjectorSession model
- [ ] GroupActivity model

#### **2. Authentication**
- [ ] QR login (`POST /api/auth/qr-login`)
- [ ] Device login (`POST /api/auth/device-login`)
- [ ] QR verification (`GET /api/qr/verify/:qrCode`)
- [ ] QR generation (`POST /api/qr/generate/:studentId`)

#### **3. Teacher Features**
- [ ] Get teacher classes (`GET /api/teacher/classes`)
- [ ] Get class students (`GET /api/teacher/classes/:classId/students`)
- [ ] Start class drill (`POST /api/teacher/classes/:classId/drills/start`)
- [ ] Mark participation (`POST /api/teacher/classes/:classId/students/:studentId/participate`)
- [ ] Get analytics (`GET /api/teacher/classes/:classId/analytics`)

#### **4. Device Management**
- [ ] Register device (`POST /api/devices/register`)
- [ ] Get device info (`GET /api/devices/:deviceId`)
- [ ] Update device (`PUT /api/devices/:deviceId`)

#### **5. Projector Mode**
- [ ] Create session (`POST /api/projector/sessions`)
- [ ] Get active session (`GET /api/projector/sessions/device/:deviceId`)
- [ ] Update content (`PUT /api/projector/sessions/:sessionId/content`)
- [ ] Connect device (`POST /api/projector/sessions/:sessionId/connect`)
- [ ] End session (`POST /api/projector/sessions/:sessionId/end`)

#### **6. Group Activities**
- [ ] Create activity (`POST /api/group-activities/create`)
- [ ] Join activity (`POST /api/group-activities/:activityId/join`)
- [ ] Submit result (`POST /api/group-activities/:activityId/submit`)
- [ ] Get results (`GET /api/group-activities/:activityId/results`)

---

### **Mobile App Testing**

#### **1. Authentication**
- [ ] QR login flow
- [ ] Device login flow
- [ ] QR scanner functionality
- [ ] Access level detection

#### **2. Navigation**
- [ ] Role-based routing
- [ ] Access level routing
- [ ] Kid mode detection (KG-5th)
- [ ] Teacher dashboard access

#### **3. Teacher Features**
- [ ] Class list display
- [ ] Class selection
- [ ] Student list view
- [ ] Drill initiation
- [ ] Participation tracking

#### **4. QR System**
- [ ] QR scanner screen
- [ ] QR login screen
- [ ] QR verification
- [ ] Student info display

#### **5. Device Mode**
- [ ] Device registration
- [ ] Device auto-login
- [ ] Class device mode screen
- [ ] Quick actions

#### **6. Projector Controller**
- [ ] Session connection
- [ ] Content type selection
- [ ] Slide navigation
- [ ] Session end

#### **7. Kid Mode**
- [ ] Kid theme application
- [ ] Kid home screen
- [ ] Kid module screen
- [ ] Voice narration
- [ ] Speech-to-text

---

### **Web Admin Testing**

#### **1. Projector Page**
- [ ] Session connection
- [ ] Real-time content updates
- [ ] Socket.io integration
- [ ] Content display (module, image, video, presentation)

---

## 🧪 **Test Scenarios**

### **Scenario 1: Student QR Login**
1. Generate QR code for student
2. Scan QR code with mobile app
3. Verify student info displayed
4. Complete login
5. Verify kid mode activated (if KG-5th)

### **Scenario 2: Teacher Class Management**
1. Teacher logs in
2. View class list
3. Select a class
4. View students
5. Start a drill
6. Mark student participation

### **Scenario 3: Device Registration**
1. Register class tablet
2. Get registration token
3. Login with device token
4. Verify class device mode activated
5. Test quick actions

### **Scenario 4: Projector Mode**
1. Create projector session
2. Open projector page in browser
3. Connect mobile controller
4. Change content type
5. Navigate slides
6. End session

### **Scenario 5: Group Activity**
1. Teacher creates group activity
2. Students scan QR to join
3. Students submit results
4. View activity results

---

## 📊 **Integration Testing**

### **End-to-End Flows**

1. **Complete K-12 Flow**:
   - Teacher creates class
   - Students assigned to class
   - QR codes generated
   - Students scan QR to login
   - Teacher starts drill
   - Students participate via class device
   - Results tracked

2. **Multi-Device Flow**:
   - Teacher uses mobile app
   - Class uses class tablet
   - Projector displays content
   - All devices sync via Socket.io

3. **Access Level Flow**:
   - 9th-12th: Full app access
   - 6th-8th: Shared access
   - KG-5th: Kid mode or teacher-led

---

## ✅ **Success Criteria**

- [ ] All backend endpoints return correct responses
- [ ] All mobile screens render correctly
- [ ] QR system works end-to-end
- [ ] Device mode functional
- [ ] Projector mode syncs correctly
- [ ] Kid mode activates for appropriate grades
- [ ] No breaking changes to Phase 1 & 2
- [ ] All tests pass

---

## 🐛 **Known Issues & Fixes**

### **Issue 1: QR Code Not Scanning**
**Fix**: Ensure camera permissions granted, check QR format

### **Issue 2: Device Token Expired**
**Fix**: Re-register device, update token storage

### **Issue 3: Kid Mode Not Activating**
**Fix**: Verify grade field in user model, check KidModeProvider logic

---

## 📝 **Test Data**

### **Test Users**
- Teacher: `teacher@test.com` / `test123`
- Student (5th): `student5@test.com` / `test123`
- Student (10th): `student10@test.com` / `test123`

### **Test QR Codes**
- Valid: `TEST-QR-CODE-12345`
- Invalid: `INVALID-QR-CODE`

### **Test Devices**
- Device ID: `TEST-DEVICE-123`
- Device Type: `class_tablet`

---

**Last Updated**: Phase 2.5 Implementation Complete

