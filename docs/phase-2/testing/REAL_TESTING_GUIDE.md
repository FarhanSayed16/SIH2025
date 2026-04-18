# Real Testing Guide - Kavach Project

## 🧪 Complete Testing Guide for Real Functionality

This guide provides step-by-step instructions to test **real functionality** of the Kavach system - no mocks, no dummies, real API calls and real data.

---

## 📋 Prerequisites

### Required Services Running

1. **Backend Server**: Must be running on `http://localhost:3000`
2. **MongoDB**: Connected and seeded with test data
3. **Mobile App**: Built and running on device/emulator
4. **Web Dashboard**: Running on `http://localhost:3001` (or configured port)
5. **Firebase**: Configured (optional but recommended for FCM)

---

## 🚀 Setup Before Testing

### 1. Start Backend

```bash
cd backend
npm install
npm run dev
```

**Verify**: Check `http://localhost:3000/health` returns `{status: 'ok', db: 'connected'}`

### 2. Seed Database

```bash
cd backend
npm run seed
```

**Verify**: Check MongoDB has users, schools, modules, drills

### 3. Start Mobile App

```bash
cd mobile
flutter pub get
flutter run
```

**Verify**: App launches and shows login screen

### 4. Start Web Dashboard

```bash
cd web
npm install
npm run dev
```

**Verify**: Dashboard accessible at `http://localhost:3001`

---

## ✅ Test Checklist

### Phase 1: Authentication Tests

#### Test 1.1: User Registration (Backend API)

**Endpoint**: `POST http://localhost:3000/api/auth/register`

**Request**:
```json
{
  "email": "testuser@example.com",
  "password": "Test1234",
  "name": "Test User",
  "role": "student",
  "institutionId": "SCHOOL_ID_FROM_SEED"
}
```

**Expected**:
- ✅ Status: 201
- ✅ Response contains `accessToken` and `refreshToken`
- ✅ User created in database
- ✅ Password is hashed (not plain text)

**Verify in Database**:
```javascript
// MongoDB
db.users.findOne({ email: "testuser@example.com" })
// Should show: hashed password, role, institutionId
```

---

#### Test 1.2: User Login (Backend API)

**Endpoint**: `POST http://localhost:3000/api/auth/login`

**Request**:
```json
{
  "email": "admin@school.com",  // From seed data
  "password": "admin123"         // From seed data
}
```

**Expected**:
- ✅ Status: 200
- ✅ Response contains `accessToken` and `refreshToken`
- ✅ User object returned
- ✅ `lastLogin` updated in database

**Save Token**: Copy `accessToken` for next tests

---

#### Test 1.3: Mobile App Login

**Steps**:
1. Open mobile app
2. Enter email: `admin@school.com`
3. Enter password: `admin123`
4. Tap "Login"

**Expected**:
- ✅ Login succeeds
- ✅ Navigates to Dashboard
- ✅ Token stored securely
- ✅ User info displayed

**Verify**:
- Check app logs for: "Login successful"
- Check backend logs for: "User logged in: admin@school.com"

---

#### Test 1.4: Web Dashboard Login

**Steps**:
1. Open `http://localhost:3001`
2. Enter email: `admin@school.com`
3. Enter password: `admin123`
4. Click "Sign In"

**Expected**:
- ✅ Login succeeds
- ✅ Redirects to Dashboard
- ✅ Token stored in localStorage
- ✅ Sidebar shows user info

**Verify**:
- Open browser DevTools → Application → Local Storage
- Check for `kavach-auth-storage` key with token

---

#### Test 1.5: Token Refresh

**Endpoint**: `POST http://localhost:3000/api/auth/refresh`

**Request**:
```json
{
  "refreshToken": "REFRESH_TOKEN_FROM_LOGIN"
}
```

**Expected**:
- ✅ Status: 200
- ✅ New `accessToken` returned
- ✅ Old access token invalidated

---

### Phase 2: Real-time Socket Tests

#### Test 2.1: Socket Connection (Mobile)

**Steps**:
1. Login to mobile app
2. Check connection indicator (should be green)

**Expected**:
- ✅ Socket connects to backend
- ✅ Connection indicator shows "Connected"
- ✅ App logs: "Socket connected"
- ✅ Backend logs: "Socket client connected"

**Verify**:
- Check backend logs for socket connection
- Check mobile app logs for "Socket connected"

---

#### Test 2.2: Join School Room (Mobile)

**Steps**:
1. Login as user with `institutionId`
2. Check app logs

**Expected**:
- ✅ Socket emits `JOIN_ROOM` event
- ✅ Backend logs: "User joined room: SCHOOL_ID"
- ✅ User added to school room

**Verify**:
- Backend logs should show room join
- Check Socket.io room membership

---

#### Test 2.3: Receive Drill Scheduled Event

**Steps**:
1. Login to web dashboard as admin
2. Schedule a drill (see Test 3.1)
3. Check mobile app

**Expected**:
- ✅ Mobile app receives `DRILL_SCHEDULED` event
- ✅ Notification appears (if FCM configured)
- ✅ App logs show event received

**Verify**:
- Mobile app logs: "DRILL_SCHEDULED received"
- Check event payload in logs

---

#### Test 2.4: Receive Crisis Alert

**Steps**:
1. Login to web dashboard as admin
2. Create an alert (see Test 4.1)
3. Check mobile app

**Expected**:
- ✅ Mobile app receives `CRISIS_ALERT` event
- ✅ RedAlert screen appears
- ✅ App vibrates/plays sound
- ✅ Notification appears

**Verify**:
- Mobile app shows RedAlert screen
- Backend logs show broadcast to room

---

### Phase 3: Drill Management Tests

#### Test 3.1: Schedule Drill (Web Dashboard)

**Steps**:
1. Login to web dashboard
2. Navigate to "Drills" page
3. Click "+ Schedule Drill"
4. Fill form:
   - Type: Fire
   - Scheduled Date/Time: Tomorrow 10:00 AM
5. Click "Schedule Drill"

**Expected**:
- ✅ Drill created in database
- ✅ `DRILL_SCHEDULED` event broadcast
- ✅ Drill appears in list
- ✅ Mobile app receives notification

**Verify**:
- Check database: `db.drills.findOne({ type: "fire" })`
- Check mobile app received event
- Check backend logs for broadcast

---

#### Test 3.2: Trigger Drill Immediately

**Steps**:
1. In web dashboard, find scheduled drill
2. Click "Trigger Now"

**Expected**:
- ✅ Drill status changes to "active"
- ✅ `CRISIS_ALERT` event broadcast
- ✅ Mobile app receives alert
- ✅ RedAlert screen appears

**Verify**:
- Database: Drill status = "active"
- Mobile app shows RedAlert
- Backend logs show alert broadcast

---

#### Test 3.3: Drill Acknowledgment (Mobile)

**Steps**:
1. Receive drill alert on mobile
2. Tap "Acknowledge" button

**Expected**:
- ✅ Socket emits `DRILL_ACK` event
- ✅ Backend records acknowledgment
- ✅ Drill record updated with user ID

**Verify**:
- Database: `drill.acknowledgedBy` contains user ID
- Backend logs show acknowledgment

---

### Phase 4: Alert Management Tests

#### Test 4.1: Create Alert (Web Dashboard)

**Steps**:
1. Login to web dashboard
2. Navigate to "Dashboard"
3. Create test alert (if button available) OR use API:

**API Call**:
```bash
POST http://localhost:3000/api/alerts
Headers:
  Authorization: Bearer ACCESS_TOKEN

Body:
{
  "schoolId": "SCHOOL_ID",
  "type": "fire",
  "severity": "high",
  "message": "Test fire alert"
}
```

**Expected**:
- ✅ Alert created in database
- ✅ `CRISIS_ALERT` event broadcast
- ✅ Mobile app receives alert
- ✅ Alert appears in dashboard

**Verify**:
- Database: `db.alerts.findOne({ type: "fire" })`
- Mobile app shows RedAlert
- Dashboard shows alert in list

---

### Phase 5: Device Management Tests

#### Test 5.1: Register IoT Device

**Endpoint**: `POST http://localhost:3000/api/devices/register`

**Request**:
```json
{
  "deviceId": "ESP32-001",
  "institutionId": "SCHOOL_ID",
  "type": "fire-sensor",
  "name": "Fire Sensor Lab 1",
  "location": {
    "lat": 28.6139,
    "lng": 77.2090
  }
}
```

**Expected**:
- ✅ Status: 201
- ✅ Device created in database
- ✅ `deviceToken` returned
- ✅ Device appears in web dashboard

**Verify**:
- Database: `db.devices.findOne({ deviceId: "ESP32-001" })`
- Web dashboard: Devices page shows new device

---

#### Test 5.2: Device Telemetry

**Endpoint**: `POST http://localhost:3000/api/devices/ESP32-001/telemetry`

**Headers**:
```
Authorization: Bearer DEVICE_TOKEN
```

**Request**:
```json
{
  "smokeLevel": 450,
  "temperature": 85,
  "battery": 75
}
```

**Expected**:
- ✅ Status: 200
- ✅ Telemetry saved to device
- ✅ Alert triggered if threshold exceeded

**Verify**:
- Database: Device has telemetry entry
- Check if alert was created (if threshold exceeded)

---

### Phase 6: FCM Push Notification Tests

#### Test 6.1: FCM Token Registration

**Steps**:
1. Login to mobile app
2. Check app logs for FCM token

**Expected**:
- ✅ FCM token received from Firebase
- ✅ Token registered with backend
- ✅ User's `deviceToken` updated in database

**Verify**:
- App logs: "FCM token received: ..."
- Backend logs: "FCM token updated for user ..."
- Database: `db.users.findOne({ email: "..." }).deviceToken` has token

---

#### Test 6.2: Send Test Push Notification

**Using Firebase Console**:
1. Go to Firebase Console → Cloud Messaging
2. Click "Send test message"
3. Enter FCM token from Test 6.1
4. Enter title and message
5. Click "Test"

**Expected**:
- ✅ Notification appears on device
- ✅ App handles notification
- ✅ Navigation works if app is open

**Verify**:
- Device shows notification
- App logs show message received

---

#### Test 6.3: Backend Sends Push Notification

**Endpoint**: `POST http://localhost:3000/api/alerts` (creates alert)

**Expected**:
- ✅ Alert created
- ✅ Backend sends FCM notification
- ✅ Device receives notification
- ✅ Notification opens RedAlert screen

**Verify**:
- Device receives notification
- App navigates to RedAlert screen
- Backend logs show FCM send attempt

---

### Phase 7: Offline & Sync Tests

#### Test 7.1: Offline Module Display

**Steps**:
1. Login to mobile app
2. Navigate to "Learn" screen
3. Turn off WiFi/Data
4. Check if modules still display

**Expected**:
- ✅ Modules display from cache
- ✅ "Last updated" timestamp shown
- ✅ "Offline" indicator visible

**Verify**:
- Modules list still visible
- No network errors

---

#### Test 7.2: Offline Quiz Completion

**Steps**:
1. Go offline
2. Complete a quiz (if available)
3. Turn on WiFi/Data
4. Check sync

**Expected**:
- ✅ Quiz completed offline
- ✅ Data synced when online
- ✅ Score updated in backend

**Verify**:
- Backend: Quiz result in database
- App: Score updated

---

#### Test 7.3: Bulk Sync

**Endpoint**: `POST http://localhost:3000/api/sync`

**Request**:
```json
{
  "quizzes": [
    {
      "moduleId": "MODULE_ID",
      "score": 85,
      "answers": {...},
      "completedAt": "2024-01-01T10:00:00Z"
    }
  ],
  "drillLogs": [
    {
      "drillId": "DRILL_ID",
      "participationStatus": "completed",
      "acknowledgedAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

**Expected**:
- ✅ Status: 200
- ✅ Quiz results saved
- ✅ Drill logs saved
- ✅ Preparedness score recalculated

**Verify**:
- Database: Quiz results and drill logs exist
- User's preparedness score updated

---

## 📊 Test Results Template

```
Date: __________
Tester: __________
Backend URL: __________
Mobile App Version: __________
Web Dashboard Version: __________

Phase 1: Authentication
[ ] Test 1.1: User Registration
[ ] Test 1.2: User Login (API)
[ ] Test 1.3: Mobile App Login
[ ] Test 1.4: Web Dashboard Login
[ ] Test 1.5: Token Refresh

Phase 2: Real-time Socket
[ ] Test 2.1: Socket Connection
[ ] Test 2.2: Join School Room
[ ] Test 2.3: Receive Drill Scheduled
[ ] Test 2.4: Receive Crisis Alert

Phase 3: Drill Management
[ ] Test 3.1: Schedule Drill
[ ] Test 3.2: Trigger Drill
[ ] Test 3.3: Drill Acknowledgment

Phase 4: Alert Management
[ ] Test 4.1: Create Alert

Phase 5: Device Management
[ ] Test 5.1: Register Device
[ ] Test 5.2: Device Telemetry

Phase 6: FCM Push Notifications
[ ] Test 6.1: FCM Token Registration
[ ] Test 6.2: Send Test Push
[ ] Test 6.3: Backend Sends Push

Phase 7: Offline & Sync
[ ] Test 7.1: Offline Module Display
[ ] Test 7.2: Offline Quiz Completion
[ ] Test 7.3: Bulk Sync

Issues Found:
1. __________
2. __________

Notes:
__________
```

---

## 🎯 Success Criteria

All tests should:
- ✅ Use real backend APIs
- ✅ Use real database
- ✅ Use real Socket.io connections
- ✅ Use real Firebase (if configured)
- ✅ Produce real results
- ✅ Verify data in database
- ✅ Check logs for errors

---

**Status**: Real testing guide ready ✅  
**Next**: Follow this guide to test all functionality

