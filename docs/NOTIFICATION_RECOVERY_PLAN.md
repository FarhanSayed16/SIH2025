# Notification Recovery Plan (Broadcast → Push + Email)

## Current Observations
- Broadcasts are created and incident logs are written.
- Email sends return 202 (SendGrid) but reported as not received.
- Push: device tokens are being registered (e.g., user 692c97abab8d98a3319de70d), but notifications are not appearing on device.
- SMS is unconfigured and intentionally skipped.
- Backend uses Firebase Admin with service account `kavach-4a8aa`; SendGrid/SMTP keys are present; SMS/Twilio not configured.

## Likely Root Causes
- Push: token/project mismatch (app’s Firebase project or Sender ID not matching backend), or stale/invalid tokens; app-side notification channel/permissions may block display.
- Email: sender identity/domain not verified or messages landing in spam/blocked despite 202 acceptance.
- Missing per-recipient diagnostics in UI; failures/skips not obvious in the broadcast page.

## Validate First (no code)
1) Single-user push test
   - Use “Send test to me” on `/broadcast` while logged in on the same account that registered the token on the phone.
   - Capture backend log for that send; note any FCM error (invalid-registration-token, not-registered, etc.).
2) Firebase console test
   - From Firebase console (project `kavach-4a8aa`), send a notification directly to that exact FCM token. If it fails, the token or app project is mismatched.
3) Email deliverability
   - Verify SendGrid sender/domain; send a direct SendGrid test to a known inbox; check spam/bounces in SendGrid Activity.
4) Recipient data
   - Ensure the target user has the correct email and the exact device token you expect; confirm the app stays logged in so the token persists.

## Fix Plan (code/data)
Push
- Ensure the mobile app uses the same Firebase project `kavach-4a8aa` and Sender ID 1012063530376; update `google-services.json` if needed.
- Confirm Android notification channel `kavach_alerts` exists and notifications are allowed on the device.
- On invalid token errors, clear the token from the user and ask the client to re-register.

Email
- Verify/confirm SendGrid sender identity/domain; use a verified from address.
- Keep channels as `['push','email']` by default (already set) so email backs up push.

Diagnostics to implement (recommended next)
- Expose per-user CommunicationLog entries (status, failureReason/providerResponse) for a given broadcast/user to surface push/email failures.
- “Send test to this user” action that returns per-channel results inline.
- Better push error surfacing in broadcast stats (invalid token vs skipped vs failed).

## Ready for Implementation?
- If yes, I will add:
  - A per-user log viewer or inline diagnostic for the latest broadcast sends.
  - Clearer push failure handling (auto-clearing invalid tokens on specific FCM errors).
  - Optional: a small test endpoint to exercise push+email for a specified user and return channel results immediately.

