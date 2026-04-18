# 🧪 Complete Testing Guide - Phase 2.5

## 📋 **Testing Checklist**

### ✅ **Backend Testing** (COMPLETED)

#### **Health Check**
- [x] ✅ Server running on port 3000
- [x] ✅ MongoDB connected
- [x] ✅ Health endpoint responding

#### **Authentication Endpoints**
- [x] ✅ `POST /api/auth/login` - Working
- [x] ✅ `POST /api/auth/register` - Ready
- [x] ✅ `POST /api/auth/qr-login` - Ready
- [x] ✅ `POST /api/auth/device-login` - Ready

#### **QR Endpoints**
- [x] ✅ `GET /api/qr/verify/:qrCode` - Working (validates)
- [x] ✅ `POST /api/qr/generate/:studentId` - Ready
- [x] ✅ `POST /api/qr/generate-class/:classId` - Ready

#### **Teacher Endpoints**
- [x] ✅ `GET /api/teacher/classes` - Working (requires auth)
- [x] ✅ `GET /api/teacher/classes/:classId/students` - Ready
- [x] ✅ `POST /api/teacher/classes/:classId/drills/start` - Ready

---

### 🔄 **Web App Testing** (IN PROGRESS)

#### **Pages to Test**
1. **Login Page** (`/login`)
   - [ ] Email/password login works
   - [ ] Error messages display correctly
   - [ ] Redirects to dashboard on success

2. **Dashboard** (`/dashboard`)
   - [ ] Loads drills and alerts
   - [ ] Real-time events display
   - [ ] Socket.io connection works

3. **Classes Page** (`/classes`) - **NEW**
   - [ ] Lists all classes
   - [ ] Shows student count
   - [ ] Shows teacher info
   - [ ] Click to view details

4. **QR Generator** (`/qr-generator`) - **NEW**
   - [ ] Class selector works
   - [ ] Generates QR codes
   - [ ] Displays QR images
   - [ ] Print badge works

5. **Drills Page** (`/drills`)
   - [ ] Lists drills
   - [ ] Can create drill
   - [ ] Can trigger drill

6. **Devices Page** (`/devices`)
   - [ ] Lists devices
   - [ ] Shows device status

7. **Map Page** (`/map`)
   - [ ] Shows map
   - [ ] Displays user locations

---

### 📱 **Mobile App Testing** (READY)

#### **Authentication Flow**
1. **Email/Password Login**
   - [ ] Login screen appears
   - [ ] Can enter email/password
   - [ ] Login button works
   - [ ] Error handling works
   - [ ] Success redirects correctly

2. **QR Login** - **NEW**
   - [ ] QR login button visible
   - [ ] Opens QR scanner
   - [ ] Can scan QR code
   - [ ] Login succeeds with valid QR
   - [ ] Error on invalid QR

3. **Device Login** - **NEW**
   - [ ] Device registration works
   - [ ] Device login works

#### **Role-Based Navigation**
1. **Admin User**
   - [ ] Redirects to admin dashboard
   - [ ] All features accessible

2. **Teacher User**
   - [ ] Redirects to teacher dashboard
   - [ ] Shows class list
   - [ ] Can view class details
   - [ ] Can start drills

3. **Student (9th-12th Grade)**
   - [ ] Redirects to full dashboard
   - [ ] All app features available

4. **Student (6th-8th Grade)**
   - [ ] Redirects to shared dashboard
   - [ ] Limited features

5. **Student (KG-5th Grade)**
   - [ ] Redirects to kid home screen
   - [ ] Simplified UI
   - [ ] Voice narration works

#### **Teacher Features** - **NEW**
1. **Teacher Dashboard**
   - [ ] Shows assigned classes
   - [ ] Displays student count
   - [ ] Refresh button works
   - [ ] Empty state shows correctly

2. **Class Management**
   - [ ] Shows all students
   - [ ] QR scanner button works
   - [ ] Student details dialog works
   - [ ] Start drill button works

3. **QR Scanning**
   - [ ] Opens camera
   - [ ] Scans QR code
   - [ ] Verifies student
   - [ ] Shows result

#### **Student Features**
1. **Home Screen**
   - [ ] Shows welcome message
   - [ ] Displays preparedness score
   - [ ] Quick actions visible

2. **Learn Screen**
   - [ ] Shows modules
   - [ ] Can view module details
   - [ ] Can complete modules

3. **Games Screen**
   - [ ] Shows games
   - [ ] Can play games

4. **Profile Screen**
   - [ ] Shows user info
   - [ ] Can logout

#### **Kid Mode** - **NEW**
1. **Kid Home Screen**
   - [ ] Large buttons
   - [ ] Bright colors
   - [ ] Simple navigation

2. **Kid Module Screen**
   - [ ] Voice narration
   - [ ] Large images
   - [ ] Simple interactions

---

## 🧪 **Manual Testing Steps**

### **Test 1: Web Admin Login**
1. Open http://localhost:3001
2. Navigate to `/login`
3. Enter admin credentials
4. Verify redirect to dashboard
5. Check that data loads

### **Test 2: Web Classes Management**
1. Login as admin
2. Navigate to `/classes`
3. Verify classes list appears
4. Click on a class
5. Verify details load

### **Test 3: Web QR Generator**
1. Navigate to `/qr-generator`
2. Select a class
3. Click "Generate QR Badges"
4. Verify QR codes appear
5. Click "Print Badge" on one
6. Verify print dialog opens

### **Test 4: Mobile Login**
1. Open app on device
2. Enter email/password
3. Verify login succeeds
4. Verify correct dashboard appears

### **Test 5: Mobile QR Login**
1. Open app
2. Click "Login with QR Code"
3. Scan a QR code
4. Verify login succeeds

### **Test 6: Teacher Dashboard**
1. Login as teacher
2. Verify teacher dashboard appears
3. Verify classes list shows
4. Click on a class
5. Verify class management opens

### **Test 7: Student Dashboard (High School)**
1. Login as 9th-12th grade student
2. Verify full dashboard appears
3. Verify all features accessible

### **Test 8: Kid Mode**
1. Login as KG-5th grade student (via QR)
2. Verify kid home screen appears
3. Verify simplified UI
4. Test voice narration

---

## 📊 **Test Results Template**

### **Date**: [Date]
### **Tester**: [Name]

#### **Backend**
- Status: ✅ / ❌
- Issues: [List any issues]

#### **Web App**
- Status: ✅ / ❌
- Issues: [List any issues]

#### **Mobile App**
- Status: ✅ / ❌
- Issues: [List any issues]

#### **Integration**
- Status: ✅ / ❌
- Issues: [List any issues]

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: Backend not responding**
- **Solution**: Check if server is running on port 3000
- **Command**: `cd backend && npm run dev`

### **Issue 2: Web app not loading**
- **Solution**: Check if dev server is running on port 3001
- **Command**: `cd web && npm run dev`

### **Issue 3: Mobile app build fails**
- **Solution**: Run `flutter clean && flutter pub get`
- **Check**: Android SDK version, Gradle version

### **Issue 4: QR scanner not working**
- **Solution**: Check camera permissions
- **Check**: `mobile_scanner` package version

### **Issue 5: Authentication fails**
- **Solution**: Check backend URL in `.env`
- **Check**: CORS settings in backend

---

## ✅ **Success Criteria**

All tests pass when:
1. ✅ Backend responds to all endpoints
2. ✅ Web app loads all pages
3. ✅ Mobile app runs on device
4. ✅ Login works for all user types
5. ✅ Role-based navigation works
6. ✅ QR login works
7. ✅ Teacher features work
8. ✅ Kid mode activates for young students
9. ✅ No console errors
10. ✅ No crashes

---

**Last Updated**: Testing in progress

