# Kavach codebase audit

> **Historical audit, before fixes.** The user subsequently requested remediation. See [AUDIT_FIXES.md](AUDIT_FIXES.md) for the current changes, passing checks, disabled unsafe capabilities and deployment requirements. The findings and original evidence below are preserved as the baseline.

**Date:** 8 September 2026  
**Source commit:** `08847cfb4f60cfc5da8e86876e439c22e73f9d7c`  
**Verdict:** The repository has critical authorization defects, emergency-message reliability failures, and broken verification gates. It should not be treated as ready for a live emergency deployment.

This report contains **36 prioritized findings**: **1 critical, 21 high, and 14 medium**. Severity reflects this application's emergency and student-data context. Dependency advisory counts and individual compiler/linter diagnostics are separate; they are not 63 additional proven application exploits.

During the initial audit, application code was not changed. The later remediation changes application code; see the linked fix report.

## 1. Graph validation and repair

**The original graph was current, but it was not a complete or fully reliable codebase map.** Matching hashes alone did not establish correctness.

| Check | Original graph | Final graph |
| --- | --- | --- |
| Commit | Matches audited commit | Matches audited commit |
| Nodes | 10,516 | 11,701 |
| Edges | 18,590 | 20,190 |
| Tracked code files represented | 857 / 867 | 867 / 867 |
| Missing files among original 1,084 manifest entries | 0 | 0 |
| Changed content among original manifest entries | 0 | 0 |
| Duplicate node IDs | 0 | 0 |
| Dangling edge endpoints | 0 | 0 |

Validation compared manifest MD5 hashes with source bytes, checked source paths and line bounds, checked graph endpoints, compared coverage against `git ls-files`, and inspected representative edges against source.

Repairs performed:

1. Ran `graphify update . --force`. It recovered six omitted files: `backend/scripts/generate-secrets.js`, `backend/scripts/get-device-token.js`, `backend/scripts/test-reset-with-token.js`, `mobile/lib/core/design/design_tokens.dart`, `mobile/lib/core/widgets/inputs/password_input.dart`, and `web/lib/design-system/tokens.ts`.
2. The installed extractor did not discover `.ino` files. Extracted byte-identical temporary C++ copies of all four Arduino sketches. Remapped their source locations to the original sketches and merged 26 nodes and 39 edges. No firmware source was edited. The supplement is [arduino-ast.json](graphify-out/arduino-ast.json).
3. Found and removed **98 false cross-language edges** after forced extraction: **51 Flutter inheritance edges** incorrectly targeting a React `State` interface, and **47 Next.js imports** incorrectly targeting Dart's `navigation.dart`. These were incorrectly labeled `EXTRACTED`. The rejected edges remain available in [rejected-edges.json](graphify-out/audit/rejected-edges.json).
4. Recomputed communities and the generated report. Skipped HTML rendering because the graph exceeds the tool's 5,000-node visualization threshold.

**Final graph status:** usable as a source-navigation map, with full tracked-code file coverage and the identified false links corrected. This is not a certification of every symbol or edge. External symbols, dynamic imports, runtime events, HTTP contracts, and name-based resolution still require source verification. Do not treat an `EXTRACTED` label as proof of semantic correctness. A future extraction can reintroduce the identified linker defects or omit Arduino files; repeat these checks after regeneration.

The graph's largest navigation hubs include `errorResponse()`, `successResponse()`, `logger`, and `useAuthStore`. Its “Surprising Connections” section helped expose the invalid language-crossing links. Its suggested questions are navigation prompts, not verified architecture conclusions. See [GRAPH_REPORT.md](graphify-out/GRAPH_REPORT.md) for current communities and their raw cohesion values.

**Graph extraction cost:** 0 input LLM tokens and 0 output LLM tokens. The large-corpus estimate in the old report included non-source material; it was not a bill. The tool's pre-correction benchmark estimated 40.1× fewer tokens per query; that estimate is not measured audit savings and says nothing about correctness.

## 2. Scope, evidence, and limits

The inventory contains 1,505 tracked files: backend 425, web 286, mobile 398, Arduino 12, operational scripts 5, workflows 2, documentation 372, and 5 root files. All 867 tracked code files were included in graph coverage checks. Repository-wide scans covered imports, syntax, authorization patterns, dangerous sinks, unfinished implementations, dependencies, and verification configuration. Manual review traced high-risk flows through routes, middleware, controllers, services, models, and clients.

This was a repository-wide static audit with focused executable checks, not an exhaustive formal proof or a production penetration test. No live database, credentials, school records, external notifications, or hardware were used. Native firmware builds, real sensor timing, deployed infrastructure, and live service integrations were not tested. Documentation was used for architecture and intended behavior; every prose or media asset was not manually reviewed.

Evidence labels:

- **Reproduced:** isolated execution of actual source demonstrated the behavior with mocked dependencies.
- **Tool-confirmed:** an existing test, compiler, linter, or package audit reported the issue.
- **Source-confirmed:** the reachable implementation and its callers establish the defect; live exploitation was not performed.

The five isolated reproductions are runnable from the repository root:

```sh
node --experimental-vm-modules graphify-out/audit/reproduce.mjs
```

These checks assert that the reported bugs currently exist. They are audit demonstrations, not passing regression tests for the desired behavior.

## 3. Prioritized findings

### A01 — Critical: Public registration grants usable administrator privileges

**Evidence:** Reproduced. [auth.routes.js:47](backend/src/routes/auth.routes.js#L47), [auth.service.js:63](backend/src/services/auth.service.js#L63), [rbac.middleware.js:9](backend/src/middleware/rbac.middleware.js#L9).

Public `POST /api/auth/register` accepts `role: "admin"`. Registration persists that role and issues an admin access token. `requireAdmin` checks the role without requiring administrator provisioning or approval. An untrusted registrant can access admin functionality immediately, including account and device management.

**Reproduce:** Register a fresh account with valid public fields and `role: "admin"`; use its token on an admin route. The isolated check confirms both role issuance and passage through the actual admin middleware.

**Fix / acceptance:** Restrict public registration to permitted public roles. Provision administrators through an authenticated administrative workflow. Public admin registration must fail, and an unapproved account must not pass an admin gate.

### A02 — High: Profile updates allow assignment of protected account fields

**Evidence:** Source-confirmed. [user.controller.js:33](backend/src/controllers/user.controller.js#L33), [user.routes.js:41](backend/src/routes/user.routes.js#L41).

`updateUser` copies the entire request body into `$set`, excluding only `password` and `role`, with a special check for `approvalStatus`. An owner can update fields such as `institutionId`, `classId`, `isActive`, and other schema fields through the profile endpoint. Changing `institutionId` bypasses the intended school/class membership workflow and affects subsequent scoped access.

**Fix / acceptance:** Use an explicit allowlist of self-editable profile fields. Put membership, activation, and approval changes behind separate permission checks. Attempts to modify protected fields through the profile endpoint must fail or leave them unchanged.

### A03 — High: Deactivated accounts retain HTTP access through existing tokens

**Evidence:** Reproduced. [auth.middleware.js:25](backend/src/middleware/auth.middleware.js#L25), [auth.service.js:239](backend/src/services/auth.service.js#L239).

Login and refresh check account activation, but the shared HTTP authentication middleware only verifies the token and loads the user. It does not reject `isActive: false`. Deactivating an account therefore does not stop requests made with an already-issued access token, until that token expires.

**Fix / acceptance:** Enforce current account eligibility in shared authentication, including optional authentication where appropriate. Deactivate an account and verify its existing token is rejected immediately.

### A04 — High: Device registration and modification lack role and ownership checks

**Evidence:** Source-confirmed. [device.routes.js:36](backend/src/routes/device.routes.js#L36), [device.routes.js:184](backend/src/routes/device.routes.js#L184), [device-auth.controller.js:41](backend/src/controllers/device-auth.controller.js#L41).

The routes described as admin-only use `authenticate` without an admin gate. Registration accepts an arbitrary institution. Updating a device by database ID has no institution comparison. Any authenticated user who knows a device ID can change its activation, status, room, class, or configuration, including sensor thresholds.

**Fix / acceptance:** Require an authorized device-management role and verify institution ownership on both operations. A student and an administrator from another school must not modify the device.

### A05 — High: Device listing exposes authentication tokens

**Evidence:** Source-confirmed. [device.routes.js:62](backend/src/routes/device.routes.js#L62), [Device.js:36](backend/src/models/Device.js#L36), [Device.js:94](backend/src/models/Device.js#L94).

Device list responses serialize complete documents. Neither `registrationToken` nor `deviceToken` is excluded from selection or serialization. Ordinary users can obtain device credentials from list responses. A user without an institution also skips the list's institution restriction and can receive devices across schools.

**Fix / acceptance:** Exclude credentials from routine queries and responses, restrict list access, and fail closed for missing institution context. Only initial authorized provisioning should disclose a new token.

### A06 — High: A valid device token can submit telemetry for another device

**Evidence:** Source-confirmed. [deviceAuth.middleware.js:37](backend/src/middleware/deviceAuth.middleware.js#L37), [iotDevice.controller.js:20](backend/src/controllers/iotDevice.controller.js#L20), [iotDeviceMonitoring.service.js:26](backend/src/services/iotDeviceMonitoring.service.js#L26).

Authentication attaches the token's device, but telemetry handling independently looks up `req.params.deviceId`. It never verifies that the route device matches the authenticated device. When IoT is enabled, device A can submit readings for device B and trigger alerts in B's school. The explicit device-alert controller already contains the missing comparison.

**Fix / acceptance:** Process the authenticated device, or reject mismatched route IDs before service execution. A token for A submitted to B's telemetry route must receive 403 and create no telemetry or alert.

### A07 — High: Sensor registration is wired to the wrong credential flow

**Evidence:** Source-confirmed. [device.routes.js:3](backend/src/routes/device.routes.js#L3), [device-auth.service.js:120](backend/src/services/device-auth.service.js#L120), [deviceAuth.middleware.js:37](backend/src/middleware/deviceAuth.middleware.js#L37).

The public API's sensor registration route calls the general device registration service, which creates `registrationToken`. Sensor ingestion authenticates against `deviceToken`, which this flow leaves null. The separate IoT registration controller generates the correct credential but is not mounted here. API-created sensors cannot authenticate using the token returned by their registration flow. Local provisioning scripts can mask the defect by writing the correct field directly.

**Fix / acceptance:** Route sensor types through consistent provisioning and return the credential expected by ingestion. A device registered through the API must immediately authenticate to its telemetry endpoint.

### A08 — Medium: Device business-ID fallback throws before it can run

**Evidence:** Source-confirmed. [device.routes.js:153](backend/src/routes/device.routes.js#L153), [device.routes.js:189](backend/src/routes/device.routes.js#L189).

GET and PUT first call `findById()` and only try `findOne({ deviceId })` if the result is null. For a business ID such as `ESP32-01`, Mongoose raises an ObjectId cast error instead, so the intended fallback is unreachable and the handler returns 500.

**Fix / acceptance:** Determine whether the supplied value is an ObjectId before selecting the query, or expose separate identifiers consistently. Both supported identifier forms must work without a cast-error response.

### A09 — High: Alert operations do not consistently enforce school or user ownership

**Evidence:** Source-confirmed. [alert.controller.js:16](backend/src/controllers/alert.controller.js#L16), [alert.controller.js:141](backend/src/controllers/alert.controller.js#L141), [alert.controller.js:179](backend/src/controllers/alert.controller.js#L179), [alert.controller.js:205](backend/src/controllers/alert.controller.js#L205), [alert.service.js:35](backend/src/services/alert.service.js#L35), [alert.service.js:57](backend/src/services/alert.service.js#L57).

Creation trusts a supplied institution. Listing lets a supplied `schoolId` override membership. Detail lookup does not check membership. The legacy student-status route accepts another `userId` without an ownership gate. Resolve checks the teacher/admin role but the service does not check the alert's school. These paths allow cross-school alert access and unauthorized changes to emergency status.

**Fix / acceptance:** Centralize alert authorization around the stored alert's institution and the authenticated actor. Test a school-A student and teacher against every school-B alert operation, including legacy routes and status updates.

### A10 — High: Socket SOS events allow school and identity spoofing

**Evidence:** Reproduced. [socketHandler.js:171](backend/src/socket/socketHandler.js#L171).

`relaySos` trusts client-supplied `institutionId`, `userId`, `userName`, and `role`. It broadcasts those values to the selected school, with no relationship check. An authenticated user can impersonate another person's `SOS_ALERT` or `SOS_SAFE`. Choosing a student identity can also reach the notification fan-out path.

**Fix / acceptance:** Derive actor and school from authenticated server state. Allow acting for another person only through explicit authorization. Spoofed identity or school fields must never produce another school's event or notification.

### A11 — High: Sync conflict resolution can modify another user's queue item

**Evidence:** Source-confirmed. [sync.controller.js:238](backend/src/controllers/sync.controller.js#L238), [syncQueue.service.js:400](backend/src/services/syncQueue.service.js#L400).

The authenticated route passes only `queueItemId`, resolution, and replacement data to the service. The service loads by ID without checking `queueItem.userId` against the authenticated user. Knowing another user's conflicting queue ID permits discarding or replacing that user's pending result.

**Fix / acceptance:** Include the authenticated user in the query and reject non-owned queue items. A second account must not resolve, overwrite, or mark the first account's conflict as synced.

### A12 — High: Password reset leaves existing sessions valid

**Evidence:** Source-confirmed. [auth.service.js:548](backend/src/services/auth.service.js#L548), [auth.service.js:288](backend/src/services/auth.service.js#L288).

Successful password reset changes the password and clears reset-token fields, but does not revoke the stored refresh token. Previously issued access tokens also remain valid. An attacker holding a refresh token can continue obtaining access after the owner resets the password.

**Fix / acceptance:** Revoke refresh sessions on password reset and enforce a token version or equivalent session invalidation policy. Tokens issued before reset must no longer refresh or authenticate under the chosen recovery policy.

### A13 — Medium: Production-capable paths log credentials and recovery tokens

**Evidence:** Source-confirmed. [auth.service.js:508](backend/src/services/auth.service.js#L508), [api_service.dart:96](mobile/lib/core/services/api_service.dart#L96).

Password-reset email failures log the complete reset URL and token without a development-only guard. Mobile API logging prints request headers, request bodies, and response data without `kDebugMode` guards. Login passwords, bearer tokens, refresh tokens, and personal information can therefore enter logs.

**Fix / acceptance:** Remove secrets from logs and gate diagnostic logging appropriately. Exercise login, refresh, and failed reset-email delivery; captured logs must contain no password or usable token.

### A14 — High: Mesh key retrieval fails open to a publicly computable key

**Evidence:** Source-confirmed. [mesh_security_service.dart:35](mobile/lib/features/mesh/services/mesh_security_service.dart#L35), [mesh_security_service.dart:135](mobile/lib/features/mesh/services/mesh_security_service.dart#L135).

Any key-retrieval failure returns a deterministic SHA-256 hash derived from the school ID and a constant string. This fallback is not limited to debug builds. Anyone knowing the school ID can compute the same key for fallback clients, defeating authentication and confidentiality on that path.

**Fix / acceptance:** Use an authorized cached key under an explicit offline policy, or fail closed. A key-fetch failure without a usable authorized key must not produce a predictable signing/encryption key.

### A15 — High: Mesh synchronization acknowledges emergency messages without processing them

**Evidence:** Reproduced. [mesh.service.js:113](backend/src/services/mesh.service.js#L113).

`syncMeshMessages` deduplicates only within the supplied batch, logs each message, and increments `synced`. It does not persist or deliver crisis alerts, drill events, or user-status changes. Even unknown message types count as synced. Retrying the same ID in another request also counts as a new success.

**Fix / acceptance:** Acknowledge only durable processing or durable queue acceptance, validate message types, and persist idempotency identifiers. Synchronize an offline status message and verify the server state changes exactly once.

### A16 — High: Mobile mesh sync deletes messages even when the server reports failure

**Evidence:** Source-confirmed. [mesh_sync_service.dart:81](mobile/lib/features/mesh/services/mesh_sync_service.dart#L81).

After a response, the client reads `synced` and `failed` counts but unconditionally marks and removes every submitted message. Partial failure, missing result fields, or zero successful messages still empties the batch. This independently loses pending emergency messages even after server-side processing is fixed.

**Fix / acceptance:** Return per-message acknowledgments and remove only acknowledged IDs. A batch with one successful and one failed message must retain the failed message for retry.

### A17 — High: Scheduled broadcasts are marked failed after successful delivery

**Evidence:** Tool- and source-confirmed. [broadcast.service.js:638](backend/src/services/broadcast.service.js#L638).

After sending notifications and saving successful delivery statistics, the scheduled-broadcast path interpolates undefined `queued`. The resulting `ReferenceError` enters the catch block, which saves the broadcast as `failed`. Operators see failure even when recipients received messages, potentially prompting duplicate sends.

**Fix / acceptance:** Remove the undefined reference or compute the correct statistic. A scheduled broadcast with successful notification results must remain sent and must not enter the failure handler.

### A18 — Medium: Registration silently drops the submitted class code

**Evidence:** Reproduced. [auth.controller.js:20](backend/src/controllers/auth.controller.js#L20), [auth.service.js:student registration](backend/src/services/auth.service.js).

The route validates `classCode` and the registration service supports it, but the controller neither destructures nor forwards it. Registering with a valid class code follows the no-class path, so the expected class association and join request are not created.

**Fix / acceptance:** Pass the validated class code to the existing service. Verify class association and the pending membership request when registering with a valid code.

### A19 — Medium: User export route is shadowed by the user-ID route

**Evidence:** Source-confirmed. [user.routes.js:27](backend/src/routes/user.routes.js#L27), [user.routes.js:111](backend/src/routes/user.routes.js#L111).

`GET /:id` is registered before `GET /export`. Express matches `export` as the ID, and its Mongo-ID validator rejects the request before the export handler runs. The export endpoint is unusable through this router.

**Fix / acceptance:** Register static routes before parameter routes. An authorized `GET /api/users/export` must reach the export handler and return the requested format.

### A20 — High: Historical incident form references missing state variables

**Evidence:** TypeScript-confirmed. [HistoricalIncidentForm.tsx:263](web/components/incidents/HistoricalIncidentForm.tsx#L263), [admin/incidents/page.tsx:1175](web/app/admin/incidents/page.tsx#L1175).

The form reads `isSummarising` during rendering and calls `setIsSummarising`, but neither is declared. Rendering the affected form raises a `ReferenceError`; suppressing TypeScript errors during production builds does not make those identifiers exist.

**Fix / acceptance:** Declare the intended state and handle an absent description safely. Render the historical incident form and exercise its summarization success and failure paths.

### A21 — Medium: Activity timeline contains a missing icon and an invalid export date field

**Evidence:** TypeScript- and source-confirmed. [ActivityTimeline.tsx:145](web/components/teacher/ActivityTimeline.tsx#L145), [ActivityTimeline.tsx:152](web/components/teacher/ActivityTimeline.tsx#L152), [activity.ts:17](web/lib/api/activity.ts#L17).

The timeline uses `Activity` without importing it. A fallback/empty-state branch can crash. CSV export reads `timestamp`, while `ActivityLog` defines `createdAt`; exporting normal records can throw `RangeError: Invalid time value` at `toISOString()`.

**Fix / acceptance:** Import the icon and use the response's actual date field with validation. Test an empty feed, an unrecognized activity type, and CSV export of a normal record.

### A22 — Medium: ML prediction client uses an incompatible API wrapper contract

**Evidence:** TypeScript- and source-confirmed. [mlPredictions.ts:149](web/lib/api/mlPredictions.ts#L149), [client.ts:214](web/lib/api/client.ts#L214), [mlPrediction.controller.js:69](backend/src/controllers/mlPrediction.controller.js#L69).

Several methods pass Axios-style `{ params }` to `apiClient.get`, which accepts only an endpoint string. Filters are silently ignored at runtime. Those methods also expect `response.data.data`, but the custom wrapper returns the server's `{ success, data }` directly. Valid prediction responses become null.

**Fix / acceptance:** Build query strings using the existing client's contract and read one data layer. Test a filtered request and a successful backend prediction response.

### A23 — High: Analytics silently replaces failures with fabricated statistics

**Evidence:** Source-confirmed. [analytics/page.tsx:72](web/app/analytics/page.tsx#L72), [analytics/page.tsx:161](web/app/analytics/page.tsx#L161).

Failed or unusable API responses populate drill, student, game, and quiz views with hardcoded/random fallback values. These are displayed in the normal analytics flow. Operators can mistake fabricated preparedness and evacuation figures for measured results, precisely when backend data is unavailable.

**Fix / acceptance:** Show an error, empty state, or explicitly identified demo mode. Simulate an analytics outage and verify that no invented operational figures appear.

### A24 — Medium: HTTP token refresh leaves socket consumers using the old token

**Evidence:** Source-confirmed. [client.ts:110](web/lib/api/client.ts#L110), [auth-store.ts](web/lib/store/auth-store.ts), [dashboard/page.tsx:101](web/app/dashboard/page.tsx#L101), [header.tsx:53](web/components/layout/header.tsx#L53).

The HTTP client refreshes its private token and local storage, but does not update Zustand's `accessToken`. Dashboard and reconnect handlers read that store value. After expiry, HTTP requests can recover while socket reconnects keep sending the expired token and fail.

**Fix / acceptance:** Update the shared session state when tokens change. Expire a token, trigger HTTP refresh, disconnect the socket, and verify reconnect uses the newly issued token.

### A25 — Medium: Card component drops click handlers supplied by callers

**Evidence:** TypeScript- and source-confirmed. [card.tsx:7](web/components/ui/card.tsx#L7), [StudentPerformanceCard.tsx:59](web/components/teacher/StudentPerformanceCard.tsx#L59), [IoTAlertModal.tsx:116](web/components/alerts/IoTAlertModal.tsx#L116).

`Card` accepts only children, class name, and title, and does not forward other props. Callers nevertheless pass `onClick`. Student card navigation is lost. The IoT modal's click-propagation guard is also dropped, allowing inside clicks to reach a dismissing backdrop.

**Fix / acceptance:** Give interactive cards appropriate supported event props or use a semantic interactive wrapper. Verify student-card navigation and that clicking inside the alert modal does not dismiss it.

### A26 — High: Missing mobile assets prevent clean-checkout tests and packaging

**Evidence:** Tool-confirmed. [pubspec.yaml:115](mobile/pubspec.yaml#L115), [flutter-test.log](graphify-out/audit/flutter-test.log).

`mobile/assets/` is absent, but the manifest requires fonts, quizzes, game images, audio, and other asset directories. `flutter test --no-pub` exits before running tests with missing asset entries and `Failed to build asset bundle`. The declared `.env` asset is also absent in this checkout, and startup awaits loading it.

**Fix / acceptance:** Supply required distributable assets and a documented configuration-generation step, or remove unused declarations and references. Tests and packaging must work from a fresh checkout using documented setup only.

### A27 — Medium: Flutter CI SDK is older than required dependency constraints

**Evidence:** Source-confirmed from workflow and installed package metadata. [flutter.yml:18](.github/workflows/flutter.yml#L18), [pubspec.yaml:103](mobile/pubspec.yaml#L103).

All mobile jobs pin Flutter 3.24.0. The declared `flutter_lints: ^6.0.0` requires Dart `^3.8.0`, newer than Dart 3.5 shipped with that Flutter release. The version pairing is documented in the [official Flutter 3.24 announcement](https://flutter.dev/blog/announcing-flutter-3-24-and-dart-3-5). Dependency resolution fails before analysis or tests. This is separate from the missing asset failure observed with the locally available newer SDK.

**Fix / acceptance:** Pin one supported Flutter/Dart toolchain that satisfies the dependency constraints, and use it consistently locally and in CI. Verify `flutter pub get` in the pinned clean environment. Package metadata used as evidence is preserved in the audit folder.

### A28 — Medium: Android release builds use the debug signing configuration

**Evidence:** Source-confirmed. [build.gradle:61](mobile/android/app/build.gradle#L61).

The release build explicitly sets `signingConfig signingConfigs.debug`. It does not produce an artifact signed with a controlled production release identity. This is unsuitable for the advertised release artifact workflow and reliable distribution/update management.

**Fix / acceptance:** Configure protected release signing inputs in the release pipeline. Verify the certificate identity on the produced release APK/AAB, without placing the signing secret in source control.

### A29 — Medium: Backend's documented test and lint commands cannot validate source

**Evidence:** Tool-confirmed. [package.json:10](backend/package.json#L10), [jest.config.js](backend/jest.config.js), [.eslintrc.js](backend/.eslintrc.js).

The normal Jest command does not enable the module execution required by the ESM tests: all 9 suites fail before any test runs with `Cannot use import statement outside a module`. ESLint's legacy config loader rejects the exported ESM configuration; this environment reports `Unexpected top-level property "__esModule"`.

An explicit temporary ESLint configuration allowed diagnostic scanning and found 32 errors and 108 warnings, including A17. Enabling Jest VM modules exposed a separate local missing-bcrypt-binding limitation caused by installing with lifecycle scripts disabled; that limitation is not counted as an application defect.

**Fix / acceptance:** Make the committed test and lint commands executable under the supported Node version, then address the actual results. Both commands must execute their checks in a clean install without manual overrides.

### A30 — Medium: Web CI depends on unconfigured linting and stale auth tests

**Evidence:** Tool-confirmed. [web.yml](.github/workflows/web.yml), [package.json](web/package.json), [auth.test.ts](web/__tests__/api/auth.test.ts).

`next lint` enters an interactive first-run setup because the web package has no committed ESLint configuration. The existing web tests produce 2 failures and 4 passes: login/logout mocks omit the now-used `apiClient.setRefreshToken`. These failures block the workflow's downstream build job and leave auth behavior inadequately checked.

**Fix / acceptance:** Commit noninteractive lint configuration and update the test doubles/assertions for the actual token contract. Lint and the six current tests must run successfully in CI.

### A31 — Medium: Web production build suppresses 47 current TypeScript errors

**Evidence:** Tool-confirmed. [next.config.js:4](web/next.config.js#L4), [typescript.log](graphify-out/audit/typescript.log).

`ignoreBuildErrors: true` allows production compilation to skip type failures, while `ignoreDuringBuilds: true` also skips lint. An explicit `tsc --noEmit` reports 47 diagnostics across API clients, authentication state, incidents, timelines, animations, and UI props. Some are definite runtime defects described above; others are type-contract failures. A successful Next build alone would not prove these paths work.

**Fix / acceptance:** Correct the listed diagnostics and restore a required type-check gate. Do not classify all 47 as independent runtime bugs; use the complete diagnostic appendix to resolve their shared causes.

### A32 — High: Locked dependency tree contains known security advisories

**Evidence:** Live npm advisory scan, not an exploitation test. [package-lock.json](package-lock.json), [npm-audit.json](graphify-out/audit/npm-audit.json).

The registry scan reports **63 affected package entries: 7 critical, 32 high, 21 moderate, and 3 low**. This includes development tools and transitive dependencies. Direct affected packages include `next`, `express`, `mongoose`, `axios`, `jspdf`, `sharp`, `nodemailer`, `vitest`, and others listed below. Reachability and impact depend on how each vulnerable feature is used; package presence does not establish exploitation of this application.

**Fix / acceptance:** Triage runtime-facing dependencies first, then development-server exposure and build tooling. Upgrade in tested groups and rerun the advisory scan. Do not apply a blind forced upgrade. The saved JSON preserves individual advisory URLs, affected ranges, dependency paths, and suggested fixes.

### A33 — High: AR evacuation guidance uses straight-line geometry without obstacle checks

**Evidence:** Source-confirmed. [arNavigation.service.js:44](backend/src/services/arNavigation.service.js#L44), [arNavigation.service.js:111](backend/src/services/arNavigation.service.js#L111), [ar_navigation_screen.dart:172](mobile/lib/features/ar_navigation/screens/ar_navigation_screen.dart#L172).

The AR route path interpolates points between start and destination. It does not use walls, accessible corridors, floors, blocked exits, or hazard geometry. The mobile AR navigation screen consumes this as route guidance. A geometrically short line can cross an impassable wall or unsafe area.

**Fix / acceptance:** Use a validated navigable floor-plan graph and hazard exclusions before presenting evacuation instructions, or clearly limit the feature to non-operational demonstration. A route test with a wall or blocked exit must choose a traversable alternative or report no safe route.

### A34 — High: Firmware disables TLS certificate verification

**Evidence:** Source-confirmed. [esp_code_integrated.ino:195](arduino/esp_code_integrated.ino#L195), [esp_code_integrated.ino:270](arduino/esp_code_integrated.ino#L270).

Both HTTPS request paths call `setInsecure()` and send the device token. An attacker able to intercept the device's network connection can impersonate the backend, capture the credential, and tamper with telemetry or alert responses. HTTPS URLs alone do not authenticate the server in this configuration.

**Fix / acceptance:** Configure trusted certificate validation for deployed firmware and keep any test-only exception explicit. Requests to an untrusted or mismatched certificate must fail without sending credentials.

### A35 — High: Blocking telemetry delays firmware's local hazard alarm

**Evidence:** Source-confirmed; hardware timing not measured. [esp_code_integrated.ino:108](arduino/esp_code_integrated.ino#L108), [esp_code_integrated.ino:117](arduino/esp_code_integrated.ino#L117), [esp_code_integrated.ino:274](arduino/esp_code_integrated.ino#L274).

The loop reads sensors, performs synchronous network telemetry, and only then evaluates hazard branches and sounds the local alarm. The request has a 10,000 ms timeout. A slow/unresponsive server can therefore delay the local alarm for seconds and delay subsequent sensor sampling. The enhanced sketch also sends telemetry before evaluating local hazards.

**Fix / acceptance:** Evaluate and actuate local alarms before network work, and keep networking from blocking the safety loop. Test with the network unavailable and a stalled backend; measure the required alarm response time on hardware.

### A36 — Medium: Global input protection is mounted after the API routes

**Evidence:** Source-confirmed. [server.js:225](backend/src/server.js#L225), [server.js:257](backend/src/server.js#L257), [input-validation.middleware.js](backend/src/middleware/input-validation.middleware.js).

The server registers all application routers before calling `app.use(preventNoSQLInjection)`. Normal handlers send responses without continuing to this later middleware, so the claimed global protection never inspects their requests. Route-specific validation still exists in some paths, but the global safeguard does not protect those routes.

**Fix / acceptance:** Put required boundary checks before the protected handlers and validate expected types/operators at the actual query construction points. Verify that a rejected input never reaches its controller; avoid relying on a blacklist as the only query defense.

## 4. Verification results

| Check | Result |
| --- | --- |
| Backend syntax across all 329 tracked `.js` files | Pass; no syntax failures |
| Five isolated source behavior reproductions | All five reproduced current defects |
| Standard backend Jest command | 9 suites failed to load; 0 tests executed |
| Backend Jest with temporary VM-module option | Still blocked by missing native bcrypt binding in this audit install |
| Standard backend lint | Invalid configuration; exits before source checks |
| Backend lint with equivalent temporary JSON configuration | 32 errors, 108 warnings |
| Web Vitest, one-shot run | 2 failed, 4 passed; 1 failed file, 1 passed file |
| Web TypeScript, explicit no-emit check | 47 diagnostics |
| Web lint | Interactive setup prompt; no completed lint check |
| Flutter 3.35.4 analysis with locally resolved dependencies | 0 errors, 45 warnings, 2,761 informational diagnostics; nonzero exit |
| Flutter tests | Asset-bundle failure before tests execute |
| npm advisory scan | 63 affected package entries; see severity breakdown above |
| Final graph integrity and code-file coverage | 867/867 code files; no missing source paths, duplicate IDs, or dangling endpoints |

The initial offline npm install lacked cached packages. A subsequent authorized dependency download used `--ignore-scripts`. Flutter dependency resolution used the local cache and adjusted five SDK-pinned dependencies for the local SDK. The modified lockfile and generated Java registrar were restored byte-for-byte to their original tracked contents afterward. No source fixes, dependency upgrades, database migrations, or automated vulnerability fixes were applied.

An initial filesystem-only Dart import scan flagged 18 paths. Flutter and focused Dart analysis did not report those imports as errors. Those scanner results were excluded from confirmed findings rather than being presented as compiler failures.

Representative commands, run from the repository root unless otherwise stated:

```sh
npm test --workspace=backend -- --runInBand
npm run lint --workspace=backend
npm test --workspace=web -- --run
./node_modules/.bin/tsc --project web/tsconfig.json --noEmit --incremental false
npm run lint --workspace=web
npm audit --json
# In mobile/:
flutter pub get --offline
flutter analyze --no-pub
flutter test --no-pub
```

Detailed outputs are in [graphify-out/audit](graphify-out/audit/). They include compiler diagnostics, all analyzer warnings and informational diagnostics, test errors, backend lint results, dependency advisory details, graph validation, and the isolated reproduction script.

## 5. Recommended repair order

1. **Close trust-boundary failures:** A01–A06, A09–A12, A14, and A36. Start with public admin registration, then test existing ordinary/admin accounts across different schools.
2. **Protect emergency delivery and guidance:** A15–A17 and A33–A35. Confirm durable acknowledgments, retained retries, correct broadcast status, traversable routes, and prompt local alarms.
3. **Restore verifiable builds:** A26–A31. Supply assets, align the toolchain, fix the commands and mocks, and enforce type checks.
4. **Repair broken user flows:** A07–A08 and A18–A25. Cover provisioning, registration, exports, incident forms, analytics, and socket refresh.
5. **Reduce remaining exposure:** A13 and A32. Redact logs and update dependencies with focused compatibility checks.

Each security repair should include a denied-operation check that proves no state mutation or notification occurred. Each delivery repair should distinguish accepted, persisted, delivered, failed, and retriable states. Retest with two institutions and multiple roles before treating the shared authorization layer as repaired.

## 6. Diagnostic appendix

The sections below preserve individual TypeScript diagnostics, backend lint errors, Flutter warnings, and dependency package summaries. Full logs retain additional context and informational/style messages.

### TypeScript diagnostics (47)

```text
web/app/users/page.tsx(519,49): error TS2322: Type 'string' is not assignable to type '{ _id: string; name: string; }'.
web/components/alerts/IoTAlertModal.tsx(45,33): error TS2339: Property 'autoDismiss' does not exist on type 'IoTAlertData'.
web/components/alerts/IoTAlertModal.tsx(116,9): error TS2322: Type '{ children: Element; className: string; onClick: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & CardProps'.
web/components/alerts/IoTAlertModal.tsx(116,19): error TS7006: Parameter 'e' implicitly has an 'any' type.
web/components/incidents/HistoricalIncidentForm.tsx(263,33): error TS2304: Cannot find name 'isSummarising'.
web/components/incidents/HistoricalIncidentForm.tsx(263,51): error TS18048: 'formData.description' is possibly 'undefined'.
web/components/incidents/HistoricalIncidentForm.tsx(265,30): error TS18048: 'formData.description' is possibly 'undefined'.
web/components/incidents/HistoricalIncidentForm.tsx(266,25): error TS2304: Cannot find name 'setIsSummarising'.
web/components/incidents/HistoricalIncidentForm.tsx(268,72): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
web/components/incidents/HistoricalIncidentForm.tsx(279,27): error TS2304: Cannot find name 'setIsSummarising'.
web/components/incidents/HistoricalIncidentForm.tsx(283,24): error TS2304: Cannot find name 'isSummarising'.
web/components/landing/HowItWorks.tsx(98,18): error TS2322: Type '{ hidden: { opacity: number; x: number; }; visible: { opacity: number[]; x: number[]; transition: { duration: number; repeat: number; ease: string; repeatDelay: number; }; }; }' is not assignable to type 'Variants'.
web/components/landing/HowItWorks.tsx(138,18): error TS2322: Type '{ hidden: { opacity: number; x: number; }; visible: { opacity: number[]; x: number[]; transition: { duration: number; repeat: number; ease: string; repeatDelay: number; }; }; }' is not assignable to type 'Variants'.
web/components/landing/ScreenshotGallery.tsx(244,23): error TS2322: Type '{ hidden: { opacity: number; y: number; }; visible: { opacity: number; y: number; transition: { duration: number; ease: number[]; }; }; }' is not assignable to type 'Variants'.
web/components/landing/ScreenshotGallery.tsx(254,23): error TS2322: Type '{ hidden: { opacity: number; y: number; }; visible: { opacity: number; y: number; transition: { duration: number; ease: number[]; }; }; }' is not assignable to type 'Variants'.
web/components/landing/ScreenshotGallery.tsx(270,23): error TS2322: Type '{ hidden: { opacity: number; y: number; }; visible: { opacity: number; y: number; transition: { duration: number; ease: number[]; }; }; }' is not assignable to type 'Variants'.
web/components/teacher/ActivityTimeline.tsx(93,48): error TS18048: 'response.data' is possibly 'undefined'.
web/components/teacher/ActivityTimeline.tsx(145,50): error TS2304: Cannot find name 'Activity'.
web/components/teacher/ActivityTimeline.tsx(152,18): error TS2339: Property 'timestamp' does not exist on type 'ActivityLog'.
web/components/teacher/ActivityTimeline.tsx(218,67): error TS2552: Cannot find name 'Activity'. Did you mean 'activity'?
web/components/teacher/StudentPerformanceCard.tsx(61,7): error TS2322: Type '{ children: (false | Element)[]; className: string; onClick: (() => void) | undefined; }' is not assignable to type 'IntrinsicAttributes & CardProps'.
web/lib/api/analytics.ts(246,12): error TS18046: 'response.data' is of type 'unknown'.
web/lib/api/analytics.ts(258,12): error TS18046: 'response.data' is of type 'unknown'.
web/lib/api/analytics.ts(271,12): error TS18046: 'response.data' is of type 'unknown'.
web/lib/api/analytics.ts(283,12): error TS18046: 'response.data' is of type 'unknown'.
web/lib/api/analytics.ts(295,12): error TS18046: 'response.data' is of type 'unknown'.
web/lib/api/analytics.ts(306,12): error TS18046: 'response.data' is of type 'unknown'.
web/lib/api/classroom.ts(54,7): error TS2322: Type 'ApiResponse<unknown>' is not assignable to type 'ApiResponse<ClassroomQR>'.
web/lib/api/mlPredictions.ts(138,12): error TS18046: 'response.data' is of type 'unknown'.
web/lib/api/mlPredictions.ts(149,81): error TS2554: Expected 1 arguments, but got 2.
web/lib/api/mlPredictions.ts(150,27): error TS2339: Property 'data' does not exist on type '{}'.
web/lib/api/mlPredictions.ts(151,30): error TS2339: Property 'data' does not exist on type '{}'.
web/lib/api/mlPredictions.ts(165,78): error TS2554: Expected 1 arguments, but got 2.
web/lib/api/mlPredictions.ts(168,27): error TS2339: Property 'data' does not exist on type '{}'.
web/lib/api/mlPredictions.ts(169,30): error TS2339: Property 'data' does not exist on type '{}'.
web/lib/api/mlPredictions.ts(186,73): error TS2554: Expected 1 arguments, but got 2.
web/lib/api/mlPredictions.ts(187,27): error TS2339: Property 'data' does not exist on type '{}'.
web/lib/api/mlPredictions.ts(188,30): error TS2339: Property 'data' does not exist on type '{}'.
web/lib/api/mlPredictions.ts(202,12): error TS18046: 'response.data' is of type 'unknown'.
web/lib/api/mlPredictions.ts(214,27): error TS2339: Property 'data' does not exist on type '{}'.
web/lib/api/mlPredictions.ts(215,30): error TS2339: Property 'data' does not exist on type '{}'.
web/lib/api/students.ts(52,3): error TS2322: Type 'JoinClassResponse | undefined' is not assignable to type 'JoinClassResponse'.
web/lib/api/students.ts(61,3): error TS2322: Type 'LeaveClassResponse | undefined' is not assignable to type 'LeaveClassResponse'.
web/lib/api/users.ts(65,82): error TS2339: Property 'users' does not exist on type '{}'.
web/lib/api/users.ts(66,35): error TS2339: Property 'pagination' does not exist on type 'ApiResponse<unknown>'.
web/lib/api/users.ts(79,5): error TS2322: Type 'ApiResponse<unknown>' is not assignable to type 'ApiResponse<{ users: User[]; total: number; page: number; limit: number; }>'.
web/lib/store/auth-store.ts(264,40): error TS2339: Property 'user' does not exist on type '{ id: string; email: string; name: string; role: string; institutionId?: string | undefined; approvalStatus?: "pending" | "approved" | "rejected" | undefined; }'.
```

### Backend lint errors (32)

```text
backend/src/controllers/leaderboard.controller.js:65:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/controllers/leaderboard.controller.js:112:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/controllers/leaderboard.controller.js:127:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/controllers/leaderboard.controller.js:128:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/middleware/input-validation.middleware.js:19:14 no-control-regex: Unexpected control character(s) in regular expression: \x00, \x1f.
backend/src/services/ai.service.js:495:15 no-empty: Empty block statement.
backend/src/services/ai.service.js:536:19 no-empty: Empty block statement.
backend/src/services/badge.service.js:73:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/badge.service.js:96:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/badge.service.js:97:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/badge.service.js:98:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/badge.service.js:103:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/badge.service.js:104:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/badge.service.js:109:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/badge.service.js:117:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/badge.service.js:123:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/badge.service.js:131:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/badge.service.js:132:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/badge.service.js:143:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/badge.service.js:144:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/badge.service.js:149:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/badge.service.js:150:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/broadcast.service.js:128:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/broadcast.service.js:146:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/broadcast.service.js:164:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/broadcast.service.js:182:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/broadcast.service.js:638:124 no-undef: 'queued' is not defined.
backend/src/services/conflictResolution.service.js:267:7 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/conflictResolution.service.js:268:7 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/conflictResolution.service.js:300:7 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/notification.service.js:78:9 no-case-declarations: Unexpected lexical declaration in case block.
backend/src/services/notification.service.js:83:9 no-case-declarations: Unexpected lexical declaration in case block.
```

The 108 additional warnings are preserved in [backend-eslint.json](graphify-out/audit/backend-eslint.json). Most report unused declarations; they were not promoted to runtime bugs without an affected flow.

### Flutter warnings (45)

```text
warning • The declaration '_showLocalNotification' isn't referenced • lib/core/services/fcm_service.dart:133:16 • unused_element
warning • The value of 'refresh' should be used • lib/features/sync/screens/enhanced_sync_status_screen.dart:41:19 • unused_result
warning • The value of 'refresh' should be used • lib/features/sync/screens/enhanced_sync_status_screen.dart:42:19 • unused_result
warning • The value of 'refresh' should be used • lib/features/sync/screens/enhanced_sync_status_screen.dart:50:15 • unused_result
warning • The value of 'refresh' should be used • lib/features/sync/screens/enhanced_sync_status_screen.dart:51:15 • unused_result
warning • The value of 'refresh' should be used • lib/features/sync/screens/enhanced_sync_status_screen.dart:292:27 • unused_result
warning • The value of 'refresh' should be used • lib/features/sync/screens/enhanced_sync_status_screen.dart:397:23 • unused_result
warning • The value of 'refresh' should be used • lib/features/sync/screens/enhanced_sync_status_screen.dart:398:23 • unused_result
warning • The asset file '.env' doesn't exist • pubspec.yaml:123:7 • asset_does_not_exist
warning • The asset directory 'assets/Summary_ndrf/' doesn't exist • pubspec.yaml:125:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/module_quiz/' doesn't exist • pubspec.yaml:126:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/360image/' doesn't exist • pubspec.yaml:127:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/fonts/' doesn't exist • pubspec.yaml:128:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/audio/' doesn't exist • pubspec.yaml:129:7 • asset_directory_does_not_exist
warning • The asset file 'assets/quiz/quiz_eng.json' doesn't exist • pubspec.yaml:132:7 • asset_does_not_exist
warning • The asset file 'assets/quiz/quiz_hin.json' doesn't exist • pubspec.yaml:133:7 • asset_does_not_exist
warning • The asset file 'assets/quiz/quiz_mar.json' doesn't exist • pubspec.yaml:134:7 • asset_does_not_exist
warning • The asset file 'assets/quiz/quiz_pun.json' doesn't exist • pubspec.yaml:135:7 • asset_does_not_exist
warning • The asset directory 'assets/images/Background/' doesn't exist • pubspec.yaml:138:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/images/Player/Boy/' doesn't exist • pubspec.yaml:139:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/images/Player/Girl/' doesn't exist • pubspec.yaml:140:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/images/Fire Wall/' doesn't exist • pubspec.yaml:143:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/images/obsticles/' doesn't exist • pubspec.yaml:144:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/images/object to collect/' doesn't exist • pubspec.yaml:145:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/images/Water wall/' doesn't exist • pubspec.yaml:146:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/doremon/EARTHQUAKE/English/' doesn't exist • pubspec.yaml:149:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/doremon/EARTHQUAKE/Hindi/' doesn't exist • pubspec.yaml:150:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/doremon/FLOOD/English/' doesn't exist • pubspec.yaml:151:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/doremon/FLOOD/Hindi/' doesn't exist • pubspec.yaml:152:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/doremon/FIRE/English/' doesn't exist • pubspec.yaml:153:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/doremon/FIRE/Hindi/' doesn't exist • pubspec.yaml:154:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/shinchan/earthquake/English/' doesn't exist • pubspec.yaml:157:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/shinchan/earthquake/Hindi/' doesn't exist • pubspec.yaml:158:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/shinchan/flood/English/' doesn't exist • pubspec.yaml:159:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/shinchan/flood/Hindi/' doesn't exist • pubspec.yaml:160:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/shinchan/fire/English/' doesn't exist • pubspec.yaml:161:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/shinchan/fire/Hindi/' doesn't exist • pubspec.yaml:162:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/edusafe/earthquake/English/' doesn't exist • pubspec.yaml:165:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/edusafe/earthquake/Hindi/' doesn't exist • pubspec.yaml:166:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/edusafe/flood/English/' doesn't exist • pubspec.yaml:167:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/edusafe/flood/Hindi/' doesn't exist • pubspec.yaml:168:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/edusafe/fire/English/' doesn't exist • pubspec.yaml:169:7 • asset_directory_does_not_exist
warning • The asset directory 'assets/Mod_game/edusafe/fire/Hindi/' doesn't exist • pubspec.yaml:170:7 • asset_directory_does_not_exist
warning • The asset file 'assets/360image/Classroom_360.png' doesn't exist • pubspec.yaml:173:7 • asset_does_not_exist
warning • The asset file 'assets/images/branding/kavach_logo.jpeg' doesn't exist • pubspec.yaml:174:7 • asset_does_not_exist
```

The 2,761 informational diagnostics are retained in [flutter-analysis.log](graphify-out/audit/flutter-analysis.log). These include style, deprecated API, and dependency-declaration diagnostics; they are not 2,761 confirmed runtime bugs.

### npm package advisory summary (63 package entries)

Registry results are time-dependent. Direct means a declared workspace dependency; indirect means a dependency of another package. A package can inherit its severity from another vulnerable package.

| Package | Severity | Relationship |
| --- | --- | --- |
| @babel/core | low | Indirect |
| @google-cloud/firestore | moderate | Indirect |
| @google-cloud/storage | moderate | Indirect |
| @grpc/grpc-js | high | Indirect |
| @mapbox/node-pre-gyp | high | Indirect |
| @next/eslint-plugin-next | high | Indirect |
| @protobufjs/utf8 | moderate | Indirect |
| @tootallnate/once | low | Indirect |
| @vitest/ui | critical | Direct |
| ajv | moderate | Indirect |
| axios | high | Direct |
| bcrypt | high | Direct |
| body-parser | moderate | Indirect |
| brace-expansion | high | Indirect |
| browserslist | high | Indirect |
| dompurify | moderate | Indirect |
| engine.io | high | Indirect |
| engine.io-client | moderate | Indirect |
| esbuild | moderate | Indirect |
| eslint-config-next | high | Direct |
| exceljs | moderate | Direct |
| express | high | Direct |
| fast-xml-parser | critical | Indirect |
| fflate | moderate | Indirect |
| firebase-admin | moderate | Direct |
| flatted | high | Indirect |
| follow-redirects | moderate | Indirect |
| form-data | high | Indirect |
| gaxios | moderate | Indirect |
| glob | high | Indirect |
| google-gax | moderate | Indirect |
| ip-address | high | Indirect |
| js-yaml | high | Indirect |
| jspdf | critical | Direct |
| jws | high | Indirect |
| lodash | high | Indirect |
| minimatch | high | Indirect |
| mongoose | high | Direct |
| nanoid | high | Indirect |
| next | high | Direct |
| node-forge | high | Indirect |
| nodemailer | high | Direct |
| path-to-regexp | high | Indirect |
| picomatch | high | Indirect |
| postcss | high | Direct |
| postcss-selector-parser | low | Indirect |
| protobufjs | critical | Indirect |
| protocol-buffers-schema | moderate | Indirect |
| qs | moderate | Indirect |
| retry-request | moderate | Indirect |
| rollup | high | Indirect |
| sharp | high | Direct |
| socket.io-adapter | moderate | Indirect |
| socket.io-parser | high | Indirect |
| tar | critical | Indirect |
| teeny-request | moderate | Indirect |
| tmp | high | Indirect |
| uuid | moderate | Direct |
| vite | high | Indirect |
| vite-node | moderate | Indirect |
| vitest | critical | Direct |
| websocket-driver | critical | Indirect |
| ws | high | Indirect |

Consult [npm-audit.json](graphify-out/audit/npm-audit.json) for exact advisory conditions before deciding that a listed vulnerability is reachable.
