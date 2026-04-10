# 🚨 IoT Real-Time Alerts & Notifications Plan

**Date:** December 8, 2025  
**Status:** Planning Phase - Awaiting Confirmation

---

## 🎯 **OBJECTIVE**

Implement **instant real-time alerts, notifications, and popups** when IoT devices detect disasters (Fire, Flood, Earthquake) on both **Web Dashboard** and **Mobile App**.

---

## 📊 **CURRENT STATE ANALYSIS**

### **✅ What's Already Working:**

1. **Backend:**
   - ✅ Socket.io broadcasting `DEVICE_ALERT` events
   - ✅ Socket.io broadcasting `TELEMETRY_UPDATE` events
   - ✅ Alert creation when thresholds are breached
   - ✅ Device authentication and telemetry processing

2. **Mobile App:**
   - ✅ Socket.io connection established
   - ✅ Socket event handlers in `socket_event_handler.dart`
   - ✅ IoT device list and detail screens
   - ✅ Basic Socket.io listeners for `TELEMETRY_UPDATE` and `DEVICE_ALERT`

3. **Web Dashboard:**
   - ✅ Socket.io connection established
   - ✅ Socket service in `socket-service.ts`
   - ✅ IoT device management page
   - ✅ Basic Socket.io listeners for `TELEMETRY_UPDATE` and `DEVICE_ALERT`

### **❌ What's Missing:**

1. **Mobile App:**
   - ❌ Real-time popup/dialog when disaster detected
   - ❌ Push notifications (FCM) for critical alerts
   - ❌ Alert banner/toast notifications
   - ❌ Auto-refresh of IoT widget on alerts
   - ❌ Sound/vibration alerts for critical disasters
   - ❌ Navigation to alert details on tap

2. **Web Dashboard:**
   - ❌ Real-time toast notifications for alerts
   - ❌ Alert popup/modal for critical alerts
   - ❌ Auto-refresh of IoT alert banner
   - ❌ Browser notification API integration
   - ❌ Sound alerts for critical disasters
   - ❌ Auto-navigate to device details on critical alert

---

## 🎯 **REQUIREMENTS**

### **Priority 1: Critical Alerts (Fire, Flood, Earthquake)**

When an IoT device detects:
- **Fire** → Instant alert with highest priority
- **Flood** → Instant alert with high priority
- **Earthquake** → Instant alert with high priority

**Both platforms should:**
1. Show immediate popup/notification
2. Play sound alert (if enabled)
3. Update UI in real-time
4. Allow quick action (view details, dismiss)

### **Priority 2: Telemetry Updates**

When device sends telemetry:
1. Update IoT widget/card in real-time
2. Update device detail screens
3. Update charts/historical data
4. No popup (silent update)

---

## 📱 **MOBILE APP IMPLEMENTATION PLAN**

### **1. Real-Time Alert Popup/Dialog**

**Location:** `mobile/lib/features/iot/widgets/iot_alert_dialog.dart` (NEW)

**Features:**
- Full-screen or modal dialog
- Shows alert type (Fire/Flood/Earthquake)
- Device name and location
- Sensor data (flame detected, water level, magnitude)
- Timestamp
- Actions: "View Details", "Dismiss", "Mark as Read"
- Auto-dismiss after 30 seconds (optional)

**Trigger:**
- Listen to `DEVICE_ALERT` Socket.io event
- Show dialog when `alertType` is `FIRE`, `FLOOD`, or `EARTHQUAKE`
- Check if app is in foreground

### **2. Push Notifications (FCM)**

**Location:** `mobile/lib/features/fcm/handlers/iot_alert_handler.dart` (NEW)

**Features:**
- Send FCM notification when disaster detected
- High priority notification
- Custom sound for each alert type
- Deep link to device detail screen
- Notification actions (View, Dismiss)

**Integration:**
- Backend sends FCM notification when `DEVICE_ALERT` is created
- Mobile app receives and displays notification
- Tap notification → Navigate to device details

### **3. Alert Banner/Toast**

**Location:** `mobile/lib/features/iot/widgets/iot_alert_banner.dart` (NEW)

**Features:**
- Persistent banner at top of screen
- Shows active alerts count
- Tap to view all alerts
- Auto-hide when all alerts resolved
- Color-coded by severity

**Placement:**
- Home screen (below welcome section)
- Device list screen (top)
- Device detail screen (top)

### **4. Sound & Vibration Alerts**

**Location:** `mobile/lib/features/iot/services/alert_sound_service.dart` (NEW)

**Features:**
- Play sound when critical alert received
- Different sounds for Fire/Flood/Earthquake
- Vibration pattern for alerts
- Respect device silent mode (optional)
- User preference to enable/disable

**Implementation:**
- Use `audioplayers` package (already in dependencies)
- Use `vibration` package (may need to add)

### **5. Real-Time Widget Updates**

**Location:** `mobile/lib/features/dashboard/widgets/iot_status_widget.dart` (ENHANCE)

**Features:**
- Auto-refresh when `TELEMETRY_UPDATE` received
- Update device counts in real-time
- Show alert badge when alerts exist
- Animate changes

### **6. Socket Event Handler Enhancement**

**Location:** `mobile/lib/features/socket/handlers/socket_event_handler.dart` (ENHANCE)

**Changes:**
- Enhanced `_handleDeviceAlert` to:
  - Show alert dialog
  - Send push notification
  - Update alert banner
  - Play sound/vibration
  - Update IoT widget
  - Navigate to device details (optional)

---

## 🌐 **WEB DASHBOARD IMPLEMENTATION PLAN**

### **1. Real-Time Toast Notifications**

**Location:** `web/components/notifications/IoTAlertToast.tsx` (NEW)

**Features:**
- Toast notification when alert received
- Shows alert type, device name, severity
- Auto-dismiss after 10 seconds
- Click to view device details
- Stack multiple toasts
- Color-coded by severity

**Integration:**
- Listen to `DEVICE_ALERT` in `socket-service.ts`
- Show toast using shadcn/ui `toast` component (already available)

### **2. Alert Popup/Modal**

**Location:** `web/components/alerts/IoTAlertModal.tsx` (NEW)

**Features:**
- Modal dialog for critical alerts
- Full alert details
- Device information
- Sensor data visualization
- Actions: "View Device", "Dismiss", "Acknowledge"
- Auto-show when critical alert received
- Prevent multiple modals (queue system)

**Trigger:**
- Show when `severity === 'CRITICAL'` or `alertType === 'FIRE'`
- Check if user is on dashboard/devices page

### **3. Browser Notifications**

**Location:** `web/lib/services/browser-notifications.ts` (NEW)

**Features:**
- Request notification permission
- Send browser notification for critical alerts
- Custom icon and sound
- Click to navigate to device details
- Respect user preferences

**Implementation:**
- Use Browser Notification API
- Request permission on first alert
- Show notification when tab is not active

### **4. Sound Alerts**

**Location:** `web/lib/services/alert-sound-service.ts` (NEW)

**Features:**
- Play sound when critical alert received
- Different sounds for Fire/Flood/Earthquake
- User preference to enable/disable
- Respect browser autoplay policies

**Implementation:**
- Use HTML5 Audio API
- Preload sound files
- Play on alert received

### **5. Real-Time Alert Banner Updates**

**Location:** `web/app/dashboard/page.tsx` (ENHANCE)

**Features:**
- Auto-update alert banner when `DEVICE_ALERT` received
- Show/hide banner based on active alerts
- Animate changes
- Update device counts in real-time

### **6. Real-Time IoT Card Updates**

**Location:** `web/app/dashboard/page.tsx` (ENHANCE)

**Features:**
- Update IoT device count when `TELEMETRY_UPDATE` received
- Update health status in real-time
- Animate changes
- Show alert badge when alerts exist

### **7. Socket Service Enhancement**

**Location:** `web/lib/services/socket-service.ts` (ENHANCE)

**Changes:**
- Enhanced `TELEMETRY_UPDATE` handler to:
  - Update IoT card
  - Update device detail views
  - Refresh device list if open

- Enhanced `DEVICE_ALERT` handler to:
  - Show toast notification
  - Show modal for critical alerts
  - Send browser notification
  - Play sound
  - Update alert banner
  - Refresh device list

---

## 🔧 **BACKEND ENHANCEMENTS**

### **1. FCM Notification Integration**

**Location:** `backend/src/services/fcm.service.js` (ENHANCE)

**Features:**
- Send FCM notification when `DEVICE_ALERT` created
- Target users with admin/teacher roles
- Include alert details in notification payload
- Deep link to device details

**Integration:**
- Call FCM service from `iotDevice.controller.js`
- When alert is created, send notification to all admins/teachers

### **2. Enhanced Alert Payload**

**Location:** `backend/src/controllers/iotDevice.controller.js` (ENHANCE)

**Features:**
- Include device name in alert payload
- Include device location/room
- Include sensor data snapshot
- Include severity level
- Include timestamp

---

## 📋 **IMPLEMENTATION STEPS**

### **Phase 1: Mobile App Real-Time Alerts**

1. ✅ Create `iot_alert_dialog.dart` widget
2. ✅ Create `iot_alert_banner.dart` widget
3. ✅ Create `alert_sound_service.dart` service
4. ✅ Enhance `socket_event_handler.dart` to show alerts
5. ✅ Update `iot_status_widget.dart` for real-time updates
6. ✅ Add FCM handler for IoT alerts
7. ✅ Test with real device alerts

### **Phase 2: Web Dashboard Real-Time Alerts**

1. ✅ Create `IoTAlertToast.tsx` component
2. ✅ Create `IoTAlertModal.tsx` component
3. ✅ Create `browser-notifications.ts` service
4. ✅ Create `alert-sound-service.ts` service
5. ✅ Enhance `socket-service.ts` handlers
6. ✅ Update dashboard page for real-time updates
7. ✅ Test with real device alerts

### **Phase 3: Backend FCM Integration**

1. ✅ Enhance FCM service for IoT alerts
2. ✅ Integrate FCM in device alert controller
3. ✅ Test FCM notifications

### **Phase 4: Testing & Polish**

1. ✅ Test all alert scenarios
2. ✅ Test sound/vibration
3. ✅ Test notifications
4. ✅ Test real-time updates
5. ✅ Performance optimization
6. ✅ User experience polish

---

## 🎨 **USER EXPERIENCE FLOW**

### **Scenario: Fire Detected by IoT Device**

#### **Mobile App:**
1. ESP32 detects fire → Sends alert to backend
2. Backend creates alert → Broadcasts `DEVICE_ALERT` via Socket.io
3. Mobile app receives event:
   - **Immediate:** Alert dialog pops up (full screen)
   - **Sound:** Fire alarm sound plays
   - **Vibration:** Strong vibration pattern
   - **Banner:** Alert banner appears at top
   - **Widget:** IoT widget updates with alert badge
   - **FCM:** Push notification sent (if app in background)
4. User taps "View Details" → Navigate to device detail screen
5. User can dismiss or acknowledge alert

#### **Web Dashboard:**
1. ESP32 detects fire → Sends alert to backend
2. Backend creates alert → Broadcasts `DEVICE_ALERT` via Socket.io
3. Web dashboard receives event:
   - **Immediate:** Alert modal pops up (centered)
   - **Toast:** Toast notification appears (top-right)
   - **Sound:** Fire alarm sound plays
   - **Browser Notification:** Browser notification (if tab not active)
   - **Banner:** Alert banner updates with new alert
   - **Card:** IoT card updates with alert count
4. User clicks "View Device" → Navigate to device details
5. User can dismiss or acknowledge alert

---

## 🔔 **ALERT PRIORITIES & BEHAVIOR**

### **Critical Alerts (Fire):**
- ✅ Immediate popup/modal
- ✅ Sound alert (loud)
- ✅ Vibration (mobile)
- ✅ Push notification
- ✅ Browser notification
- ✅ Cannot be auto-dismissed (user must acknowledge)

### **High Priority Alerts (Flood, Earthquake):**
- ✅ Immediate popup/modal
- ✅ Sound alert (moderate)
- ✅ Vibration (mobile)
- ✅ Push notification
- ✅ Browser notification
- ✅ Auto-dismiss after 30 seconds (optional)

### **Telemetry Updates:**
- ✅ Silent UI update
- ✅ No popup
- ✅ No sound
- ✅ Update widgets/cards
- ✅ Update charts

---

## 🛠️ **TECHNICAL DETAILS**

### **Socket.io Events:**

```javascript
// Backend emits:
io.to(`school:${institutionId}`).emit('DEVICE_ALERT', {
  deviceId: 'KAV-NODE-001',
  alertId: 'alert_123',
  alertType: 'FIRE', // 'FIRE', 'FLOOD', 'EARTHQUAKE'
  severity: 'CRITICAL', // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  deviceName: 'Safety Node 001',
  deviceType: 'multi-sensor',
  room: 'Lab',
  sensorData: {
    flame: true, // or water: 2500, magnitude: 3.5
  },
  timestamp: new Date(),
  thresholdBreached: true,
  readings: { ... }
});

io.to(`device:${deviceId}`).emit('TELEMETRY_UPDATE', {
  deviceId: 'KAV-NODE-001',
  readings: {
    flame: false,
    water: 0,
    acceleration: { x: -1.02, y: 1.67, z: -9.63 },
    magnitude: 9.83
  },
  timestamp: new Date()
});
```

### **Mobile App State Management:**

- Use Riverpod providers for:
  - Active alerts state
  - Alert sound preferences
  - Notification preferences
  - Device telemetry cache

### **Web Dashboard State Management:**

- Use Zustand store for:
  - Active alerts state
  - Alert sound preferences
  - Notification preferences
  - Device telemetry cache

---

## 📦 **DEPENDENCIES**

### **Mobile App:**
- ✅ `audioplayers` (already installed)
- ⚠️ `vibration` (may need to add)
- ✅ `flutter_local_notifications` (for local notifications)
- ✅ FCM (already configured)

### **Web Dashboard:**
- ✅ Socket.io client (already installed)
- ✅ Toast component (shadcn/ui `toast.tsx` - already available)
- ✅ Browser Notification API (native)
- ✅ HTML5 Audio API (native)

---

## ✅ **SUCCESS CRITERIA**

1. ✅ When ESP32 detects fire → Alert appears within 1 second on both platforms
2. ✅ Sound plays immediately for critical alerts
3. ✅ Push notification sent within 2 seconds
4. ✅ UI updates in real-time without refresh
5. ✅ User can view alert details with one tap/click
6. ✅ Multiple alerts handled gracefully (queue system)
7. ✅ No performance degradation with multiple devices
8. ✅ Works when app/web is in background

---

## 🚀 **IMPLEMENTATION ORDER**

1. **Mobile App Alert Dialog** (Highest Priority)
2. **Web Dashboard Toast Notifications** (Highest Priority)
3. **Mobile App Sound/Vibration** (High Priority)
4. **Web Dashboard Sound Alerts** (High Priority)
5. **Mobile App FCM Integration** (Medium Priority)
6. **Web Dashboard Browser Notifications** (Medium Priority)
7. **Real-Time Widget Updates** (Medium Priority)
8. **Backend FCM Integration** (Medium Priority)
9. **Polish & Testing** (Low Priority)

---

## 📝 **FILES TO CREATE/MODIFY**

### **Mobile App:**
- ✅ `mobile/lib/features/iot/widgets/iot_alert_dialog.dart` (NEW)
- ✅ `mobile/lib/features/iot/widgets/iot_alert_banner.dart` (NEW)
- ✅ `mobile/lib/features/iot/services/alert_sound_service.dart` (NEW)
- ✅ `mobile/lib/features/fcm/handlers/iot_alert_handler.dart` (NEW)
- ✅ `mobile/lib/features/socket/handlers/socket_event_handler.dart` (MODIFY)
- ✅ `mobile/lib/features/dashboard/widgets/iot_status_widget.dart` (MODIFY)
- ✅ `mobile/lib/features/iot/providers/iot_alerts_provider.dart` (NEW - Riverpod)

### **Web Dashboard:**
- ✅ `web/components/notifications/IoTAlertToast.tsx` (NEW)
- ✅ `web/components/alerts/IoTAlertModal.tsx` (NEW)
- ✅ `web/lib/services/browser-notifications.ts` (NEW)
- ✅ `web/lib/services/alert-sound-service.ts` (NEW)
- ✅ `web/lib/services/socket-service.ts` (MODIFY)
- ✅ `web/app/dashboard/page.tsx` (MODIFY)
- ✅ `web/app/devices/page.tsx` (MODIFY)

### **Backend:**
- ✅ `backend/src/services/fcm.service.js` (MODIFY)
- ✅ `backend/src/controllers/iotDevice.controller.js` (MODIFY)

---

## ⚠️ **CONSIDERATIONS**

1. **Performance:**
   - Limit concurrent alerts (queue system)
   - Debounce rapid telemetry updates
   - Cache device data to reduce API calls

2. **User Experience:**
   - Don't spam user with too many notifications
   - Allow user to disable sound/vibration
   - Respect device silent mode
   - Auto-dismiss non-critical alerts

3. **Battery Life (Mobile):**
   - Optimize Socket.io connection
   - Limit background processing
   - Use efficient notification delivery

4. **Browser Compatibility:**
   - Check Notification API support
   - Handle autoplay restrictions
   - Fallback for unsupported features

---

## 🎯 **TESTING CHECKLIST**

- [ ] Fire alert triggers popup on mobile
- [ ] Fire alert triggers modal on web
- [ ] Sound plays for critical alerts
- [ ] Vibration works on mobile
- [ ] Push notification received
- [ ] Browser notification works
- [ ] Telemetry updates widget in real-time
- [ ] Multiple alerts handled correctly
- [ ] Alert dismissal works
- [ ] Navigation to device details works
- [ ] Works when app/web in background
- [ ] Performance is acceptable

---

**Status:** 📋 **PLAN READY FOR REVIEW**

**Next Step:** Awaiting user confirmation to proceed with implementation.

---

## 📌 **QUESTIONS FOR USER**

1. Should alerts auto-dismiss after a certain time?
2. Should sound/vibration be enabled by default?
3. Should we show alerts even when app/web is in background?
4. Should we limit the number of concurrent alerts shown?
5. Any specific sound files you want to use?

---

**Ready for your review and confirmation! 🚀**

