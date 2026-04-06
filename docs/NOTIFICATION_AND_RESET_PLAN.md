# Notification & Forgot-Password Recovery Plan

## Scope
Unify and validate end-to-end notification delivery (broadcast → push/email, optional SMS) and forgot-password flows. This is a read/plan only; no code changes in this file.

## Current State (observed)
- Broadcasts create records, incident logs, and email sends return 202 from SendGrid; SMS is unconfigured and skipped.
- Push tokens are being registered, but many recipients lack tokens; some push attempts fail or are skipped. Device does not show notifications yet.
- “Send test to me” exists on `/broadcast` (frontend) to target the logged-in user.
- Communication logs can now be filtered by `userId` and include `skipped` status.
- Forgot-password flow not recently verified; depends on email deliverability.

## Likely Root Causes
- Push:
  - Token/project mismatch (mobile app Firebase project/Sender ID not matching backend service account `kavach-4a8aa`).
  - Invalid/stale tokens not cleared; app notification channel/permissions missing.
- Email:
  - Sender/domain not verified in SendGrid; 202 accepted but email dropped or in spam.
- SMS:
  - Twilio not configured; currently skipped.
- Forgot-password:
  - Email deliverability issues; reset token validity/expiry not recently confirmed.

## Validation Steps (no code)
1) Push: single-user test
   - Use “Send test to me” on `/broadcast` while logged in on the same account whose device registered the token.
   - Check backend logs (or `/api/communication/logs?userId=<USER_ID>`) for push failureReason/providerResponse.
2) Push: Firebase console test
   - From Firebase console (project `kavach-4a8aa`), send a test notification directly to that exact FCM token. If it fails, token/project is mismatched.
3) Email deliverability
   - Verify SendGrid sender/domain; send a direct test to a known inbox; check spam and SendGrid Activity for bounces/drops.
4) Forgot-password E2E
   - Trigger reset → receive email → open link → reset password → login. Note any delivery failure or token expiry error.

## Fix Roadmap
Backend
- Push error surfacing: log and surface invalid-token errors; clear bad tokens on FCM “not-registered/invalid” codes.
- Optional: add a “send test to user” API that returns per-channel results immediately.
- Keep default channels as push+email; continue marking SMS as skipped if not configured.

Frontend (broadcast)
- Show per-user/per-channel delivery status using `/api/communication/logs?userId=...`.
- Keep “Send test to me”; optionally add “Send test to user” with userId input.

Mobile App
- Confirm Firebase project `kavach-4a8aa` and Sender ID 1012063530376 in `google-services.json`.
- Ensure Android notification channel `kavach_alerts` exists and notifications are allowed.

Email
- Verify/confirm SendGrid sender identity or use a verified from-address; retest direct send.

Forgot Password
- Verify reset email delivery after sender verification.
- Confirm token validity window and successful reset/login.

## Ready-to-Apply Actions (once validated)
- Backend: add invalid-token clearing; optional test endpoint; expose log details in broadcast stats.
- Frontend: surface communication log status per user/broadcast; add “test to user” UI.
- Config: align mobile Firebase project; verify SendGrid sender; keep SMS optional.

