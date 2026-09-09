# Web UI/UX Enhancement Plan

**Project:** Kavach / EduSafe web application  
**Prepared:** 9 September 2026  
**Source baseline:** Git commit `869607b`; source inspected directly after reviewing the supplied image folder.  
**Screenshot folder:** [web/public/gallery/web](web/public/gallery/web/) — 18 PNG files.  
**Status:** Implementation specification only. This task does not change application code.  
**Companion:** [Mobile UI/UX Enhancement Plan](MOBILE_UI_UX_ENHANCEMENT_PLAN.md).

## 1. Purpose, scope and evidence

This document describes how to improve the existing web application so another developer or coding model can distinguish the current product from the required result. It covers every supplied web image, its actual route, supporting components, required behavior, data dependencies and acceptance checks.

The desired product is a clear institutional workspace: teachers manage classes and learning; parents inspect their children's reported status and progress; administrators inspect institution-wide operations and reliable analytics. Routine educational activity, live emergency information, historical reports and disconnected services must remain distinguishable.

### 1.1 Evidence categories

| Category | Meaning |
| --- | --- |
| **Observed** | Visible in the supplied PNG. It is evidence of that captured build, not necessarily the current source. |
| **Verified** | Read in the current source. File/line references refer to the baseline above. |
| **Required** | Proposed implementation behavior. It is not already implemented simply because it appears here. |
| **Dependency** | Supporting API, service, data or content work needed to make a UI claim true. |
| **Deferred** | Optional enhancement outside the initial release of this plan. |

Priorities: **P0** means misleading information or a broken consequential interaction; **P1** means core usability, accessibility and consistency; **P2** means convenience after the foundations are correct.

### 1.2 Method and limitations

- All 18 files were opened and visually inspected individually. They contain teacher, parent and administrator views, including multiple states of the same route.
- Graphify was queried for navigation, then actual pages, components, clients and relevant backend contracts were inspected. All 152 web source entries in the existing graph source manifest matched their current file hashes. This does not prove every graph relationship or runtime behavior is correct.
- Existing gallery captions are not reliable route evidence: several disagree with the pixels. The corrected screenshot inventory below is the source of truth for this plan.
- No browser session, network request to the deployed product, fresh web build or automated application test was run for this document-only task. Runtime behavior inferred from code must be exercised during implementation.
- Uploaded screenshot dimensions are image pixels, not a verified CSS viewport/browser zoom configuration. Layout targets below are proposed CSS sizes.
- Historical analytics shown in images have partly been removed from current code. Do not reconstruct unsupported statistics to match an older screenshot.
- Names, emails, class codes and QR payloads in images are incidental evidence. Use anonymized fixtures in future tests and public before/after illustrations. Keep original evidence unchanged during this planning task.
- The earlier [audit fixes](AUDIT_FIXES.md) remain constraints, but their passing checks do not certify all newly inspected flows. Preserve authentication, approval, tenant isolation, verified relationships and disabled unverified evacuation routing.

### 1.3 Included and excluded work

Included: authenticated shared shell; general dashboard; teacher classes, QR, approvals, class detail and analytics; drills and scheduling; broadcasts; scenario learning; map; parent verification/dashboard and connected child flows; administrator analytics; devices and telemetry; shared forms, tables, dialogs and responsive states.

The landing page, public marketing copy and authentication screens are not pictured and are not receiving a full redesign here. Their shared-component regressions still need testing. The only direct landing-page item is correcting the captions of these supplied screenshots. Other sidebar destinations remain reachable; an unpictured feature does not become a deletion candidate.

## 2. Complete screenshot-to-code inventory

| ID / evidence link | Actual view | Primary implementation | Main observed issue |
| --- | --- | --- | --- |
| W01 — [teacher-1.png](web/public/gallery/web/teacher-1.png) | General dashboard, teacher session | `web/app/dashboard/page.tsx`; dashboard chart components | Admin heading for teacher, System Active beside Disconnected, large decorative blocks, unexplained Safety Score |
| W02 — [teacher-2.png](web/public/gallery/web/teacher-2.png) | My Classes | `web/app/teacher/classes/page.tsx` | Duplicated class codes, repeated large controls, expiry not presented as a usable state |
| W03 — [teacher-3.png](web/public/gallery/web/teacher-3.png) | Class detail, Drills tab | `web/app/teacher/classes/[classId]/page.tsx` | Huge empty panel, three equally prominent quick-start controls, unclear scope hierarchy |
| W04 — [teacher-4.png](web/public/gallery/web/teacher-4.png) | Same class detail after QR generation | Same class detail route, QR success block | Small QR at far edge of wide banner; no coherent sharing surface |
| W05 — [teacher-5.png](web/public/gallery/web/teacher-5.png) | Teacher Analytics, Overview | `web/app/teacher/analytics/page.tsx` | Mixed units in a chart, large panels, weak explanation of metrics |
| W06 — [teacher-6.png](web/public/gallery/web/teacher-6.png) | Teacher Analytics, Students | Same analytics page; `StudentPerformanceCard` | Repeated nested metric boxes, 0/0 and Never states, high card density without useful comparison |
| W07 — [teacher-7.png](web/public/gallery/web/teacher-7.png) | Teacher Analytics, Performance | Same analytics page; `ProgressChart` | Area chart across student names called a trend, mixed count/score measures |
| W08 — [teacher-8.png](web/public/gallery/web/teacher-8.png) | Drill Management, Active | `web/app/drills/page.tsx` | Very old starts labeled in progress, weak class/context identification, wide sparse rows |
| W09 — [teacher-9.png](web/public/gallery/web/teacher-9.png) | Drill Management, History | Same drill route | Creation/scheduling language instead of clear completion context; repetitive full-width rows |
| W10 — [teacher-10.png](web/public/gallery/web/teacher-10.png) | Broadcast history | `web/app/broadcast/page.tsx` | Competing colored counts, Sent versus Delivered ambiguity, oversized history entries |
| W11 — [teacher-11.png](web/public/gallery/web/teacher-11.png) | Scenario, choice step | `web/app/scenario/page.tsx` | Sparse reading view without clear step/state structure; shell overwhelms learning task |
| W12 — [teacher-12.png](web/public/gallery/web/teacher-12.png) | Map, fallback provider | `web/app/map/page.tsx` | Environment-variable instructions in product UI; Delhi map presented beneath institution-specific wording |
| W13 — [parent-14.png](web/public/gallery/web/parent-14.png) | Verify Student | `web/app/parent/verify-student/page.tsx` | Paste versus scan wording conflict, large empty result panel, role-wrong header |
| W14 — [parent-15.png](web/public/gallery/web/parent-15.png) | Parent Dashboard | `web/app/parent/dashboard/page.tsx` | Old timestamps next to Safe, internal class codes, repeated shortcuts and large cards |
| W15 — [admin-16.png](web/public/gallery/web/admin-16.png) | Institution analytics, upper Drill Analytics view | `web/app/analytics/page.tsx` | Title, filter and tile tabs consume most of first viewport |
| W16 — [admin-17.png](web/public/gallery/web/admin-17.png) | Same analytics, lower drill charts | Same analytics page | Historical distribution/performance numbers need provenance; sidebar/body scroll mismatch |
| W17 — [admin-18.png](web/public/gallery/web/admin-18.png) | Devices, All Devices | `web/app/devices/page.tsx` | Sensor subset repeated in full table; active label beside old telemetry time |
| W18 — [admin-19.png](web/public/gallery/web/admin-19.png) | Scenario, outcome/end state | `web/app/scenario/page.tsx` | Long outcome blocks, narrative under Your safety score, no compact learning debrief |

There is no `teacher-13.png` in the supplied directory. Do not invent a missing screen to make filenames sequential.

### 2.1 Caption corrections

`web/components/landing/ScreenshotGallery.tsx` mislabels several images. Correct its labels when this plan is implemented: teacher-4 is class QR generation, teacher-6 is analytics Students, teacher-7 is analytics Performance, teacher-9 is drill History, teacher-10 is Broadcast, teacher-12 is Map, admin-16 is Analytics, and admin-19 is Scenario outcome. These labels also supply image alternative text. Keep filenames stable unless every caller is updated; no image regeneration is needed.

### 2.2 Current-code differences from screenshots

- Current `web/app/map/page.tsx:256` passes **“Map & Blueprint”** to Header; the screenshot's Admin Dashboard heading is older. Most other pictured routes still use Header's default.
- Current admin analytics uses **Average Drill Score** from `avgScore`, rather than the screenshot's Safety Score wording.
- Current admin analytics explicitly reports **“Drill type breakdown unavailable”** where W16 shows a pie chart and per-type percentages. Keep that honest state until supported data exists.
- Web parent status reads `.status` correctly. The mobile `.safetyStatus` parsing mismatch must not be copied into a web finding.
- Web child-management search already stays visible for no results; the mobile disappearing-search defect does not apply here.
- Web Add Child already consumes `autoVerified`; the mobile verification/link response mismatch is not a web implementation gap.

## 3. Product direction and non-negotiable rules

### 3.1 Target experience

1. Every page states its actual task, role and institution context.
2. Teachers see pending work and their classes before decorative institutional totals.
3. Parents see reported child status with provenance/time, then learning progress; low preparedness never means a child is currently unsafe.
4. Operational state is explicit: successful fetch, no records, failed fetch, stale record, disconnected updates and unknown data are different.
5. Charts answer a defined question with one understandable unit and scope. Missing data does not become zero or a fake trend.
6. Consequential actions have an exact target and result: approve a request, start a drill, send a broadcast, or update a real incident. The interface does not imply delivery or resolution without supporting evidence.

### 3.2 Preserve existing implementation

Keep Next.js App Router, React, TypeScript, Tailwind, Zustand, existing API clients, Lucide icons and Recharts. Reuse `components/ui` and the current branding component. Do not add a new UI framework, router, dashboard template or chart library. TanStack Query is installed, but installation alone is not evidence of an existing application provider; do not force a cross-repository fetching migration to fix a few response races.

Keep current URLs and server authorization. Role-correct navigation is not a substitute for backend access checks. Preserve public versus authenticated layouts, teacher ownership, parent-child verification and account approval. Do not reintroduce fabricated analytics or disabled geographic/floorplan evacuation routes.

### 3.3 Brand continuity

Use **Kavach** as the existing web product name and the existing K.A.V.A.C.H logo component. The mobile plan retains EduSafe as its existing title. Treat them as current labels in the same project; do not silently rename both products or package/API identifiers. Use consistent status language, colors and spacing across the two plans. A complete brand rename is a separate product decision.

The provided teacher/parent and admin captures show different logo artwork. Use `components/branding/KavachLogo.tsx` with `lib/branding/logo-config.ts` as the single source for web slots; verify readability at sidebar size rather than copying an image into every page.

## 4. Shared shell, navigation and connection status — all images

### 4.1 Verified implementation

- `components/layout/header.tsx:18` defaults its title to **Admin Dashboard**; most pages render `<Header />` without a title. Root metadata also says Kavach - Admin Dashboard for all routes.
- Pages repeat their own Sidebar/Header/aside/main markup. Some use a fixed-height internal scroller; others scroll the document. This explains an implementation risk behind inconsistent sidebar/body behavior, though a screenshot alone cannot prove every scroll bug.
- The sidebar is hidden below `md` in multiple pages without a corresponding mobile menu in the inspected shared header.
- Sidebar navigation is a flat role-filtered list; parents see both Dashboard and Parent Dashboard. Active matching uses raw prefix matching, without an explicit path-segment boundary or `aria-current`.
- The root layout already supplies a Skip to main content link. The covered pages do not provide its matching `main-content` ID.
- Header polls socket state every two seconds, and manual reconnect requires an institution ID. No institution means Reconnect can do nothing without explanation.
- Several pages connect to the singleton socket independently; Dashboard disconnects on unmount. A fresh deep link or route transition therefore needs lifecycle verification, not a cosmetic green badge.

### 4.2 Required shell layout

```text
Desktop
┌ Navigation, 240px ┬ Context header: role/institution · Live updates state ┐
│ Grouped links    │ Breadcrumbs / actual page title / primary action     │
│                  │ Filters and task content                            │
│                  │ One main content scroll region                      │
│ Account / logout │                                                     │
└──────────────────┴─────────────────────────────────────────────────────┘

Narrow screen
[Menu] [Current section] [compact updates state]
Actual page title
Primary action / filters, wrapping vertically
Content
```

**Implementation choice:** extract one small shared authenticated shell from the repeated markup, for example a proposed `web/components/layout/app-shell.tsx`. This is a proposed new file, not an existing component. It receives page context/content and reuses Header/Sidebar. Migrate the pictured pages in batches; do not reorganize every route directory into new route groups at once.

Use a desktop sidebar with its own navigation scroll and a stable account footer. Make content width flexible with `min-width: 0`. Keep one deliberate main scroller; avoid nesting a viewport-height page inside another viewport-height page. Add `id="main-content"`, a focusable skip target and scroll offset below any sticky header. The shell's semantic context heading must not precede or duplicate every page's H1 unnecessarily.

On narrow viewports, provide a labeled menu button and accessible dismissible navigation drawer. Close it after route selection, on Escape and on explicit Close; restore focus. Offscreen links must not remain tabbable. Preserve usable navigation at browser zoom and on short laptop windows.

### 4.3 Proposed role navigation groups

| Role | Group | Existing destinations to retain |
| --- | --- | --- |
| Teacher | Overview | Dashboard |
| Teacher | Teaching | My Classes, Teacher Analytics, Parents, QR Generator |
| Teacher | Safety operations | Drills, Devices, Broadcast, Map |
| Teacher | Content and account | Templates, Resources, Disaster Scenario, Users where authorized, My Profile |
| Parent | Family | Parent Dashboard, Manage Children, Verify Student, Notifications |
| Parent | Account and place | Parent Profile, authorized Map |
| Admin / SYSTEM_ADMIN | Overview | Dashboard, Analytics, Reports where authorized |
| Admin / SYSTEM_ADMIN | Operations | Crisis Command, Incidents, Drills, Devices, Broadcast, Map |
| Admin / SYSTEM_ADMIN | People and content | Users, Admin Users, Parents, All Classes, Templates, Resources, Disaster Scenario, My Profile as authorized |

Remove the parent's duplicate generic Dashboard navigation choice; route any retained `/dashboard` parent entry deliberately to the parent dashboard without fetching unrelated institutional data. Do not infer extra SYSTEM_ADMIN access from a desired menu grouping: preserve the server's role/scope contract. If a route is restricted, display the correct access state instead of broadening permission for visual consistency.

Set page title from explicit page context: My Classes, Class name, Teacher Analytics, Drill Management, Broadcasts, Map, Verify Student, Parent Dashboard, Institution Analytics and Devices. Browser/document titles should be equally descriptive. Use segment-aware matching and one current navigation item, with `aria-current="page"` on the appropriate link.

### 4.4 Connection and notification semantics

| Condition | Required wording/behavior |
| --- | --- |
| Auth not yet hydrated | Initializing; do not flash Disconnected as a known outage |
| Socket connected | “Live updates connected”; not “System safe” |
| Socket disconnected, API data succeeded | “Live updates disconnected” and actual last data fetch time |
| Reconnecting | Pending state driven by connection result, not only a fixed timeout |
| Institution not assigned/selected | Explain the missing context; do not offer a no-op Reconnect |
| API request failed | Section-specific failure even if socket is connected |
| Notification permission denied | In-app updates remain usable; permission state does not prove transport failure |

Give authenticated socket lifecycle one owner that survives relevant page transitions. A small client boundary mounted from the root layout can own it while checking authenticated identity and route context; do not connect on public pages or for unavailable institution context. Pages subscribe/unsubscribe their own handlers without disconnecting other consumers. Clean up on account/institution changes and logout. Avoid accumulating duplicate event handlers or replaying one alert as several modals.

Remove the unconditional System Active badge from the dashboard. Display real incident state separately. Sound/browser notification permission should be explained and user-controlled; visual text must remain sufficient. Closing an alert notification is not resolving its incident or confirming that a person is safe.

## 5. Visual system, component contracts and accessibility

### 5.1 Use the existing token layers

Sources: [globals.css](web/app/globals.css), [Tailwind configuration](web/tailwind.config.js), [design tokens](web/lib/design-system/tokens.ts), and [shared UI components](web/components/ui/).

CSS variables/Tailwind semantic classes should own rendered colors. The TypeScript tokens describe dimensions and related constants; do not create another independent palette that pages ignore. Existing `Button` hard-codes blue, while many pages hard-code gradients and multiple status colors. Replace those defaults with semantic classes before restyling callers. Check marketing/login callers before changing global defaults.

| Token/element | Proposed target | Implementation rule |
| --- | --- | --- |
| Primary action | `#216E39` with white foreground | Align with the mobile plan; retain blue as an informational/chart color |
| Canvas / surface | `#F6F8F7` / `#FFFFFF` | Calm reading surface; remove animated full-page gradients |
| Primary / secondary text | `#17221B` / `#526057` | Secondary information remains legible |
| Sidebar | Existing deep navy family | Preserve recognizable navigation; increase low-contrast label readability as measured |
| Status unknown | Neutral text/icon and explicit label | Never green by default |
| Pending / caution | Dark amber on pale amber | Include explanatory text |
| Error / urgent | `#B3261E` with appropriate light container | Reserve for errors/real urgent context, not ordinary low learning scores |
| Main title | 28–32px equivalent in rem, semibold | One H1; wrap without pushing actions out of view |
| Section title / card title | 20px / 16–18px equivalent | Clear hierarchy without uppercase everywhere |
| Body / metadata | 16px / 14px equivalent | Critical values and statuses do not use tiny 10px text |
| Page gutters | 16px narrow, 24px ordinary, 32px wide | One owner; avoid cumulative padding across shell and page |
| Spacing | 4, 8, 12, 16, 24, 32px | Eliminate unneeded nested large panels |
| Card | 16–24px padding; 12–16px radius; subtle border/shadow | Content height, not a fixed empty dashboard tile |
| Buttons/inputs | 44px minimum product target; 48px touch/urgent actions | Label wraps or layout adapts; do not shrink to fit |
| Table row | Approximately 52px at ordinary density | Grow for wrapping and zoom; no clipped status explanations |
| Reading width | About 720px for scenario/form reading | Operations tables can use the available wider area |

These are proposed values, not contrast measurements of the screenshots. Adopt 4.5:1 for ordinary text and 3:1 for qualifying large text; verify actual states and color pairs. [W3C text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

The 44/48px sizes are this product's usability targets, not a claim that WCAG 2.2 requires 44px for every control. WCAG's minimum target criterion uses 24 CSS pixels with exceptions/spacing rules. [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

### 5.2 Shared primitives to improve

| Existing primitive | Required change |
| --- | --- |
| `components/ui/button.tsx` | Semantic colors, `type` appropriate to context, operation-specific pending labels, stable width, accessible busy state |
| `components/ui/input.tsx` and labels | Actual `id`/`htmlFor`, helper/error linkage, clear invalid state, no placeholder-only labels |
| `components/ui/card.tsx` | Keep container semantics; use real Link/button for actions rather than clickable div-only cards |
| `components/ui/modal.tsx` | Initial focus, contained keyboard focus, Escape/Close, focus restoration, inert background and unique title IDs |
| `components/ui/empty-state.tsx` / `loading-skeleton.tsx` | Separate first load, failed load, genuine empty and filtered empty |
| `components/ui/toast.tsx` | Announce noncritical feedback without stealing focus; persistent inline errors for actions that need recovery |
| Existing chart components | Unit/scope metadata, readable chart labels, data table/summary alternative, distinct unavailable states |
| Shared Header/Sidebar | Correct page context, mobile navigation, connection states and accessible active links |

Current Modal declares dialog semantics but does not implement complete focus/keyboard behavior. Repair that component or use a browser-native dialog through its existing API after compatibility checks. Modal focus stays inside until closed, and returns to the trigger. Do not mark a panel modal while allowing keyboard interaction behind it. [WAI dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

For in-page tabs, implement associated tablist/tab/tabpanel semantics, selected state, arrow-key focus movement and Enter/Space activation where panel loading makes manual activation appropriate. Use ordinary navigation links for navigation between URLs. Do not apply tab semantics to unrelated toolbar buttons. [WAI tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

### 5.3 Responsive behavior

- At 1280+ CSS width: full sidebar, compact toolbar, two chart columns when labels remain readable, and tables for comparisons.
- From 768–1279: allow fewer columns and wrapping toolbars; choose drawer navigation where sidebar plus content cannot fit usefully. Do not preserve three giant cards at the cost of horizontal page scrolling.
- Below 768: drawer navigation, one main content column, stacked form labels/actions, cards or a scrollable table region with a visible alternative detail view.
- Test reflow at 320 CSS pixels and 400% zoom equivalents. Necessary two-dimensional content such as a map/table can have its own scrolling region; the whole application shell must still reflow. [W3C reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- Tables need captions/headers, named sort controls and full accessible values. Use native tables, not `role="grid"`, unless genuine spreadsheet-style keyboard interaction is implemented.
- Avoid hiding useful columns without another way to inspect them. Put lower-priority identifiers in row details rather than forcing all users to read them.
- Sticky page/section headers must not cover focused inputs, anchors, tab labels or chart controls at zoom.

### 5.4 Theme, motion and language

`useTheme` and `useAccessibility` exist but their hooks were not found called by the inspected web source. Do not claim their existence means settings apply globally. Connect preferences once, respect OS reduced motion and retain visible keyboard focus. Do not expose the existing hide-focus option as a usability feature.

`globals.css` defines a `.font-medium` font-size preference name that overlaps a common Tailwind weight utility name. Use an explicit root preference class to prevent unrelated weighted text from inadvertently receiving a size override. Keep browser zoom enabled. Avoid full-page animation, animated metric counting for urgent statuses and chart motion that repeatedly restarts on polling.

Root HTML currently uses English; tip language buttons change content only. Initial enhancement copy can remain English with working existing tip-language choices. A full translated web interface is **P2** and needs explicit string ownership, translated resources and `lang` updates; do not imply the mobile localization implementation already provides this. Preserve Hindi/Marathi scripts with appropriate fallback fonts. Keep content language and interface language separate.

## 6. General dashboard — W01

### 6.1 Verified problems beyond appearance

`web/app/dashboard/page.tsx` shows System Active unconditionally. `loadData` catches errors without a page-level failure state, leaving arrays that can imply zero records and All Clear. `scheduledDrills` at line 335 filters completed rather than scheduled drills. The Safety Score at line 609 is calculated from drill count divided by ten, capped at 100; it is not a preparedness or safety measurement.

`DrillPerformanceChart` buckets records by `createdAt` and their current status. This is not a historical time series of completion events or evacuation performance. The current dashboard also mixes live and persisted SOS items; status-changing actions need identifiable authorized targets and verified success rather than removing a row optimistically without a trustworthy result.

### 6.2 Required layout

```text
Dashboard · [role and real institution scope]
Action needed [only actual pending approvals / active drill / incident]

Compact summary: drills in scope · active drills · completed drills
Live updates state and last successful data fetch

Teacher: My classes / pending requests / upcoming drills
Administrator: real active incidents and operational summaries

Drill activity [accurately named chart or list]
Alert records [actual scope, including empty/error state]
Safety tip [secondary placement, correct date/language]
```

- Remove the arbitrary Safety Score. Replace it with a factual count only if the data supplies a useful distinct measure; otherwise use fewer cards. Do not replace it with a different invented percentage.
- Label completion rate with its denominator and date/scope. Correct the scheduled filter using the normalized drill status contract in §10.
- Distinguish **No active alert records returned** from a safety guarantee. On failed load say **Alert status unavailable**, retaining prior data with its timestamp if present.
- Render genuine active SOS/incident context before educational summaries. A manual dismissal does not mark a person safe or resolve a persisted incident.
- A teacher dashboard must emphasize assigned work. Keep role-specific content inside the existing dashboard entry rather than maintaining another duplicate shell.
- Make cards clickable only where a real drilldown exists. Remove hover pointer/scale from decorative metrics.
- Move the safety tip below essential work. The effect already ignores cancelled tip results, but the selected chip changes before successful new content arrives; keep the displayed language tied to its actual content, and preserve it on failure. Label old content Safety tip with its date, not Today's tip.
- Use separate request/error states for independent sections. A failed alerts request must not erase a successful drill list. Throttle/batch telemetry-driven refresh rather than refetching the entire page on every sample.

### 6.3 Chart requirements

For the existing created-date aggregation, use a title such as **Drills created in the last 30 days, grouped by current status** and count units. If the target is completions over time, change the service/data selection to verified completion timestamps. Do not silently label creation counts as performance. Use bars for discrete daily counts or a simple line with explicit scope; preserve real zero days only inside a known complete reporting interval. Provide an accessible table and a genuine empty-period state.

**Acceptance:** teacher does not see an Admin page title; failed alerts never say All Clear; ten drills never imply 100% safe; scheduled count is correct; each metric/graph has defined source, unit and scope; updates do not interrupt reading or duplicate notifications.

## 7. My Classes and classroom QR sharing — W02 and W04

### 7.1 Verified source

`web/app/teacher/classes/page.tsx:214` renders class cards with the code twice, multiple colored panels and three broad actions. Pending requests are fetched sequentially and a failed count becomes zero. Failed class loading can become an apparent empty list. Approved Students uses roster `studentIds.length`, which does not establish verified approval count.

Clipboard feedback precedes awaiting `navigator.clipboard.writeText` at line 155. QR existence controls Generate/Regenerate wording without evaluating expiry. The list does not show a generated image; class detail shows a 96px QR only after generating it in that page session.

### 7.2 Required class cards and states

- Page heading: **My classes**, with search/filter only where useful for the real list size. The primary content is each assigned class's name, grade/section, school if needed, roster count and genuine pending count.
- Show the class code once in a compact copyable row. Internal IDs are secondary detail, not the class subtitle.
- Primary action: **Open class**. Secondary: **Share join code**. Pending approvals link appears with a real nonzero count or an explicit unknown/error state, not a fake zero.
- Use one or two compact card rows rather than nested tutorial panels in every class. Explain the joining process once in the share dialog.
- On initial error, keep Retry and a clear error; on background error retain the last successful list. “No classes assigned” appears only after a successful empty result.
- Await clipboard completion. Announce Copied only on success; if denied/unavailable, keep selectable code and explain manual copying.

### 7.3 Required join-code dialog

```text
Share class join code                         [Close]
Class name · school
[Actual QR, sufficiently large with quiet zone]
Class code                                   [Copy]
Valid until [actual time and timezone] / Expired
Students sign in and request access; approval still applies
[Download/Print, only if implemented] [Generate/Replace]
```

Use the actual server response: QR code/string/image, expiry and nested class. `web/lib/api/classroom.ts:38` currently models a different shape and omits image/string/class. Normalize it once before using typed UI state. Keep QR token values out of debug logs and generic error displays; they are not decorative identifiers.

The backend persists the QR hash/expiry, while the original QR string/image is returned during generation. After reload, the current client cannot assume it can retrieve the original image. Show **Join QR not available in this session** with the actual known expiry and an explicit Generate action, or implement authenticated retrieval/persistence as a separate dependency. Do not encode a stored hash as if it were the original QR, silently generate a new code just by opening Share, or promise cross-session QR availability without supporting storage.

The backend currently generates a seven-day expiry. Use the returned value, not a new UI-only deadline. Evaluate valid/expired/unknown separately. Preserve image quiet zone and enough contrast for scanning. Print/download must create an actual artifact or be omitted; no “coming soon” primary controls.

**Critical dependency:** `backend/src/services/classroom-join.service.js:115` can accept a JSON QR based on class ID without comparing it to the current token/version. Regeneration and nullable expiry do not prove old printouts are invalid. Before promising **Replace invalidates the old QR** or adding a Revoke control, enforce current-token/version and expiry verification server-side. If not implemented yet, use honest Generate wording and do not imply revocation. Classroom join QR, student login QR and parent verification code remain different types.

**Acceptance:** one visible class code; clipboard failures are honest; pending count failure is not zero; actual QR available in a coherent dialog; expiry is evaluated; old-code replacement/revocation guarantees appear only after server regression tests prove them; teacher ownership and approval remain enforced.

## 8. Class detail, roster, approvals and class drills — W03/W04

### 8.1 Required structure

Use breadcrumbs **My classes / Class name**, a compact grade/section/class-code header and Share join code. Preserve existing tabs as **Requests, Students, Learning progress, Drills** with accurate counts, accessible tab behavior and durable URL/query state for the selected tab. W03/W04 show a selected Drills tab; the current default is Pending, so do not assume Drills is always the landing tab.

For eligible KG–4 classes, preserve the existing conditional **Roster Students** tab or an explicitly labeled subsection under Students, including **Add roster student**. Keep `roster_record` children distinct from login-capable accounts; this layout change must not remove teacher-led roster management or create login credentials for those children.

Render QR sharing in the dialog from §7 instead of expanding a full-width banner that pushes all class work below the fold. Keep a small success message near its trigger when generated.

### 8.2 Correct data before interpreting an empty roster

The class-detail roster filters `approvalStatus` and `userType` at line 123, but `backend/src/services/teacher.service.js:47` omits these from the populated student projection. Correct the minimal response projection and client type, or rely on an endpoint with an explicit approved-roster contract. Do not present an empty class because required filter fields were missing.

The class-detail approval and standalone approval pages use different endpoint/identifier flows. Keep request IDs distinct from student IDs. Replace browser `alert`/`prompt` interaction with contextual approve/reject controls, rejection reason where required, row-specific pending state and recovery. A network failure must not become **All students processed**. Keep rows until server success; no new bulk approval feature is required.

### 8.3 Class drill panel

- Show existing drills with actual status, target participants, start/scheduled time and one details link.
- Replace three huge immediate-start color bars with a compact **Start practice drill** action that selects type and reviews the target class. Keep **Schedule drill** as a secondary action.
- Review screen names class, drill type, audience and the consequence of starting now. The confirmation is for a consequential action, not for ordinary browsing. A single explicit final Start is enough; avoid a slow wizard.
- Disable duplicate submission and retain input on failure. Scheduling names the institution timezone and converts local date/time deliberately before sending the server's expected format.
- Use the same drill status/participant contract as §10. Decide from real participant selection whether institution-wide/grade-targeted drills belong in this class list; do not display only one selection mode without explaining scope.
- Avoid a large blank padded panel when no drills exist. Keep one short empty message with schedule/start actions and an explanation of who can perform them.

### 8.4 Request lifecycle

Class-detail currently reloads several collections on tab changes, initially requests progress twice and polls at different intervals. Consolidate ownership without replacing the whole fetching stack. Retain visible data during refresh; scope results to class ID and active dataset; ignore late responses from a previous class. Clean up listeners added during Quick Start and prevent repeated starts from accumulating `DRILL_START` handlers.

**Acceptance:** legitimate approved students appear; error is not an empty roster; request/student IDs never interchange; Back and tab state are retained; QR sharing does not shift the entire page; class drill creation sends once with correct target/timezone; old-class responses never populate a newly selected class.

## 9. Teacher analytics and student detail — W05, W06 and W07

### 9.1 Data prerequisites

The current Overview, Students and Performance tabs live in `web/app/teacher/analytics/page.tsx`, with `StudentPerformanceCard` and `ProgressChart` under `web/components/teacher/`. Their attractive numbers are not all valid learning measures:

- `backend/src/services/teacher.service.js:487` increments both completed and total modules for every quiz result, without distinct-module/pass filtering. A displayed 3/3 is not proof that the assigned curriculum is completed.
- The analytics page supplies hard-coded quiz zeros and zero login streak, while the card turns missing activity into Never. Unknown is not equivalent to zero or never active.
- The Top 10 collection depends on the Students tab's search/sort state. Its scope and ranking can change without the Overview title explaining it.
- W07 is an area chart across different students, not a time trend. W05 also mixes module counts, game counts and preparedness scores on one axis.
- A shared `Promise.all`/state flow can preserve the previous class's data when a newly selected class fails. Results need class/request identity.
- Sessions uses recent drill records, not a general training-session dataset. Backend analytics queries `Drill.classId` although the model stores `participantSelection.classIds`, uses a nonexistent participant status field and counts a limited recent list as total drills.

### 9.2 Required page layout

```text
Teacher analytics
[Class selector] [actual reporting period, where supported] [Refresh]
Scope / last successful update / refresh state
[Overview] [Students] [Drill history] [Performance]

Compact, defined summary metrics
One question per chart
Data table / student list with contextual drilldown
```

Associate Class label and input. Keep selection visible while content changes. On class switch, show a new-class loading state or a cache explicitly scoped to that class; never show old-class students below a new class name. A failed class request has Retry and a clear error. Background refresh preserves readable content and scroll position.

### 9.3 Overview and Performance

- Define **Preparedness score**, **Recorded games**, **Completed modules** and their units separately. Scores use `/100` only where the server contract really defines that scale.
- Correct module-completion aggregation to distinct completed content and an actual assigned/eligible denominator. Until supported, show the actual recorded activity measure or omit completion percentage. Neither attempts/attempts nor 0/0 is an acceptable completion metric.
- Rename the existing student-name area chart **Student comparison** and use horizontal bars or a sortable table with a metric selector. Actual trends require dated measurements of the same population/metric; make them a separate later feature if the data is absent.
- Do not combine counts and a score on one unlabeled axis. Use separate charts, a metric selector or clearly separated panels. Do not solve confusion by adding three crowded axes.
- For Top 10, define one stable metric and applied class/filter scope. Tie-break deterministically and retain full accessible student identity; first names alone can collide.
- Show an average's population and exclusions. Missing scores must not silently lower a mean by becoming zero. If no valid observations exist, show No recorded scores.
- Rename Sessions to **Drill history** and show the actual period/limited list. Fix total count versus latest-ten semantics before labeling anything Total drills.

### 9.4 Students view and detail

On wide screens, replace the four nested colored boxes per student with a comparison table: Student, Preparedness, Completed modules/actual denominator, Recorded game activity, Last recorded learning activity, Open details. Keep Search and Sort above it, result count visible and no-result recovery. On smaller screens, use compact cards with the same information priority.

Move optional email and extra statistics into detail. Student name or an explicit details action is a keyboard-operable Link. Do not rely on an `onClick` applied to a generic Card div. Missing data says Not recorded/Unavailable; a valid zero remains zero. Label the progress bar's actual metric instead of calling the module ratio Overall Progress.

`web/app/teacher/classes/[classId]/students/[studentId]/page.tsx` already exposes a detailed route and mounts `ActivityTimeline`, which has a genuine paginated activity service. Reuse it. Avoid resetting the page to a skeleton and activity pagination on each 30-second refresh. Preserve originating class/tab/filter context on Back. Distinguish not found, access denied and request failure. Correct class-detail sort accessors that use missing nested progress/quiz fields instead of the normalized response.

**Acceptance:** no unrecorded quiz/streak becomes zero; no attempt/attempt percentage becomes curriculum completion; chart units and categories are honest; a previous class never appears under a new selection; student links work by keyboard; drill-history labels/counts match the corrected service; real activity pagination remains usable during refresh.

## 10. Drill management, scheduling and detail — W08 and W09

### 10.1 Normalize the active contract first

`web/lib/api/drills.ts` declares an `active` status, `completionTime`, `acknowledgedBy` and string participants. The backend Drill model uses `in_progress`, `completedAt`, `actualStart` and participant objects. Drill detail receives an envelope containing `data.drill`, while the page treats `response.data` as the drill directly. Normalize these shapes in the API boundary before interpreting status/counts or applying new styling. Do not change stored statuses merely to match a label.

An old in-progress record in W08 does not prove a live exercise is running now. Show the actual status plus start time, elapsed age and refresh state. Do not auto-complete records in the browser based on age. Reconciliation of abandoned drills is a backend/workflow concern for an authorized operator.

### 10.2 Required list

- Heading **Drills**, institution/class context and one **Schedule drill** action.
- Accessible tabs **In progress, Scheduled, History**, with successful scoped counts. Unknown counts do not render zero.
- Compact rows/table with drill name/type, participant scope, normalized status, relevant time and Details. Use sentence case; large all-caps titles and repeated filled buttons are unnecessary.
- In progress: actual start time and participation information with explicit units. Scheduled: planned start with timezone. History: actual completion time where available; label scheduled/created time separately rather than pretending it is completion time.
- Search/filter by available type/class/status fields; preserve applied state on return from detail. Avoid a global All filter that suggests access outside authorized institution scope.
- Empty/error/loading states keep the toolbar and tabs visible. Failure is not No drills.

### 10.3 Scheduling and starting

The schedule form names type, audience, date/time/timezone, duration and any existing supported instructions. Validate required choices and time bounds before submission. Preserve server errors beside fields. Show the exact target and timing in the final action label or brief review summary.

Starting now and scheduling are different commands. Show **Start practice drill** only for authorized operators and clearly identify it as an exercise. Prevent duplicate mutations. A failed start must retain the form and must not navigate into a success view. A successful scheduled result says Scheduled, not Started. Define browser Back/dismiss behavior for unsaved forms; do not lose user input on a recoverable network error.

### 10.4 Detail and participation

Display one authoritative record with scope, status, start/completion times, participants and explicit acknowledged/completed definitions. Do not use acknowledgment count as completed participation unless the backend defines that behavior. Missing participant time is unavailable, not zero seconds. The existing End action targets the real drill ID, shows its consequence and updates only after verified success. Add Cancel only if an actual authorized cancellation endpoint/workflow is implemented; do not invent it from the desired label.

The detail page currently builds AI-summary duration from scheduled time and mismatched `completionTime`, or invents five minutes when unavailable (`drills/[drillId]/page.tsx:203`). Use actual start/completion or a validated recorded duration. Omit unknown duration from the summary input rather than substituting a plausible number. Label generated summaries separately from measured drill results; a generated explanation cannot establish missing participation or timing facts.

Listen for live updates once, merge them with record identity/order, and clean up subscriptions. Disconnected live updates do not erase the last fetched detail. A refresh for one drill must not populate another after navigation. Keep an accessible participant table and error recovery independent of charts.

**Acceptance:** `in_progress` is classified correctly; detail unwraps the real response; scheduled/started/completed timestamps have distinct meanings; repeated clicks create one drill; expired/old exercise records do not masquerade as current live telemetry; date/time round trips correctly; errors and unknown participation remain visible.

## 11. Broadcast history and composer — W10

### 11.1 Verified behavior and critical prerequisite

`web/app/broadcast/page.tsx:151` ignores selected recipients/channels and always sends to `recipients.type = all` through push. Scheduling can still announce Broadcast sent successfully. History loads at most 100 items and calculates display metrics from that loaded set.

Backend broadcast status can be set to sent even when channel tasks fail. Recipient counts, channel send attempts and actual delivery receipts are different quantities; delivered starts at zero and is not evidence every recipient rejected or ignored the message. Fix these semantics before presenting W10-style delivery rates as operational truth.

### 11.2 Required composer

```text
New broadcast
Purpose/type and priority
Audience [actual authorized recipient selector]
Channels [only supported configured channels]
Title/subject where required
Message
Timing: Send now / Schedule [date, time, timezone]

Preview: exact audience/scope, channel, message and timing
[Cancel] [Send broadcast / Schedule broadcast]
```

- Bind the selected audience and channels to the actual API contract and server authorization. If only all-institution push is intentionally supported, remove the unsupported choices and say so before sending. Do not silently broaden an operator's selected audience.
- Correct channel behavior across immediate and scheduled backend paths as well as the form. The current service forces admin recipients to push, can abort a mixed-channel send when no push tokens exist, and scheduled processing can add email for recipients without push tokens. Define and validate the effective channels before showing Preview. Do not send through an unselected fallback channel; a supported fallback must be explicitly selected and described. Per-channel unavailability/failure must not silently change the selected audience or channel policy.
- Show a real recipient estimate only if it is calculated through a trustworthy scoped contract. Otherwise state the selected group, not a fabricated count.
- Separate Save/preview UI from actual sending. Final Send is explicit and guarded against duplicate clicks/Enter. Retain draft on errors; scheduling success says Scheduled with the actual time.
- Template selection uses existing template content fields and appropriate channel requirements. Preserve the existing route/query prefill flow, but do not submit automatically when a template opens.
- Validate timing and required content; surface field errors and permission/configuration failures contextually. Do not promise unconfigured email/SMS delivery.

### 11.3 Required history and metrics

Use a compact filter toolbar and table/cards with Title, Audience, Channels, Submission/scheduling status, Time and View details. Keep preview text short, full content available on expansion, and badges secondary to readable labels. Replace decorative emoji with consistent Lucide icons.

| Metric/state | Required meaning |
| --- | --- |
| Broadcasts listed | Count within the loaded/applied scope; not necessarily all historical broadcasts |
| Scheduled | Accepted for future processing; not sent |
| Submitted/accepted | Server accepted the operation; not proof of device receipt |
| Channel attempts / provider accepted | Counts defined by the backend's actual send tasks |
| Unique recipients | Deduplicated intended recipients, not channel tasks |
| Delivered | Receipt confirmed by a supported delivery mechanism |
| Delivery unknown | No receipt evidence; do not display a misleading zero-percent failure rate |
| Failed / partially failed | Explicit task outcomes and recoverable retry where supported |

Separate send status from delivery status in list/detail. If delivery receipts are unsupported, use Delivery tracking unavailable and omit the percentage. Never divide a channel-task count by unique recipients and call it delivery rate. An export or resend option is P2 unless its backend semantics are implemented; retries must not accidentally duplicate successful recipients.

**Acceptance:** selected recipients/channels are honored or unsupported choices are absent; immediate/scheduled processing never silently adds a channel; missing push tokens do not misrepresent other selected-channel outcomes; scheduling is not announced sent; failures retain drafts; counts declare their scope/units; zero receipts do not imply known delivery failure; history loading errors do not become zero broadcasts; double submit sends one operation.

## 12. Scenario learning and outcome — W11 and W18

### 12.1 Verified implementation

The same `web/app/scenario/page.tsx` powers teacher and administrator screenshots. It consumes `nextScenario`, options, consequence, `isGameOver`, `safetyScoreSentence` and tip from the existing AI service. The safety-score field is a sentence, not a numeric preparedness score.

The page has a bounded reading column and Play again, but does not present a useful step/history structure. `onChoice` appends context before successful response; a failed continuation needs deliberate retry semantics so it does not append the same choice twice or associate a consequence with the wrong step. Continuation errors are not rendered once scenario text exists: the error card requires `!scenarioText`. Add a persistent inline continuation error that retains the selected choice and exact retry request.

During AI quota cooldown, `backend/src/services/ai.service.js:766` can return the same `SCENARIO_FALLBACK` on every request, with options and `isGameOver: false`. The web result type omits `quotaLimited`. This can look like successful progress while repeating the same scenario indefinitely. Preserve a typed fallback/unavailable indicator through the client and handle it distinctly from an accepted generated transition.

### 12.2 Required choice experience

- Title **Safety scenario practice** with a concise note that the story is AI-generated practice, separate from live emergency instructions.
- Preserve the readable column around 720px. Reduce the visual dominance of navigation without hiding the user's way out.
- Show a real step number from the accepted sequence, not a fabricated percentage complete when total steps are unknown.
- Display one current scenario and a labeled group of choices. Allow reading and selecting a choice, then an explicit Continue action if accidental clicks are a concern. Keep keyboard selection and visible focus clear.
- While waiting, retain the scenario/selected choice, show Generating next step and prevent duplicate requests. Keep Back/exit and a way to retry the same transition on failure.
- Commit history only when the next response is accepted, or retain an explicit pending entry with an immutable request snapshot. Late responses after restart/exit must not overwrite the new session.
- Validate the response: no choices and not game-over is an unavailable/invalid next step, not a silently blank end state. Preserve the previous readable step.
- When quota/fallback mode is returned, do not advance the accepted step/history as though a new generated transition succeeded. Show AI practice temporarily unavailable with Retry/Exit and the retained prior state. A separately implemented finite local practice scenario is an optional alternative; repeatedly returning the same generic fallback is not such a flow.

### 12.3 Required outcome and debrief

```text
Scenario complete
What happened [concise outcome]
Your choice and feedback [actual returned explanation]
Learning takeaway [reviewed or clearly identified generated content]
[Review choices] [Try another scenario] [Return]
```

Rename **Your safety score** to **Feedback on your choices** when the returned value is narrative. Do not derive a numeric score, XP, pass/fail or official preparedness increase from that sentence. Use neutral feedback styling rather than automatically coloring any returned narrative green.

Reduce repeated full-height cards by grouping outcome and feedback into readable sections. Keep useful generated text, but do not invent new safety advice or claim the content is reviewed official guidance. Verified educational content references/citations require a real source contract and content review; they are not UI decorations.

Review choices can use the accepted in-memory history without adding server session persistence. Saved resume, teacher assignment and recorded achievement are P2 dependencies. A local session must not claim it can resume after logout/reload unless implemented.

**Acceptance:** continuation errors have visible Retry; one accepted transition advances one step; repeated quota fallback does not advance history indefinitely; restart ignores older responses; narrative is not a number; completion offers a clear debrief and exit; no live emergency or dispatch action is triggered by the practice interface.

## 13. Map, blueprint and device locations — W12

### 13.1 Verified implementation

`web/app/map/page.tsx` contains fallback blueprint bounds around Delhi, casts the floorplan response to a top-level image/bounds structure, and can fall back to an OpenStreetMap iframe fixed on Delhi. The actual floorplan map-data endpoint returns an envelope containing blueprint, equipment, exits, rooms and hazards. The no-Mapbox path does not automatically load the same real device overlay data.

The screenshot's environment-variable instructions belong to development/deployment setup, not a teacher's map. The current heading is already Map & Blueprint; preserve that improvement.

### 13.2 Required experience

- Heading **Institution map**, with actual institution context, layer legend and last successful data update.
- Render a campus location only from verified saved coordinates/geometry. If unavailable, show **Institution location not configured** with an authorized setup destination where one exists.
- A generic basemap is not a campus marker. Remove the hard-coded Delhi marker/bounds from ordinary operational presentation. An explicit demo route, if retained elsewhere, stays clearly labeled demo and separate.
- Normalize the real map-data response once in the API boundary. Check coordinate order, geometry type and required image/georeference fields before adding overlays.
- If the provider is unavailable, show a readable **Map unavailable** state plus a real list of authorized devices/places where the data can be fetched independently. Do not claim blueprint/device layers work in an iframe when they do not.
- Explain missing capabilities in user terms: **Detailed campus layers are unavailable**. Keep environment variable names, `.env.local` instructions and token diagnostics out of the student/teacher/parent page.
- Add available layer controls and a legend only for actual layers. A map entry should have accessible text details: name/type, status, relevant location metadata and accurately labeled Last contact/Server received time. Show a measurement/observation time only if validated, following §16. Do not relabel activity as observation.
- Normalize unknown device health to neutral. Current map marker logic makes statuses other than warning/offline green; absent or unrecognized status must not become healthy by default.
- Do not interpret a device position or floorplan exit marker as a verified safe evacuation route. Preserve disabled unverified AR/routing services from the audit.
- If geolocation is offered, request it on an explicit action and handle denial without blocking saved campus data. Do not overwrite institution location with the browser's current position.
- Keep map zoom/pan keyboard-accessible where supported, provide a meaningful non-map alternative and preserve provider attribution. Allow map-internal two-dimensional interaction without making the whole shell horizontally scroll.

**Acceptance:** no fabricated campus location; actual map-data envelope loads; missing provider does not falsely advertise overlays; no developer setup instructions in routine UI; unknown locations remain unknown; device/list selection retains IDs/time; routing remains unavailable until verified independently.

## 14. Parent verification, dashboard and children — W13/W14

### 14.1 Verify Student

The current page accurately says camera scanning is available in the mobile app, but its placeholder, empty text and Clear & Scan Another action still imply a browser scanner. Keep the initial web capability as **Paste verification code**. A browser camera scanner is optional P2 work, not a button-label change.

Replace two large empty columns with a compact form and a result section that appears below it after a meaningful response. Explain where the parent obtains the code. Associate the label/input, use a real form submit, and guard Enter and button paths with the same pending state. Current button disabling alone does not stop repeated Enter submissions.

Distinguish verified, invalid/expired, not linked, permission denied and network unavailable. Current network errors become `verified: false`; do not present service failure as proof that a relationship is invalid. Editing the code invalidates the old displayed result, and a late response for an older value cannot display under the new one. Announce/focus the resulting state accessibly.

Keep raw code payloads out of logs and URL query strings. Show identity only as returned by the authorized verification endpoint. The current View Location destination `/parent/children/[studentId]/location` does not exist. Navigate to the real child detail Safety tab through a tested query/tab contract instead of adding a placeholder location page.

### 14.2 Parent status dependencies shared with mobile

The web correctly reads `status`, but defaults missing status to safe and recognizes only a limited set of display states. Its dashboard expects `summary.safe` and `summary.inDrill`; the backend provides `safeChildren` and `inDrillChildren`. `||` fallbacks also discard legitimate zero values. Normalize the real response rather than maintaining competing fallbacks.

Use the **same backend correction** described by mobile plan D01: persisted User defaults, parent service fallbacks and the location endpoint can invent safe/current-time values. `lastSeen` is shared by location and safety updates, so it is not a dedicated safety-report timestamp. Establish explicit report provenance and report time; unknown legacy records remain unknown. Do not create different mobile and web freshness policies or independent conflicting timestamp fields.

| Record state | Required parent display |
| --- | --- |
| Explicit safe report with established time | Reported safe · report time |
| Established report without reliable time | Reported status · Report time unavailable |
| Stored default safe without report evidence | Status unavailable |
| Explicit help/at-risk/missing/evacuating value | Correct human-readable status; do not collapse everything to Safe/emergency |
| Activity/location time only | Label it Last activity/location update, not Safety reported |
| Refresh failed with prior report | Retain report/time with Could not refresh |
| No data / unknown enum | Status unavailable; neutral presentation |

### 14.3 Required dashboard

```text
Your children                                  [Add child] [Manage]
Last successful update / refresh state
Compact linked-child and real notification summary

Child name · school · grade/section
Latest reported status and report time
Preparedness [defined score or unavailable]
Recent recorded learning [if available]
[Open details] [Safety details, where authorized]
```

- Remove redundant large quick actions already available in the sidebar and header. Use one primary Add child action and secondary Manage.
- Replace internal class codes with human-readable class context on overview cards. Keep relationship and optional email in details unless needed to identify a child.
- Use one clear keyboard-operable child details Link rather than a clickable generic container plus duplicate full-width button.
- Do not display Safe totals until the actual count and report provenance are reliable. Show unknown separately; missing metrics do not become zero. Preparedness is secondary learning information, not a safety signal.
- The page currently refreshes children/status through two polling paths while summary is initialized separately. Refresh must update its declared datasets consistently, with per-section time/error states and no whole-page skeleton for each poll.
- Retain each child's last successful report on individual failure. Avoid replacing the whole status map with only successful responses then using safe fallbacks for failed children.

### 14.4 Connected child flows

Web child-management search already works across name/email/grade/section and remains visible on empty results. Preserve it; improve compact cards, typed status state and unlink wording. Removing a link removes the parent-child association, not the child's account. Keep explicit confirmation, pending state and recovery; do not misleadingly call every reversible link operation permanent deletion.

Web Add Child already understands `autoVerified` and pending outcomes, and APIs for pending requests/cancellation exist. Keep Linked separate from Awaiting approval and surface persistent request status. Do not duplicate the mobile parser repair in web code.

The existing child detail has Overview, Progress, Drills, Attendance and Safety. Preserve them. Safety currently checks coordinates by truthiness; valid zero latitude/longitude must not disappear. Validate finite coordinates and optional timestamps, distinguish denied access/no location/load failure, and show report freshness independently of coordinates. Both dashboard and verification location actions must open this actual destination.

Notifications/profile have no supplied screenshots. Apply the shared shell and existing state rules, preserve notification/read semantics and contact editing, and test navigation; do not claim a complete visual redesign of unpictured screens from these two images.

**Acceptance:** no browser scan promise without a scanner; Enter submits once; changed code clears old result; network failure is not Not linked; location links resolve; missing status never Safe; activity timestamps never become report time; valid zero counts/coordinates survive; pending links remain pending.

## 15. Institution analytics — W15 and W16

### 15.1 Preserve current truthful behavior

`web/app/analytics/page.tsx` uses AdminRoute and six actual analytics API methods. Current code removed unsupported screenshot distributions/per-type percentages, reports unavailable breakdowns and uses `avgScore` for Average Drill Score. Do not restore the old W16 pie chart or percentages as decorative filler.

Current usability gaps remain: huge title/filter/tab sections, repeated skeleton replacement during polling, shared request state that can cross tab/date selections, Apply Filter after date edits already trigger fetching, placeholder Export and missing values rendered as zero time/score. Existing evacuation-time grade labels use arbitrary cutoffs without institution-specific context.

### 15.2 Required layout

```text
Institution analytics                         [Export, if functional]
Institution scope · last successful refresh · refresh control
[Date preset if supported] [Start] [End] [Apply] [Clear]
[Drills] [Student progress] [School overview] [Modules] [Games] [Quizzes]
Compact summary metrics
Charts and accessible tables for the selected dataset
```

Use normal compact tabs rather than six large icon tiles. Keep the selected date scope visible beside results. Use `draftStart/draftEnd` versus applied range if retaining Apply; edits alone must not silently change displayed results. Clear resets draft/applied state consistently. Validate start before end and define inclusive boundaries/timezone with the backend. No unsupported date presets or ranges should be shown as though implemented.

On refresh, keep the current chart/table and show a small updating state. Scope responses by institution, selected dataset and applied dates; a late response cannot mark a newer selection refreshed. Update Last refreshed only when that dataset succeeds, not whenever any request completes. Auto-refresh has one visible control and pauses unnecessary work when hidden/disposed without erasing data.

### 15.3 Metrics and charts

| Dataset | Required interpretation |
| --- | --- |
| Drills | Participants as defined by the endpoint, actual measured time units, Average Drill Score; no inferred universal safety rating |
| Student progress | Returned counts/averages with population and data availability; real dated observations only for trends |
| School overview | Real institution identity and scoped counts; no invented total schools or broad super-admin scope |
| Modules | Completion definition and denominator from service, not arbitrary UI assumptions |
| Games | Activity/performance with explicit game type and units; XP/count/score separated |
| Quizzes | Accuracy/pass rate/attempt count correctly distinguished; failed request not an empty success |

Missing measurements display Not recorded/Unavailable, not `0s` or `0%`. Valid zero remains valid. Remove unqualified Excellent/Good response-time judgments unless the deployed institution has a documented applicable benchmark and the metric matches it. Do not equate Average Drill Score with current physical safety.

For participation over time, label granularity and whether counts are unique people or participation events according to the actual API. Avoid smoothed curves that imply observations between discrete samples. Keep gaps for unavailable periods; zero is justified only when a complete period has zero records. Provide a table and summary for every chart; preserve actual returned datasets.

### 15.4 Export

Current Export only shows a coming-soon toast. A report-generation method and backend report routes already exist. Either wire a real authorized export using the **applied** institution/tab/date scope or omit/disable the unavailable control with a short explanation. A completed export must produce a usable file, include scope/time/units, handle failure and respect permissions. Do not invent a new report backend or mark a toast as successful export. Pagination or report-generation limits must be explicit in the output.

**Acceptance:** charts reflect applied filters only; older responses do not replace new selections; exported data matches displayed scope; no historical fake distributions return; unknown is not zero; refresh preserves reading; metric units and timestamps are explicit; institution access stays enforced.

## 16. Devices, health and telemetry — W17

### 16.1 Verified dependencies

`web/app/devices/page.tsx` displays an IoT sensor subset and then repeats those devices in All Devices. Failed loads can become empty arrays/zero health counts. The green active badge reflects registration/device status, not fresh telemetry. Existing backend health logic already derives freshness from last seen; reuse that contract rather than inventing another client threshold.

The inspected detail logic has more serious semantic issues:

- It treats water above 2000 as flood, while server default polarity/configuration treats below 2000 as danger.
- It treats raw acceleration magnitude above 2.5 as earthquake; server logic uses acceleration excess over gravity with configuration.
- It uses fire-value truthiness and can turn a string `"0"` into a positive reading, or missing data into No Fire.
- Old history/live values can remain when switching devices; timestamps can be discarded. Missing axis components become zero, while valid zero-temperature series can be hidden by truthiness.

### 16.2 Required device list

Use one main table with search and type/health filters: Device name, Type, Location when known, Registration state, Telemetry health, Last contact/server receipt and Details. Do not repeat the same device in two tables by default. A grouped view is optional only if it adds value without double-counting.

Separate **Registered/active configuration** from **Online/recent telemetry/stale/offline/unknown**, using server-derived health and accurately named timestamps. Existing telemetry storage stamps server receipt time, and authentication can also refresh `lastSeen`; those values do not establish when a sensor measured a sample. Label current fields **Server received** or **Last contact** according to their write path. Show **Sample time unavailable** unless a validated measurement timestamp exists. Show the configured freshness policy in a short explanation where available. A previous active flag must not be portrayed as live monitoring after months without contact.

Keep last successful results on refresh failure and show per-source error/retry. Empty device state appears only after a successful empty query. Device history failing does not erase the device's identity. Teachers/admins retain existing device-route permissions and institution scope.

### 16.3 Required detail

```text
Device name · ID · actual type/location
Registration state / telemetry health / last contact or server receipt
Current readings [values + units + timestamp meaning + assessment source]
Measured at [only if validated; otherwise sample time unavailable]
History [device ID, applied time range, sample granularity]
Charts grouped by compatible units + data table
```

- Consume normalized sensor readings and an authoritative server assessment/configuration. Do not reproduce contradictory fixed thresholds in JSX.
- If an assessment is unavailable, show the raw valid value with its unit and **Assessment unavailable**. Do not derive Fire/Flood/Earthquake or All clear from missing or malformed fields.
- Say **Sensor reports no flame** only for an explicit valid normalized reading; do not claim the entire area is safe.
- Preserve sample ID/device ID/timestamp and its meaning together. Do not relabel server receipt or authentication contact as measurement time. Clear or explicitly label old content while a new device loads; ignore late history/live events for the prior device.
- Show Waiting for telemetry, No records in period, Stale sample, History unavailable and Valid zero distinctly.
- Existing history is fixed to a limited period/granularity/count. A range selector requires actual parameter support and correct limits; do not show arbitrary ranges that still return the same 24 hours.
- Keep temperature, raw water readings and acceleration in separate panels/axes with correct units. Use accessible data tables; do not animate every live sample or refetch all lists for every telemetry event.
- Batch events or apply targeted invalidation with an in-flight guard. Performance work must preserve incident notifications, not suppress alerts to make charts quieter.

**Acceptance:** no duplicated count/table by default; old registered devices are not labeled online; selected-device history cannot cross IDs; valid zero remains visible; missing data never implies No Fire; water/acceleration assessment matches server configuration; contact/receipt time is not misrepresented as measurement time; no placeholder successful health state on request failure.

## 17. Universal interaction and state rules

### 17.1 Required state matrix

| State | Required presentation | Recovery/interaction |
| --- | --- | --- |
| Auth hydration | Brief initialization state | Do not flash privileged content or assume logged out before hydration settles |
| Initial data loading | Skeleton matching expected content or short loader | Shell/navigation remains usable |
| Successful empty result | Task-specific empty state | Useful action such as Add, Schedule or select another scope |
| Search/filter has no matches | Keep controls and query visible | Clear search/filter without leaving route |
| Initial failure | Inline error and Retry | Never display reassuring zero/All clear/No children |
| Background refresh | Keep last successful content with updating state | Preserve scroll, expanded rows and selection |
| Refresh failed with data | Retain data and its original time with stale/error label | Retry only affected dataset where practical |
| Missing/malformed metric | Unavailable, including unit/source explanation if useful | No fabricated numerical default |
| Unknown status enum | Neutral unknown label | Retain diagnostic details outside ordinary UI |
| Pending mutation | Operation-specific progress and duplicate-submit guard | Keep draft/target stable |
| Mutation failure | Persistent contextual explanation | Retry without duplicate side effects or loss of input |
| Pending approval | Persistent Awaiting approval state | Supported cancel/check status; no temporary privilege |
| Permission denied | Clear access explanation | Supported alternate path; do not broaden backend access |
| Live updates disconnected | Separate connection warning and last data refresh | API-backed views remain readable; explicit reconnect result |
| No live institution context | Explain assignment/selection requirement | No no-op Reconnect or arbitrary global data fetch |
| Resource removed/inaccessible | Not found or no longer available | Back to authorized list, not a generic empty success |
| Session expired/account changed | Clear private scoped state and reauthenticate | Late requests and events cannot populate another account |

### 17.2 Request and mutation ownership

Use existing clients with explicit dataset identity. Each relevant result belongs to account, institution, resource ID and applied filters. Cancel a superseded request where supported or ignore its result. Do not show old-class/old-child/old-device data under a newly selected identity.

Keep first-load state separate from background refreshing. Concurrent independent datasets need independent errors; partial failure should not blank a successful page. Share request ownership within a feature so multiple effects do not trigger the same initial load or competing polling. Stop subscriptions/timers on disposal and scope changes.

For consequential actions, keep the exact submitted input and target through pending/error states. Button disabling alone is insufficient if Enter, row handlers or shortcuts call the same method. Guard the handler. For operations where timeout can leave success unknown, use a supported idempotency/request identity or a read-after-timeout reconciliation before inviting a duplicate send. Do not claim canceling a pending browser request reverses an operation already accepted by the server.

### 17.3 Date and number rules

- Choose the institution timezone for scheduling and reporting; display it near controls/results. Browser-local rendering must not silently change a planned institution time.
- Record event time, report time, sample time, scheduling time and fetch time separately. Do not substitute one for another.
- Use locale-aware formatting, meaningful units and appropriate precision. A count remains a count; a score is not a percentage unless the scale supports that interpretation.
- Preserve null versus zero. Denominator zero means no eligible items/undefined rate, not automatically 0% or 100% completion.
- Identify aggregation scope and pagination limits. A list of the latest 100 broadcasts or ten drills is not an all-time total.
- Keep dates sortable using real timestamps; formatted labels are display values, not query identities.

### 17.4 Consequential action copy

| Existing or misleading wording | Required replacement/rule |
| --- | --- |
| Admin Dashboard on every role | Actual page title with appropriate role/institution context |
| System Active | Remove unless backed by a defined operational state; separate Live updates connected |
| All Clear after missing data | Alert status unavailable |
| Safety Score derived from drill count | Remove; retain only defined factual metrics |
| Student Performance Trends across names | Student comparison |
| 0/0 modules, 0% complete | No assigned modules or denominator unavailable, according to actual data |
| Never for absent activity timestamp | Last activity not recorded |
| Broadcast sent after scheduling | Broadcast scheduled for [actual time/timezone] |
| Delivered without receipts | Delivery tracking unavailable/unknown |
| Regenerate invalidates old QR without enforcement | Do not promise invalidation until server proves it |
| Enter or scan on paste-only verification | Paste verification code |
| Your safety score for a sentence | Feedback on your choices |
| Active device next to old last-seen | Separate registration status from telemetry health |
| Environment-variable instructions on Map | Campus map/layers unavailable, with authorized setup path if available |

## 18. API/data dependency ledger

Resolve these prerequisites at the narrowest responsible layer. Do not duplicate a backend correction already implemented under the mobile plan; share one contract and verify both clients.

| ID | Capability | Verified existing support/problem | Required integration |
| --- | --- | --- | --- |
| WD01 | Honest dashboard metrics | Drill/alert APIs exist; count/10 score and scheduled filter are wrong | Remove arbitrary score, normalize status/count/time, independent load outcomes |
| WD02 | Role/page context | Header title prop and auth roles exist | Explicit titles, one parent dashboard destination, role-scoped requests |
| WD03 | Live updates lifecycle | Singleton socket and page-level connect/disconnect | One authenticated lifecycle owner, scoped subscriptions and actual connection outcome |
| WD04 | Approved roster/count | Teacher endpoint omits fields used by UI filtering | Minimal server projection/DTO correction; distinguish roster versus approved count |
| WD05 | QR display/expiry | Server returns image/string/nested class transiently; persisted hash cannot reconstruct it | Normalize response and expired/unknown state; session-unavailable state plus explicit generation, or authenticated retrieval dependency |
| WD06 | QR replacement/revocation | Class-ID JSON acceptance does not verify current token/version | Enforce token/version/expiry server-side before invalidation/revoke claims |
| WD07 | Module completion | Teacher service counts quiz attempts as completed and total | Distinct completion definition plus real assigned/eligible denominator |
| WD08 | Teacher drill analytics | Incorrect class field, participant-status expectation and limited totals | Canonical participant selection, completed criteria, independent total count and actual event dates |
| WD09 | Drill detail/status | API declarations differ from model and nested response | Normalize `in_progress`, participant objects, actualStart/completedAt and detail envelope |
| WD10 | Audience/channel selection | Composer forces all/push; backend immediate/scheduled channel policies also differ | Honor validated effective selections across both paths; preview accurately; never broaden audience or add unselected fallback channels |
| WD11 | Broadcast delivery metrics | Send tasks, recipients and receipts conflated | Typed outcomes, declared units, partial failure; receipt-backed delivery only |
| WD12 | Parent status/time | Web fields partly correct; defaults/summary/provenance remain wrong | Reuse mobile D01 backend work; normalize real summary fields and status enum |
| WD13 | Verification/location | Existing verification and child Safety view | Separate network versus invalid result; invalidate edited result; route to actual Safety tab |
| WD14 | Applied analytics/export | APIs/report service exist; Apply misleading and Export placeholder | Applied filter state, response identity, real authorized file export or unavailable control |
| WD15 | Campus map/blueprint | Nested server map data, fixed Delhi fallback, unknown status becomes green | Adapter/geometry validation, verified institution location, neutral unknown health, timestamp meaning and independent list fallback |
| WD16 | Sensor assessment/health | Server configuration differs from UI thresholds; receipt/contact time is not sample time | Server-derived normalized assessment/units/health, missing versus valid zero, explicit timestamp meaning |
| WD17 | Scenario progression | Stateless next-step endpoint/client history; quota fallback repeats a nonterminal scenario | Typed quota/fallback mode, no false advancement, validated accepted/pending history and stable retry/reset |
| WD18 | Complete web translation | English interface and tip content-language controls | Optional explicit localization resources/provider; no assumption of mobile reuse |

### 18.1 Concrete source change map

All paths below are existing unless marked proposed. Read callers before shared changes.

| Work area | Primary paths | Responsibility |
| --- | --- | --- |
| Shared shell | `web/components/layout/header.tsx`, `sidebar.tsx`; `web/app/layout.tsx`; proposed `web/components/layout/app-shell.tsx` | Page context, navigation, landmarks and consistent layout |
| Theme/components | `web/app/globals.css`; `web/tailwind.config.js`; `web/lib/design-system/tokens.ts`; `web/components/ui/` | Semantic colors, dimensions, accessible fields/dialogs/states |
| Socket/auth context | `web/lib/services/socket-service.ts`; `web/lib/store/auth-store.ts`; existing page subscriptions | Lifecycle and scoped connection/subscription state, preserving token handling |
| Dashboard | `web/app/dashboard/page.tsx`; `web/components/dashboard/DrillPerformanceChart.tsx`, `AlertStatusChart.tsx` | Defined metrics, role-specific priority, chart semantics and state |
| Classes and QR | `web/app/teacher/classes/page.tsx`; `web/app/teacher/classes/[classId]/page.tsx`; `web/lib/api/classroom.ts` | Compact roster/sharing workflow and real QR DTO |
| Approval flows | Both teacher class-detail and `web/app/teacher/classes/[classId]/approvals/page.tsx`; `web/lib/api/teacher.ts` | Correct IDs, row actions, feedback and count semantics |
| Teacher analytics | `web/app/teacher/analytics/page.tsx`; `web/components/teacher/StudentPerformanceCard.tsx`, `ProgressChart.tsx`, `ActivityTimeline.tsx` | Honest comparison metrics, student detail and stable refresh |
| Teacher/QR backend | `backend/src/services/teacher.service.js`; `backend/src/services/classroom-join.service.js`; related class/user/drill models and routes | Response projection, completed-module denominator, drill scope and code validity |
| Drills | `web/app/drills/page.tsx`; `web/app/drills/[drillId]/page.tsx`; `web/lib/api/drills.ts`; `backend/src/models/Drill.js`; related controller/service | Typed detail/status/time/participants and scoped commands |
| Broadcast | `web/app/broadcast/page.tsx`; `web/lib/api/broadcast.ts`; `backend/src/services/broadcast.service.js` | Selection binding, schedule/send outcomes and receipt semantics |
| Scenario | `web/app/scenario/page.tsx`; `web/lib/api/ai.ts`; `backend/src/services/ai.service.js`; existing scenario backend handler | Validated step/result/quota fallback/retry and debrief |
| Map | `web/app/map/page.tsx`; `backend/src/controllers/floorPlan.controller.js`; existing school/map/device APIs | Actual nested map response and verified location/layers |
| Parent | `web/app/parent/dashboard/page.tsx`, `verify-student/page.tsx`, `children/manage/page.tsx`, `children/[studentId]/page.tsx`; `web/lib/api/parent.ts` | Status/count/result normalization and actual child destination |
| Shared parent backend | `backend/src/models/User.js`; `backend/src/services/parent.service.js`; existing report/status write paths | Report provenance/time and honest counts/location; shared with mobile |
| Institution analytics | `web/app/analytics/page.tsx`; `web/lib/api/analytics.ts`; existing analytics/report backend | Applied filters, data/units and functional export |
| Devices | `web/app/devices/page.tsx`; `web/lib/api/devices.ts`; `backend/src/services/iotDeviceMonitoring.service.js` | Correct sensor assessment, freshness, scoped sample/history data |
| Gallery evidence labels | `web/components/landing/ScreenshotGallery.tsx` | Correct captions/alternative text for supplied files only |

A shared shell and a small accessible tab helper may be worthwhile because real duplication exists. Do not pre-create a generic table engine, request framework, resource registry or configurable dashboard builder. A native table and a feature-local adapter are sufficient unless repeated requirements demonstrate otherwise.

## 19. Ordered implementation batches

Each batch includes its error, loading, keyboard and responsive states. Do not treat accessibility and data correctness as cleanup after visual completion.

| Batch | Priority | Deliverable | Dependencies | Completion gate |
| --- | --- | --- | --- | --- |
| WB0 | P0 | Capture current local baseline, route screenshots and relevant existing tests; verify exact source contracts | None | Baseline is documented; screenshot-era features distinguished from current code |
| WB1 | P0 | Shared data prerequisites: drill DTO/status, roster, completion definition, parent provenance/summary, broadcast selection/outcomes, sensor semantics, map adapter/fallback | WB0 | Focused backend/client contract tests; no misleading defaults/unauthorized scope broadening |
| WB2 | P1 | Shared tokens/components, page-correct titles, responsive shell, sidebar groups, keyboard dialogs/tabs and socket ownership | WB0; preserve WB1 | Deep-link/navigation/zoom/keyboard checks pass; public routes and auth remain intact |
| WB3 | P1 | General dashboard and classes/approvals/QR presentation | WB1, WB2; WD06 before invalidation promises | Honest metrics, correct roster, usable real QR and contextual class actions |
| WB4 | P1 | Teacher analytics, student comparison/detail and activity preservation | WB1, WB2 | Real denominator/units, stable selected class, usable tables/charts |
| WB5 | P1 | Drill list/detail/schedule and Broadcast composer/history | WB1, WB2 | Correct targets/status/times; chosen audience/channel honored; results truthful |
| WB6 | P1 | Parent verification/dashboard/child links and Map | WB1, WB2 | Unknown reports remain unknown; paste flow and actual destinations work; no fabricated campus |
| WB7 | P1 | Institution analytics/export decision and device monitoring/detail | WB1, WB2 | Applied filters, no fake chart data, typed samples/health and real export or honest omission |
| WB8 | P1 | Scenario choice/retry/debrief and screenshot-caption corrections | WB2, WD17 | Stable step progression, narrative feedback label, accurate gallery labels |
| WB9 | P1 | Cross-route review, before/after evidence and full acceptance checks | WB3–WB8 | Section 21 complete; unsupported capabilities explicitly recorded |
| WB10 | P2 | Optional web scanner, complete translations/dark mode, saved scenario resume, advanced exports/filters | WB9 and actual supporting contracts | No mock capability shipped as complete |

WB1 should be split into small independent patches by domain; it is not one enormous backend rewrite. Reuse mobile backend status work if it has already landed. Do not estimate calendar completion without knowing available implementers, test stability and content-review capacity. The current task creates this plan, not those implementation patches or a deployment.

## 20. Verification plan

### 20.1 Focused automated regressions

Use the repository's Vitest/Testing Library and backend tests. The listed cases are required implementation checks, not tests claimed to already exist.

| Area | Required proof |
| --- | --- |
| Shell | Correct teacher/parent/admin title; exactly one main skip target; current navigation item correct; narrow menu opens/closes and restores focus |
| Dialogs/tabs | Keyboard reaches all controls; dialog focus contained/restored; background inactive; tab selection/panel semantics correct |
| Auth/socket | Fresh deep link initializes valid context; missing institution produces explanation; account switch removes old handlers/data; route changes do not disconnect other consumers or duplicate alerts |
| Dashboard | Failed alerts not All Clear; arbitrary drill-count score absent; scheduled/completed distinction correct; chart bucket timestamp matches title |
| Roster/approvals | Actual response includes required fields; failed count not zero; request IDs not student IDs; failed approval retains row; correct ownership enforced |
| QR | Response image/string/class correctly parsed; clipboard rejection reported; valid/expired/unknown states; replaced/revoked old code rejected server-side before UI promises invalidation |
| Teacher metrics | Multiple attempts for one module do not become multiple completed modules; undefined denominator not a percentage; missing quiz/streak/activity stays unknown |
| Scope/races | Class A response cannot populate class B; same rule for child, device, analytics tab/date and institution/account changes |
| Drill API | Nested detail unwraps; in-progress records classified; participant objects/times parsed; global/grade/class targeting interpreted consistently |
| Drill mutation | Duplicate Enter/click creates one operation; schedule round-trip has correct timezone; scheduled result does not claim started; AI summary never receives invented five-minute duration |
| Broadcast | Submitted payload and effective immediate/scheduled channels match selection; no unselected fallback email; missing push tokens preserve truthful per-channel results; unsupported selection cannot broaden audience; scheduled/failure/partial/receipt-unknown states render correctly |
| Parent | Explicit report provenance required for safe; location time never report time; real zero summary preserved; missing response not safe; location links resolve; zero coordinate accepted |
| Verify | Enter guarded; input edit invalidates result; older response ignored; network failure distinct from invalid/not-linked; authorized identity only |
| Analytics | Draft edits do not apply prematurely; successful current scope owns Last refreshed; no unsupported distributions; export matches applied scope if implemented |
| Devices | Server assessment/polarity used; string/missing readings normalized; valid zero retained; old telemetry not online; old-device history ignored; receipt/contact is not labeled sample time |
| Map | Real nested map response handled; no operational Delhi fallback; no invented overlays; absent provider/location state readable; disabled routing preserved |
| Scenario | Failed choice retry does not double-append; inline continuation error visible; consequence attached to correct accepted choice; quota fallback does not falsely advance history; restart ignores old response; invalid next-step state recoverable; no numeric score fabricated |
| Gallery | All 18 captions match actual supplied views and file paths resolve |

Existing web tests include `web/__tests__/components/audit-ui.test.tsx`, auth-store and API/auth refresh tests. Preserve them and add a focused set of behavior tests near the changed feature. Do not add one test for every color/padding constant. Backend tests are necessary where a UI promise depends on authorization, QR validity, recipient selection, status provenance or aggregation.

### 20.2 Browser and accessibility matrix

| Dimension | Required cases |
| --- | --- |
| Desktop width | 1920, 1440, 1280 and 1024 CSS pixels; compare useful content above the fold |
| Tablet/narrow | 768, 390 and 320 CSS pixels; visible navigation, wrapping controls and usable tables |
| Zoom/text | 100%, 200%, 400% zoom where applicable; enlarged OS text and long labels |
| Browser | Current project-supported Chromium, Firefox and Safari; record which were actually tested |
| Input | Keyboard only, mouse, touch; clipboard allowed/denied; Enter submit and Escape dismissal |
| Assistive technology | At least one desktop screen reader/browser pairing; verify labels, landmarks, table headers and status announcements |
| Connection | API success/socket disconnected, API failure/socket connected, timeout, reconnect, delayed/out-of-order responses |
| Identity | Teacher, parent, admin, SYSTEM_ADMIN; unassigned institution, pending approval, expired session, account switch |
| Data | Genuine zero, absent value, unknown enum, old report, no report provenance, long names, duplicate first names, no matching filters |
| Time | Institution/browser timezone difference, date boundary, expired QR, old in-progress drill and delayed telemetry |
| Motion/appearance | Reduced motion, high contrast where implemented, normal light; dark only if fully implemented |
| Mutation | Double-click/Enter, timeout with unknown result, server validation error, permission change mid-flow |

Do not require a new browser automation framework merely to produce screenshots if current tools suffice. If adopting automation for these user journeys, keep its scope tied to the real acceptance matrix and existing dependencies/tooling.

### 20.3 Before/after evidence

For each W01–W18 capture the implemented equivalent with matching route, logical viewport, tab/state and anonymized data. Existing PNGs may have unknown zoom/data freshness; document any baseline difference rather than forcing fake values to make images look identical.

Record the following for visual review:

1. Correct heading, role and institution context.
2. Main action visible without unnecessary scrolling at normal desktop size.
3. Search/filter controls usable in empty/error states.
4. Card/table density, metadata hierarchy and long-text behavior.
5. Real status, metric unit, reporting scope and freshness explanation.
6. Keyboard focus/landmark behavior and measured contrast.
7. No overlap among sticky headers, menus, dialogs and content.

Measure render/network behavior on the same dataset before and after. Prioritize eliminating repeated whole-page polling, duplicate requests and telemetry-triggered request storms. Do not promise a particular frame rate or load-time improvement without measurement. Large tables may later need pagination/virtualization, but do not add virtualization to a six-student view before evidence warrants it.

### 20.4 Commands and honest reporting

Use the existing root workspace lockfile and supported Node version. From the repository root, existing scripts allow `npm --workspace web run test`, `npm --workspace web run lint` and `npm --workspace web run build`. Run the relevant backend commands when contracts change. Confirm script/tool versions from the checkout before execution; do not upgrade Next.js, React or Tailwind as an incidental part of UI work.

Record actual commands/results and baseline failures. A previous build or audit test count is not verification of a new UI patch. This plan itself is checked for screenshot coverage, source paths, Markdown links and internal consistency; no new application passing result is claimed.

## 21. Definition of done

- [ ] All 18 supplied images have an accurate route/source mapping and an equivalent after view.
- [ ] Every pictured route uses a correct title, institution/role context and consistent shell.
- [ ] Parent navigation has one dashboard destination; all retained authorized routes stay reachable.
- [ ] Narrow-screen navigation, skip link, focus, tabs and dialogs work by keyboard and at zoom.
- [ ] Tokens and common components produce coherent typography, spacing, controls and status colors.
- [ ] Initial failure, empty, missing, valid zero and background-refresh states remain distinct.
- [ ] Dashboard no longer claims safety from drill count or missing alert data.
- [ ] Teacher roster and completion percentages reflect corrected contracts and real denominators.
- [ ] QR expiry/display is real; invalidation/revocation claims have server enforcement.
- [ ] Drill list/detail/scheduling use correct statuses, participant structures and time semantics.
- [ ] Broadcast audience/channel choice is honored, and acceptance/scheduling/delivery are separate.
- [ ] Parent safety reports have provenance/time; activity alone never establishes safe.
- [ ] Verification uses accurate paste-only wording unless a real scanner is implemented; location links resolve.
- [ ] Analytics applies and exports the same scope; removed fake charts are not restored.
- [ ] Device health/assessment matches server configuration and retains original sample identity/time.
- [ ] Map shows verified institution data or an honest unavailable state; no operational demo location.
- [ ] Scenario retries/history/debrief are coherent; narrative feedback is not a fabricated numeric score.
- [ ] No previous account/class/child/device results appear under a newly selected identity.
- [ ] Existing security, approval, tenant, parent relationship and disabled-routing protections remain intact.
- [ ] Tests and browser evidence are recorded; unverified/unsupported cases are explicit.
- [ ] Marketing screenshot captions match the actual PNG contents; original evidence files remain preserved.

## 22. Handoff brief for another model

> Implement `WEB_UI_UX_ENHANCEMENT_PLAN.md` against the current repository. Read current source before editing; baseline line references may have moved. Start with WB0 and the P0 contract prerequisites. Preserve existing Next.js/React/Tailwind/Zustand architecture, shared clients, server authorization, teacher ownership, verified parent relationships and disabled unverified routing. The supplied images include older behavior: do not restore removed fake analytics. Use the screenshot inventory for actual route mapping, not the existing incorrect gallery captions. Reuse mobile backend safety-provenance work rather than introducing a second incompatible contract. Never invent scores, safe reports, timestamps, QR revocation, delivery receipts, sensor assessments or campus locations. Complete one bounded batch with its error, keyboard, responsive and regression checks; report changed files, actual before/after behavior, verification and remaining dependencies. Do not rewrite unpictured product areas, upgrade dependencies or deploy as part of a UI styling batch.

For each implementation batch, provide:

1. Completed WB/WD IDs and changed files.
2. Actual behavior before and after, including empty/failure/permission cases.
3. API/content dependency resolved or still unavailable.
4. Focused tests and comparable screenshots.
5. Remaining definition-of-done items. A visible button does not mean its capability is complete.

This web document and the mobile document are implementation specifications. Neither implies that their proposed UI or backend changes have already been applied.
