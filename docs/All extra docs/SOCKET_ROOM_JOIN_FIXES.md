# Socket.io Room Join & Real-Time Alert Fixes

## Issues Fixed

### 1. ✅ Backend: Added `join_room` (lowercase) Handler
**Problem:** Backend only supported `JOIN_ROOM` (uppercase), but some clients might use lowercase.

**Fix:** Added support for both `JOIN_ROOM` and `join_room` event names in `socketHandler.js`.

**File:** `backend/src/socket/socketHandler.js`

### 2. ✅ Web Dashboard: Explicit Room Join After Connection
**Problem:** Web dashboard was connecting to Socket.io but not explicitly joining the room after connection.

**Fix:** 
- Added explicit `joinRoom()` call after Socket.io connection
- Added `JOINED_ROOM` listener for confirmation
- Added logging to track connection and room join

**Files:**
- `web/lib/services/socket-service.ts`
- `web/app/dashboard/page.tsx`
- `web/app/admin/crisis-dashboard/page.tsx`

### 3. ✅ Mobile App: Improved Room Join Logic
**Problem:** Mobile app was joining room immediately, but connection might not be fully established.

**Fix:**
- Added delay after connection before joining room
- Added `JOINED_ROOM` listener for confirmation
- Fixed Socket.io authentication to use `auth` instead of `extraHeaders` (Socket.io v4)
- Added logging to track connection and room join

**Files:**
- `mobile/lib/core/services/socket_service.dart`
- `mobile/lib/main.dart`

### 4. ✅ DEVICE_ALERT Listener Already Present
**Status:** Both web and mobile already have `DEVICE_ALERT` listeners configured:
- **Web:** `web/app/dashboard/page.tsx` and `web/app/admin/crisis-dashboard/page.tsx`
- **Mobile:** `mobile/lib/features/socket/handlers/socket_event_handler.dart`

## How It Works Now

### Connection Flow

1. **User Authenticates** → Gets JWT token and institutionId
2. **Socket.io Connects** → Uses JWT token for authentication
3. **Backend Auto-Joins Room** → Automatically joins `school:{institutionId}` on connection
4. **Client Explicitly Joins** → Client also emits `JOIN_ROOM` with `{ schoolId }` for redundancy
5. **Backend Confirms** → Emits `JOINED_ROOM` event
6. **Client Receives Confirmation** → Logs confirmation

### Alert Broadcasting Flow

1. **ESP32 Sends Alert** → POST to `/api/devices/{deviceId}/alert`
2. **Backend Creates Alert** → Stores in database
3. **Backend Broadcasts** → `io.to('school:{institutionId}').emit('DEVICE_ALERT', data)`
4. **Clients Receive** → All clients in the room receive the event
5. **UI Updates** → Toast notifications, modals, sounds, etc.

## Testing Steps

1. **Restart Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Open Web Dashboard:**
   - Open browser DevTools → Console
   - Look for: `🔄 Connecting to Socket.io with institutionId: ...`
   - Look for: `Socket connected`
   - Look for: `✅ Joined room: { room: 'school:...', schoolId: '...' }`

3. **Open Mobile App:**
   - Check Flutter logs
   - Look for: `🔄 Joining room: school:...`
   - Look for: `✅ Joined room: ...`

4. **Trigger Alert from ESP32:**
   - Fire sensor, flood sensor, or earthquake
   - Check backend logs: `Broadcasted DEVICE_ALERT to room: school:...`
   - Check web console: Should see `Received IoT Device Alert:` log
   - Check mobile logs: Should see alert dialog

## Expected Console Output

### Web Dashboard (Browser Console)
```
🔄 Connecting to Socket.io with institutionId: 6924de10a721bc018818253c
Socket connected
✅ Joined room: { room: 'school:6924de10a721bc018818253c', schoolId: '6924de10a721bc018818253c' }
Received IoT Device Alert: { deviceId: 'KAV-NODE-001', alertType: 'FIRE', ... }
```

### Mobile App (Flutter Logs)
```
🔄 Joining Socket.io room: school:6924de10a721bc018818253c
🔄 Joining room: school:6924de10a721bc018818253c
✅ Joined room: { room: 'school:6924de10a721bc018818253c', schoolId: '6924de10a721bc018818253c' }
```

### Backend Logs
```
✅ Client connected: abc123 (User: admin@example.com)
User 6924de10a721bc0188182548 joined room: school:6924de10a721bc018818253c
Broadcasted DEVICE_ALERT to room: school:6924de10a721bc018818253c
```

## Troubleshooting

### No Alerts Appearing

1. **Check Socket.io Connection:**
   - Web: `console.log(socketService.isConnected())` in browser console
   - Mobile: Check Flutter logs for connection status

2. **Check Room Join:**
   - Look for `✅ Joined room:` in logs
   - Verify institutionId matches the one in backend logs

3. **Check Backend Broadcasting:**
   - Look for: `Broadcasted DEVICE_ALERT to room: school:...`
   - Verify the room name matches what clients joined

4. **Check Event Listener:**
   - Web: Verify `socketService.on('DEVICE_ALERT', ...)` is called
   - Mobile: Verify `socketNotifier.on(SocketEvents.deviceAlert, ...)` is called

### FCM Notifications Not Working

1. **Check FCM Token Registration:**
   - Mobile: Check Flutter logs for `✅ FCM token registered successfully`
   - Backend: Check if user has `deviceToken` field populated

2. **Check Firebase Configuration:**
   - Verify `FIREBASE_SERVICE_ACCOUNT` env variable is set
   - Check Firebase Admin initialization logs

3. **Check Backend Logs:**
   - Should NOT see: `No FCM tokens found for school ...`
   - Should see: `FCM notification sent for IoT alert ...`

## Key Changes Summary

1. **Backend:** Added `join_room` (lowercase) handler for compatibility
2. **Web:** Explicit room join after connection with confirmation listener
3. **Mobile:** Improved room join timing and Socket.io v4 authentication
4. **Logging:** Added comprehensive logging for debugging

## Next Steps

1. Test with actual ESP32 device
2. Verify alerts appear on both web and mobile
3. Check FCM notifications work when app is in background
4. Monitor backend logs for any connection issues

