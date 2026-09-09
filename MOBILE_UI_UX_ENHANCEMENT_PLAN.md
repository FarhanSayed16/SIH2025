# Mobile UI/UX Enhancement Plan

**Project:** EduSafe / K.A.V.A.C.H mobile application  
**Prepared:** 9 September 2026  
**Source baseline:** Git commit `869607b`, plus the eleven mobile screenshots supplied in this conversation.  
**Status:** Implementation specification; no application changes are made by this document.  
**Scope:** Mobile authentication, student navigation, Home, Learn, NDMA, NDRF, sign-language learning, Games/comics, parent dashboard and child management, and the connected mobile journeys needed to make those screens work properly. Web UI planning is deferred until the web screenshots arrive.

## 1. Purpose and how to use this document

The target is a coherent, readable and trustworthy disaster-preparedness application. Users should quickly understand their next learning action, their connection state and the meaning of any safety information. Parents should distinguish a child's learning progress from a reported safety status. Emergency controls must remain accessible without covering other actions.

This is a specification for improving the existing Flutter application, not a proposal to replace it. Keep Flutter, Riverpod, existing authentication, role restrictions, working content, services and platform integrations. Reuse existing components where they meet the requirements. Do not create a second design-system directory, navigation framework or generic configuration engine.

Each implementation task must distinguish these evidence categories:

| Label | Meaning |
| --- | --- |
| **Observed** | Visible in a supplied screenshot. A screenshot alone does not prove the current source behaves identically. |
| **Verified** | Confirmed in the checked-out source at the baseline above. Source references use repository-relative paths and baseline line numbers. |
| **Required** | Proposed target behavior for the enhancement work. It is not already implemented merely because it appears here. |
| **Dependency** | A service, content or backend change required before the proposed UI can truthfully advertise a capability. |
| **Deferred** | Useful follow-up that is not required for the initial enhancement release. |

Priorities are **P0: misleading or broken interactions**, **P1: core usability and visual consistency**, and **P2: additional convenience after the foundations work**. P0 items are not all styling changes; several require correcting the data supplied to the interface.

Before editing, read the relevant source again. Line numbers will move. Search the named class or method rather than copying an old line number into a patch. Read [AUDIT_FIXES.md](AUDIT_FIXES.md) and preserve its security and routing protections. Historical tests in that report are not evidence that the new UI or every journey below passes today.

### 1.1 Evidence and limitations

- All eleven screenshots were inspected. They include different versions of the login logo and Home text encoding; they are not assumed to be one reproducible build.
- Graphify was queried for navigation, then the actual Flutter widgets, models, services and selected backend contracts were read. A graph name match is not proof of runtime behavior.
- The existing graph contains 11,957 nodes and 20,442 edges. Its file hash matches its recorded validation report. Comparing its 883-file source manifest with the current files found four firmware files changed; the mobile source entries matched. The graph is suitable for mobile navigation here, but this document does **not** certify the whole graph as current for firmware.
- Graph structural validation is recorded in [graph-validation.json](graphify-out/remediation/graph-validation.json). Broader audit or firmware work should refresh that portion before using it as current evidence.
- No simulator/device session or fresh application build was run for this planning task. Screenshot clipping and spacing are observations; dynamic keyboard, scrolling, accessibility and delivery behavior require the checks below.
- Screenshot pixels are not Flutter logical pixels. The proposed dimensions below are design decisions in logical pixels, not measurements reverse-engineered from these images.
- Screenshots remain conversation attachments; this document identifies them by their contents. No nonexistent screenshot files are referenced. Implementation evidence should use anonymized test accounts.

## 2. Screenshot inventory and exact implementation map

| ID | Supplied image | Active source and important symbols | Existing concern | Target section |
| --- | --- | --- | --- | --- |
| S01 | Login with circular logo | `mobile/lib/features/auth/screens/login_screen.dart`, `LoginScreen`; `core/widgets/kavach_logo.dart`, `KavachLogo` | Large decorative header and form spacing; registration near system navigation; join buttons appear to offer a logged-out alternative | §7 |
| S02 | Manage Children with search and two cards | `mobile/lib/features/parent/screens/children_management_screen.dart`, `ChildrenManagementScreen` | Tall repeated cards, exposed emails, unexplained score and safety labels | §14 |
| S03 | Parent Dashboard with counts and child cards | `mobile/lib/features/parent/screens/parent_dashboard_screen.dart`, `ParentDashboardScreen`; `features/parent/widgets/parent_bottom_nav.dart` | Redundant information, oversized counters, hard-coded child safety display | §13 |
| S04 | Purple Sign Language Modules list | `mobile/lib/screens/hearing_impaired_list.dart`, `HearingImpairedList`; `data/hearing_impaired_data.dart` | Long titles compete with play icons; metadata mixes format and file size | §11 |
| S05 | NDMA Modules catalogue | `mobile/lib/screens/ndma_module_list.dart`, `NdmaModulesList`; `data/module_data.dart`; `models/module_models.dart` | Raw descriptions, crowded metadata, false nonzero progress segment | §10 |
| S06 | Featured games and Safety Comics | `mobile/lib/screens/main_menu_screen.dart`, `MainMenuScreen`; `features/dashboard/screens/games_screen.dart` | Broken emoji encoding, fixed-size cards, crowded selectors, misleading AI grouping | §12 |
| S07 | Disaster Management / three source cards | `mobile/lib/screens/module_screen_file.dart`, `ModuleScreenFile`; `features/dashboard/screens/learn_screen.dart` | Inconsistent source labels and colors; non-scrollable source menu | §9 |
| S08 | Home Quick Actions lower scroll | `mobile/lib/features/dashboard/screens/home_screen.dart`, `_buildQuickActions`, `_buildEmergencyFAB`; `core/widgets/cards/feature_card.dart` | Excessively tall grid, misleading drill label, emergency button overlaps a card | §8 and §15 |
| S09 | Home greeting, score and readable language chips | Same Home screen; `features/score/providers/preparedness_score_provider.dart` | Duplicate score, weak explanation, old date under “Today's” tip | §8 |
| S10 | Earlier Home with corrupted moon/language text | Same Home screen | Historical encoding failure; current Home uses Unicode escapes for these labels | §6 and §8 |
| S11 | Earlier Login with smaller square logo | Same Login screen and logo component | Brand/layout inconsistency between supplied builds | §7 |

**Important routing distinction:** the pictured Learn tab returns `ModuleScreenFile`, not `features/modules/screens/module_list_screen.dart`. The latter has another catalogue/filter implementation, but no instantiation was found in the mobile source search. Editing only that file would miss the supplied screens. The pictured Games tab similarly returns `screens/main_menu_screen.dart`.

### 2.1 Baseline problems that affect implementation confidence

`mobile/lib/features/dashboard/screens/learn_screen.dart:3` imports `../../../../core/providers/access_level_provider.dart`; line 6 imports `../../../../screens/module_screen_file.dart`. From that directory these resolve outside `lib`, to absent `mobile/core` and `mobile/screens` paths. The corresponding intended files are under `mobile/lib`. This is a verified relative-path problem, not a fresh compiler result. Correct the imports and establish a current build baseline before judging a redesigned Learn screen. Do not assume the historical audit build proves this checkout compiles.

## 3. Product direction and boundaries

### 3.1 Target experience

1. **Student:** sign in, identify the next available learning activity, open it, resume verified progress, and understand what is available without a network.
2. **Parent:** see linked children, inspect reported status and its timestamp, open meaningful progress details, and act on real notifications.
3. **Any authorized emergency participant:** open emergency assistance, intentionally request help or report status, and see whether the request is waiting, accepted or failed.
4. **Learner using another language or sign-language content:** find the appropriate format without navigating an unrelated disability label; read controls and operate playback comfortably.

### 3.2 Decisions for the first implementation

- Keep **EduSafe** as the product title because `AppConstants.appName` already uses it. Use the existing **K.A.V.A.C.H** mark consistently as the associated logo. This is a deliberate continuity decision, not a claim that two competing brands have been resolved externally.
- Use one logo treatment and one subtitle: **“Learn safety. Practise preparedness.”** The existing longer description can remain in About. Do not rename package identifiers, backend keys, asset directories or notification channel IDs for a visual branding change.
- Use a calm neutral canvas, dark green primary actions, readable dark text, and restrained category accents. Reserve strong red for errors and emergency/help context, not a beginner's low learning score.
- Keep the student tabs in their current order: **Home, Learn, Games, Profile, Ask**. Keep parent tabs in their current order: **Dashboard, Children, Scan QR, Notifications, Profile**. Shorten the visible parent notification label to **Alerts** only if it improves fit; the destination remains the notification list.
- Preserve distinct teacher and younger-child entry points. Screenshots do not cover those dashboards. Shared component changes must not break them, but their independent redesign is not part of this document.
- Do not add leaderboards, streak pressure, a new reward currency, biometric sign-in, a chat framework, paid stock artwork or a replacement state-management system as part of this work.

### 3.3 What must remain true

- Tenant approval, roles and access levels remain enforced by the existing backend. Hiding a tile is not authorization.
- Manual emergency entry is distinguishable from a real received incident. Opening a screen must not fabricate an alert, send status or start a call.
- AR evacuation routing remains unavailable until verified routing is implemented. Do not restore fabricated route lines, compass destinations or client-created route broadcasts.
- Mesh messages, crisis status messages and socket events are separate delivery paths. A correction to one queue does not prove the other paths acknowledge delivery.
- An offline label must describe actual available content. Cached module JSON is not a downloaded video.
- Local estimates, server-confirmed scores and safety reports must not be conflated.

## 4. Shared visual foundation

### 4.1 Use the existing design code, with one runtime owner

Relevant files:

- [Runtime theme selector](mobile/lib/core/theme/app_theme.dart), `AppTheme.getTheme`.
- [Peace theme](mobile/lib/core/theme/peace_mode_theme.dart) and [crisis theme](mobile/lib/core/theme/crisis_mode_theme.dart).
- [Enhanced theme](mobile/lib/core/design/app_theme.dart), `AppThemeEnhanced`, plus another class named `AppTheme`.
- [Color tokens](mobile/lib/core/design/colors.dart), [typography](mobile/lib/core/design/typography.dart), [spacing](mobile/lib/core/design/spacing.dart), [borders](mobile/lib/core/design/borders.dart).
- [Application bootstrap](mobile/lib/main.dart#L369), which currently imports the runtime theme selector, not the enhanced design theme.

**Required approach:** keep `core/theme/app_theme.dart` as the public runtime entry point. Make its selected themes consume the existing design tokens. Update shared widget defaults to read `Theme.of(context).colorScheme` and `textTheme` for semantic colors and text. Keep category-specific accent colors local only where they convey a real category. Consolidate overlapping enhanced-theme definitions incrementally after checking their callers; do not activate the entire unused theme merely because its name sounds newer.

`main.dart` sets `themeMode` but does not provide a separate `darkTheme` in the inspected configuration. Crisis mode is a product state, not an ordinary dark appearance. Complete a real dark palette through the same theme entry point before presenting dark appearance as supported. Do not use crisis mode as the dark-theme implementation. Dark appearance is P2; legibility in the existing crisis state is P0/P1.

### 4.2 Proposed color tokens

These are target values, not measurements of the screenshots. Verify each rendered foreground/background combination before release, including disabled, pressed and focus states.

| Semantic role | Proposed light value | Usage |
| --- | --- | --- |
| Primary | `#216E39` | Main buttons, selected navigation, links |
| On primary | `#FFFFFF` | Text/icons on filled primary controls |
| Primary container | `#E8F3EB` | Selected chips, restrained positive backgrounds |
| Canvas | `#F6F8F7` | Page background |
| Surface | `#FFFFFF` | Cards, sheets, fields |
| Primary text | `#17221B` | Headings and body text |
| Secondary text | `#526057` | Supporting descriptions and timestamps |
| Decorative border | `#D8E2DB` | Nonessential card boundaries |
| Control outline | `#66756B` | Field/control boundaries when needed to identify a control |
| Informational accent | `#1D5F91` | Informational labels, learning metadata |
| Warning foreground / background | `#805400` / `#FFF4D6` | Pending or stale information with explicit text |
| Emergency/error foreground | `#B3261E` | Help/error emphasis |
| Emergency/error container | `#FCE9E7` | Error explanations; not a whole flashing page |
| Sign-language accent | `#7542A6` | Optional format icon/chip; not an independent app theme |

Adopt at least **4.5:1 for normal text** and **3:1 for qualifying large text** as the product's minimum text contrast targets. They follow the W3C contrast criterion; do not claim whole-app accessibility compliance from color checks alone. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

### 4.3 Type, spacing and component dimensions

| Element | Target at default text scale | Behavior when content grows |
| --- | --- | --- |
| Page title | 24, weight 600–700 | Wrap where appropriate; never collide with action icons |
| Section title | 20, weight 600 | Allow two lines |
| Card title | 16–18, weight 600 | Two lines initially; details expose full title |
| Body | 16, normal | Natural wrapping; no artificial scale clamp |
| Secondary metadata | 14 | Do not reduce below readability to fit a row |
| Button label | 16, weight 600 | Increase height or wrap layout instead of shrinking text |
| Page horizontal padding | 16 below 600 available width; 24 above | Center content on larger screens |
| Spacing scale | 4, 8, 12, 16, 24, 32 | Use existing token files; eliminate arbitrary large gaps |
| Standard card | 16 padding, 16 radius, 0–1 elevation | Content-driven height |
| Form control | Minimum 56 high, 12 radius | Helper/error text sits outside the minimum content height |
| Standard button | Minimum 48 high; primary form action 52 | Grow for text scaling |
| Icon | Usually 24; 40–48 icon container in cards | Hit target stays at least 48 × 48 |
| Bottom navigation | Platform component sizing; allow safe inset | Never hard-code total height including Android navigation |
| Section separation | 24 | Avoid stacked 24 + 32 margins between the same elements |

Use platform text rendering and script fallback initially. The declared `PixelGame` font belongs only to suitable game content, not login, safety messages, learning descriptions or parent information. Do not download a new font family merely for cosmetic uniformity.

Use a minimum 48 × 48 logical-pixel interactive target throughout this product. Test semantics with TalkBack and VoiceOver, preserve large text and display scaling, and keep interactions understandable without color. These choices apply Flutter's accessibility guidance. [Flutter accessibility](https://docs.flutter.dev/ui/accessibility)

### 4.4 Components to reuse and adjust

| Existing implementation | Required adjustment | Do not introduce |
| --- | --- | --- |
| `core/widgets/inputs/text_input.dart` / `password_input.dart` | Autofill hints, keyboard actions, focus progression, visibility tooltip, theme colors, reliable enabled/error states | Another unrelated auth input family |
| `core/widgets/cards/feature_card.dart` | Compact content layout; remove dependence on a tall bounded `Expanded` description for the new Home layout | A copy of every card for every role |
| `core/widgets/cards/module_card.dart` | Inspect field compatibility before adapting for the legacy learning model; keep honest progress and metadata | A forced migration to the disconnected catalogue model |
| `core/widgets/states/{loading_state,empty_state,error_state}.dart` | Short, contextual messages and local retry; keep search/actions outside replacement states | Full-screen blocking loaders for each small refresh |
| `core/widgets/displays/{badge_widget,progress_indicator}.dart` | Semantic labels, true zero and unknown states, readable colors | Safety labels inferred from decorative colors |
| `core/widgets/navigation/bottom_nav_bar_custom.dart` | Theme-driven colors, selected-state semantics, labels and badges that fit | A third student bottom navigation implementation |
| `features/parent/widgets/parent_bottom_nav.dart` | Match visual tokens while retaining parent destinations | Student routes assigned to parent indices |
| `core/widgets/layouts/screen_layout.dart` | Clear safe-inset ownership; support content that does not compete with docked actions | Global arbitrary bottom padding applied to every screen |
| `core/widgets/accessibility_wrapper.dart` | Prefer native control semantics; avoid duplicate labels; do not adopt its `ScalableText` clamp as the new default | Global text-scale suppression |

Do not blindly replace every caller of a shared component. First list callers and record which rely on fixed constraints, crisis colors or teacher/kid behavior. A small screen-local widget is acceptable when its domain data differs; a new generalized component is justified only by actual repeated use.

## 5. Navigation, responsive layout and system insets

### 5.1 Existing behavior to preserve

`DashboardScreen` uses an `IndexedStack` for Home, Learn, Games, Profile and Ask. Preserve tab state and access checks. `AppRouter` selects separate parent, teacher and kid home screens. Several tab children return their own `Scaffold`; Home uses `ScreenLayout`, which also returns a `Scaffold`. This nesting needs explicit ownership of app bars, scrolling and docked actions; it is not automatically a reason to rewrite all routes.

### 5.2 Required ownership

- The student dashboard owns the persistent bottom navigation and selected tab.
- A tab owns its content scroll position and page heading. Standalone detail pages own their back button and route-specific scaffold.
- The Home emergency entry is placed in a **reserved action area below Home content and above the shell's bottom navigation**, rather than floating over a quick-action tile. On other existing screens, retain authorized emergency access without inventing new global behavior.
- A real active-incident banner may expose the incident destination across authorized screens. Its visibility comes from real incident state, not a red color preference.
- Give each system inset one clear owner. `SafeArea` protects interactive content against operating-system intrusions; use measured layout constraints for app-owned navigation/action areas. Do not sum raw screen padding repeatedly. [Flutter SafeArea and MediaQuery](https://docs.flutter.dev/ui/adaptive-responsive/safearea-mediaquery)
- Keyboard appearance resizes scrollable forms. Keep the focused field and its error visible, and ensure the bottom form action can be reached. Do not float an unrelated emergency button above the login keyboard.
- Background decoration may extend under system UI. Text, buttons and list endings must remain reachable and visible above it.

### 5.3 Navigation behavior

| Trigger | Required destination/behavior |
| --- | --- |
| Home “Browse learning” | Select the existing Learn tab, preserving its state; do not push a duplicate Learn hub |
| Home “Play games” | Select the Games tab; direct game links may still push a specific game |
| Home “View drills” | Existing `DrillListScreen`; only use “Join active drill” when a real active drill is available |
| Home “Take a quiz” | Existing `LanguageSelectionScreen`; retain current quiz/content contract |
| Source catalogue item | Push that source's actual list/detail route; Back restores filters and scroll |
| Parent child card | Child detail for the selected child ID; no ambiguity between card body and details button |
| Parent Scan QR tab | Existing authorized parent QR flow, with purpose-specific instructions |
| Received notification | Authorized associated incident/child/drill if the payload supports it; unavailable resource gets a readable state |
| Logout or user change | Remove privileged routes and user-specific display state; never show the previous child's or learner's cached data |

Keep the current route system. A small callback from Home to its dashboard is sufficient for tab selection. Do not introduce a new routing package solely to implement these shortcuts.

### 5.4 Responsive rules

- Use the available content width from layout constraints, not the physical screenshot width.
- Below 360 available logical pixels, or when text scaling makes two columns unsuitable, use a single-column quick-action list.
- From 360 to 599, allow two compact action columns only if labels and descriptions remain readable. Content must determine height; no `childAspectRatio: 0.88` dependency for long translated text.
- At 600 and above, center form content at a maximum width of 480 and reading content at approximately 720. Use wider grids only where scanning benefits; do not stretch a two-child list across an entire tablet.
- Existing `ResponsiveUtils` names a 600 mobile breakpoint but classifies tablet at 900. Do not assume its current categories implement the proposed layout. Update shared classification only after caller review; local `LayoutBuilder` constraints may be the safer first step.
- At large text sizes, metadata uses `Wrap` or vertical layout; child cards and lesson rows grow. Keep critical status explanations visible rather than truncating them.
- Preserve portrait and landscape reading where possible. Game-specific orientation changes must restore the prior system/orientation state on exit.

## 6. Language, encoding, content and accessibility behavior

### 6.1 Existing state

The application uses hand-written localization classes under `mobile/lib/l10n/`, a custom localization delegate and `localeProvider`. Supported UI locales are English, Hindi, Marathi and Punjabi. These are not ARB-generated resources in the inspected tree; do not write instructions assuming `flutter gen-l10n` is already the source of truth.

Home's greeting emoji and Hindi/Marathi tip labels currently use valid Unicode escapes. That explains why S09 differs from S10. In contrast, `screens/main_menu_screen.dart:105,134,155` and other game-card strings still contain literal mojibake. A font swap alone does not repair corrupted source strings.

### 6.2 Required behavior

1. Repair affected strings at their source. Replace decorative game emoji strings with real `IconData` where appropriate. Review static content separately; do not run a blanket encoding conversion across binary assets or all disaster instructions.
2. Add new labels to the existing localization interface and all four implementations. Keep UI language separate from content/audio language: NDRF has more content languages than the application UI.
3. Use one persistent application-language selector in Profile, with an accessible entry from Login. Show native names: English, हिंदी, मराठी, ਪੰਜਾਬੀ. Verify translations with a competent reviewer before release.
4. A lesson-specific language choice applies only to that content. Label it “Content language.” A missing translation says which language is available; it must not silently show English under a selected Hindi label.
5. For Home's tip, display the language actually returned. Rapidly selecting languages must not let an older network response replace the newest selection.
6. Avoid all-caps role/status labels in normal prose. Use “Student,” “Reported safe,” “Status unavailable” and meaningful sentence case.
7. Format dates for the selected locale. Distinguish event time, last synchronization and last fetched time. Do not label an old dated tip “Today's safety tip.”
8. Expose labels and state for icon-only search-clear, password visibility, refresh, notification, play and overflow controls. Decorative icons should not create duplicate screen-reader announcements.
9. Keep text scaling enabled. Existing `ScalableText` clamps to 0.8–2.0 at `accessibility_wrapper.dart:140`; do not spread that limitation into redesigned screens. Test at 200% and beyond where the operating system permits.
10. Respect reduced-motion preferences. Remove delayed entrance animations from essential actions and emergency feedback. Decorative animation must not postpone access to an actionable control.

### 6.3 Copy replacements

| Existing copy | Required copy or rule |
| --- | --- |
| “Module BY NDMA” | “NDMA safety guides” |
| “Module by NDRF” | “NDRF training videos” |
| “Module by NDMA For Hearing Disabilities” | “Sign-language safety videos” with factual source attribution below |
| “Start Drill” when opening a list | “View drills” |
| “Hazard Screen AI” | “Check a photo for hazards” |
| “Check exit” | “Check an exit photo” with “Photo review cannot confirm a safe route” |
| “Featured AI Games” | “Featured safety games”; label individual AI-dependent experiences accurately |
| “Score: 20%” | “Preparedness score: 20/100” when that is the actual data contract |
| “SAFE” without evidence | “Status unavailable”; use “Reported safe” only for a real report |
| “Monitor your 2 children progress and safety” | Localized count-aware copy such as “Learning and reported status for 2 children” |
| “Today’s safety tip” on an old response | “Safety tip” plus the actual content date |
| Internal key / debug output | User-facing unavailable message with Retry only when retry can help |

## 7. Authentication and class joining — S01 and S11

### 7.1 Verified implementation

`LoginScreen.build` at `login_screen.dart:347` already uses `SafeArea` and `SingleChildScrollView`. Do not describe the screenshot as proof those widgets are missing. The current vertical expansion includes a `size.height * 0.08` top gap, large section gaps, card padding, and delayed animations reaching 1,300 ms for the registration footer. The footer is an unwrapped `Row`. The current logo configuration is 88 × 88 with a circular crop; S11 shows a different earlier treatment.

The submit button depends on `_isFormValid()` at line 534, while ordinary `onChanged` paths at 429 and 477 do not rebuild the parent unless an error exists. `onEditingComplete` does rebuild it. This can leave submit availability out of sync with typed text. `AuthService.login` at `features/auth/services/auth_service.dart:67` converts a `DioException` into a generic exception, whereas the screen's detailed error handling expects `DioException`. The typed validation exception used for registration does not yet solve login feedback.

The two prominent class-join buttons at lines 634 and 681 only ask an unauthenticated user to log in. They are not working alternatives to authentication.

### 7.2 Required layout

```text
Safe top inset
Language control
Consistent K.A.V.A.C.H mark, 72–88 logical pixels
EduSafe
Learn safety. Practise preparedness.

Sign in
Email label + input
Password label + input + accessible visibility action
Forgot password?
Sign in [primary]
Contextual error, when present

Have a class code? Join your class [secondary]
New to EduSafe? Create an account [text action]
Safe bottom inset
```

- Use a content-driven, centered form with maximum width 480. At default text size on a typical 360 × 800 viewport, aim to show the sign-in fields and submit action without scrolling; the entire page must still scroll on smaller screens or with enlarged text.
- Use at most 24 pixels between brand and form and 16 between form groups. Remove screen-height-proportional blank space and large nested cards around each secondary choice.
- A pale brand accent may remain at the top. The form surface should be plain enough to make field boundaries, errors and the primary action unambiguous.
- Place registration in a wrapping sentence or separate centered text action; no one-line constraint that pushes it off screen.
- Show the same logo crop in both login and loading/splash contexts where the full mark should be recognizable. Do not crop away necessary lettering by accident.

### 7.3 Required interactions

1. Typing or pasting into either field updates submit availability immediately. Disable submission only while required input is absent/invalid or a request is in progress; the reason must be understandable.
2. Email keyboard uses appropriate email entry, no autocapitalization, and Next. Password supports password-manager autofill, visibility state announcement, and Done. Done and button tap share one guarded submit path.
3. Preserve the entered email after failure. Never log password/token contents. Show field errors near fields; show connection or approval status as form-level feedback with a specific next step.
4. Extend the existing typed service error contract to login so pending approval, validation, invalid credentials and network failure remain distinguishable. Preserve neutral credential failure copy that does not expose account existence.
5. Keep the neutral forgot-password success message already present in `forgot_password_screen.dart:176`. Preserve invalid/missing reset token recovery from `reset_password_screen.dart:111`.
6. Improve the existing multistep `RegisterScreen`, including visible step names, Back, retained values and field-level errors. Do not remove role-specific fields or approval transitions. Login accepts the existing generic email policy; the registration-only Gmail restriction in `core/utils/validators.dart` must not be silently applied to login or removed during styling.

### 7.4 Class-code and QR flow

Keep one compact entry on Login: **“Join your class.”** Opening it shows **“Sign in or create an account to join a class.”** Let the user choose code or scan after explaining the authentication requirement. Preserve a validated pending join intent through successful authentication in transient state; do not submit the join request before authentication or approval checks. Clear that intent on explicit cancellation or when it is consumed.

`features/student/screens/join_class_screen.dart` already handles code, QR and pending approval. `StudentService` expects a classroom QR with `type: "classroom_join"` and `classId`; manual joining posts `classCode`. Individual student-login QR and parent-link QR are different contracts. Validate type before choosing a flow and show a useful “This QR code is for …” error rather than attempting every operation.

Scanner requirements: explain purpose before camera permission; show camera preview, reachable Close, manual entry alternative and torch only when supported. Provide denied/permanently denied/no-camera/error states. Pause scanning after one accepted code, prevent duplicate requests, and resume after recoverable failure. Do not expose raw QR payloads or secret values in feedback. Replace fixed `250` overlay / `bottom: 50` assumptions in `features/qr/screens/qr_scanner_screen.dart` with available-space layout.

**Acceptance:** both login screenshots' content has a single consistent layout; all controls remain reachable with keyboard and 200% text; valid input immediately enables submit; double taps submit once; approval and offline errors remain distinct; unauthenticated join leads to an explained recoverable flow; pending class membership is never displayed as approved.

## 8. Student Home and Quick Actions — S08, S09 and S10

### 8.1 Verified implementation

- `HomeScreen.build` at line 98 substitutes zero for a missing score. `_buildWelcomeSection` renders a circular score; `_buildScoreCard` renders the same score again.
- The score card handles loading/error, but the welcome score can still display a number or default zero. These two representations can disagree about freshness and availability.
- `_buildQuickActions` opens existing routes and uses `ResponsiveGrid(childAspectRatio: 0.88)` at line 992. The reusable `FeatureCard` has a bounded `Expanded` description and layered shadows. Compacting only its parent padding will not fix its layout contract.
- `_loadTodaysTip` reads `tip` and `date`, suppresses failures and updates selected language before the request succeeds. There is no guarantee the selected chip matches the retained text after failure or racing requests.
- Greeting and role repeat identity decoration, while the next useful action begins well below the initial viewport.

### 8.2 Required layout and hierarchy

```text
Good evening, [display name]                    [profile shortcut]
Connection / relevant pending update state

Preparedness
[score or clear unavailable state]  [View breakdown]
One short explanation; source and updated time
[Continue learning OR Browse learning]

Quick actions
[View drills]       [Browse learning]
[Play games]        [Take a quiz]
More safety tools: photo checks, authorized maps/devices

Safety tip · [actual date when needed]
Tip text
Content language control

Reserved Emergency help action area
Student bottom navigation
```

Remove the welcome score circle. Keep one score presentation with a descriptive label, an honest source/freshness state, a progress visualization only when meaningful, and one contextual learning action. Place History inside the score detail destination or as a secondary text action; Refresh becomes pull-to-refresh and a local retry on error. Do not make Refresh, History and Details three equal oversized colored tiles.

Use compact action cards or rows with a leading icon, short title and one supporting line. Remove empty card space dedicated to a small arrow at the opposite corner. The entire card is one accessible action. Keep important labels visible; do not force a short description into an overflowing fixed-height grid.

“View drills” opens the existing drill list. “Browse learning” and “Play games” select the corresponding tab. Camera/AI photo checks are secondary safety tools, with capability limits described in §15. Do not infer an active drill or recommendation when the data is absent.

### 8.3 Score data rules

| State | Required rendering | Forbidden interpretation |
| --- | --- | --- |
| Initial load, no cached record | Small skeleton / “Loading preparedness…” | `0%` as a placeholder |
| Confirmed score equals zero | `0/100` and encouraging next action | Red danger signal or “unsafe student” |
| No valid score / unassessed | “No score available yet” and Browse learning | Invented denominator or completion count |
| Valid server score | Value, breakdown link and real source timestamp | Learning score interpreted as current physical safety |
| Local estimate available | “Estimated on this device”; pending state if applicable | Unqualified server-confirmed score |
| Refresh failure with cached score | Retained labeled score and local Retry | Remove everything or silently pretend current |
| Invalid response | “Score unavailable” | Convert malformed fields into trustworthy zero |

`PreparednessScore` already has score, breakdown and `lastUpdated`. The provider's `lastFetched` currently combines local and remote updates. Add an explicit source/freshness distinction before relying on it in copy. `LocalScoreCalculator` uses a hard-coded module denominator and estimated drill availability; do not display “X of Y completed” from those assumptions. Show backend/content-derived totals only where verified.

The current breakdown model contains module, game, quiz, drill and streak components. Display returned weights and values; do not recalculate a new scoring formula as a UI enhancement. If backend and local scores differ, show which one is currently presented and reconcile through the existing services.

### 8.4 Tip and connectivity behavior

- Display “Today's safety tip” only when the returned content date matches the user's current local date under the chosen date contract. Otherwise use “Safety tip” with the real date. Do not change the date simply because a fetch happened now.
- Preserve the old tip while loading another language, but label it with its old language. Commit response text, response language and selection together. Ignore outdated request results.
- On failure, retain readable content with an inline retry or show a small unavailable state. This optional section must not block Home.
- `ConnectivityIndicator` currently derives “Offline: Mesh Active” from socket offline state. Replace that with “Offline” unless the mesh provider actually confirms usable transport state.
- `SyncIndicator` only reflects the learning synchronization provider, whose pending count excludes crisis and mesh queues. Label it “Learning updates” and present urgent undelivered status separately. One previous successful sync is not proof that every queue is delivered.

**Acceptance:** one score only; absent data never becomes a red zero; quick actions appear substantially earlier than in S09 at the same logical viewport; all six relevant actions remain accessible; Emergency never covers a card; cached/error/zero states remain distinct; failed language switching never relabels old content incorrectly.

## 9. Learn hub — S07

### 9.1 Existing versus required

`ModuleScreenFile` currently uses a padded, non-scrollable `Column` of three large gradient source cards. It pushes `NdmaModulesList`, `NdrfLanguageScreen` and `HearingImpairedList`. Its labels mix capitalization and disability terminology, and its indigo header differs from the green and purple child screens.

**Required first version:** retain those working source destinations while making the hub readable and task-oriented.

```text
Learn
Safety lessons, videos and accessible formats

Continue learning [only when reliable resume data exists]

Browse resources
NDMA safety guides          [compact source row]
NDRF training videos       [compact source row]
Sign-language safety videos [compact source row]
```

- Use one scrollable page, shared app bar and compact source rows with clear supporting text.
- Explain what the user will find: topic-based guidance, training videos in available languages, or sign-language video content.
- Show source attribution as factual provenance, not an unsupported endorsement or a claim that every item is official, current or locally applicable.
- Make sign-language resources a clear format choice available to everyone. Do not require users to identify themselves as disabled.
- Add “Continue learning” only after the persistence and identity isolation work in §10 is complete. Until then, omit that block; do not fill it with a hard-coded lesson.

**P2 extension:** a unified topic/format search across NDMA, NDRF and sign-language catalogues. This needs an explicit local catalogue adapter with stable IDs, source, format and actual language fields. The current `LearningModule` model does not represent all three sources equally. Initial source navigation does not depend on this extension.

**Acceptance:** the three source choices remain available to authorized students; all fit by scrolling at 320 width and enlarged text; Back returns to the same location; no inaccessible giant card or new disconnected catalogue route is introduced.

## 10. NDMA catalogue, lesson details and progress — S05

### 10.1 Verified implementation and dependencies

`NdmaModulesList` searches titles only. It renders raw static descriptions and a single crowded metadata row. At `ndma_module_list.dart:190`, zero progress deliberately becomes `0.02` in the indicator. `LearningModule.progress` in `models/module_models.dart:50` counts completed videos, not quiz results or overall preparedness.

The active `screens/module_detail_screen.dart:169` callback marks `VideoLesson.isCompleted` only in memory. `ModuleRepository._loadVideoProgress` reads Hive, but this active callback does not write through the existing persistence services. `VideoProgressService.markVideoCompleted` and `ModuleCompletionService.markVideoCompleted` exist and must be evaluated and wired into this journey before persistent completion is promised. The local key is module-based; verify and correct user isolation before reusing it on shared devices.

### 10.2 Required catalogue

- Keep the page title and search in a stable header. Add a clear button and visible result count. Searching with no matches must preserve the editable search field.
- Search title and reviewed short description locally. Topic tags can participate where they are real. Do not advertise grade filtering without a trustworthy grade field.
- Use a 48-pixel leading topic icon, title, a concise two-line catalogue summary and wrapping metadata. Keep full safety content in the detail page; do not truncate actual instructions into misleading fragments.
- Format difficulty in sentence case. Show duration only from supplied metadata and label estimates as estimates. Do not infer exact video length from a manually entered lesson-duration string.
- Use “Not started,” “In progress” or “Videos completed,” plus the numeric completion proportion where valid. At zero, the track is empty; remove the deliberate two-percent segment.
- Use a single primary action: Start learning, Continue or Review. Coming-soon content gets an explicit unavailable label and explanation instead of an apparently enabled play action.
- In the first release, prefer search plus at most topic/status filters based on available fields. Avoid a large filter sheet filled with unsupported grade, duration or download options.

### 10.3 Required lesson detail

```text
Back · Lesson title
Source / content language / available format
Short overview and factual metadata
Video progress: completed count / actual video count

Lesson videos
[video title] [not started / completed / resume if supported]

Read summary [only when mapped reviewed content exists]
Take quiz [available, or explain existing unlock requirement]
```

- Preserve the current rule that the associated quiz unlocks after required videos are completed, unless that product rule is explicitly changed later.
- Keep video completion and quiz completion separately labeled. A completed video list does not prove a passed quiz.
- Remove the hard-coded `35 views` in `module_detail_screen.dart:117` and the inert speaker icon at line 151. Do not retain a fake popularity metric or an audio action without playback.
- The active NDMA detail has no summary loader/mapping. Before enabling Read summary, map stable module IDs to reviewed entries in `mobile/assets/ndma_summary/ndma_summary.json`. If an entry is absent, omit the action or explain that a summary is unavailable. The asset's presence alone does not prove each lesson has a matching summary.
- Replace “AI Quiz - Coming Soon” action styling with an honest unavailable control/explanation if the route is still not implemented. Do not create a new AI quiz service to satisfy a visual mockup.
- On return from playback, update list/detail consistently. Persist once through the appropriate service; avoid repeated awards when playback reaches the completion threshold more than once.
- Store completion under the correct user and stable content ID. Migration of existing device-only progress must not attribute one learner's activity to another. If ownership cannot be established, keep it unassigned rather than crediting the currently logged-in child.

### 10.4 Progress and offline capability

The existing server service posts `moduleId`, `moduleType`, `action: "video_complete"`, `videoId` and optional language/total video fields to `ApiEndpoints.moduleProgress`. Preserve and verify this contract instead of inventing a second endpoint. Local completion may be shown immediately if labeled pending until accepted; retry must be idempotent.

The active `VideoPlayerView` is network-based. `OfflineStorageService.downloadModule` currently caches API JSON, not media bytes. Therefore:

- Initially say **“Requires internet”** for network-only playback.
- A cached summary may be labeled **“Summary available offline”** only after that exact content has been read successfully without a network.
- **P2:** real video downloads require file storage, complete-file validation, cancellation, interrupted-download recovery, storage-space handling and deletion. Display Download / Downloading / Available offline / Failed only after those states exist. Keep this separate from the initial catalogue redesign.
- File size, content duration and download completion are different values. Do not use one as a substitute for another.

**Acceptance:** exact zero progress; completion survives restart for the correct learner; a second learner sees no previous user's progress; repeated completion does not duplicate rewards; errors do not unlock quizzes; list search survives no results; offline mode never advertises network videos as available.

## 11. Sign-language learning, NDRF and media — S04

### 11.1 Sign-language catalogue

`HearingImpairedRepository` contains thirteen remote MP4 entries. Its `size` strings mix a format label with values such as file sizes. `HearingImpairedList` uses a generic icon and trailing play icon; its completion callback is a no-op. There is no current sign-video progress contract in this route.

**Required presentation:** title **“Sign-language safety videos”**, short factual source description, search, and content-height rows. Each row contains a small format/topic icon, full-enough title, a format/language line and a clear play action. Use “Preparedness,” “During an emergency” and “Recovery” grouping only where the actual video title/content supports it.

- Separate format, language and optional file size in the data presentation. Do not claim Indian Sign Language or another specific sign language unless the content metadata verifies it.
- Reserve a trailing 48 × 48 play target and at least 12 spacing from title content. Long titles wrap; metadata moves below rather than colliding with the icon.
- Use the shared page theme with a restrained purple format accent. Avoid a completely different purple application theme.
- Do not display completion/resume badges until this route writes and restores user-scoped progress. Until then, Play is honest and sufficient.

### 11.2 Player requirements

`screens/video_player_view.dart` already preserves video aspect ratio and has Chewie controls plus loading/retry/error handling. Reuse these capabilities. It currently autoplays and marks completion near 95%.

1. The learner explicitly starts playback. Preserve a visible loading state, Retry and Back if initialization fails.
2. Keep the signer, hands and face fully visible with contain/aspect-fit behavior. Do not use cover cropping, decorative overlays over the signer or zoom that hides essential gestures.
3. Keep Play/Pause, seek, elapsed/total time and fullscreen accessible. Do not place the shared AR/VR experience menu above essential sign-language controls; unsupported immersive options should not distract from playback.
4. Show captions/transcripts only when an actual reviewed asset exists. A transcript is a content dependency, not text the UI model should invent. It must not obscure the signer by default.
5. Resume position is P2 unless position persistence is explicitly added; completion persistence alone does not provide time-based resume.
6. Pause and manage resources when backgrounded or navigating away. Returning from a player restores orientation/system UI and the previous list position.
7. Completion callbacks must be idempotent across player retry, seeking and recreation. A loading/retry cycle must not generate multiple completions.

### 11.3 NDRF path, inspected but not pictured

`NdrfLanguageScreen` routes through thirteen content-language groups in `data/ndrf_data.dart`. The current native-script language labels are valid UTF-8; do not replace them as if they were the broken Home screenshot text. `NdrfModuleDetailScreen` reads bundled language summary JSON and opens network YouTube playback.

- Present language selection as a searchable/wrapping list with native label and readable secondary name. Persist the content preference separately from UI locale.
- Display video title, source, available summary and actual playback requirements consistently with NDMA.
- Replace `ndrf_module_detail_screen.dart:238` missing-summary “Debug Info” with **“Summary is not available for this video.”** Do not show repository keys to learners.
- Use the existing loading flag meaningfully, distinguish missing summary from load failure, and preserve usable video access when only a summary is unavailable.
- If no reviewed transcript/caption asset exists, label the limitation accurately; do not imply all thirteen language groups include every accessibility format.

**Acceptance:** no play/title collision at 200% text; signer remains visible; media errors recover; no invented duration, sign language, caption or download badge; NDRF summaries use correct assets; playback exit restores the app layout.

## 12. Games, comics and external experiences — S06

### 12.1 Verified implementation

`MainMenuScreen` has a 280-high featured carousel, 200-wide game cards, literal corrupted emoji strings, gradients and a “Featured AI Games” grouping. Actual launchers include scenario play, earthquake drill, Punjab Safety Hero, extinguisher training, school quiz, school runner and flood escape. Preserve their destinations and `gameType` values.

Comics use fixed `Row` selectors for three characters, two languages and three hazards. Asset discovery sequentially probes up to 200 pages before navigation. Only Doraemon currently has supported narration; the other readers already guard audio availability. `GameManager` session counters do not establish persistent learning accomplishments.

### 12.2 Required Games layout

```text
Games
Practise safety through play

Featured safety games
Compact game cards with real icons and clear Start actions

Safety comics
Story collection [wrapping choices]
Content language [choices]
Choose a topic [Earthquake / Flood / Fire]

External simulations
Clearly labeled internet/external-content entries
```

- Replace corrupted text icons with existing Material icons or existing suitable assets. Do not generate new art for every card as a prerequisite.
- Keep one restrained gradient or illustrated featured treatment, rather than making every section compete through saturated colors.
- A carousel may remain at ordinary text scale if its next item is visibly discoverable. At large text or narrow width, use a vertical list. Cards grow with content; do not maintain 280-high/200-wide constraints by shrinking text.
- Each game card shows title, one sentence, and factual requirements such as internet, camera or landscape only where verified. Label individual AI-dependent games specifically; not every game is AI.
- Use “Start” or “Play,” with one semantic action per card. The visual button and card tap must not trigger duplicate navigation.
- Loading a game creates a visible pending state and blocks duplicate starts. Failed initialization offers Retry and Back. A 90-second AI timeout needs ongoing visible feedback and a cancel/leave action; it must not look like a frozen screen.
- Do not show session-memory Games Played or XP as a saved achievement. Persist and verify semantics first, or label session values explicitly and keep them out of the main Home score.

### 12.3 Comics selection and reader

- Keep current content identifiers and corrected uppercase asset paths. Display names may be improved without renaming `doremon`, `shinchan`, `edusafe`, `EARTHQUAKE`, `FLOOD`, `FIRE`, `English` or `Hindi` asset directories.
- Convert character, language and topic rows into wrapping selectable controls. Announce selected state. Avoid nested bordered panels around every row.
- Show a loading indicator while pages are discovered, guard duplicate taps and provide a specific missing-content state. A generated asset index may replace repeated probing only if built from the actual bundle and kept in sync; do not hand-code invented page counts.
- Reader: show page position, reachable Back/Close, previous/next controls, contain-fit images and optional pinch zoom using an existing/native Flutter widget. Restore reading position only after adding correctly scoped persistence.
- Make narration user-controlled. Show audio controls only for a collection/language with a real supported asset; otherwise say narration is unavailable where helpful. Do not re-enable non-Doraemon audio without files.
- Review forced landscape and audio autoplay in `comic_reader_screen.dart`. Prefer respecting current orientation for reading and explicit audio start; if a particular comic requires landscape, explain and restore orientation on exit.
- A textual equivalent for image-based comics is a content-authoring dependency. Do not invent or automatically translate disaster instructions during the UI implementation.

### 12.4 External games

`features/games/screens/web_game_screen.dart` forces landscape/immersive mode, injects a desktop viewport and lacks a meaningful page-error state. Improve the wrapper with loading, network failure/retry, a reachable exit and clear external-source labeling. Preserve required installed WebView behavior, but review navigation boundaries before sending users to unrelated pages. Do not claim offline support, verified score integration or accessible content that the external source does not provide.

**Acceptance:** no mojibake in the Games entry; all current game routes remain reachable; selectors wrap; double taps create one session; unsupported narration stays unavailable; media failure has an exit; external game exit restores system bars/orientation; no fabricated saved XP is displayed.

## 13. Parent Dashboard — S03

### 13.1 Verified implementation

The dashboard combines a greeting, three summary cards and large child cards. Grade is repeated, card tap and “View Details” lead to the same destination, and `_buildChildCard` at `parent_dashboard_screen.dart:692` renders literal green **“Safe”** for every child.

This is a data-contract problem as well as a rendering problem:

- `_getChildStatus` reads `safetyStatus`, but `backend/src/services/parent.service.js:1006` returns `status`.
- That backend method defaults missing status to `safe` and missing `lastSeen` to the current time. Other parent statistics/summary paths also default absent status to safe.
- `ParentChild` supports nullable safety status and last seen, but `ChildLocation.fromJson` fabricates current time for absent `lastSeen`.
- `backend/src/models/User.js:269–276` persists defaults of safe and current time. Removing response fallbacks alone therefore cannot identify whether an older user ever submitted a safety report.
- `User.updateLocation` and `updateSafetyStatus` both change `lastSeen`. It is not a dedicated safety-report timestamp. Separately, `ParentService.getChildLocation` at line 306 infers safe from the presence of coordinates and derives activity time from other metadata; that endpoint also needs correction.
- Two 30-second timers refresh status/summary and invalidate children. Failed status refreshes can remove previous values from the refreshed map. The UI then risks falling back to reassurance.
- The “Alerts” summary is unread notification count, not confirmed active emergency count. The unread provider returns zero during loading/errors.

### 13.2 Required layout

```text
Dashboard                                    [notifications with real unread count]
Hello, [parent display name]
Linked children and their latest reports

[N linked children] [N unread notifications]   compact summary
[Status refresh issue, only when relevant]

My children                                  [Manage]
[avatar] [Child name]                         [reported status]
School · Grade and section
Status reported [time / time unavailable]
Preparedness [score or unavailable]            [Open details]

Other child cards
Last successful refresh / local retry when needed
Persistent parent navigation
```

- Use one compact summary row or two small cards. Remove the unconditional Safe counter. A “Reported safe” count may return only after the source, timestamps and denominator are trustworthy; show unknown reports separately.
- Keep one clear child-card action. A full-card tap with a chevron and an accessible “Open [child] details” label is sufficient; remove the duplicate full-width outlined button.
- Show school and grade/section once. Omit missing optional metadata; never invent “Test School” or a grade as a placeholder.
- Use safe avatar fallback for absent/empty names. Both dashboard and management currently index `child.name[0]` directly; a missing name must not crash the list.
- Keep learning metrics secondary to a real urgent status. Do not use preparedness score as a safety signal.
- Preserve pull-to-refresh. Remove redundant toolbar refresh if pull-to-refresh and contextual retry provide the same function accessibly; provide a semantic Refresh action for users who cannot perform the gesture.

### 13.3 Required status contract

| Input state | Display | Color/behavior |
| --- | --- | --- |
| Explicit safe report, timestamp available | “Reported safe” plus actual report time | Calm green accent; historical report, not guarantee |
| Explicit safe report, timestamp absent | “Reported safe · Time unavailable” | Neutral emphasis until freshness can be established |
| Explicit help/at-risk/missing status | Exact normalized human-readable state and report time | Red emphasis and details action; do not change its meaning |
| Explicit active drill state | “Participating in drill” with actual drill context | Informational/amber; distinguish exercise from incident |
| Missing status | “Status unavailable” | Neutral; never green Safe |
| Refresh failed, prior report available | Last reported state plus “Could not refresh” and its original time | Retain data without presenting it as current |
| Unknown backend enum | “Status unavailable” with safe diagnostics outside the user flow | Do not treat every unrecognized value as emergency or safe |

Normalize the actual `status` response in one typed model. Do not maintain two competing `status`/`safetyStatus` fallbacks in every widget. Review persisted model defaults, status/location write paths, status/summary responses and the separate child-location response together. Coordinates or account creation must never establish a safe report.

Establish a dedicated safety-report timestamp and provenance through a verified existing report record or an explicit backend extension, for example a proposed `statusReportedAt` field written only when a real authorized status report is accepted. That name is a proposed contract addition, not a current field. Keep activity `lastSeen`, safety-report time and client `lastFetchedAt` separate. Existing records whose explicit report provenance cannot be established render Status unavailable; do not backfill safety reports from account creation, last login, location activity or a stored default `safe`. If a report itself is established but its time is not, display Report time unavailable.

For the initial release, always show the actual report time and refresh failure state. A product-specific staleness threshold can be added later only when the reporting cadence and incident policy define one. Do not invent a universal “safe for five minutes” rule. Missing timestamps are unavailable, not fresh.

Polling must retain the last successful result, avoid overlapping refreshes and stop unnecessary work when the parent shell is disposed. Keep the existing interval initially; a new realtime architecture is not required for the visual enhancement. Mark individual failed children rather than turning their status into a default. Do not trigger a full-list loading replacement every 30 seconds.

### 13.4 Parent navigation correction

The current dashboard bottom bar always has index zero and **pushes** Children, QR, Notifications and Profile as standalone routes. Those screens do not share a persistent shell. Styling alone cannot create consistent tab behavior.

Required implementation: add a small parent shell in the existing parent feature, or make the current parent dashboard entry own an `IndexedStack` of parent tab bodies. Preserve standalone routes where other flows need them, with an explicit embedded-body option or extracted private body as appropriate. Do not copy complete screens to create embedded versions.

- Keep tab selection and scroll state when switching.
- Do not push another parent dashboard for every tab change.
- Show notification count only on Notifications/Alerts. `parent_bottom_nav.dart:46` currently also applies that badge to Children; remove that misleading duplicate.
- Treat Scan QR as its own explicit scanner destination with a way back to the previous tab. Request camera permission only when that destination is opened.
- Create the scanner only when entering its destination; pause/stop camera and detection when leaving the tab or backgrounding the app. An offstage `IndexedStack` child must not retain an active scanner or submit/navigate from hidden callbacks. Resume deliberately on return.
- Unknown/loading unread count is not confirmed zero. Keep the badge absent or show a small loading state without claiming “No alerts.”

**Acceptance:** missing status never renders Safe; missing timestamp never becomes “just now”; failures retain honest prior data; counters mean what labels say; both children open the correct authorized detail; empty names do not crash; tab switching does not build an ever-growing route stack.

## 14. Children management and connected parent screens — S02

### 14.1 Children management

**Verified:** `children_management_screen.dart:170` returns an empty state before building the search field. A no-result search therefore removes the control needed to change the search. Cards always show email and render `preparednessScore ?? 0`; details are only in an overflow menu. Unlink confirmation already exists.

**Required:** use a stable page header with **“Children”**, a labeled Add child action, search and a result count. Keep these controls in place while the list body changes between loading, no children, no matches and error states.

- Search supports the fields it advertises. The existing prompt promises name/email/grade; verify those comparisons or narrow the prompt to the actual supported fields. Do not label it “Search children” and silently ignore obvious name matches due to case/spacing.
- Show compact cards/rows with name, grade/section, school if useful, reported status with timestamp, and preparedness as a secondary metric. Place optional email in details rather than every overview card.
- Use the same status normalization and avatar fallback as the dashboard.
- Tapping the row opens details. Overflow contains secondary relationship actions, with visible text labels.
- “Remove link” must explain that it removes this parent's association and does not delete the child's account. Preserve confirmation, pending state and failure recovery. Remove the card only after success, or provide a clear rollback if an optimistic update is used.
- Distinguish **“No children linked yet”** with Add child from **“No children match this search”** with Clear search. Never remove the search field from the no-match state.
- Show real counts only. For large lists, use the existing service's supported pagination/search capabilities if present; do not assume the server pages results when it currently returns an entire list.

### 14.2 Add/link child and QR verification

`AddChildScreen` has separate verified-success and pending-approval branches. However, link controllers return `autoVerified` (`backend/src/controllers/parent.controller.js:348–355`), while `QRVerificationResult.fromJson` reads `verified` (`parent_models.dart:277`). These existing branches do not prove that real link responses reach the correct display. Normalize verification and link-submission results separately, including the actual pending request ID, before relying on the Linked/Awaiting approval presentation. Existing backend pending-link request and cancel endpoints can support a visible pending requests section.

Required flow: choose Scan code or Enter child ID; explain where the code comes from; verify code; show a safe preview of the intended child and relationship; submit link request; display **Linked** or **Awaiting approval** based on the actual result. Keep pending status visible after a transient snackbar disappears. Allow cancellation where the existing endpoint permits it. Never auto-approve a request merely to make onboarding feel smoother.

Do not mix parent linking, classroom joining and individual QR login instructions. A wrong QR type gets a specific recoverable message. Camera denial retains manual entry where supported. Invalid/expired code, already linked, awaiting approval, rejected and network failure are separate states.

### 14.3 Child detail

The existing detail page has eight tabs: Overview, Analytics, Progress, Activities, QR, Drills, Attendance and Safety, with Safety last. Several numeric defaults become zero; unknown safety becomes red; freshness is coupled to the presence of a location card.

Required information structure:

1. **Overview:** identity, latest reported safety state/time, preparedness and clear links to learning/activity.
2. **Learning:** existing progress and analytics views, with unavailable/zero distinctions.
3. **Activity:** activities, drills and attendance as clear subchoices or sections.
4. **Safety:** reported status and any authorized location information, independent of whether coordinates exist.

Keep QR access in a labeled action within detail rather than competing as one of eight equally important tabs. This grouping reuses existing destinations; it must not discard analytics, drill history or attendance. If consolidating tab bodies would create excessive changes in the first batch, keep them accessible under an explicit “More” menu while implementing Overview and Safety first.

Never imply live tracking from an old `lastSeen`. An established safety-report timestamp still belongs beside its report even when coordinates are absent. Do not show unknown status as a red emergency unless an explicit backend status supports it. Retain verified parent-child relationship checks on every request.

Use the corrected contract from §13.3 in the Safety tab as well as the dashboard. The current location endpoint's coordinates-imply-safe behavior must not survive as a second source of reassurance. A location/activity timestamp is labeled as such; it cannot substitute for safety-report time.

### 14.4 Notifications

`notifications_screen.dart` already implements All/Unread/Drill/Achievement/Attendance/Emergency filters despite a stale TODO comment. Preserve and restyle them; do not spend implementation effort recreating a nonexistent feature gap.

- Use a wrapping filter row, readable notification title/body, local formatted time and clear read/unread state.
- Distinguish no notifications, no filtered results, loading and failed refresh. Do not turn a failed unread count into “You're all caught up.”
- Move “Mark all read” into a discoverable toolbar/overflow action with a visible in-progress state and failure feedback; it is not a floating emergency action.
- Opening a notification may mark it read through the existing service. **Read is not an incident acknowledgment, safe report or response commitment.**
- When the linked child or resource no longer exists or permission changes, show an unavailable state rather than routing to a wrong default child.

### 14.5 Parent profile

Before making profile editing more prominent, correct the current hydration behavior: `_loadProfile` initializes phone fields empty and relationship to a default; Save can submit those defaults. Read the actual editable profile values or submit only changed fields, then update displayed/auth state from the successful response.

Group identity, contact details, language/accessibility preferences, linked children and account actions. Keep unsaved edits on recoverable failure and confirm discard when necessary. Do not treat a theme/language change as permission to overwrite contact data.

**Acceptance:** no-match search remains editable; pending links remain pending; unauthorized detail access remains denied; unlink does not delete accounts; absent progress is not zero; profile Save without edits does not clear real contact data; notification read state never claims emergency acknowledgment.

## 15. Emergency assistance, actual incidents and photo tools

These connected flows are not fully visible in the screenshots. They were inspected because the large Home emergency button and photo shortcuts lead directly to them. Their correctness is a prerequisite for a trustworthy redesign.

### 15.1 Current behavior requiring P0 correction

| Source | Verified behavior | Required correction |
| --- | --- | --- |
| `features/dashboard/screens/home_screen.dart:1011` | Manual Emergency opens `RedAlertScreen` with “Emergency Alert - Test” and no real incident ID | Separate manual help entry from received incident display |
| `features/emergency/screens/red_alert_screen.dart:43,109` | Starts sound/vibration/pulsing and blocks Back on entry | Manual entry is calm and dismissible; actual incident behavior is explicit |
| `red_alert_screen.dart:242,280,297` | Help/Safe emit without delivery result, then claim sent/marked safe | Await actual acceptance or display delivery unknown/pending/failure |
| `core/services/socket_service.dart:189` | Disconnected socket emit silently does nothing | Return actionable transport result and implement acknowledgment contract |
| `red_alert_screen.dart:347,383` | Placeholder campus contact; Help automatically opens a telephone call URI | Configured contacts only; explicit user Call action |
| `features/emergency/screens/crisis_mode_screen.dart:203` | Inactivity handler calls `markSafe` while announcing potentially trapped | No response never becomes safe; use a supported status or retain unknown |
| `crisis_mode_screen.dart:349,381` | GPS failure blocks Help; queued response can produce “Help is on the way” | Preserve calling/manual fallback; distinguish queued from accepted and dispatched |
| `features/emergency/services/crisis_alert_service.dart:58,133` | Failed API delivery returns `success: true, offline: true` | Typed delivery outcome, not a generic success boolean |
| `crisis_alert_service.dart:218` | Failed queued posts can still be removed; replay method has no caller found | Keep failed records and wire verified replay before promising eventual delivery |

The socket backend authorizes identity/school and broadcasts, but does not provide a client acknowledgment or actual responder commitment. A new acknowledgment is a small required service/backend contract change; it does not establish that help has been dispatched.

### 15.2 Manual emergency entry

```text
Emergency help                                  [Close]
Choose what you need

[Request help from your institution]  if supported and authorized
[Call a configured emergency contact]
[View available emergency contacts]

Connection and delivery state
Location sharing explanation / manual location when supported
```

- Opening the page does not sound an alarm, send a report, announce an active incident or start a call.
- A user presses an explicit **Request help** action to submit. That action itself is intentional; do not add a mandatory countdown, long-press or series of confirmations that delays urgent help.
- Call controls clearly name the configured destination. Do not ship placeholder contacts. Existing emergency contact policy must be validated for deployment; this UI plan does not prescribe a universal number.
- Show the location that will be shared or a clear location-unavailable state. Do not silently send a fabricated coordinate. An explicit manual location field or optional coordinates requires backend support before enabled.
- Keep Close/Back available for a manually opened assistance screen. Leaving must not cancel an already accepted request or falsely announce that it was resolved.
- Retain existing role/access restrictions. When institution messaging is unavailable, show why and any supported calling action.

### 15.3 Genuine incident and drill display

Use real payload fields such as `alertId`, type, message, source, severity and `isDrill` from the existing `CrisisModeScreen` contract. Review socket handlers, FCM handlers and drill entry points because some currently open `RedAlertScreen`.

Display a stable high-contrast incident heading, **“Drill”** when applicable, source/time, readable instructions and large status actions. Use a static background with optional bounded audible/haptic notification; avoid continuous flashing. Respect reduced motion and keep visual text independent of sound. Do not let an appearance switch dismiss or resolve a real incident.

Keep **Report safe** and **Request help** distinct. A report is not physical safety verification. Silence/inactivity is not a safe report. If the backend cannot represent a no-response status, keep the state unchanged/unknown and expose the missing capability as a dependency.

### 15.4 Delivery states and contract

| Outcome | Exact UI meaning | Allowed next action |
| --- | --- | --- |
| Not submitted | No request has been sent | Submit or call |
| Submitting | Attempt in progress; no acceptance yet | Avoid duplicate send; keep other emergency contact options available |
| Server accepted | Server explicitly acknowledges this request ID | Show acceptance time; do not imply responder arrival |
| Saved locally | Durable local record exists but delivery is not confirmed | “Waiting to send”; retry/call and show last attempt |
| Delivery unknown | Attempt timed out and acceptance is unknown | Retry with the same idempotency ID; do not duplicate requests |
| Failed to save/send | No reliable durable queue/acceptance exists | Explicit failure and retry/call |
| Dispatched | Only if a real responder/dispatch contract later confirms it | Show actual source/status; currently unsupported |

Use a stable request ID for retries, preserve failed queued items, and remove only individually acknowledged records. Distinguish the crisis-status queue from the mesh queue and learning queue. If local storage fails, the UI must not say “Saved locally.” Wire replay with lifecycle/auth/connection ownership and verify it with a disconnected/reconnected test before promising background retry.

Scope each queued event to its original authenticated account, institution and incident, and retain its original event time/order. The current crisis queue is globally keyed and its replay does not preserve all stored identity/time information. An account switch must not replay the previous user's report as the new user. A delayed older Safe event must not overwrite a newer Help event. The server must authorize the original event context and enforce a defined ordering/idempotency policy; do not let a client-supplied user ID bypass existing authorization. Events whose context cannot be safely established stay unavailable for automatic replay with a clear pending/error state.

Implement that protection on both socket submission and the active HTTP `POST /api/alerts/:alertId/status` path. Inspect `backend/src/controllers/alertStatus.controller.js`, `services/alertStatus.service.js`, `routes/alert.routes.js` and the associated alert/status models before changing the contract. A socket acknowledgment alone does not fix HTTP queue retries.

### 15.5 Photo-based hazard and exit checks

`evacuation_check_screen.dart:463` currently says “Route is safe for evacuation” for a clear photo result. `damage_scan_screen.dart:415` treats a missing `damageDetected` field as false and can say “Area appears safe.” A photo result does not establish route or building safety.

Required flow: explain the tool; choose camera/gallery; show a preview; let the user explicitly submit the image for analysis; show processing/cancel or leave; show an image-bound observation with time and limitations; allow another photo or Back.

- Result copy describes the image: **“No obstruction detected in this photo”** only when a valid result supports it, not “Route is safe.”
- Missing, malformed, unsupported or ambiguous fields become **“Unable to assess this photo.”** Do not default to a green success state.
- Separate observation, uncertainty and any reviewed follow-up text. Do not generate new disaster instructions from this design document.
- Handle camera denial, permanent denial, picker cancellation, upload failure, timeout and retry without losing the selected preview unnecessarily.
- The existing `/ai/evacuation/check` and related photo endpoints remain the integration points. Validate the response before presentation. Preserve disabled AR routing and posted-plan/staff guidance where routing is unavailable.

**Acceptance:** opening manual Emergency performs no external action; Safe/Help feedback matches durable delivery state; denied GPS does not remove available calling options; no inactivity-to-safe conversion; failed queue items survive replay; no placeholder phone contact; photo unknown is never safe; AR remains unavailable until independently verified.

## 16. Other mobile tabs and cross-screen consistency

These screens were inspected for connected behavior but have no supplied screenshots. Apply the shared system and the concrete fixes below; do not claim their complete visual redesign has been validated.

### 16.1 Ask

`AskKavachScreen` sends a question and optional preferred language to `/ai/ask`, consumes an answer string, automatically speaks replies and automatically sends a final voice-recognition result. It does not transmit a conversation history or consume citation/confidence fields.

Required: keep a keyboard-safe composer, retain drafts, show listening and cancel state, allow users to review a voice transcript before pressing Send, and make read-aloud opt-in. A failed request is a failed message with Retry, not a normal bot answer. Keep microphone permission contextual. Preserve selectable text and replay/stop controls. Show only supported answer content; do not promise conversation memory, source citations or emergency dispatch through chat without actual contracts.

### 16.2 Student Profile

Replace the current English/Hindi toggle with the existing four-locale selector. Separate language, accessibility and appearance from operational emergency state. The manual peace/crisis switch must not imply that choosing a theme starts or resolves an incident. Keep join class, QR, parent linking, authorized device tools and logout discoverable in grouped rows. Preserve current access rules and logout cleanup.

### 16.3 Teacher and kid screens

`AppRouter` routes these roles separately. Include them in shared-theme, input, card and navigation regression checks. Do not apply the parent shell or full student action grid to younger-child mode. A teacher/kid screenshot-driven redesign remains a separate follow-up if requested; this plan preserves their existing workflows.

### 16.4 Permission timing

`main.dart` currently requests notification permission during startup. Move the user-facing request to an explained, relevant moment after sign-in or when enabling alerts, while preserving notification initialization and token registration. Camera, microphone and location prompts likewise follow an intentional feature entry. A denied permission must not block unrelated learning or authentication. Opening every tab through an `IndexedStack` must not trigger every feature's permission request or media initialization at once.

## 17. Implementation boundaries and data contract ledger

This ledger prevents an implementing model from adding UI states whose supporting behavior does not exist.

| ID | Proposed capability | Existing support | Work required before it can be shown |
| --- | --- | --- | --- |
| D01 | Accurate child reported status | Status/location endpoints and nullable child fields exist, but persisted defaults and activity timestamps are ambiguous | Correct model/write paths and all parent responses; establish explicit report provenance/time; unknown historical records remain unknown; correct summary counting |
| D02 | Accurate unread badge | Notification endpoints and filters exist | Loading/error distinct from zero; badge on correct parent destination |
| D03 | Immediate valid login + meaningful errors | Existing form and authentication service | Rebuild validity on edits; preserve typed error categories through service/provider/screen |
| D04 | Resume class join after login | Existing class join and QR parsing | Carry typed transient intent through auth; preserve approval and QR type checks |
| D05 | Persistent NDMA completion | Hive and server completion services exist | Wire active route, scope by user/content, verify server content IDs and idempotence |
| D06 | Resume video at timestamp | Network player exists | Position persistence and lifecycle handling; optional P2 |
| D07 | Sign-language completion | No-op callback in active list | Stable content identity + user-scoped write/read; hide badges until implemented |
| D08 | Offline videos | JSON cache only in named download method | Real media storage/download lifecycle; P2, not a cosmetic button |
| D09 | Reliable preparedness narrative | Score/breakdown model and local calculator exist | Provenance, null/error distinctions, authoritative totals; no UI formula rewrite |
| D10 | Accurate tip language/date | Endpoint returns tip/date | Atomic selection/content update, race handling, language/freshness labeling |
| D11 | Emergency “accepted” feedback | Socket broadcast / API / multiple queues | Explicit acknowledgment/request IDs, typed outcomes, queue durability/replay |
| D12 | “Help is on the way” | No verified dispatch contract found | Do not show; requires actual responder state, outside initial UI work |
| D13 | Help submission without GPS | Current service rejects missing location | Review/extend backend optional-location contract; retain supported calling meanwhile |
| D14 | Photo assessment | Existing AI endpoints | Validate required response fields, unknown state, image-bound wording |
| D15 | Application-wide language selector | `localeProvider` and four localization classes | Complete labels and controls, preserve separate content language |
| D16 | Saved game accomplishments | Session counters exist | Use verified persistence/service semantics before displaying saved totals |
| D17 | Accurate parent profile editing | Parent profile service exists | Real hydration or change-only updates, successful response reflected in state |
| D18 | Caption/transcript/audio availability | Some audio and summaries exist | Inventory actual assets, author/review missing equivalents; never invent availability |
| D19 | Accurate child-link outcome | Verification/link endpoints and pending request endpoints exist | Parse `verified` versus `autoVerified` by response type, preserve pending request ID and approval state |

### 17.1 Minimal source-change map

| Work area | Existing primary files | Narrow integration responsibility |
| --- | --- | --- |
| Tokens/theme | `core/design/{colors,typography,spacing,borders}.dart`; `core/theme/{app_theme,peace_mode_theme,crisis_mode_theme}.dart`; `main.dart` | Shared visual defaults and runtime theme wiring |
| Student shell | `features/dashboard/screens/dashboard_screen.dart`; `core/widgets/navigation/bottom_nav_bar_custom.dart`; `core/widgets/layouts/screen_layout.dart` | Tab ownership, safe insets, action space |
| Login | `features/auth/screens/login_screen.dart`; `features/auth/services/auth_service.dart`; existing input widgets | Compact form, validity, typed feedback, auth intent |
| Home | `features/dashboard/screens/home_screen.dart`; connectivity/sync widgets; score provider/model | One score, compact actions, honest data state |
| Learning | `screens/module_screen_file.dart`; `ndma_module_list.dart`; `module_detail_screen.dart`; existing repositories/services | Actual visible catalogue and completion journey |
| Accessible media | `screens/hearing_impaired_list.dart`; `video_player_view.dart`; NDRF language/detail files | Metadata, player behavior, readable unavailable states |
| Games/comics | `screens/main_menu_screen.dart`; `comic_reader_screen.dart`; `features/games/screens/web_game_screen.dart` | Encoding, responsive cards, launch/reader lifecycle |
| Parent | `features/parent/screens/*`; parent models/provider/service; parent bottom nav | Persistent shell, cards, search, unknown state and edit correctness |
| Parent API dependency | `backend/src/models/User.js`; `backend/src/services/parent.service.js`; `backend/src/controllers/parent.controller.js`; existing parent routes/tests | Honest status/provenance/time/location/summary and link-result contracts; preserve verified relationships |
| Emergency dependency | Existing emergency screens/service, socket service/provider, socket/FCM handlers; `backend/src/socket/socketHandler.js` | Manual versus incident entry and verified delivery |
| Emergency HTTP dependency | `backend/src/controllers/alertStatus.controller.js`; `backend/src/services/alertStatus.service.js`; `backend/src/routes/alert.routes.js`; associated alert/status models | Authorization, request deduplication, incident/account scoping and event ordering for queued HTTP reports |
| Language | `l10n/app_localizations.dart`, four language implementations, `core/providers/locale_provider.dart` | Complete actual strings without localization framework migration |

All mobile paths in this table are relative to `mobile/lib/`. A possible **new** `features/parent/screens/parent_shell_screen.dart` is a proposed small implementation file, not an existing file. No other new production file is required in advance; decide extraction after reading actual callers.

### 17.2 Content and asset inventory required during implementation

Inventory the existing `mobile/assets` bundle and repository metadata before adding artwork or labels. Record stable content IDs, actual asset paths, format, supported content languages, source attribution, available summaries/audio and whether playback is local or remote. The bundle is large, so avoid copying media into new parallel folders for the redesign.

Keep the already corrected case-sensitive comic/quiz/summary paths. Missing content should produce a clear unavailable state. Descriptions, translations, duration estimates and new accessibility transcripts require content review; the coding model must not improvise disaster guidance. Source branding must describe provenance without inventing endorsement or publication freshness.

## 18. Universal state specification

| State | Presentation | Interaction requirements |
| --- | --- | --- |
| First load | Skeleton for the actual content shape or a concise loader | Navigation/Back remains available; no fake data |
| Refresh with existing data | Keep content; small progress indicator | Avoid jump to top and duplicate requests |
| Partial failure | Retain successful sections; local explanation on failed section | Retry only that request where possible |
| Empty collection | Explain absence and useful next action | Different from an error |
| No search/filter results | Keep query/filter controls and show Clear filters | User can recover without leaving screen |
| Offline with usable cache | Show cached content, content timestamp and exact offline capability | Disable only network-required actions, with reason |
| Offline without cache | Explain which content needs a connection | Back/retry and any actually local action remain available |
| Pending approval | Persistent state and next step | Never grant access or show linked/approved prematurely |
| Permission denied | Purpose-specific explanation | Retry or Settings for permanent denial; supported manual alternative |
| Invalid response | Unavailable/unknown | No reassuring numerical or safety fallback |
| Mutation pending | Disable duplicate mutation, preserve entered data | Relevant unrelated navigation remains usable |
| Mutation failed | Explain failure beside action; retain input | Retry/undo according to actual service outcome |
| Session expired | Clear private active view and return to auth | Resume only a safe authorized intent after fresh authentication |
| Background/resume | Restore legitimate state and refresh necessary stale data | No repeated awards, automatic duplicate sends or stacked alert routes |

Define these states in the existing feature provider/model when the distinction is domain-specific. Do not build a universal application-wide state engine merely to render these messages.

## 19. Ordered delivery plan

Complete one reviewable batch at a time. Each batch includes the relevant localization, accessibility and state checks; these are not cleanup postponed until the end.

| Batch | Priority | Exact deliverable | Depends on | Completion gate |
| --- | --- | --- | --- | --- |
| B0 | P0 | Establish current build baseline; correct Learn relative imports; record current screenshots with test accounts | None | Active Learn path resolves; current analysis/build outcome recorded honestly |
| B1 | P0 | Fix login enable/error behavior, parent report provenance/model defaults/location/link contracts, emergency false-success/default-safe behavior, photo unknown state | B0 | Targeted failure/unknown/approval/delivery regression tests pass; existing ambiguous safety records remain unknown |
| B2 | P1 | Unified light tokens, critical crisis legibility, input semantics, responsive layout and safe-inset ownership | B0; preserve B1 | Representative student/parent/auth/crisis layouts fit with enlarged text |
| B3 | P1 | Compact Login and explained class-join flow | B1, B2 | Keyboard/autofill/join/approval scenarios pass |
| B4 | P1 | Student Home, compact actions, one honest score, tip and connectivity state | B1, B2 | No duplicate score/overlap; navigation and offline state truthful |
| B5 | P1 | Learn hub, NDMA catalogue/detail, real scoped completion, sign/NDRF player polish | B0, B2; D05 for Continue | Zero is zero, user progress isolated, media failure recovers |
| B6 | P1 | Games encoding/cards, comic controls, external game exit/error handling | B2 | All existing launchers and supported assets still work |
| B7 | P1 | Parent shell, dashboard/list/detail, notifications and safe profile editing | B1, B2 | Status/notifications/linking semantics correct; tab state retained |
| B7a | P1 | Complete manual-versus-incident emergency layouts, photo preview/result flow, Ask voice/composer behavior, student Profile and contextual permissions | B1, B2; §15 contracts | No automatic send/call; real incident remains accessible; transcript review/opt-in speech/draft recovery and permission states pass |
| B8 | P1 | Full mobile journey verification, localization review and before/after evidence | B3–B7a | §21 acceptance matrix passes; unresolved dependencies documented |
| B9 | P2 | Optional true media downloads, timestamp resume, unified content search, full dark appearance | Only after B8 and supporting contracts | No mock capability; separate acceptance evidence per enhancement |

Do not estimate calendar dates without knowing implementer capacity and current test/build stability. B1 can be split into independent auth, parent-data and emergency patches; do not mix an unreviewable backend safety rewrite with cosmetic token changes. This document authorizes a plan, not deployment or implementation in this turn.

## 20. Test specification for the implementation

### 20.1 Focused automated checks

Use the existing Flutter test stack and established backend test stack. Tests should prove user-visible behavior or a critical contract, not mirror every padding constant.

| Test group | Required regression scenario |
| --- | --- |
| Auth form | Enter/paste valid fields without blur; submit becomes available; Done/tap overlap sends once; approval/network errors survive service wrapping |
| Join intent | Wrong QR type rejected; class intent resumes only after authorized login; cancellation clears intent; pending approval does not grant membership |
| Parent normalization | Missing/unknown status never safe; coordinates or persisted default safe without report provenance remain unknown; location updates do not alter safety-report time; absent timestamp stays absent; actual `status` field parsed; failed refresh retains prior report time |
| Parent link result | Real `autoVerified` link success and `verified` QR validation normalized separately; pending request ID retained; approval is not inferred from generic HTTP success |
| Parent summary | Unknown children excluded from reported-safe count; unread loading/error not coerced to confirmed zero |
| Parent search/avatar | No matches keeps search/clear visible; blank name renders fallback; tapping item uses correct child ID |
| Parent profile | Save without changes preserves real phone/relationship; failed save retains edits |
| Navigation | Tab changes preserve state; parent tabs do not accumulate routes; hidden/backgrounded scanner stops and cannot submit; shortcut selects correct student tab; restricted feature remains restricted |
| Layout | Login, Home actions, NDMA row, sign-video row and child card render at narrow width and 200% text without overflow |
| Progress | True zero indicator; active video callback persists once; restart restores correct user's data; other user cannot inherit completion |
| Tip | Out-of-order language response ignored; failed language change does not mislabel old text; stale date not called today |
| Connectivity | Socket offline does not imply mesh active; learning sync success does not clear crisis pending state |
| Emergency | Manual entry does not send/call; disconnect cannot produce accepted state; timeout/unknown retries reuse ID; inactivity cannot mark safe |
| Queue | Failed send remains queued; acknowledged item alone removed; storage failure not shown saved; reconnect actually invokes replay; account switch cannot replay another user's event; older Safe cannot overwrite newer Help; socket and HTTP paths enforce ordering/idempotency |
| Photo tools | Missing/malformed fields produce unknown; clear photo result does not claim route/building safety |
| Media/game lifecycle | Duplicate launch guarded; error path offers exit; rotation/system UI restored; unsupported narration stays unavailable |
| Ask and preferences | Final voice transcript requires Send; reply does not speak without opt-in; failed request retains draft/retry state; changing appearance does not resolve an incident; locale chooser exposes all four supported UI languages |

Reuse the existing regression coverage under `mobile/test/features/auth`, `mobile/test/features/mesh`, `mobile/test/features/ar` and `mobile/test/core/utils`. Add a small number of focused widget/integration tests for the newly specified behaviors. A proposed new test path must be labeled as new in a patch; do not claim the above tests already exist.

### 20.2 Manual device matrix

Dimensions below are **logical viewport test targets**, not claims about the uploaded device. Test the actual supported platforms available to the project; mark an unavailable platform as unverified.

| Dimension | Cases |
| --- | --- |
| Phone size | 320 × 568, 360 × 800, 412 × 915 |
| Larger layout | 600-wide and 840-wide viewport; landscape phone |
| Text/display size | Default, approximately 130%, 200%, and larger supported OS setting |
| System navigation | Android gesture navigation and three-button navigation; iOS safe insets where supported |
| Keyboard | Email/password, search and chat composer open; submit and errors reachable |
| Languages | English, Hindi, Marathi, Punjabi UI; representative long NDRF content-language labels |
| Assistive technology | TalkBack; VoiceOver where iOS tested; sensible focus order and no duplicate card actions |
| Connectivity | Connected, disconnected, weak/timeout, reconnect, cache/no-cache |
| Account state | Full/shared student, restricted access, pending approval, parent with zero/one/multiple children, expired session |
| Permissions | Camera/microphone/location allowed, denied and permanently denied |
| Motion/appearance | Reduced motion; ordinary light mode; existing crisis mode; dark only if actually implemented |
| Lifecycle | Background during request, return from player/game, rotate, logout/login as another user |

Use anonymized fixtures with long names, blank names, missing school/grade, real zero, missing score, old status timestamp, missing timestamp, unknown enum and large notification count. Do not use real screenshot emails in golden images.

### 20.3 Visual review and performance evidence

Capture before/after screenshots from the **same logical viewport, locale, text scale and fixture data** for each S01–S11-equivalent screen. Review navigation-bar overlap, field visibility, title wrapping, status colors, language rendering and the amount of useful content above the fold. Historical screenshot variants are reference evidence, not pixel-perfect golden baselines.

Measure actual text/control contrast in the rendered implementation. Run semantics/tap-target checks and manually confirm announcement order. A screenshot cannot verify the hitbox behind a small icon.

Profile on a representative lower-end physical Android device before setting a numerical performance commitment. Record cold/warm Home render, list scrolling, comic launch and player initialization. Require no regression in those measured journeys, no repeated network calls caused by cosmetic rebuilds, no delayed essential buttons and no unnecessary preloading of all video content. Do not claim a frame-rate target was met without a recorded trace.

### 20.4 Commands and evidence discipline

From `mobile/`, use the project's pinned Flutter toolchain and run `flutter analyze --no-fatal-infos` and `flutter test` after implementation. Run the relevant integration/device journeys and an Android debug build when platform/UI changes warrant it. Use the repository's existing backend test commands for modified status/acknowledgment contracts.

Do not install a different Flutter version or change dependency versions solely to produce a redesigned screenshot. Record new errors separately from baseline informational lints. Do not report historical backend/web/mobile passing counts as validation of this UI work. For this document-only task, source/link checks are the applicable validation; no fresh app test result is claimed.

## 21. Definition of done

- [ ] Each supplied screenshot has a mapped source, implemented target and comparable after screenshot.
- [ ] Brand mark/title, typography, spacing and main actions are consistent across the covered screens.
- [ ] All interactive content can be reached above system navigation and around the keyboard.
- [ ] Emergency help occupies reserved space and never covers another control.
- [ ] Login validity updates immediately; errors, approval and join intent work end to end.
- [ ] Student shortcuts reach the real tabs/routes; parent tabs preserve state without accumulating routes.
- [ ] Missing child status/time is unknown, not safe/current; parent summary and unread badges are truthful.
- [ ] Search remains editable when there are no results; empty-name avatars are safe.
- [ ] One Home score distinguishes unavailable, actual zero, local estimate and server-confirmed state.
- [ ] NDMA zero progress is empty; completion persists correctly and remains isolated by user.
- [ ] Video/comic/game requirements reflect actual assets and network capability.
- [ ] No mojibake remains in the covered UI; four supported interface languages render correctly.
- [ ] Sign-language content remains uncropped; captions/narration are advertised only when supported.
- [ ] Manual emergency entry never sends or calls automatically; delivery feedback matches actual acknowledgment/durable state.
- [ ] Failed crisis updates survive replay; inactivity never reports safe; photo unknown never implies safe routing.
- [ ] Security, tenant approval, verified child relationships and disabled AR safeguards remain intact.
- [ ] Focused tests and device matrix results are recorded; unsupported/unverified cases are explicit.
- [ ] No web redesign or unrelated architecture/dependency migration is included.

## 22. Handoff instructions for another implementing model

Use the following brief together with this file and the repository:

> Implement the mobile enhancements specified in `MOBILE_UI_UX_ENHANCEMENT_PLAN.md`. Read the current source before editing; baseline references may have moved. Start with B0 and the P0 correctness prerequisites. The screenshot Learn route is `ModuleScreenFile` / `NdmaModulesList`, and the Games route is `MainMenuScreen`; do not redesign only an unused alternative catalogue. Preserve existing Flutter/Riverpod architecture, roles, approval checks, verified parent-child relationships, authentication protections, supported assets and disabled unverified AR routing. Distinguish proposed UI from existing capability. Do not invent safe statuses, timestamps, scores, media downloads, narration, dispatch confirmation or server acknowledgments. Implement one bounded batch with its state and accessibility tests, then report changed files, before/after behavior, verification and remaining dependencies. Do not redesign web pages; that requires a separate screenshot-driven plan.

Required output from each implementation batch:

1. Batch and requirement IDs completed, plus the source files changed.
2. Before/after behavior, including failure, offline and permission cases.
3. Any contract/content dependency actually completed or still unavailable.
4. Relevant test results and representative screenshots from matching conditions.
5. Remaining acceptance items; never mark a capability complete because only its button exists.

### 22.1 Deferred web work

When the user provides web screenshots, create a separate web enhancement Markdown document grounded in the actual web routes/components. It may share the approved mobile colors, terminology and status semantics, but its layouts and interactions need their own source mapping. No web design conclusions are inferred from the current mobile screenshots.
