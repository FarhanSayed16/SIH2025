# IoT Alert System Fixes

## Issues Fixed

### 1. ✅ FCM Notification Service ES Module Error
**Problem:** `notification.service.js` was using CommonJS syntax (`require`, `module.exports`) in an ES module project.

**Fix:** Converted to ES module syntax:
- Changed `require('firebase-admin')` → `import admin from 'firebase-admin'`
- Changed `require('../utils/logger')` → `import logger from '../config/logger.js'`
- Changed `module.exports` → `export` statements
- Added `firebaseAdminInitialized` flag for proper initialization tracking

**File:** `backend/src/services/notification.service.js`

### 2. ✅ DEVICE_ALERT Broadcast Missing Data
**Problem:** When broadcasting `DEVICE_ALERT` events via Socket.io, the payload was missing critical fields that the frontend expects:
- `alertType`
- `deviceName`
- `deviceType`
- `room`
- `severity`
- `readings`/`sensorData`

**Fix:** Enhanced the broadcast payload to include all necessary fields:
- Updated `processSensorTelemetry` to return device info and alert details
- Enhanced `iotDevice.controller.js` to include complete device and alert data in broadcast
- Added `DEVICE_ALERT` broadcast to `deviceAlert` controller (for direct alert POSTs)

**Files:**
- `backend/src/services/iotDeviceMonitoring.service.js`
- `backend/src/controllers/iotDevice.controller.js`
- `backend/src/controllers/device.controller.js`

## What to Check on Frontend

### Web Dashboard
1. **Socket.io Connection:**
   - Open browser DevTools → Console
   - Check for Socket.io connection logs
   - Verify `socketService.isConnected()` returns `true`

2. **Event Listeners:**
   - Check if `DEVICE_ALERT` listener is registered in:
     - `web/app/dashboard/page.tsx`
     - `web/app/admin/crisis-dashboard/page.tsx`
   - Look for console logs: `Received IoT Device Alert:`

3. **Toast/Modal Display:**
   - Check if `useIoTAlertToast` hook is working
   - Verify `IoTAlertModal` component is rendering
   - Check browser console for errors

### Mobile App
1. **Socket.io Connection:**
   - Check `socket_provider.dart` for connection status
   - Verify Socket.io is connected before alerts are sent

2. **Event Listeners:**
   - Check `socket_event_handler.dart` for `DEVICE_ALERT` handler
   - Verify `IoTAlertDialog.show()` is being called
   - Check for console logs in Flutter debug output

3. **FCM Notifications:**
   - Verify FCM token is registered in backend
   - Check if `fcm_message_handler.dart` handles `iot_alert` type
   - Test with app in background to see push notifications

## Testing Steps

1. **Restart Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Trigger Alert from ESP32:**
   - Fire sensor: Bring flame near sensor
   - Flood sensor: Submerge water sensor
   - Earthquake: Shake the device

3. **Check Backend Logs:**
   - Should see: `Broadcasted DEVICE_ALERT to room: school:...`
   - Should NOT see: `require is not defined` errors
   - FCM errors should be resolved (if Firebase is configured)

4. **Check Frontend:**
   - Web: Open dashboard, check console for `DEVICE_ALERT` events
   - Mobile: Check Flutter logs for alert dialog display
   - Verify toast notifications appear
   - Verify modals/dialogs appear for critical alerts

## Expected Behavior

### When ESP32 Sends Alert:
1. ✅ Backend receives alert POST
2. ✅ Backend creates Alert in database
3. ✅ Backend broadcasts `DEVICE_ALERT` via Socket.io with complete data
4. ✅ Backend sends FCM notification (if configured)
5. ✅ Web dashboard receives Socket.io event → Shows toast + modal
6. ✅ Mobile app receives Socket.io event → Shows dialog + sound + vibration
7. ✅ Mobile app receives FCM (if in background) → Shows push notification

## Troubleshooting

### No Alerts Appearing on Frontend

1. **Check Socket.io Connection:**
   ```javascript
   // In browser console
   console.log(socketService.isConnected());
   ```

2. **Check Event Listener Registration:**
   - Verify `socketService.on('DEVICE_ALERT', ...)` is called
   - Check if listener is registered before alerts are sent

3. **Check Backend Broadcasting:**
   - Look for: `Broadcasted DEVICE_ALERT to room: school:...`
   - Verify institution ID matches logged-in user's institution

4. **Check Frontend Console:**
   - Look for JavaScript errors
   - Check if event handler is being called
   - Verify data structure matches expected format

### FCM Notifications Not Working

1. **Check Firebase Configuration:**
   - Verify `FIREBASE_SERVICE_ACCOUNT` env variable is set
   - Check Firebase Admin initialization logs

2. **Check FCM Tokens:**
   - Verify users have registered FCM tokens
   - Check database for `fcmTokens` in User model

3. **Check Mobile App:**
   - Verify FCM token registration on app startup
   - Check if app has notification permissions

## Next Steps

1. Test with actual ESP32 device
2. Verify all alert types (fire, flood, earthquake) work
3. Test on both web and mobile
4. Verify FCM notifications work when app is in background
5. Check alert persistence in database

