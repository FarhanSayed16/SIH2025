# Notification System Review (2025-12-08)

## What’s happening now
- Broadcasts are created and linked to incidents, but delivery shows `0 successful, 13 failed`.
- Logs are flooded with `No FCM token provided - skipping push notification`.
- Incident log creation for broadcasts now works (no more alertId validation errors).

## Likely root causes
1) **Recipients have no FCM tokens**
   - Push channel is the default (`channels` defaults to `['push']` in `broadcast.service`).
   - If users don’t have `deviceToken` set, push attempts fail and we mark them as failed.
2) **Channel choice is push-only**
   - If the broadcast UI/API doesn’t pass `channels`, email/SMS are never attempted.
3) **Environment**
   - Firebase Admin is initialized from `config/firebase-admin.json` (service account present).
   - `FIREBASE_SERVER_KEY` in `.env` is a placeholder and unused by current code.
   - SendGrid and SMTP creds are present in `.env`, but won’t be used unless `channels` includes `email`.
4) **Data completeness**
   - Missing `deviceToken` / `email` / `phone` on many users will reduce reachable recipients.

## Code observations
- `backend/src/services/broadcast.service.js`
  - Defaults `channels` to `['push']`.
  - Sends via `sendNotification`/`sendNotificationWithTemplate` for each recipient×channel.
- `backend/src/services/communication.service.js`
  - Push requires `recipient.fcmToken` or `recipient.userId`; otherwise throws and logs failure.
  - Email/SMS require `recipient.email` / `recipient.phone`.
- `backend/src/services/fcm.service.js`
  - Uses `firebase-admin.json`; warns and skips if not initialized or no token.
- `backend/src/services/email.service.js`
  - Will init SendGrid/SMTP if packages are installed and env values are present.

## What to fix to make it demo-ready
1) **Ensure tokens are present**
   - Have mobile/web register `deviceToken` via `POST /api/users/:id/fcm-token` after login.
   - Optionally backfill tokens for test accounts before demo.
2) **Send on multiple channels**
   - From the broadcast UI/API, include `channels: ['push','email']` (and `['sms']` if configured).
   - For “send to all”, this guarantees email delivery even if push tokens are missing.
3) **Fail-soft / skip cleanly**
   - Add a guard to skip push attempts for recipients without tokens and count as `skipped`, not `failed`.
   - Add fallback: if push is selected but token is missing, automatically attempt email when an address exists.
4) **Verify email path**
   - Confirm `@sendgrid/mail` and `nodemailer` are installed.
   - Ensure `SENDGRID_API_KEY`/`SMTP_*` are valid (they are in `.env`).
5) **Add quick health checks**
   - Add a lightweight “dry-run” endpoint or log to verify which channels initialize (Firebase/SendGrid/SMTP).

## Minimal code changes recommended
- In `broadcast.service.js`:
  - Skip push for recipients without `fcmToken` (mark as `skippedNoToken` instead of `failed`).
  - If `channels` includes `push` but no token, and email is available, auto-attempt email.
  - Expand stats to report `sent`, `failed`, `skippedNoToken`, `skippedNoChannel`.
- In `communication.service.js`:
  - Gracefully skip push when `!recipient.fcmToken && !recipient.userId`, returning a typed “skipped” result instead of throwing.
  - Same for missing email/phone when those channels are chosen.

## How to validate after fixes
1) Create a broadcast with `channels: ['push','email']` targeting a small custom list where you know:
   - At least one user has a valid `deviceToken`.
   - All have valid emails.
2) Check logs:
   - Push: expect success for the tokened user; no warning spam.
   - Email: expect SendGrid/SMTP success codes.
3) Open `/admin/incidents` to confirm the broadcast-created incident log is present (already working).

## If you want me to proceed with code changes
- I’ll implement the skip/fallback logic and richer stats, and set the default broadcast channels to include email (`['push','email']`) for safety.

