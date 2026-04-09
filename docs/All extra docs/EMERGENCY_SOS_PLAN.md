# Emergency SOS Workflow Plan (get approval before coding)

## Goals (must-have for first delivery)
- From the existing Emergency button → two choices: **I am safe**, **I am in danger**.
- On **I am in danger**:
  - Show call directory (police/emergency helplines + campus security if available).
  - Send alert to parent(s), teacher(s), and nearby members with location.
  - Show confirmation/feedback to the user (toast + status banner).
- On **I am safe**:
  - Send “safe” update to same recipients and clear local alert state.

## Scope & constraints
- Keep existing backend untouched where possible; prefer using existing notification/socket paths. If needed, add a thin SOS endpoint; avoid invasive changes.
- Mobile-first; web parity if easy (optional).
- Location: ask permission, then capture lat/lng and address (via reverse geocode if available; otherwise lat/lng string).
- Delivery channels: socket push (in-app), FCM push (if token available). SMS/call directory are manual actions (user taps to call).

## User flows
1) **Entry**: Tap “Emergency” on home.
2) **Choice**: Buttons for “I am safe” / “I am in danger”.
3) **Danger flow**:
   - Prompt for location permission (if not already granted).
   - Show call directory sheet (police 112, fire 101, ambulance 108; plus configurable campus/security numbers if available).
   - Auto-send alert payload: `{ userId, role, institutionId, status: 'danger', location, timestamp }`.
   - Visual feedback: banner + toast + disable double-submit; allow “Update to Safe”.
4) **Safe flow**:
   - Send payload with `status: 'safe'`.
   - Update UI to green banner and dismiss danger state.

## Data structures (frontend)
- `SosState`: `{ status: 'idle' | 'danger' | 'safe', lastSentAt?: Date, location?: { lat, lng, address? } }`
- `SosContact`: `{ label, number, type: 'police'|'fire'|'ambulance'|'security'|'custom' }`
- `SosPayload`: `{ userId, institutionId, role, status, location?, accuracy?, device?: 'mobile'|'web', timestamp }`

## API / integration points (minimal)
- Preferred: reuse existing socket channel `school:{institutionId}` with event `SOS_ALERT` and `SOS_SAFE`.
- If an HTTP endpoint exists (e.g., `/api/sos`), POST the payload; otherwise send via socket only.
- Push: if FCM token is present, call existing push notify endpoint with same payload (optional first pass).
- No DB/schema changes in this pass; treat as thin event.

## UI components (mobile)
- `EmergencyScreen` (existing): add in-screen sheet/modal for danger.
- `SosDangerSheet`:
  - Shows call buttons list.
  - Shows location (lat/lng or address).
  - Buttons: “Share alert” (default on open), “Mark safe”.
- `SosToast/Banner`: shows status and last sent time.

## UI components (web, optional)
- Banner/Modal on dashboard when SOS is triggered (listen to `SOS_ALERT`).

## Behaviors & edge cases
- Location denied: still send alert without location and show “Location not shared”.
- Debounce sends: prevent repeat within 15s unless status changes.
- Offline: queue locally and show “Pending send”; retry when online (optional nice-to-have).
- Call directory: tapping launches tel: links; no backend dependency.

## Steps to implement (phase order)
1) Wire socket events:
   - Emit `SOS_ALERT` and `SOS_SAFE` from mobile with payload above.
   - Listen on web/mobile to show banner/toast when receiving these events.
2) Mobile UI:
   - Add danger sheet with call directory and immediate send on open.
   - Add “Mark safe” button to send `SOS_SAFE`.
   - Capture location (lat/lng) and include in payload.
3) FCM push (if token present):
   - Call existing push notify endpoint with the same payload (only if token/institutionId available).
4) Web display (optional first pass):
   - Show toast/banner on dashboard for incoming SOS events; include name, role, location.
5) Polishing:
   - Debounce repeated sends.
   - Handle location permission errors gracefully.

## Testing checklist
- Danger send with location granted → recipients see toast/banner.
- Danger send with location denied → still sends, shows “no location”.
- Safe update clears danger state and sends `SOS_SAFE`.
- Call directory buttons open dialer.
- Multiple rapid taps do not spam events.

## What to configure
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (for reverse geocode if we add it; optional first pass).
- Call directory numbers (static constants for now: 112, 101, 108, campus/security placeholder).

## Approval
- Confirm this plan; then I’ll implement mobile danger/safe flows, socket emits, and receive banners (plus optional web banner). No backend schema changes; only lightweight events/push reuse.

