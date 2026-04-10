# Map & Blueprint Integration Plan (Web + Mobile)
Step-by-step phases to restore working maps and add blueprint overlays.

## Goals
- Web: Show campus map with live devices/alerts + indoor blueprint overlay.
- Mobile: Show map/blueprint, device locations, drill navigation.
- Ensure API keys and SDK wiring are correct; handle fallbacks.

## Phase 1 – Audit & Prereqs (quick)
- Verify Map tokens/keys:
  - Web: `NEXT_PUBLIC_MAPBOX_TOKEN` (or map provider token) in `.env`.
  - Mobile: Google Maps API key(s) in `AndroidManifest.xml` / iOS plist.
- Confirm backend endpoints for map/blueprint:
  - Floor plan / blueprint: `/schools/:id/blueprint`, `/floor-plan/map-data` (per `api_endpoints.dart`).
  - Device locations: existing devices API.
- Check socket join for institution room (already used for alerts).

## Phase 2 – Web Map Fix
- Components/pages to wire:
  - Dashboard map (`SafetyMap`).
  - Any map in crisis/incident view.
  - Dedicated `/map` page for blueprint + devices (added).
- Actions:
  - Load map token from env; guard render if missing (show banner “Map token missing”).
  - Fetch blueprint/floor-plan data for selected school; overlay polygon/image on map.
  - Plot device markers (IoT devices) with status colors; update on `DEVICE_ALERT`/`TELEMETRY_UPDATE`.
  - Add drill marker/zone when `DRILL_START` arrives.
  - Add “Center on school” and “Fit to markers/blueprint” controls.

## Phase 3 – Mobile Map Fix
- Screens to wire (candidate):
  - IoT device list/detail map (if present).
  - Drill/evac navigation map.
- Actions:
  - Ensure Google Maps initialized with API key.
  - Fetch blueprint/floor-plan; overlay as GroundOverlay or polyline/polygon region.
  - Plot device markers with status colors; refresh on socket events.
  - For drills, show a callout/popup and center map on drill area.

## Phase 4 – Blueprint Overlay Implementation
- Backend response expected fields: image URL or geojson, bounds (lat/lng SW/NE).
- Web:
  - If image overlay: use Mapbox ImageOverlay / custom source+layer with bounds.
  - If geojson: add fill/line layers.
- Mobile:
  - If image overlay: Google Maps GroundOverlay with bounds.
  - If geojson: convert to polygons/polylines.
- Add toggle: “Show Blueprint” on/off; default on if data available.

## Phase 5 – Realtime Updates
- Socket events:
  - `DEVICE_ALERT`: update marker status + optional pulse animation.
  - `TELEMETRY_UPDATE`: refresh device markers silently.
  - `DRILL_START`: add drill zone/marker and show popup.
- Web: already listening on dashboard; ensure map component subscribes or receives prop updates.
- Mobile: ensure map screen listens to provider/state that updates on socket events.

## Phase 6 – UX/Validation
- If token missing: show banner and skip map init.
- If blueprint missing: show “No blueprint available” placeholder.
- Loading/error states for blueprint fetch.
- Provide recenter button and layer toggle (satellite/streets).

## Phase 7 – Testing
- Web:
  - Load dashboard -> map renders; blueprint toggles; markers show.
  - Emit `DEVICE_ALERT` -> marker/status updates.
  - Emit `DRILL_START` -> drill marker/zone appears; popup already handled.
- Mobile:
  - Open map screen -> renders with blueprint; markers show.
  - Emit `DEVICE_ALERT`/`DRILL_START` -> markers/overlays update.
  - Verify no crashes if token missing; shows banner.

## Phase 8 – Deployment Notes
- Ensure env tokens set in deployment (Mapbox/Google Maps).
- Cache blueprint images (CDN) where possible.


