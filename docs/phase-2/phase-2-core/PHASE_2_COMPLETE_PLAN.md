# Phase 2: Mobile & Admin Shells - Complete Implementation Plan

## 📋 Table of Contents

1. [Overview](#overview)
2. [Phase 2 Summary](#phase-2-summary)
3. [Prerequisites & Phase 1 Review](#prerequisites--phase-1-review)
4. [Sub-Phase Breakdown](#sub-phase-breakdown)
5. [Add-ons & Enhancements](#add-ons--enhancements)
6. [Additional Recommendations](#additional-recommendations)
7. [Tech Stack Decisions](#tech-stack-decisions)
8. [File Organization](#file-organization)
9. [Implementation Checklist](#implementation-checklist)
10. [Acceptance Criteria](#acceptance-criteria)

---

## 🎯 Overview

**Phase 2 Goal**: Deliver production-quality app shells for mobile (Flutter) and admin web (React/Next.js) that authenticate with the backend, navigate core flows, and receive real-time events.

**Outcome**: 
- ✅ Flutter app installed on devices with login, token persistence, Socket.io connection, dashboard shell, and RedAlert screen
- ✅ React admin app with login, drill scheduling, and real-time event viewing
- ✅ Shared design tokens, themes, and assets for consistent UI

**Timeline**: Estimated 4-6 weeks (depending on team size)

---

## 📊 Phase 2 Summary

### What Phase 2 Delivers

1. **Mobile App Shell (Flutter)**
   - Complete authentication flow
   - Dashboard with navigation
   - Real-time Socket.io integration
   - Push notifications (FCM)
   - Offline caching
   - RedAlert screen
   - Theme system (Peace/Crisis modes)

2. **Admin Web Shell (React/Next.js)**
   - Admin authentication
   - Drill scheduler
   - Real-time event viewer
   - Device management UI
   - Dashboard with metrics

3. **Shared Infrastructure**
   - Design tokens
   - Theme system
   - Asset management
   - API client libraries

---

## ✅ Prerequisites & Phase 1 Review

### Phase 1 Completion Status

#### ✅ Completed & Ready:
- ✅ Backend APIs (all endpoints functional)
- ✅ Authentication (JWT + Refresh tokens)
- ✅ Socket.io server (real-time events)
- ✅ Device endpoints (IoT ready)
- ✅ AI proxy endpoint
- ✅ Geospatial queries
- ✅ Sync endpoint

#### ⚠️ Added for Phase 2:
- ✅ **FCM Token Registration Endpoint** (`POST /api/users/:id/fcm-token`)
  - **Status**: Just added
  - **Purpose**: Register FCM tokens for push notifications
  - **Location**: `backend/src/controllers/user.controller.js`
  - **Route**: `backend/src/routes/user.routes.js`

### Backend APIs Available for Phase 2

#### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get profile

#### User Management
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/location` - Update location
- `PUT /api/users/:id/safety-status` - Update safety status
- `POST /api/users/:id/fcm-token` - **NEW: Register FCM token**

#### Schools
- `GET /api/schools` - List schools
- `GET /api/schools/:id` - Get school
- `GET /api/schools/nearest` - Find nearest (Geo-Spatial)

#### Drills
- `GET /api/drills` - List drills
- `POST /api/drills` - Schedule drill
- `POST /api/drills/:id/trigger` - Trigger drill
- `POST /api/drills/:id/acknowledge` - Acknowledge drill

#### Alerts
- `GET /api/alerts` - List alerts
- `POST /api/alerts` - Create alert
- `PUT /api/alerts/:id/resolve` - Resolve alert

#### Modules
- `GET /api/modules` - List modules
- `GET /api/modules/:id` - Get module
- `POST /api/modules/:id/complete` - Complete module

#### Devices
- `GET /api/devices` - List devices
- `POST /api/devices/register` - Register device

#### Sync
- `POST /api/sync` - Sync offline data

#### Socket.io Events
- `JOIN_ROOM` - Join school room
- `DRILL_SCHEDULED` - Drill scheduled event
- `CRISIS_ALERT` - Crisis alert event
- `DRILL_ACK` - Drill acknowledgment
- `DRILL_SUMMARY` - Drill summary
- `STUDENT_STATUS_UPDATE` - Student status update

---

## 📦 Sub-Phase Breakdown

### 2.1: Project Setup & App Infrastructure (Mobile)

**Goal**: Create Flutter project scaffold with consistent structure, state management, theming, and tooling.

#### Build Tasks:

1. **Initialize Flutter Project**
   ```bash
   flutter create kavach_app
   cd kavach_app
   ```

2. **Folder Structure**
   ```
   lib/
   ├── core/
   │   ├── constants/
   │   │   ├── app_constants.dart
   │   │   └── api_endpoints.dart
   │   ├── theme/
   │   │   ├── app_theme.dart
   │   │   ├── peace_mode_theme.dart
   │   │   └── crisis_mode_theme.dart
   │   ├── services/
   │   │   ├── api_service.dart
   │   │   ├── socket_service.dart
   │   │   ├── storage_service.dart
   │   │   └── connectivity_service.dart
   │   └── utils/
   │       ├── validators.dart
   │       └── helpers.dart
   ├── features/
   │   ├── auth/
   │   │   ├── screens/
   │   │   │   ├── login_screen.dart
   │   │   │   └── register_screen.dart
   │   │   └── providers/
   │   │       └── auth_provider.dart
   │   ├── dashboard/
   │   │   ├── screens/
   │   │   │   ├── home_screen.dart
   │   │   │   ├── learn_screen.dart
   │   │   │   ├── games_screen.dart
   │   │   │   └── profile_screen.dart
   │   │   └── widgets/
   │   ├── emergency/
   │   │   └── screens/
   │   │       └── red_alert_screen.dart
   │   ├── games/
   │   │   └── (placeholder)
   │   └── ar/
   │       └── (placeholder)
   └── main.dart
   ```

3. **State Management Decision**
   - **Recommended**: **Riverpod** (scalable, type-safe, testable)
   - **Alternative**: Provider (simpler, faster start)
   - **Setup**: Add `flutter_riverpod` to `pubspec.yaml`

4. **Environment Configuration**
   - Use `flutter_dotenv` for environment variables
   - Create `.env` file with:
     ```env
     BASE_URL=http://localhost:3000
     SOCKET_URL=http://localhost:3000
     API_VERSION=v1
     ```

5. **Theme System**
   - Define `PeaceModeTheme` (green/white, friendly)
   - Define `CrisisModeTheme` (red/black, high contrast)
   - Theme switcher based on app state

6. **CI/CD Setup**
   - GitHub Actions for Flutter analyze
   - Pre-commit hooks for formatting
   - Test automation

#### Acceptance Criteria:
- ✅ App builds and runs on Android emulator
- ✅ `main.dart` shows splash → login screen
- ✅ Lint and tests run in CI
- ✅ Theme system functional

---

### 2.2: Authentication Flow & Token Management (Mobile)

**Goal**: Implement secure auth flows, local token storage, and session management.

#### Build Tasks:

1. **AuthService Implementation**
   ```dart
   class AuthService {
     Future<AuthResponse> login(String email, String password);
     Future<void> logout();
     Future<String?> refreshTokenIfNeeded();
     bool isAuthenticated();
     User? getCurrentUser();
   }
   ```

2. **Token Storage**
   - Use `flutter_secure_storage` for tokens
   - Store: `accessToken`, `refreshToken`, `userId`
   - Auto-login on app start

3. **Token Refresh Interceptor**
   - Intercept 401 responses
   - Auto-refresh token
   - Retry original request

4. **Screens**
   - `LoginScreen`: Email + password + login button
   - `RegisterScreen`: Registration form (optional for demo)

5. **Role Switcher (Dev Mode)**
   - Hidden toggle in settings
   - Tap version number 7 times → Developer menu
   - Switch between Student/Teacher/Admin roles

#### Integration:
- Backend: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`

#### Acceptance Criteria:
- ✅ User can login and token is stored securely
- ✅ Token refresh works automatically
- ✅ Protected routes redirect to login if no token
- ✅ Role switcher present in dev mode

---

### 2.3: Dashboard Shell & Core Screens (Mobile)

**Goal**: Build main app navigation and dashboard UI components.

#### Build Tasks:

1. **Bottom Navigation Bar**
   - Tabs: Home, Learn, Games, Profile
   - Persistent across screens

2. **Home Screen**
   - Preparedness Score (circular indicator)
   - Quick actions:
     - "Start Drill" button
     - "View Modules" button
     - "Play Game" button
   - Emergency FAB (prominent red button)

3. **Learn Screen**
   - List of modules (pull to refresh)
   - Cached modules display
   - Module detail view

4. **Games Screen**
   - List of installed games
   - Placeholder screens for future games

5. **Profile Screen**
   - User details
   - Role display
   - Settings:
     - Role switcher (dev mode)
     - Theme toggle
     - Language selector
     - Version number (tap 7 times for dev menu)

6. **RedAlertScreen**
   - Full-screen overlay
   - High contrast (red/black)
   - Blocks navigation
   - Shows alert details
   - Action buttons

7. **Developer Menu (Add-on 2)**
   - Trigger: Tap version 7 times
   - Options:
     - Toggle Force Crisis Mode
     - Clear Local Storage
     - Switch Role
     - Send Fake Mesh Message
     - Inject Mock Data

#### Integration:
- Backend: `/api/modules`, `/api/users/:id`

#### Acceptance Criteria:
- ✅ Navigation flows work
- ✅ Dashboard shows placeholder data
- ✅ Modules list cached and displayed
- ✅ Emergency FAB navigates to RedAlertScreen
- ✅ Developer menu accessible

---

### 2.4: Socket Client & Real-time Handling (Mobile)

**Goal**: Connect to Socket.io server, join school room, and respond to real-time events.

#### Build Tasks:

1. **SocketService Implementation**
   ```dart
   class SocketService {
     void connect(String token);
     void joinRoom(String schoolId);
     void disconnect();
     void on(String event, Function handler);
     void emit(String event, Map<String, dynamic> data);
   }
   ```

2. **Event Handlers**
   - `DRILL_SCHEDULED` → Show banner + schedule notification
   - `CRISIS_ALERT` → Navigate to RedAlertScreen immediately
   - `DRILL_SUMMARY` → Show summary modal
   - `STUDENT_STATUS_UPDATE` → Update UI

3. **Reconnection Logic**
   - Exponential backoff
   - Show offline indicator
   - Auto-reconnect on network restore

4. **Connectivity Listener (Add-on 1)**
   - Use `connectivity_plus` package
   - Listen to connectivity changes
   - **Logic**:
     - WiFi/Data ON → Connect Socket.io (Green Dot)
     - WiFi/Data OFF → Kill Socket, Start Mesh (Red Dot)
     - Show "Offline Mode: Mesh Active" banner

#### Integration:
- Backend Socket.io server
- Events: `JOIN_ROOM`, `DRILL_SCHEDULED`, `CRISIS_ALERT`, etc.

#### Acceptance Criteria:
- ✅ App connects to Socket.io on login
- ✅ App joins school room
- ✅ Receives test CRISIS_ALERT broadcast
- ✅ Navigates to RedAlertScreen on alert
- ✅ Connectivity listener works (Add-on 1)

---

### 2.5: Push Notifications & Background Behavior (Mobile)

**Goal**: Implement FCM for alert reliability when app is backgrounded or killed.

#### Build Tasks:

1. **FCM Integration**
   - Add `firebase_messaging` package
   - Initialize Firebase
   - Get device token
   - Register token with backend

2. **Message Handlers**
   - Foreground messages → Show in-app banner
   - Background messages → Show OS notification
   - Tap notification → Open app to RedAlertScreen

3. **Token Registration**
   - Send token to backend on login
   - Update token if changed
   - Handle token refresh

4. **Permissions**
   - Request notification permissions
   - Handle iOS/Android differences

#### Integration:
- Backend: `POST /api/users/:id/fcm-token`
- Firebase Cloud Messaging

#### Acceptance Criteria:
- ✅ FCM token registered with backend
- ✅ Push arrives when app backgrounded
- ✅ Tapping notification opens RedAlertScreen
- ✅ Foreground messages show in-app

---

### 2.6: Offline Caching & Content Sync (Mobile)

**Goal**: Ensure app has essential content offline.

#### Build Tasks:

1. **Content Sync Service**
   - Download modules on first launch
   - Store in Hive/SQLite
   - Background refresh (daily)

2. **Offline UX**
   - Show cached modules
   - Display "Last updated" timestamp
   - Offline indicator

3. **Mock Data Injector (Add-on 3)**
   - Check if Hive box is empty
   - If empty → Inject `assets/mock_data.json`
   - Contains:
     - 5 fake drill logs
     - 3 badges
     - Leaderboard data
   - Makes app look "lived in"

4. **Asset Management**
   - Bundle minimal assets in-app
   - Download heavy assets on WiFi only
   - LRU eviction policy

#### Integration:
- Backend: `/api/modules`, `/api/sync`
- Local storage: Hive

#### Acceptance Criteria:
- ✅ Modules display when offline
- ✅ Sync runs when connection restored
- ✅ Mock data injected on first launch
- ✅ Assets cached properly

---

### 2.7: Accessibility, Internationalization & Theming (Mobile)

**Goal**: Make app accessible and ready for Hindi + English.

#### Build Tasks:

1. **i18n Support**
   - Use `flutter_localizations` and `intl`
   - Create `strings_en.dart` and `strings_hi.dart`
   - Language switcher in settings

2. **Accessibility**
   - Screen reader labels
   - High contrast mode
   - Scalable text
   - VoiceOver/TalkBack support

3. **Theme Toggles**
   - Peace/Crisis mode toggle
   - Dark mode (optional)

#### Acceptance Criteria:
- ✅ App switches between English/Hindi
   - ✅ Screen readers work
   - ✅ High contrast mode available

---

### 2.8: Mobile QA, Builds & Distribution

**Goal**: Prepare installable builds for testers.

#### Build Tasks:

1. **CI/CD for Builds**
   - GitHub Actions for APK/IPA generation
   - Firebase App Distribution setup
   - Test build automation

2. **App Assets**
   - App icons (Android + iOS)
   - Splash screen
   - App name: "KAVACH"

3. **Distribution**
   - Firebase App Distribution
   - Internal test links
   - Debug builds for demo

#### Acceptance Criteria:
- ✅ Testers can install app on physical devices
- ✅ Demo device has latest build
- ✅ CI generates builds automatically

---

### 2.9: Admin Web Shell (React/Next.js)

**Goal**: Create minimal admin interface for drill scheduling and event viewing.

#### Build Tasks:

1. **Project Setup**
   - Next.js 14+ with TypeScript
   - UI library: **Shadcn/ui** (recommended) or Material-UI
   - State management: Zustand or React Query

2. **Pages**
   - `/login` - Admin login
   - `/dashboard` - Live counters, recent alerts
   - `/drills` - Drill scheduler
   - `/devices` - Device list
   - `/map` - School location (placeholder)

3. **Components**
   - Header/Sidebar navigation
   - Modal for triggering test alerts
   - Charts (Recharts) for metrics

4. **Socket.io Client**
   - Connect to backend Socket.io
   - Listen for `CRISIS_ALERT`, `DRILL_SCHEDULED`
   - Show visual notifications

5. **API Integration**
   - `/api/auth/login`
   - `/api/drills` (create, list)
   - `/api/alerts` (list)
   - `/api/devices` (list)

#### Integration:
- Backend APIs (Phase 1)
- Socket.io server

#### Acceptance Criteria:
- ✅ Admin can login
- ✅ Can schedule drill (triggers socket event)
- ✅ Dashboard shows real-time events
- ✅ Device list displays

---

### 2.10: Testing, Observability & Documentation

**Goal**: Make shells reliable, testable, and handover-ready.

#### Build Tasks:

1. **Unit Tests**
   - Auth service tests
   - Socket service tests (mocks)
   - Navigation logic tests

2. **Integration Tests**
   - E2E test: Login → Join room → Receive alert
   - Use `integration_test` or `flutter_driver`

3. **Documentation**
   - Developer setup instructions
   - API usage examples
   - Architecture diagrams

4. **CI/CD**
   - Run lint/tests for mobile
   - Run lint/tests for web

#### Acceptance Criteria:
- ✅ Unit tests pass in CI
- ✅ Integration test demonstrates full flow
- ✅ Documentation complete

---

## 🎁 Add-ons & Enhancements

### Add-on 1: Smart Network Switcher (Mesh Integration)

**Purpose**: Seamlessly switch between Socket.io and Mesh networking.

**Implementation**:
```dart
class ConnectivityService {
  void listenToConnectivity() {
    connectivity.onConnectivityChanged.listen((result) {
      if (result == ConnectivityResult.none) {
        // Kill Socket.io
        socketService.disconnect();
        // Start Mesh
        meshService.startAdvertising();
        // Show offline banner
        showOfflineBanner();
      } else {
        // Connect Socket.io
        socketService.connect();
        // Stop Mesh
        meshService.stopAdvertising();
        // Hide offline banner
        hideOfflineBanner();
      }
    });
  }
}
```

**Why Important**: Shows judges you handled the transition, not just two states.

---

### Add-on 2: God Mode Hidden Menu (Demo Helper)

**Purpose**: Force events and switch roles for demos.

**Implementation**:
- Tap version number 7 times in Profile screen
- Developer menu appears with:
  - Toggle Force Crisis Mode
  - Clear Local Storage
  - Switch Role (Student/Teacher/Admin)
  - Send Fake Mesh Message
  - Inject Mock Data

**Why Important**: Ensures demo never fails due to server lag or wrong credentials.

---

### Add-on 3: Mock Data Injector (Visual Polish)

**Purpose**: Make app look "lived in" from first launch.

**Implementation**:
```dart
void injectMockData() {
  if (hiveBox.isEmpty) {
    final mockData = jsonDecode(
      await rootBundle.loadString('assets/mock_data.json')
    );
    // Inject drill logs, badges, leaderboard
    hiveBox.put('drillLogs', mockData['drillLogs']);
    hiveBox.put('badges', mockData['badges']);
    hiveBox.put('leaderboard', mockData['leaderboard']);
  }
}
```

**Why Important**: App looks popular and functional from first second.

---

## 💡 Additional Recommendations

### 1. Error Handling & User Feedback

**Recommendation**: Implement comprehensive error handling
- Network errors → Show retry button
- Auth errors → Redirect to login
- Socket errors → Show reconnection status
- User-friendly error messages

### 2. Loading States

**Recommendation**: Add loading indicators
- Skeleton screens for lists
- Progress indicators for actions
- Pull-to-refresh feedback

### 3. Analytics (Optional)

**Recommendation**: Add basic analytics
- Screen views
- Feature usage
- Error tracking
- Use Firebase Analytics or custom solution

### 4. Performance Optimization

**Recommendation**: Optimize for low-end devices
- Image caching
- Lazy loading
- Code splitting
- Memory management

### 5. Security Enhancements

**Recommendation**: Additional security measures
- Certificate pinning (production)
- Biometric authentication (optional)
- App integrity checks
- Secure storage for sensitive data

### 6. Testing Strategy

**Recommendation**: Comprehensive testing
- Unit tests for services
- Widget tests for UI
- Integration tests for flows
- Manual testing checklist

---

## 🛠 Tech Stack Decisions

### Mobile (Flutter)

| Component | Choice | Reason |
|-----------|--------|--------|
| State Management | **Riverpod** | Scalable, type-safe, testable |
| Local Storage | **Hive** | Fast, binary, simple |
| Networking | **Dio** | Interceptors, error handling |
| Socket.io | **socket_io_client** | Official client |
| Secure Storage | **flutter_secure_storage** | Encrypted storage |
| Connectivity | **connectivity_plus** | Network status |
| FCM | **firebase_messaging** | Push notifications |
| i18n | **flutter_localizations** | Built-in support |
| UI Components | **Custom** | Full control |

### Web (Next.js)

| Component | Choice | Reason |
|-----------|--------|--------|
| Framework | **Next.js 14+** | SSR, routing, API routes |
| UI Library | **Shadcn/ui** | Modern, customizable |
| State Management | **Zustand** | Simple, lightweight |
| Data Fetching | **React Query** | Caching, sync |
| Charts | **Recharts** | Flexible, React-native |
| Socket.io | **socket.io-client** | Real-time |
| Styling | **Tailwind CSS** | Utility-first |

---

## 📁 File Organization

### Recommended Structure

```
kavach/
├── backend/              # Phase 1 (Complete)
├── mobile/               # Phase 2 (Flutter)
│   ├── lib/
│   ├── assets/
│   ├── test/
│   └── pubspec.yaml
├── web/                  # Phase 2 (Next.js)
│   ├── app/
│   ├── components/
│   └── package.json
└── docs/
    ├── phase-0/         # Phase 0 docs
    ├── phase-1/          # Phase 1 docs
    ├── phase-2/          # Phase 2 docs
    └── shared/           # Shared docs (architecture, etc.)
```

---

## ✅ Implementation Checklist

### Phase 2.1: Setup
- [ ] Initialize Flutter project
- [ ] Setup folder structure
- [ ] Configure state management (Riverpod)
- [ ] Setup environment config
- [ ] Create theme system
- [ ] Setup CI/CD

### Phase 2.2: Authentication
- [ ] Implement AuthService
- [ ] Create LoginScreen
- [ ] Create RegisterScreen
- [ ] Token storage (secure)
- [ ] Token refresh interceptor
- [ ] Role switcher (dev mode)

### Phase 2.3: Dashboard
- [ ] Bottom navigation
- [ ] Home screen
- [ ] Learn screen
- [ ] Games screen
- [ ] Profile screen
- [ ] RedAlertScreen
- [ ] Developer menu

### Phase 2.4: Socket.io
- [ ] SocketService implementation
- [ ] Event handlers
- [ ] Reconnection logic
- [ ] Connectivity listener (Add-on 1)

### Phase 2.5: Push Notifications
- [ ] FCM integration
- [ ] Token registration
- [ ] Message handlers
- [ ] Permissions

### Phase 2.6: Offline
- [ ] Content sync service
- [ ] Offline UX
- [ ] Mock data injector (Add-on 3)

### Phase 2.7: i18n & Accessibility
- [ ] English + Hindi strings
- [ ] Language switcher
- [ ] Screen reader support
- [ ] High contrast mode

### Phase 2.8: Builds
- [ ] CI for APK/IPA
- [ ] App icons
- [ ] Distribution setup

### Phase 2.9: Admin Web
- [ ] Next.js setup
- [ ] Login page
- [ ] Dashboard
- [ ] Drill scheduler
- [ ] Socket.io client
- [ ] Device list

### Phase 2.10: Testing & Docs
- [ ] Unit tests
- [ ] Integration tests
- [ ] Documentation
- [ ] CI/CD

---

## 🎯 Acceptance Criteria

Before moving to Phase 3, ensure:

1. ✅ Flutter app installed on test device
2. ✅ Can login via backend credentials
3. ✅ Token persists and auto-logs in
4. ✅ App calls JOIN_ROOM and receives CRISIS_ALERT
5. ✅ RedAlertScreen displays correctly
6. ✅ Modules list cached and displayed offline
7. ✅ FCM token registered with backend
8. ✅ React admin app can login and schedule drill
9. ✅ CI runs tests and builds
10. ✅ All add-ons implemented

---

## 📚 Next Steps After Phase 2

- Kick off Phase 3 (Gamification & Content)
- Integrate game stubs
- Prepare AR placeholder for Phase 5
- Begin content creation

---

**Status**: 📋 **PLAN READY**  
**Next**: Begin Phase 2.1 Implementation  
**Last Updated**: Phase 2 Planning

