# EduSafe mobile UI overhaul: phased implementation plan

**Prepared:** 9 September 2026  
**Status:** Design and implementation specification; implementation has not started through this document.  
**Scope:** Flutter mobile UI, using the supplied 16-screen collage as visual inspiration.  
**Non-negotiable constraints:** Preserve backend logic and existing business behavior. Deliver smooth, accessible animation and responsive interaction.  
**Code reference:** Working tree at `6d90f20`, including existing uncommitted changes. Recheck source before each phase.

## 1. What we are building

Overhaul EduSafe into a calm, polished learning and preparedness application: a cohesive green identity, purposeful school illustrations, clear page hierarchy, compact useful cards, consistent navigation, and motion that makes interactions feel immediate and connected.

This is a substantial visual redesign of the existing application. It is not a new backend, a new scoring system, or permission to implement every feature drawn in the inspiration. Keep Flutter, Riverpod, existing services, data models, authentication, content, role access and integrations.

The earlier [mobile enhancement report](MOBILE_UI_UX_ENHANCEMENT_PLAN.md) records observations and broader dependencies. **This document governs the current UI-only implementation.** Backend-dependent recommendations in the earlier report are deferred. The [web plan](WEB_UI_UX_ENHANCEMENT_PLAN.md) remains separate; this collage specifies mobile direction only.

### 1.1 Evidence and current-source differences

The original screenshots show older versions of some screens. The inspiration is a proposed aesthetic, not evidence of implemented functionality. Current source was inspected for navigation, onboarding, theme wiring, animations, drills, scenario requests, score components, badge references and emergency entry. Graphify was queried for orientation, then source was checked directly; its graph is not treated as proof that current dirty files match its snapshot.

The following current facts override older observations:

- `DashboardScreen` uses an `IndexedStack` with Home, Learn, Games, Profile, Ask. Home now receives an `onSelectTab` callback.
- `LearnScreen` currently imports the active `screens/module_screen_file.dart` correctly. Do not repeat the old import repair.
- `main.dart` wires a real peace dark theme. Crisis mode and dark appearance are separate concerns.
- Home opens `ManualEmergencyScreen`; do not restore the older test-alert entry.
- `OnboardingScreen` already exists and writes `onboarding_completed` using SharedPreferences. A working first-launch entry into this screen was not established by the inspected references; trace startup before wiring it.
- Existing animation helpers already provide fade, slide, scale and loading widgets. They need review and adaptation, not a competing animation framework.
- The current working tree includes unrelated backend, Firebase, theme and platform changes. Preserve those changes. Compare this work against its own starting snapshot rather than assuming the tree is clean.

No device performance measurement or fresh Flutter build was performed for this planning task. All performance figures below are proposed acceptance targets, not claimed results.

## 2. Strict implementation boundary

| Area | Permitted in this overhaul | Preserve or defer |
| --- | --- | --- |
| Visual design | Colors, typography, spacing, illustration, icons, component styling, layout and responsive behavior | Keep existing brand identity unless separately changed by the owner |
| Motion | Transitions, press feedback, presentation interpolation, loading visuals, local selection animation | No animation callback may submit a request, award points, mark a lesson complete or trigger an emergency |
| UI interaction | Local filters, disclosure, focus, keyboard handling, selection before submission, sheets and existing destination navigation | Preserve request payloads, validation rules, allowed roles and action eligibility |
| State presentation | Loading, error, empty, pending, stale and unavailable presentations using existing evidence | No fabricated score, trend, safety state, badge, delivery acknowledgement or downloaded status |
| Backend | Read existing contracts to understand the interface | No backend files, database schema, endpoints, authorization, scoring or socket protocol changes |
| Client domain logic | Call existing handlers and providers from the redesigned view | No service rewrite, queue repair, score recalculation, token changes, completion-rule changes or new synchronization policy |
| Assets | Add optimized local decorative assets; reference existing media correctly | No replacement or bulk recompression of the recovered learning/game library in this work |
| Platform configuration | Only asset/font declarations directly needed by the approved UI | No Firebase, signing, API-host, permissions or dependency upgrade work mixed into these phases |

**Decision rule:** If a design requires a new server field or different domain behavior, simplify the design to existing capabilities. Record the missing capability as deferred. Do not quietly expand scope.

Pure display formatting is allowed, but preserve the underlying value and meaning. A score may animate visually toward its supplied value; its stored value, source and weights remain unchanged. A successful dialer launch means the dialer opened, not that someone answered. An unavailable status must not become “Safe.”

## 3. Inspiration-to-product mapping

The IDs below refer to the numbered screens in the supplied collage. This table makes each difference intentional.

| ID | Inspiration | Implemented target | Adaptation or exclusion | Phase |
| --- | --- | --- | --- | --- |
| I01 | Illustrated splash | Branded first-run welcome artwork and a clean startup surface | Do not make returning users wait through an artificial splash timer; keep existing K.A.V.A.C.H logo | 3 |
| I02 | Onboarding | Redesign existing onboarding into three concise panels: Learn, Practice, Be prepared | Reuse the existing completion preference and skip behavior; no duplicate preference store | 3 |
| I03 | Login/signup | Compact welcome, clear form, strong sign-in action, secondary account and supported QR journeys | No Google button without existing OAuth support; no Student ID login label where only email works; no role control that overrides authenticated role | 3 |
| I04 | Home | Greeting, single green preparedness hero, four compact quick actions, safety tip and accessible emergency entry | No invented 72 score or +12% trend. Do not copy the red “No active emergencies / You are currently safe” banner | 4 |
| I05 | Learn browse | Searchable, visually organized learning with source and format distinctions | Only expose categories backed by actual content. Do not imply every source is indexed by a global search when it is not | 5 |
| I06 | Learning content | Clean player, title, supported metadata, readable content and real continuation action | No invented views/transcript. Preserve 95% video completion behavior and quiz eligibility; no unrestricted “Mark as completed” button | 5 |
| I07 | Games | One illustrated featured activity, compact game rows and cleaner comic selection | Retain actual available games, titles and routes; do not invent a playable cyclone game | 6 |
| I08 | Scenario question | Illustrated context, readable question, selected-choice feedback and explicit Continue | Use actual options and current step. Do not claim a fixed total of five when the response does not provide one | 6 |
| I09 | Drills | Polished tabs, date/location cards, status labels and existing detail actions | Preserve All/Scheduled/Active/Completed and their current filters. Calendar integration is optional later, not required | 6 |
| I10 | Report incident wizard | No new production destination in this release | Endpoint constants alone do not establish a supported mobile submission flow. Defer the four-step incident wizard | Deferred |
| I11 | Emergency map | Restyle existing emergency help and supported map screens coherently | Do not invent nearby facilities, opening hours, safe zones or routes; preserve disabled/unavailable capabilities | 8 |
| I12 | Ask assistant | Calm chat surface, prompt suggestions, language control and accessible composer | Preserve existing AI request/response contract. No invented citations, streaming or location knowledge | 7 |
| I13 | Preparedness breakdown | Score ring, readable actual contribution rows, real badge links | Keep module/game/quiz/drill/streak and current 40/25/20/10/5 model weights; do not substitute four fictional categories | 4 |
| I14 | Profile/settings | Clear account card, role-specific sections, parent-linking tools and concise settings | Keep supported account actions and locale choices; respect sensitive identifiers and role permissions | 7 |
| I15 | Achievement | Polished real badge detail; optional one-time celebration for a verified newly earned badge | No invented five-lesson award or client-created reward. Historical badge fetch must not replay every celebration | 7 |
| I16 | Closing illustration | Reuse motivational artwork on onboarding completion or a suitable empty state | No mandatory closing page, repeated interruption or exit interception | 3 |

Parents, teachers and child-mode users are not pictured in the new collage. They still require compatible shared styling and regression coverage. Preserve their distinct navigation and workflows rather than forcing them into the student shell.

## 4. Visual design specification

### 4.1 Identity and composition

Use a warm educational style rather than a dense administrative dashboard. Keep the existing EduSafe name and K.A.V.A.C.H brand mark. Use illustrated school environments as supporting artwork on welcome, onboarding and the featured game. Keep ordinary lists clean and lightweight.

Home should show meaningful content immediately: greeting, the preparedness summary and the start of quick actions on a typical phone. Reduce oversized header whitespace and repeated score displays. Learning pages prioritize content discovery; emergency pages prioritize immediately available actions.

Use one strong visual feature per screen. Do not combine a large gradient header, glowing score ring, multiple elevated cards and animated backgrounds on the same screen.

### 4.2 Proposed tokens

These are implementation decisions in Flutter logical pixels, not measurements copied from the collage. Validate final color pairs in the component review before rollout.

| Token | Light appearance target | Application |
| --- | --- | --- |
| Primary | `#087443` | Main actions, selection and brand accents |
| Primary strong | `#005B35` | Hero surface and pressed emphasis |
| Primary soft | `#E7F3EB` | Selected containers and gentle highlights |
| Canvas | `#F6F8F5` | Main page background |
| Surface | `#FFFFFF` | Cards, forms and sheets |
| Text primary | `#18251E` | Headings and body text |
| Text secondary | `#536259` | Supporting text, never very pale essential copy |
| Outline | `#DCE5DD` | Dividers and subtle card borders |
| Danger | `#B42318` | Emergency actions and actual errors |
| Warning | `#885200` on `#FFF3D6` | Warnings with icon and text |
| Informational | `#175CD3` on `#EAF2FF` | Neutral informational accents |
| Dark canvas/surface | `#101A14` / `#19261E` | Peace dark appearance |
| Dark text/primary | `#EDF5EF` / `#89D8AB` | Readable dark text and selected accents; use a dark foreground on light green buttons |

- Spacing scale: 4, 8, 12, 16, 20, 24 and 32. Phone page gutters: 20; use 16 for very narrow widths.
- Card radius: 16; prominent hero radius: 20; field/button radius: 12; chips fully rounded.
- Button height: minimum 48, usually 52. Icon-only hit area: minimum 48 × 48, including visually smaller icons.
- Typography: page heading 26–28/32, section heading 20/26, card title 16–18/24, body 14–16/22–24, supporting labels 12–13/18. Values are starting sizes, not caps on system text scaling.
- Use medium/semibold emphasis selectively. Avoid bold labels everywhere and uppercase paragraphs.
- Use the existing normal UI font with language-capable fallbacks first. Keep `PixelGame` confined to appropriate game content. A new font is optional only after script coverage and asset cost are verified.
- Prefer borders and very soft static shadows. Do not use layered glowing shadows, expensive full-screen blur or glass effects.
- Use consistent Material icon families and weights. Replace decorative emoji with icons where reliable rendering is required. Preserve native language labels as valid Unicode.

### 4.3 Reusable components

Update the existing `mobile/lib/core/design/` tokens and active `mobile/lib/core/theme/` wiring. Do not create another competing design-system directory. Review `core/design/app_theme.dart` against the actual theme entry before changing it.

Build or adapt these components only when needed by the first consuming screen:

1. Page header: title, optional supporting line, optional trailing action, consistent safe-area behavior.
2. Primary, secondary and danger buttons: normal, pressed, focused, disabled and pending states with stable width.
3. Form field: label, leading icon if useful, validation message, password toggle and visible focus treatment.
4. Content card: thumbnail/icon, title, useful metadata, progress when available, explicit destination affordance.
5. Score hero and contribution row: presentation only, receiving actual values and availability state.
6. Status banner: text/icon plus severity; reusable for unavailable connection or a real alert without equating them.
7. Filter chip and segmented control: clear selection, focus and large text wrapping/scrolling.
8. Loading, empty and error sections: shared spacing, meaningful retry action, stable layout.
9. Bottom navigation and action tray: safe-area aware, no content obstruction.
10. Motion helpers: shared timings and reduced-motion handling within existing animation utilities.

### 4.4 Artwork handoff

Plan three reusable illustration families: school welcome/onboarding, learning preparedness, and scenario/game cover. Use consistent people, palette, line treatment and lighting. Keep text outside images so localization and scaling work.

Store new assets under a clearly named subdirectory of existing `mobile/assets/images/` during implementation. Prefer optimized WebP/PNG, provide useful crop space and avoid essential details at image edges. Target under 250 KB for a typical hero and under 1 MB for the combined initial welcome artwork; these are budgets to measure, not permission to degrade legibility. Do not preload the entire media library.

Every asset handoff must record filename, purpose, dimensions, crop behavior, semantic/decorative status and provenance. Use temporary neutral placeholders only in review builds. Do not ship screenshot crops, illegible generated text or imitation Google sign-in controls.

## 5. Motion specification: smoothness is a release requirement

“Smooth” means immediate feedback, predictable continuity, stable scrolling and no visible stalls on the agreed baseline device. It does not mean animating every widget or stretching every interaction.

### 5.1 Motion tokens and recipes

Use Flutter SDK animation primitives first. Extend `mobile/lib/core/widgets/enhanced_animations.dart` and add a small duration/curve token file under the existing design directory if needed. Do not introduce a new animation package for ordinary fades, slides, selection or press feedback.

| Interaction | Target motion | Timing | Constraints |
| --- | --- | --- | --- |
| Button press | Scale 1.0 to 0.98 and subtle surface change; return on release | 80 ms press, 120 ms release | Keep hit target stationary. Action follows the tap handler immediately, not animation completion |
| Primary pending action | Label-to-progress crossfade inside the same button bounds | 120–160 ms | Prevent repeated submission using existing pending state; no success indication before actual result |
| Bottom navigation | Indicator and icon emphasis animate; destination appears immediately | 160–200 ms | No horizontal carousel between tabs, no stacked animations after rapid taps |
| Page push/pop | Platform-appropriate native transition | Approximately 220–300 ms where configurable | Preserve platform back gestures and lifecycle; do not wrap every route in another transition |
| In-page section reveal | Opacity plus at most 8–12 px upward movement | 180–220 ms, ease-out | First reveal only. Optional 30 ms staggering for at most four items, total under 320 ms |
| Cards while scrolling | Normal native scrolling | No per-scroll entrance effect | Do not hide and replay rows each time they enter the viewport |
| Sheet | Standard modal sheet transition | Approximately 240–280 ms | Preserve drag dismissal, focus and keyboard behavior |
| Chip selection | Background/border/text emphasis | 140–160 ms | No bounce or size change that shifts neighboring chips |
| Onboarding | PageView transition and animated page indicator | 280–300 ms | User-controlled only; no auto-advance or autoplay carousel |
| Score update | Ring interpolates from previous displayed value to actual new value | 400–600 ms | One animation per changed value. No reset to zero on every tab visit; semantics announce final value only |
| Filtered content | Short transition between stable states | 120–180 ms | Do not animate whole long lists or allow outgoing invisible content to receive taps |
| Loading | Small progress indicator; optional subtle skeleton on large initial content areas | No minimum waiting time | No forced delay for a loader to finish. Avoid many independent shimmer controllers |
| Game choice | Selection border/fill, then content transition when response arrives | 140 ms selection, 180–220 ms response | Motion does not modify choice, context history or result |
| Chat message | Small fade with at most 8 px movement | 120–180 ms | Never animate text character by character when the API returns a complete answer |
| Achievement | Badge scale 0.94 to 1.0 and restrained decorative particles | 300–450 ms badge; particles at most 1.2 s | One-shot, dismissible immediately, never used in emergency mode |
| Error presentation | Border/message reveal | 120–160 ms | No shaking fields or flashing red screen; preserve typed input |
| Emergency entry | Immediate stable content | 0 ms decorative delay | No hero animation, celebration, bounce or blocking reveal before actions are usable |

Use `Curves.easeOutCubic` for settling and `Curves.easeInOutCubic` for reversible local transitions where appropriate. Native routes retain their platform behavior. Avoid elastic or overshooting curves for ordinary controls.

### 5.2 Reduced motion and accessibility

Read the platform animation preference through the Flutter media/accessibility APIs available in the installed SDK. Also honor accessible navigation where relevant. If motion is disabled, render the final presentation directly: no slide, scale, count-up, stagger, shimmer or particles. A subtle opacity change of at most 80 ms is optional only when it does not conflict with the platform preference; an immediate change is the safe default.

A progress indicator must still communicate pending work in reduced-motion mode through a stable icon and text such as “Loading.” Never make animation the only indicator of selected, loading, success or error state.

Do not announce every interpolated score frame to screen readers. Announce the actual final value once. Preserve keyboard focus through transitions. Exclude decorative artwork and particles from semantics. Existing emergency sound/haptic policy is outside this animation redesign; do not quietly change it.

### 5.3 Engineering rules that prevent jank

- Keep business requests and synchronous heavy work out of animation builders and `build()`.
- Use implicit animations for small state changes and shared explicit controllers only where sequencing actually requires them.
- Dispose controllers and observers. Apply `TickerMode` to inactive preserved tab subtrees where appropriate; an `IndexedStack` alone is not a guarantee that every ticker stops.
- Preserve tab state, list position, selected filters and input. Avoid rebuilding every tab to animate the navigation indicator.
- Use lazy list/sliver builders. Do not wrap a long catalogue in a giant non-lazy column simply to animate it.
- Decode artwork near its displayed resolution; reserve image dimensions before loading to avoid layout jumps.
- Do not crossfade live video, a camera preview or a map texture through multiple expensive layers. Keep those surfaces stable and animate lightweight surrounding controls.
- Use `RepaintBoundary` only where profiling shows useful isolation, not around every widget.
- Avoid animated blur, repeated shadow rasterization, clipping layers over full-screen content and full-screen opacity stacks.
- Cancel or retarget presentation animations on new input. Rapid taps must end in the latest selected state with no queued replay.
- Pause decorative motion when backgrounded or offscreen. Do not silently change media playback policy or business timers under this optimization.
- Use a stable layout for skeleton, error and loaded states where possible. Do not replace a full screen with a spinner during every small refresh.

### 5.4 Performance acceptance and measurement

Define and record one real low/mid-range Android baseline device before implementation: model, chipset, RAM, OS and refresh rate. Also check a modern high-refresh device when available. Emulator/debug smoothness is not release evidence.

For 60 Hz, the frame interval is approximately 16.7 ms; at 120 Hz it is approximately 8.3 ms. Inspect UI and raster frame times separately in profile mode. These are frame budgets, not a claim that every device will hold every refresh rate.

Release targets for repeatable warm UI journeys on the baseline device:

- At least 99% of measured UI and raster frames fit the 60 Hz budget during a 30-second catalogue scroll and repeated ordinary transitions.
- No repeatable UI-induced stall over 50 ms during button feedback, tab switching or opening a normal sheet.
- Visible tap feedback begins within 100 ms; business result latency remains determined by existing services.
- No monotonic memory/controller growth over five repeated Home → Learn → detail → back → Games → Profile cycles. Record measurements and investigate retained objects rather than enforcing an arbitrary universal memory ceiling.
- No decorative animation causes sustained background work after leaving the screen.
- Cold start time and UI asset size do not regress materially without a documented reason. Target no more than 10% cold-start regression against the same-device baseline over five launches; record individual runs and median.

Measure first cold transitions as well as warm runs; report them separately so warm averages do not hide first-use jank. Capture Flutter DevTools performance traces for Home scroll, tab changes, learning list, scenario selection, sheet/keyboard interaction and achievement animation. External video buffering, network latency and map loading must be reported separately from UI frame performance.

If a target fails, first remove expensive decoration, reduce animated area, resize images and narrow rebuilds. Do not compensate by adding longer animations or changing backend behavior. Smoothness cannot be promised on every device without measurement.

## 6. Phase 0 — Freeze scope and capture the baseline

**Dependency:** None. **Outcome:** A reviewable reference for proving that the overhaul changes presentation only.

1. Record HEAD, existing dirty paths, current app launch command, Flutter version and device details. Preserve unrelated work; do not reset the tree.
2. Capture the current main journeys using anonymized student, parent and teacher accounts, including restricted and child-mode cases where available.
3. Trace `mobile/lib/main.dart`, `core/navigation/app_router.dart`, `features/dashboard/screens/dashboard_screen.dart` and `core/widgets/navigation/scaffold_with_bottom_nav.dart`.
4. Record the existing handlers behind sign-in, class join, score refresh, lesson completion, scenario choices, drill participation, assistant send and emergency actions. Document method, endpoint, relevant payload keys and action eligibility from source. Do not copy tokens or personal data.
5. Read the relevant models and preserve their exact semantics. In particular record score weights, the video completion threshold and the existing scenario context construction.
6. Capture baseline analysis/test failures separately from UI work. Existing test results in older audit reports are historical evidence only.
7. Measure the performance journeys from §5.4 before adding effects.

**Deliverables:** UI route inventory, contract checklist, baseline screenshots, known-issue list and performance baseline. Proposed evidence location: `docs/ui-overhaul/` created during implementation.

**Exit gate:** Every first-release destination has a known current source and handler. Missing contracts are deferred, not guessed. The initial implementation diff can be distinguished from pre-existing changes.

## 7. Phase 1 — Establish the visual and motion foundation

**Dependency:** Phase 0. **Outcome:** One reusable visual language with tested interaction behavior.

**Primary existing files:** `mobile/lib/core/design/colors.dart`, `typography.dart`, `spacing.dart`, `borders.dart`, `design_tokens.dart`; `mobile/lib/core/theme/app_theme.dart`, `peace_mode_theme.dart`, `peace_dark_theme.dart`, `crisis_mode_theme.dart`; `mobile/lib/core/widgets/enhanced_animations.dart`; existing buttons, inputs, cards and state widgets under `core/widgets/`.

**Tasks:**

1. Apply the tokens in §4 through the active themes. Preserve current theme-provider behavior and the separation between peace dark appearance and crisis state.
2. Produce a small development-only component preview with light/dark, long labels, text scale, pending/error and reduced-motion examples. Do not add a production navigation destination for it.
3. Refine buttons and inputs first, then cards, status banners, chips, headers and loading states. Keep semantic labels and focus visibility.
4. Add shared motion timing and preference handling. Review existing fade/slide/scale helpers for replay behavior and excessive movement before reuse.
5. Prepare optimized illustration assets and document their crop/semantics. Use existing icons where artwork adds little value.
6. Check actual text/background contrast and disabled/focus states; no essential label should disappear into a pastel surface.

**Animation work:** Button feedback, selected chips, pending state crossfade, static reduced-motion states and one representative card reveal.

**Exit gate:** Components work at normal and 200% text scale, in both peace appearances, with TalkBack and reduced motion. A button triggers the same handler exactly once. No new animation dependency is required unless an explicit measured need is documented.

## 8. Phase 2 — Redesign the application shell and navigation

**Dependency:** Phase 1. **Outcome:** Consistent safe areas, predictable navigation and uninterrupted scrolling.

**Primary existing files:** `features/dashboard/screens/dashboard_screen.dart`, `core/widgets/navigation/bottom_nav_bar_custom.dart`, `core/widgets/navigation/scaffold_with_bottom_nav.dart`, `core/widgets/layouts/screen_layout.dart`, `responsive_layout.dart`, `core/navigation/app_router.dart` under `mobile/lib/`.

**Target decision:** Keep the existing student order **Home, Learn, Games, Profile, Ask** in this release. The collage's Ask/Profile swap is not necessary for the visual direction. Keeping order also preserves existing `initialTabIndex` callers. Restyle the navigation fully without changing index meaning.

**Tasks:**

1. Give navigation a subtle surface, clear selected indicator, consistent icon weight and readable labels.
2. Make safe-area ownership explicit between parent and child scaffolds. Remove accidental double top gaps and reserve space for bottom controls.
3. Preserve `IndexedStack` state. Ensure inactive tabs do not run decorative tickers.
4. Keep Home's existing tab-selection callback for Learn and Games; do not push another full tab shell for these shortcuts.
5. Use one scroll owner per normal page. Preserve scroll positions on tab return and keyboard dismissal behavior.
6. Define layouts at 320, 360, 390/412 and 600+ logical-pixel widths. Use content constraints and text scale, not device-name checks. Wide content may use two columns when it remains readable.
7. Keep emergency controls reachable without covering the last grid row, navigation labels or keyboard actions. Prefer a reserved action area or correctly inset existing button.

**Animation work:** Navigation selection indicator, native route transitions, lightweight sheets. No whole-screen sliding carousel for tabs.

**Exit gate:** Every tab, Home shortcut, back action and `initialTabIndex` caller reaches the same destination as before. Twenty rapid tab changes cause no lost input, duplicated routes or ticker errors. Last content remains reachable above system navigation.

## 9. Phase 3 — Welcome, onboarding and authentication

**Dependency:** Phase 2. **Outcome:** An inviting, compact entry journey that fits small screens and keyboards.

**Primary existing files:** `features/auth/screens/onboarding_screen.dart`, `login_screen.dart`, `register_screen.dart`; `core/widgets/kavach_logo.dart`; auth routing in `main.dart` and `core/navigation/app_router.dart`; QR screens under `features/qr/screens/`; class join under `features/student/screens/`.

**Tasks:**

1. Restyle the existing onboarding into three short panels with shared school artwork, concise benefits and clear Skip/Next/Get started actions.
2. Reuse `onboarding_completed`. Trace startup/session restoration before enabling first-launch entry. Returning signed-in users keep their existing authenticated destination; onboarding must not override role routing.
3. Keep native startup branding lightweight. Do not add a timed Flutter splash or require Get started on every launch.
4. Redesign login with a modest brand block, prominent title, labeled fields, clear forgot-password action and a full-width primary action. Keep account creation and supported class/QR entry discoverable without excessive competing borders.
5. Retain existing validation rules and request handlers. Do not add Google sign-in or Student ID credentials. If role guidance is shown, make it explanatory; server-authenticated roles remain authoritative.
6. Restyle registration steps and existing reset flows with the same field, error and button language. Preserve approval states and neutral account-recovery messaging.
7. Respect keyboard insets, autofill, focus traversal and password visibility semantics. Keep entered text after an error. Avoid footer rows that overflow in translation.
8. Preserve the distinction among classroom QR, login QR and parent-linking QR. Each screen should state its supported purpose.

**Animation work:** User-controlled onboarding transitions, page indicator interpolation, short form-section reveal and stable pending button. No form shaking or decorative delay before sign-in becomes usable.

**Exit gate:** Login/register/reset and supported QR flows use unchanged contracts. Skip and completion persist correctly. With keyboard open on a small phone, focused fields and submit actions remain reachable. No unsupported authentication button ships.

## 10. Phase 4 — Home and preparedness

**Dependency:** Phase 2; core identity from Phase 1. **Outcome:** Useful information is visible sooner, with one clear preparedness story.

**Primary existing files:** `features/dashboard/screens/home_screen.dart`, `features/score/screens/score_breakdown_screen.dart`, `score_history_screen.dart`, `core/widgets/displays/score_display.dart`, `core/widgets/cards/feature_card.dart`. Read existing score provider/model, but preserve calculation and service behavior.

**Target hierarchy:**

1. Compact greeting and account/avatar affordance.
2. Single green preparedness hero: actual score, explicit label and breakdown action.
3. Relevant current connection/alert information only when supported by real state.
4. Four compact actions: Drills, Learn, Games and Quiz, keeping access gates.
5. Safety tip with selected language and honest date context.
6. Secondary existing tools under a clear “Safety tools” section.
7. Persistent, unobstructed emergency-help entry using the current manual screen.

**Tasks:**

- Remove repeated headline score displays. Move refresh/history into unobtrusive but discoverable actions.
- Show loading/unavailable separately from a real zero. Do not manufacture a trend pill when no comparable history exists.
- Redesign contribution rows around actual module/game/quiz/drill/streak values. Display supplied weights and units clearly without recomputing them in a widget.
- Use compact icon tiles with concise labels; avoid tall fixed-aspect cards full of blank space.
- Preserve current tip-fetch behavior and locale support. Do not represent an older tip as freshly issued merely by changing its date label.
- Do not display “You are currently safe” merely because an alert list is empty or a connection is unavailable.

**Animation work:** One restrained first-view reveal; score interpolation only on a real changed value; immediate final value with reduced motion. No perpetual glowing or rotating score decoration.

**Exit gate:** Source score and displayed final score match. Navigation and feature gates are unchanged. A refresh does not replay all page animations, reset scroll or clear visible useful data unnecessarily. Emergency entry is not obscured.

## 11. Phase 5 — Learning discovery and content

**Dependency:** Phases 1–2. **Outcome:** Consistent learning cards and a focused, accessible reading/viewing experience.

**Primary existing files:** `features/dashboard/screens/learn_screen.dart`; `screens/module_screen_file.dart`, `ndma_module_list.dart`, `module_detail_screen.dart`, `hearing_impaired_list.dart`, `video_player_view.dart`, `ndrf_language_screen.dart`, `ndrf_module_detail_screen.dart`; read `models/module_models.dart` and corresponding `data/` files.

**Tasks:**

1. Redesign the active Learn destination, `ModuleScreenFile`, rather than only the alternate module-list implementation.
2. Present NDMA, NDRF and sign-language resources as coherent source/format choices. Add a featured local item only from actual available content with a valid destination.
3. Keep search scope explicit. NDMA-only search must say so; any wider local search needs a real mapping of available items and routes without extra server behavior.
4. Use thumbnails or consistent hazard icons, readable titles, short descriptions and supported duration/level/progress metadata. Omit absent metadata rather than inventing it.
5. Make source lists scrollable and long titles wrap without colliding with play actions.
6. Redesign detail pages with stable aspect-ratio player, title, meaningful metadata, supported summary and the existing next eligible action.
7. Show Transcript/Related sections only when real content exists. Do not create cosmetic tabs that contain placeholders in production.
8. Preserve the player's existing 95% completion rule, callback behavior, resume handling and quiz eligibility. The collage's manual completion button is excluded.
9. Sign-language videos must keep hands and face visible with appropriate fitting. Do not crop essential signing to create an attractive cover.
10. Preserve honest remote/bundled/offline availability. Cached metadata is not a downloaded video.

**Animation work:** Short filter selection and loading-to-content transition; optional lightweight thumbnail transition where it does not affect a live player. Keep video/camera textures stable. Playback controls must respond immediately.

**Exit gate:** Each source opens the same real media or content. Completion and quiz requests are unchanged. Progress never gains a false nonzero sliver for a true zero. Slow loading, failed media and returning from full screen retain readable states and usable navigation.

## 12. Phase 6 — Games, scenarios, comics and drills

**Dependency:** Phases 1–2; shared cards from Phase 5 where useful. **Outcome:** A playful but organized practice area.

**Primary existing files:** `screens/main_menu_screen.dart`, `comic_reader_screen.dart`, `features/games/screens/disaster_scenario_screen.dart`, `web_game_screen.dart`, `features/drills/screens/drill_list_screen.dart`, `drill_detail_screen.dart`.

**Games and comics:**

1. Use one illustrated featured game card, then compact rows for the actual games. Do not label unrelated static games as AI-powered.
2. Replace broken decorative emoji with reliable icons. Remove hard-coded card heights that cut off long names or translated actions.
3. Separate comic character, language and hazard choices into clear sequential groups. Preserve exact asset paths and available audio combinations.
4. Restyle comic reader controls without changing audio availability, lesson content or game mechanics. Keep existing orientation behavior unless a separately tested presentation change is necessary.
5. Give external web games a coherent wrapper and existing loading/error affordances. Do not rebuild third-party games or their backend.

**Scenario:**

1. Show existing scenario text over/under suitable decorative artwork; artwork must not contradict the scenario.
2. Present actual returned options as large accessible choice cards. A selection may be held locally before Continue.
3. Continue calls the existing `_onChoice` exactly once with the selected option. Preserve `stepIndex`, `userChoice` and `previousContext` construction.
4. Preserve `_applyResponse` interpretation. Do not recalculate consequences or safety results in the UI.
5. Use “Step N” unless a total is supplied. Preserve selection while pending and explain actual errors through the existing retry path without silently resubmitting a choice.

**Drills:**

1. Restyle the existing four tabs: All, Scheduled, Active, Completed. Preserve `all`, `scheduled`, `in_progress`, `completed` filter semantics.
2. Show actual title, date, location and status when available. Cards open the existing detail route using the real drill ID.
3. Present the existing eligible detail action; do not add an unconditional “Join drill” to every card.
4. Defer calendar integration and new reminders. Empty history remains an empty state, not a fabricated sample drill.

**Animation work:** Game-card press feedback, selected answer transition, response reveal after data arrives, tab selection and restrained result presentation. No animation-driven request submission or score award.

**Exit gate:** All game routes and comic assets remain reachable. Scenario request sequence is unchanged for the same choices. Drill filters and action eligibility match the baseline. Rapid Continue taps cannot create duplicate UI-triggered submissions.

## 13. Phase 7 — Assistant, profile and real achievements

**Dependency:** Phases 1–2. **Outcome:** Clear personal tools and a polished conversational surface.

**Primary existing files:** `features/dashboard/screens/ask_kavach_screen.dart`, `features/profile/screens/profile_screen.dart`, `features/badges/screens/badge_collection_screen.dart`, `badge_detail_screen.dart`; read `features/badges/providers/badge_provider.dart` and existing locale provider/localizations.

**Assistant tasks:**

- Use an uncluttered header, brief introduction, a few actionable suggested prompts and clear user/assistant message styling.
- Preserve the current question and preferred-response-language payload and actual response interpretation.
- Keep composer visible above the keyboard with wrapping input, accessible send/microphone controls and stable pending state.
- Do not fake streaming by displaying characters on a timer. Keep unsupported citations, confidence ratings and location claims out of the interface.
- Keep current speech behavior unless explicitly documented as a frontend interaction change with parity checks; visual polish must not accidentally add voice submissions or change recognition lifecycle.
- Preserve scroll intent: do not force the user to the bottom while they read an older message.

**Profile tasks:**

- Use a compact account card, then sections for learning, family/class tools, preferences and account actions.
- Preserve role-specific visibility. Parent linking QR and student ID should remain purposeful, readable and copyable where already supported.
- Show all existing supported UI locales through the existing localization system. Do not invent another preference store.
- Keep appearance controls distinct from crisis status. Preserve current dark behavior.
- Group badges/certificates/history without turning profile into a long wall of equally prominent cards.

**Achievement tasks:**

- First redesign the existing badge collection and detail screens using actual badge records.
- A celebration overlay is optional within this phase only when a newly earned badge can be reliably identified from existing state.
- Compare stable award identity within the user scope; do not treat first load of historical badges as new awards. If reliable identification is unavailable, ship polished badge detail without automatic celebration.
- Animation completion never calls an award endpoint. Dismissal must be immediate and return to the original task.

**Animation work:** Short message insertion, composer state transition, settings disclosure and one-shot achievement motion. No bouncing chat bubbles or looping badge confetti.

**Exit gate:** Requests, settings persistence, QR contents and badge records remain unchanged. Historical badge lists do not replay celebrations on every visit. Keyboard and screen-reader focus remain usable.

## 14. Phase 8 — Emergency, maps and remaining roles

**Dependency:** Shared shell/components stable; do not defer safety regression checks until this phase. **Outcome:** Consistent visual quality across operational and role-specific screens.

**Primary existing files:** `features/emergency/screens/manual_emergency_screen.dart`, `crisis_mode_screen.dart`, `red_alert_screen.dart`, `features/maps/screens/blueprint_map_screen.dart`; parent screens including `parent_shell_screen.dart`, `parent_dashboard_screen.dart`, `children_management_screen.dart`, `parent_profile_screen.dart`; teacher screens under `features/teacher/screens/`; role routing in `core/navigation/app_router.dart`.

**Tasks:**

1. Restyle `ManualEmergencyScreen` with a calm title, large explicit call actions and clear availability of institution messaging. Preserve its current manual-entry semantics.
2. Apply typography, spacing and contrast to real received-alert screens without modifying alert lifecycle, acknowledgement, GPS, queue or call logic.
3. Keep operational actions visible immediately. Do not hide them behind an illustration, animated countdown or delayed sheet entrance.
4. Restyle supported map surfaces and loading/unavailable states. Preserve route restrictions; do not replace unavailable routing with decorative routes or invented nearby facilities.
5. Keep photo-assessment and map results expressed according to actual existing evidence. Visual green must not manufacture a safety guarantee.
6. Bring parent dashboard and child-management cards into the same design language: concise child identity, distinct learning progress/status, clear details action and privacy-conscious supporting metadata.
7. Preserve parent tab destinations and linkage permissions. Do not reuse student navigation indexes for the parent shell.
8. Apply shared component improvements to teacher and child-mode screens, then correct text overflow and contrast introduced by the new tokens. Preserve role-specific task density and existing behavior.
9. Do not implement the inspiration's general incident wizard. Record it as a future capability requiring separately established contracts and product scope.

**Animation work:** Minimal state transitions for ordinary lists; immediate emergency action visibility; no decorative looping motion on operational screens. Preserve existing business-driven emergency behavior while avoiding new decorative flashing.

**Exit gate:** Entering help does not itself send an alert or place a call. Existing received-alert actions and disabled capabilities remain unchanged. No new “help is on the way,” “safe route,” or “currently safe” claim appears without existing evidence. All supported roles remain usable.

## 15. Phase 9 — Integration, motion tuning and release proof

**Dependency:** All required screen phases. **Outcome:** A coherent redesign with measured smoothness and preserved contracts.

### 15.1 Functional parity checks

Use meaningful existing tests plus focused new regression tests for behavior affected by the UI. Do not write tests that merely repeat every token constant.

| Journey | Required proof |
| --- | --- |
| Login and account recovery | Same validation, payload, role destination and error preservation |
| Navigation | Same destination for each tab, shortcut and initial index; preserved state on return |
| Learning | Same content IDs, media sources, completion threshold and quiz eligibility |
| Scenario | Same request payload sequence for the same selected choices; no duplicate submission |
| Drills | Same status filter values and eligible actions |
| Assistant | Same request structure and response meaning; no extra request from a rebuild or animation |
| Profile and badges | Same user data, preferences and real rewards; no reward created by presentation |
| Emergency | Manual entry remains manual; actual alert behavior unchanged; no fake acknowledgement |
| Backend boundary | No backend/protocol/model/service modifications introduced by the UI implementation |

Capture sanitized request fixtures or use existing service mocks. Compare before/after operation count, endpoint and relevant payload values for the same interaction sequence. Do not record real credentials, QR tokens or children's personal details.

### 15.2 Visual and accessibility matrix

Check representative screens at 320, 360, 390/412 and 600+ logical-pixel widths; normal and 200% text scale; light and dark peace appearance; all supported locale labels; keyboard open; reduced motion enabled; screen-reader focus; slow/failed content; long names and long module titles.

Capture golden/reference images for components and representative screens where the repository test setup supports them. Avoid relying exclusively on screenshot tests for navigation, semantics and business parity.

### 15.3 Smoothness scenarios

1. Cold launch and first navigation to Home, Learn, Games and Profile.
2. Thirty seconds of long learning-list scrolling, then reverse direction rapidly.
3. Twenty tab switches, including while an ordinary data request is pending.
4. Open/close the keyboard repeatedly in login and assistant; retain focus/input correctly.
5. Open a detail page and return repeatedly; no hero tag conflict, media texture flicker or controller leak.
6. Select scenario choices under delayed responses; one request per explicit submission.
7. Trigger one genuine badge presentation; dismiss immediately; no replay on tab return.
8. Enable reduced motion and repeat the same journeys; every result remains understandable.
9. Enter emergency help during other UI motion; actions appear immediately.
10. Background/resume and rotate supported media screens; no resumed decorative animation storm or lost route state.

Record profile traces, frame distributions, cold-start measurements and issues resolved against §5.4. If the baseline device is unavailable, mark performance acceptance incomplete rather than claim smoothness from code inspection.

### 15.4 Release and rollback

Deliver implementation in small phase-scoped commits or equivalent reviewable patches. Each phase includes screenshots and parity evidence. Avoid a new remote feature-flag system; use ordinary review builds and the existing distribution process.

Rollback should revert only the relevant UI patch and its directly added assets. There must be no backend migration or data rollback because this plan introduces none. Preserve pre-existing work and do not revert unrelated backend/Firebase changes when reverting the redesign.

**Final exit gate:** Core flows pass; all visible production controls work; required states and accessibility checks pass; motion meets the recorded baseline-device targets; no unauthorized backend/domain changes appear in the implementation diff.

## 16. Implementation sequence and checkpoints

| Phase | Checkpoint artifact | Must be complete before |
| --- | --- | --- |
| 0 | Current screenshots, route/contracts inventory and measured baseline | Any UI implementation |
| 1 | Tokens, component preview, illustration direction and motion samples | Screen-wide rollout |
| 2 | Working shell with preserved destinations and safe areas | Main tab screen rollout |
| 3 | Welcome/auth screens and keyboard proof | Entry journey sign-off |
| 4 | Home and real score breakdown | Main dashboard sign-off |
| 5 | Learning catalogue/detail/player parity | Learning sign-off |
| 6 | Games/scenario/comics/drills parity | Practice sign-off |
| 7 | Assistant/profile/real badge presentation | Personal tools sign-off |
| 8 | Emergency/map/parent/teacher/child-mode consistency | Whole-mobile sign-off |
| 9 | Visual matrix, request parity and device performance evidence | Release |

Phases 3–8 may be developed independently after the shared foundation is stable, but should be integrated in this order to keep review manageable. Motion is implemented and measured inside every phase; Phase 9 tunes and verifies it rather than adding all animation at the end.

Do not attach a fixed delivery date before Phase 0 identifies build health, device availability and artwork effort. Estimate each phase after its inputs are known. The required finish line is completion of the gates, not an arbitrary number of screens per day.

## 17. Handoff instructions for another implementation model

For each phase, read this document, the named current source and existing repository instructions. Treat historical reports as context and current source as authoritative.

Before editing, state the exact UI files and existing handlers the phase will use. If a proposed design requires changing a frozen contract, remove that proposal from the phase and list the dependency. Do not implement a fake replacement.

For each completed screen, provide:

- The previous layout and new layout, with screenshots using the same anonymized data.
- Changed components and source paths.
- Existing provider/handler bindings retained.
- Loading, error, empty, pending and unavailable behavior where applicable.
- Motion recipe, timings, reduced-motion behavior and interruption handling.
- Keyboard, long-text, localization and role checks.
- Relevant tests and measured performance evidence; explicitly identify checks not run.
- Remaining issues and whether they are presentation work or deferred business/backend work.

Do not mark a screen complete because it resembles the collage. Completion requires usable interactions, preserved contracts and smooth measured behavior.

### 17.1 Final scope checklist

- [ ] Existing brand retained with a coherent new green educational visual direction.
- [ ] Existing backend and client business behavior preserved.
- [ ] All 16 inspiration screens accounted for as implemented, adapted or deferred.
- [ ] Unsupported Google login, incident wizard, fabricated maps, fake metrics and manual completion bypass excluded.
- [ ] Current onboarding, active Learn route, real dark theme and manual emergency entry reused correctly.
- [ ] Smooth motion implemented progressively, with no animation-dependent side effects.
- [ ] Reduced motion, accessibility, locale and small-screen behavior verified.
- [ ] All supported role journeys retain their destinations and permissions.
- [ ] Device profiling supports the smoothness claim.
- [ ] Existing unrelated working-tree changes preserved.

The intended outcome is a visibly redesigned, more usable and smoother mobile application, powered by the same backend and existing product behavior.
