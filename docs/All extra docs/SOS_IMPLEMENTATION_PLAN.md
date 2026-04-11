# SOS & Rapid Response – Implementation Plan (Frontend + Backend)
_Plan only — no code changes yet. Based on current app: Emergency FAB opens `RedAlertScreen`; backend uses `alert.routes.js` → `alert.controller.js` → `processAdminAlert/createAlert` pipeline._

## Frontend (Flutter) – Architecture & Steps
- **Deps (already in project / to confirm):**
  - `geolocator` (GPS capture), `geocoding` (optional reverse geocode), `url_launcher` (tel:), `flutter_riverpod` (state), `socket_io_client` (already via `SocketService`), `flutter_local_notifications` (already used), `permission_handler` (if needed).
- **Screens/Components:**
  - `home_screen.dart` Emergency FAB → `RedAlertScreen`.
  - Upgrade `RedAlertScreen` into **SOS Mode**:
    - Hero state with pulsing “Sending help…” animation while sending.
    - Quick Dial list: Police 112, Fire 101, Ambulance 108, Women’s Helpline 1091, Campus Security, Parent/Teacher numbers (if available in profile).
    - Status banner: Danger sent / Safe sent, with last sent time.
    - Buttons: `I AM IN DANGER` (default action) and `I AM SAFE` (clear).
  - Optional: mini-map/lat-lng text.
- **Logic flow (Danger):**
  1) Prompt / request location → get lat/lng (fallback to none if denied).
  2) Emit SOS over socket: `SOS_ALERT` (or reuse `USER_HELP`) with payload `{userId, role, institutionId, status:'danger', location:{lat,lng,accuracy}, timestamp, device:'mobile'}`.
  3) POST fallback to backend: `/api/alerts` (or new `/api/sos`) with same payload and `type: 'sos'/'emergency'`, `severity:'critical'`, `title:'SOS Alert'`, `metadata: {source:'mobile', sos:true}`.
  4) Show “Sending…” animation until at least one send succeeds; then show success banner; present Quick Dial sheet.
- **Logic flow (Safe):**
  - Emit `SOS_SAFE` (or reuse `USER_SAFE`) + optional POST to `/api/alerts/:id/status` with `status:'safe'`.
  - Update banner to green; allow dismiss.
- **State / throttling:**
  - Local `SosState` with `status`, `lastSentAt`, `locationText`.
  - Debounce repeat sends (e.g., 15s).
- **Permissions:**
  - If location denied: still send alert without coords; show “Location not shared” in UI.
  - If service disabled: show CTA to enable; continue with coarse/no location.
- **Background considerations (first pass):**
  - No true background tracking; single-shot location on tap.
  - If offline: show “Pending send” toast; optionally retry when socket reconnects.

## Backend (Node/Express) – Architecture & Steps
- **Entry:** `/api/alerts` (existing `alert.routes.js` → `alert.controller.js` → `processAdminAlert/createAlert`).
- **Enhancements:**
  - Accept `type: 'sos'` and `location` (GeoJSON `[lng, lat]`) in payload; set `severity: 'critical'`, `metadata.sos=true`, `source='mobile'`.
  - If caller passes `userId` and `role`, attach to alert and log.
  - Integrate into `processAdminAlert` so broadcast pipeline runs.
- **Recipient resolution:**
  - Parents: use `ParentStudentRelationship.findVerifiedByStudent(studentId)` (as in `parent-notification.service.createEmergencyAlert`).
  - Teachers: query teachers in same institution (and optionally class associations).
  - Nearby users: Socket room `school:{institutionId}`; optionally filter by geo (if users have recent location). First pass: broadcast to room.
- **Fan-out:**
  - Socket: emit `SOS_ALERT` with payload `{alertId, userId, role, institutionId, location, timestamp}` to `school:{institutionId}`.
  - Push (FCM): reuse notification service; send to tokens of parents/teachers/nearby (same query).
  - SMS (if configured): hit SMS service with same text + location link `https://maps.google.com/?q=lat,lng`.
- **Safe update:**
  - Endpoint `/api/alerts/:id/status` already supports status updates; allow `status:'safe'` for sos alerts; broadcast `SOS_SAFE`.

## Database Schema (existing Alert + SOS fields)
- **Alert (augment fields in payload, no schema change if `metadata` flexible):**
  ```json
  {
    "type": "sos",
    "title": "SOS Alert",
    "severity": "critical",
    "institutionId": "<ObjectId>",
    "triggeredBy": "<userId>",
    "location": { "type": "Point", "coordinates": [lng, lat] },
    "metadata": { "sos": true, "source": "mobile", "deviceId": null }
  }
  ```
- **Socket/Payload shape (frontend/backend):**
  ```json
  {
    "userId": "<userId>",
    "role": "student|teacher|admin|parent",
    "institutionId": "<ObjectId>",
    "status": "danger|safe",
    "location": { "lat": 12.34, "lng": 56.78, "accuracy": 5 },
    "timestamp": "ISO",
    "device": "mobile"
  }
  ```

## Security & Permission Handling
- **Location denied:** send SOS without location; include `location: null` and UI copy “Location not shared”.
- **Auth:** reuse existing auth middleware; use requester’s `institutionId` by default.
- **Rate limiting:** debounce on client; optional server rate limit per user (e.g., 1 SOS / 10s).
- **Data exposure:** only broadcast location to institution-scoped recipients; no public rooms.

## Step-by-step Execution Plan
1) **Frontend**
   - Add geolocator/url_launcher (if not already), wire `RedAlertScreen` to emit `SOS_ALERT/SOS_SAFE` via socket with location.
   - Add POST fallback to `/api/alerts` with `type:'sos'`.
   - Add “Sending…” animation and Quick Dial sheet.
2) **Backend**
   - Update `alert.controller.js` create flow to accept `type:'sos'`, location, metadata.sos.
   - In `processAdminAlert` pipeline, when `type==='sos'`, fan-out:
     - Parents (relationships), teachers (institution), nearby (room broadcast).
     - FCM push + Socket `SOS_ALERT`.
   - Add `SOS_SAFE` broadcast on status update.
3) **Testing**
   - Mobile: danger with location granted/denied; safe update.
   - Backend: alert create with location → recipients resolved → socket + push invoked.
   - Web: socket listener sees `SOS_ALERT`.

## Files to touch (later)
- Frontend: `mobile/lib/features/dashboard/screens/home_screen.dart` (entry), `mobile/lib/features/emergency/screens/red_alert_screen.dart` (SOS UI), optional socket handler for receive.
- Backend: `backend/src/controllers/alert.controller.js`, `services/alertPipeline.service.js` (fan-out), possibly `services/notification.service.js` or FCM sender; no schema migration required.

