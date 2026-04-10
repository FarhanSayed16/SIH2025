# Real-Time Popups & Notifications (IoT + Drills)
Step-by-step implementation and validation guide.

## Scope
- Platforms: Mobile (Flutter) and Web (Next.js).
- Events requiring unmissable popups:
  - IoT alerts: `DEVICE_ALERT`
  - Drills: `DRILL_START` (also handle `DRILL_SCHEDULED`, `DRILL_END`)

## Backend Requirements (reference)
- Emit to room `school:{institutionId}` for both IoT alerts and drills.
- Payload should include:
  - `alertType`, `severity`, `deviceId`, `deviceName`, `deviceType`, `room`
  - `sensorData` or `readings`
  - `timestamp`
  - Drills: `drillId`, `type`, `startTime`/`duration`, `drillFlag`, `message/title`
- Push (optional fallback): ensure all roles register FCM tokens.

## Mobile (Flutter) — Implementation Steps
1) Socket join:
   - On connect, join `school:{institutionId}` after auth.
2) IoT alert popup (`DEVICE_ALERT`):
   - In `_handleDeviceAlert`, do:
     - Play sound: `AlertSoundService().playAlertSound(alertType)`
     - Show full-screen `IoTAlertDialog.show(...)` with:
       - `alertType` (uppercased), `deviceId`, `deviceName`, `deviceType`, `room`
       - `sensorData` map, `severity` (uppercased), `timestamp` (DateTime.now)
     - Optional short Snackbar for context.
3) Drill popup (`DRILL_START`):
   - In `_handleDrillStart`, do:
     - Show full-screen `IoTAlertDialog.show(...)` with:
       - `alertType` = drill type uppercased
       - `deviceId` = drillId or 'DRILL', `deviceName`/`deviceType` = 'DRILL'
       - `sensorData` with status + start/duration
       - `severity` = 'DRILL', `timestamp` = now
     - Then navigate to `CrisisModeScreen` (drill mode) to keep existing flow.
     - Toast “Drill started” as secondary cue.
   - `DRILL_END`: toast “Drill ended”.
   - `DRILL_SCHEDULED`: toast “Drill scheduled”.
4) Foreground push (FCM):
   - Ensure `FirebaseMessaging.onMessage` shows heads-up via `flutter_local_notifications` (channel `high_importance_channel`).
   - Request permissions; ensure channel exists.
5) Token registration:
   - On login/launch, POST `/api/users/:id/fcm-token` for ALL roles (admin/teacher/student/parent); retry on token refresh.
6) Testing (mobile):
   - Emit `DEVICE_ALERT` -> expect full-screen popup + sound.
   - Emit `DRILL_START` -> expect full-screen popup, then drill screen.
   - Kill/restart app: verify push still shows heads-up if socket missed.

## Web (Next.js) — Implementation Steps
1) Socket join:
   - After auth, join `school:{institutionId}`; log join success.
2) IoT alerts (`DEVICE_ALERT`):
   - On event: show toast + modal (IoT alert modal), optional sound/browser notification if permission granted.
3) Drills (`DRILL_START`):
   - On event: show toast “Drill started” + modal with drill info and “View drill” action.
4) Testing (web):
   - Emit `DEVICE_ALERT` and `DRILL_START`; confirm toast + modal appear.

## Validation Checklist
- Backend emits include required fields and target `school:{institutionId}`.
- Mobile: socket connected & room joined; popups appear for IoT/drill events; sound plays; push heads-up works in foreground.
- Web: socket joined; toast + modal appear for IoT/drill events.
- FCM tokens registered for all roles.

## Notes
- Current mobile code may have non-blocking warnings (unused locals/Map inference). Clean after functional validation.
- Push is a fallback; primary UX is real-time socket popups.


