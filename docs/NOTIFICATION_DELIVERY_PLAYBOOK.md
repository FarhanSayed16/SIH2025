# Notification Delivery Playbook (Push + Email) — Read/Plan

Scope: Web shows broadcast success, but devices/users don’t receive notifications. This playbook lists checks and fixes to restore delivery. No code changes here.

## Quick Triage Order (15–30 min)
1) Verify mobile API base URL
   - Ensure the app points to a reachable backend (LAN `http://<host>:3000` or a working HTTPS tunnel). If login fails via tunnel (403/HTML), recreate/swap the tunnel and update the base URL.
2) Single-user push test (known token)
   - Pick a user whose device just registered a token. Use “Send test to me” on `/broadcast` (channels push+email). Immediately query `/api/communication/logs?userId=<ID>` to see push result and `failureReason/providerResponse`.
3) Firebase console token test
   - From Firebase project `kavach-4a8aa` (Sender ID 1012063530376), send a test message directly to that exact token. If it fails, the token/app project mismatch is confirmed.
4) Email deliverability check
   - Verify SendGrid sender/domain; send a direct test to inbox; check spam/bounce in SendGrid Activity. Broadcasts returning 202 still won’t deliver if sender isn’t verified.

## Root-Cause Checklist
- Push:
  - Token/project mismatch (app not using `kavach-4a8aa` / Sender ID 1012063530376).
  - Invalid/stale tokens not yet cleared; device notifications/channel disabled.
  - Backend reachable only via blocked tunnel; push succeeds server-side but device never contacted.
- Email:
  - Sender/domain unverified → SendGrid accepts (202) but drops; or lands in spam.
- SMS:
  - Not configured (expected to be skipped).

## Validation Steps (no code)
- Login path: Confirm mobile can log in against the chosen base URL (no 403/HTML). If not, fix connectivity first.
- Push delivery:
  - After “Send test to me”, inspect `/api/communication/logs?userId=<ID>`:
    - `success: true` → should arrive; if not, likely device/channel permission.
    - `failed` with `invalid-registration-token`/`not-registered` → refresh token (relogin) and retry.
  - Firebase console send-to-token test to rule out backend logic vs token/project mismatch.
- Email delivery:
  - Send a direct test; confirm inbox/spam; check SendGrid Activity for bounce/drop.

## Ready-to-Apply Fixes (post-validation)
- Backend:
  - Continue clearing invalid FCM tokens on FCM errors; surface `failureReason` in logs.
  - Keep defaults `channels: ['push','email']`; treat missing token/email as `skipped`, not failed.
- Frontend (broadcast):
  - Use existing “Send test to me”; add per-user delivery status by querying `/api/communication/logs?userId=...`.
- Mobile app:
  - Ensure `google-services.json` uses `kavach-4a8aa`; keep notification channel enabled; call `/api/users/:id/fcm-token` after login.
- Config:
  - Verify SendGrid sender/domain; update base URL (LAN or fresh tunnel) in the app.

## What to do next (actionable sequence)
1) Point the mobile app to a working backend URL (LAN IP or new tunnel) and re-login.
2) Run “Send test to me”; immediately pull `/api/communication/logs?userId=<ID>` and note push `failureReason`.
3) If push fails, send from Firebase console to the same token; if that fails, refresh token / fix project config.
4) Verify email sender/domain and check inbox/spam for the test message.

