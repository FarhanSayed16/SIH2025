# Kavach audit remediation

Date: 8 September 2026. Base commit: `08847cfb4f60cfc5da8e86876e439c22e73f9d7c`; changes are in the working tree, not committed or deployed.

This file records fixes to the 36 findings in [CODEBASE_AUDIT.md](CODEBASE_AUDIT.md). The original audit and its evidence remain available as a historical baseline. Fixing these findings does not certify an emergency system for live deployment.

## Verification

| Check | Result |
| --- | --- |
| Backend tests | 135 passed across 15 suites, including real HTTP routes and an isolated MongoDB replica set |
| Web tests | 9 passed across 4 suites |
| Mobile tests | 28 passed, with the restored assets included |
| Web production build | Passed with Next.js 15.5.25; TypeScript checking enabled |
| Android debug build | Passed; `mobile/build/app/outputs/flutter-apk/app-debug.apk`, using example Firebase configuration |
| Backend lint | 0 errors; 107 existing warnings |
| Web lint | 0 errors; 65 existing warnings |
| Mobile analysis | 0 errors and 0 warnings with `flutter analyze --no-fatal-infos`; 1,887 informational style/deprecation diagnostics remain |
| Dependency audit | `npm audit`: 0 reported vulnerabilities across all severities |
| Firmware host regression | Both changed sketches pass local alarm ordering, certificate configuration, queue saturation and network isolation checks |
| Whitespace check | `git diff --check` passed |

Backend tests never connect to an application database. The test runner starts a temporary MongoDB replica set and removes it afterward. Notification delivery is mocked in scheduler tests; compatibility tests generate email locally without SMTP. Tests also exercise Excel export/import, Sharp image processing and PDF generation after dependency updates.

The web build still downloads the existing Google Fonts at build time and therefore requires network access or a populated font cache. The Android debug build completed in 617.8 seconds. It uses the repository's example Firebase configuration and is not a production Firebase or signed-release verification. The debug APK is approximately 824 MiB because it includes the supplied media assets.

## Finding-by-finding changes

| ID | Change and resulting behavior |
| --- | --- |
| A01 | Public registration accepts only student, teacher and parent roles. Raw public `institutionId` no longer establishes school membership. Class joining or administrator assignment establishes membership; institution access requires approval. |
| A02 | Profile updates use an explicit field allowlist. Users cannot write roles, approval, password hashes, refresh tokens or security state into their own profiles. Staff updates check school and class ownership; approval attribution comes from the authenticated actor. |
| A03 | Authentication checks current account activity, approval rejection/blocking and token version. Database role is authoritative. Disabled accounts cannot keep using previously issued access tokens. |
| A04 | Device registration and updates require approved administrators. Institution and class assignments are validated against the administrator and device. Teachers can read permitted devices; students cannot provision or list them. |
| A05 | Device secrets are excluded by default queries and JSON serialization. Only the provisioning response returns credentials. Lists and details enforce school access; institutionless accounts cannot see all devices. |
| A06 | Telemetry compares the authenticated device with the route's device ID before processing. A token issued for one device cannot submit another device's readings. |
| A07 | Sensor provisioning issues a cryptographically random device token as well as the registration token. Sparse unique credential fields omit absent values instead of saving duplicate `null` entries. Two-device provisioning is covered through real HTTP and MongoDB. |
| A08 | Device details and updates avoid ObjectId casting for business IDs. Valid hexadecimal business IDs still receive a business-ID lookup if the MongoDB-ID lookup misses. |
| A09 | Alert creation/listing are institution-scoped. Shared router parameter authorization covers alert reads and status/resolve paths. Updating another user's status requires approved staff and a target in the alert's school. Unapproved teachers cannot use the teacher alert endpoint. |
| A10 | Socket school/user/name/role/timestamp come from authenticated server state. Cross-school room joins, drill acknowledgment, safe/help updates and legacy safety updates are denied. Unapproved accounts do not automatically join school rooms. |
| A11 | Conflict resolution looks up the queue item by both ID and authenticated owner. Another user's queue item cannot be resolved. |
| A12 | Password reset clears the stored refresh token and increments the token version. Access/refresh verification rejects older versions. Active user sockets are disconnected on reset and relevant profile changes; sockets also expire with their access token and revalidate incoming events. |
| A13 | Removed recovery-token logs and mobile API/auth response, credential and error-body logging. Mobile auth errors now throw valid exceptions; registration retains typed field errors instead of mutating immutable `Exception` objects. |
| A14 | Removed predictable mesh fallback keys and fail-open transport paths. Mesh keys require a matching school, valid server key and actual unexpired server expiry. Cache entries use a new namespace. Signatures authenticate canonical payload and envelope fields; payload/source tampering is rejected. Encryption uses a fresh secure random nonce. |
| A15 | Mesh sync acknowledges only successfully persisted supported status updates. Updates are atomic, school-authorized and timestamp-ordered, so replay cannot overwrite newer status. Unsupported, encrypted or invalid events return explicit per-message failures and no acknowledgment. They are not represented as delivered. |
| A16 | Mobile deletes only explicitly acknowledged message IDs. Mixed failures, missing acknowledgments and HTTP errors retain messages for retry. The concurrency guard is set before the first asynchronous connectivity check. |
| A17 | Corrected the scheduled broadcast logging variable. Successfully delivered broadcasts remain `sent`; regression tests cover successful, mixed, failed and already-claimed batches without sending real notifications. |
| A18 | Registration forwards `classCode` to the service and derives student school/class/grade/section from the class record. |
| A19 | Registered `/users/export` before `/:id`, preserving the static route and its administrator gate. |
| A20 | Historical incident form defines summarization state and handles optional description safely. |
| A21 | Activity timeline imports the required icon, uses the actual `createdAt` field and handles missing/invalid dates safely in display and CSV export. |
| A22 | ML prediction clients build actual query strings for the fetch client and unwrap one API envelope. Analytics methods have concrete response types and reject absent data instead of hiding errors. |
| A23 | Removed randomly generated analytics, invented chart values and silent outage fallbacks. Tabs display real results, empty states or recoverable errors. Drill averages use the real returned `avgScore`. |
| A24 | Refreshed HTTP access tokens update Zustand and persisted session state, allowing socket subscribers to reconnect with the current token. Login/logout keep client/store credentials consistent. |
| A25 | Card forwards standard div attributes and event handlers. Click propagation and modal behavior have persistent tests. Also fixed the IoT modal's conditional-hook crash on open/close transitions. |
| A26 | Integrated the user-provided 329 asset files and removed their blanket Git exclusion. Corrected Linux-sensitive comic folders, English quiz extension, language-summary filenames and chemical panorama path; declared NDMA summary assets. Missing approval animation uses a native icon. Comics without audio disable playback. Removed automatic/mock drill injection into operational sync. A local `.env` was prepared from the example with no Gemini key. |
| A27 | Flutter CI pins 3.35.4 and Java 17. The pubspec requires Dart 3.9 / Flutter 3.35 and declares already-used direct dependencies. Corrected obsolete tests/generated mock parameters; analysis enforces errors and warnings while retaining informational lint output. The Gradle wrapper is executable. |
| A28 | Release signing uses explicit environment inputs or local `android/key.properties`; release tasks fail clearly when credentials are absent. CI separates debug checks from signed release jobs. Signing files are ignored. No production identity was generated. |
| A29 | Backend ESLint configuration loads as CommonJS. Jest runs with ESM support and an isolated test database. Removed the invalid JS-extension mapper, corrected required fixtures and lexical switch blocks, and stopped drill auto-end timers from keeping an otherwise idle process alive. |
| A30 | Web lint has a noninteractive configuration. Tests run once by default, use the correct JSX runtime and mock both token setters. Auth, refresh, card and modal tests pass. |
| A31 | Removed TypeScript/build bypasses. Corrected API contracts, optional response handling, profile normalization, animation types and JSX errors. The production build passes with type checking enabled. |
| A32 | Updated vulnerable direct dependencies and scoped vulnerable transitive dependencies to patched compatible versions. Regenerated the lockfile from clean resolution and verified `npm ci`, compatibility tests and zero audit advisories. |
| A33 | Disabled fabricated geographic and floorplan routes and the client-supplied AR path broadcast endpoint with explicit HTTP 503 responses. Mobile clears stale routes/compass targets, removes the fabricated indoor preview and displays unavailable guidance with posted-plan/staff instructions. Floorplan CRUD and non-routing training remain available. |
| A34 | Removed insecure TLS from both affected sketches. HTTPS requires a configured trusted root CA and a synchronized clock. Missing trust configuration disables network transmission. |
| A35 | Local alarms run before nonblocking queue operations. Network work runs in a separate FreeRTOS task with bounded queues, so offline or full-queue conditions do not block the sensor/alarm loop. |
| A36 | Mounted recursive input-key validation before API routers. Operator keys, dotted keys and prototype-manipulation keys are rejected before business handlers. Normal text is not rejected by a command-word blacklist. |

## Behavior and rollout requirements

- **AR routing is unavailable.** The repository contains no validated traversability graph or coordinate calibration. These fixes remove unsafe operational guidance; they do not implement a verified evacuation planner. Re-enable routing only after those inputs and route validation exist.
- **Mesh sync supports authorized user status updates.** Crisis/drill/other event types and encrypted sync envelopes are explicitly unsupported and remain queued. A complete authenticated, durable handler is still required before claiming delivery of those event types. Mesh peers share a school key; this is not proof of an individual sender's identity.
- **Mesh protocol changes require coordinated mobile rollout.** New clients use versioned payload signatures and v3 key caches; legacy signatures are rejected. Existing queued legacy envelopes are not silently converted into trusted messages. The server's new acknowledgment contract is intentionally fail-safe with old responses: updated clients retain unacknowledged messages.
- **Firmware needs deployment configuration and board validation.** Set each device's unique token, backend URL and trusted root CA. Host tests do not measure ESP32 timing, flash the hardware, perform TLS handshakes or verify physical buzzer/sensor behavior. The enhanced sketch still supports its explicit HTTP development configuration; production must use configured HTTPS.
- **Android release credentials are external.** For local release builds, supply `mobile/android/key.properties` with `storeFile`, `storePassword`, `keyAlias`, `keyPassword`, or use `ANDROID_KEYSTORE_PATH`, `ANDROID_STORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. CI's `android-release` environment needs `ANDROID_KEYSTORE_BASE64`, the three signing secrets above, and `FIREBASE_GOOGLE_SERVICES_BASE64`. Set `MOBILE_BASE_URL` to the production HTTPS endpoint; `MOBILE_SOCKET_URL` is optional. Configure environment protections in GitHub. No release artifact was signed or deployed.
- **Restored assets are substantial:** 329 files, 675,127,134 bytes, now eligible for source control. They must accompany CI/checkouts. Keep `.env`, Firebase credentials and signing material out of commits. Local debug verification uses the checked-in Firebase example, not production Firebase.
- **Dependency migration:** use Node 22.12+ (tested with 22.14) and the committed lockfile. Web CI now uses Node 22 and the root lockfile. The backend Docker build uses the same root workspace lockfile and copies only runtime source; local Compose reads backend/.env. Compose configuration validation passed without reading credentials; Docker image/runtime execution was not verified. Scoped overrides preserve ExcelJS, Firebase and Next.js APIs while replacing vulnerable nested packages. Rollback requires reverting the manifests, lockfile and associated compatibility changes together; it would also restore the recorded security exposure. No destructive database migration was performed.
- Existing backend/web lint warnings and mobile informational style diagnostics remain documented rather than being suppressed globally. Dependency audit results describe the advisory database at verification time, not a guarantee against undisclosed vulnerabilities.

## Refreshed code graph

The current graph contains **11,957 nodes and 20,442 edges** and represents **883/883 inventoried source files**. Validation found zero duplicate node IDs, dangling endpoints, missing source paths or out-of-bounds source locations. All source hashes still match the verified working tree.

The refresh re-extracted all code, rebuilt all four Arduino sketches through temporary byte-identical C++ copies, removed 51 reintroduced false Flutter-to-React inheritance links, and regenerated communities. No LLM tokens were used. The known Next.js-to-Dart navigation mismatch is also checked by the repeatable repair script.

The graph is a navigation aid, not proof of runtime behavior or every inferred relationship. This was an AST/code refresh; documents and media were not semantically re-extracted. The working-tree hash manifest and validation are [source-manifest.json](graphify-out/remediation/source-manifest.json) and [graph-validation.json](graphify-out/remediation/graph-validation.json). The initial audit retains its own separate baseline manifests.

## Evidence and repeatable checks

Current verification logs are in [graphify-out/remediation](graphify-out/remediation/). The initial audit's logs and bug reproductions remain in `graphify-out/audit`; those reproductions assert pre-fix behavior and are historical evidence, not the new regression suite.

```sh
npm ci
npm test --workspace backend
npm run lint --workspace backend
npm test --workspace web
npm run lint --workspace web
npm run build --workspace web
npm audit
(cd mobile && flutter pub get && flutter analyze --no-fatal-infos && flutter test)
python3 arduino/tests/check_safety.py
python3 graphify-out/refresh_code_graph.py
```

Dependency changes were checked against the official [Next.js upgrade documentation](https://nextjs.org/docs/app/guides/upgrading) and [Vitest migration documentation](https://vitest.dev/guide/migration.html), alongside registry advisories and local runtime compatibility tests.
