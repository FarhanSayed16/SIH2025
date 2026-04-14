# Phase 2.1: Project Setup & App Infrastructure - Task Breakdown

## 🎯 Goal

Create Flutter project scaffold with consistent folder structure, state management, theming, environment configuration, and tooling.

---

## 📋 Complete Task List

### Task 1: Verify & Update Flutter Project Setup

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Verify Flutter SDK version (3.24+)
- [ ] Check if project needs re-initialization
- [ ] Update `pubspec.yaml` with all required dependencies
- [ ] Run `flutter pub get` to install dependencies
- [ ] Verify project builds successfully

**Dependencies to Add/Verify**:
```yaml
# State Management
flutter_riverpod: ^2.4.0

# Local Storage
hive: ^2.2.0
hive_flutter: ^1.1.0
flutter_secure_storage: ^9.0.0

# Networking
dio: ^5.4.0
socket_io_client: ^2.0.3
flutter_dotenv: ^5.1.0

# Connectivity
connectivity_plus: ^5.0.0

# Utils
intl: ^0.19.0  # For i18n
```

**Files to Check/Update**:
- `mobile/pubspec.yaml`
- `mobile/lib/main.dart`

---

### Task 2: Create Complete Folder Structure

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Create `lib/core/constants/` folder
- [ ] Create `lib/core/theme/` folder
- [ ] Create `lib/core/services/` folder
- [ ] Create `lib/core/utils/` folder
- [ ] Create `lib/features/auth/screens/` folder
- [ ] Create `lib/features/auth/providers/` folder
- [ ] Create `lib/features/dashboard/screens/` folder
- [ ] Create `lib/features/dashboard/widgets/` folder
- [ ] Create `lib/features/emergency/screens/` folder
- [ ] Create `lib/features/games/` folder (placeholder)
- [ ] Create `lib/features/ar/` folder (placeholder)
- [ ] Create `assets/images/` folder
- [ ] Create `assets/icons/` folder
- [ ] Create `assets/animations/` folder
- [ ] Create `assets/fonts/` folder

**Folder Structure to Create**:
```
lib/
├── core/
│   ├── constants/
│   ├── theme/
│   ├── services/
│   └── utils/
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   └── providers/
│   ├── dashboard/
│   │   ├── screens/
│   │   └── widgets/
│   ├── emergency/
│   │   └── screens/
│   ├── games/
│   └── ar/
└── main.dart

assets/
├── images/
├── icons/
├── animations/
└── fonts/
```

---

### Task 3: Environment Configuration Setup

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Add `flutter_dotenv` to `pubspec.yaml`
- [ ] Create `.env` file in `mobile/` directory
- [ ] Create `.env.example` file
- [ ] Create `lib/core/config/env.dart` file
- [ ] Implement environment variable loader
- [ ] Add `.env` to `.gitignore`

**Files to Create**:
- `mobile/.env`
- `mobile/.env.example`
- `mobile/lib/core/config/env.dart`

**Environment Variables**:
```env
BASE_URL=http://localhost:3000
SOCKET_URL=http://localhost:3000
API_VERSION=v1
ENVIRONMENT=development
```

---

### Task 4: Constants & Configuration Files

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Create `lib/core/constants/app_constants.dart`
- [ ] Create `lib/core/constants/api_endpoints.dart`
- [ ] Define app-wide constants (colors, sizes, durations)
- [ ] Define API endpoint constants
- [ ] Define Socket.io event constants

**Files to Create**:
- `mobile/lib/core/constants/app_constants.dart`
- `mobile/lib/core/constants/api_endpoints.dart`

**Constants to Define**:
- App name, version
- API endpoints
- Socket.io events
- Timeouts, retry counts
- UI constants (padding, sizes)

---

### Task 5: Theme System Implementation

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Create `lib/core/theme/app_theme.dart` (base theme)
- [ ] Create `lib/core/theme/peace_mode_theme.dart` (green/white, friendly)
- [ ] Create `lib/core/theme/crisis_mode_theme.dart` (red/black, high contrast)
- [ ] Define color schemes for both modes
- [ ] Define text styles
- [ ] Create theme provider (Riverpod)
- [ ] Implement theme switcher logic

**Files to Create**:
- `mobile/lib/core/theme/app_theme.dart`
- `mobile/lib/core/theme/peace_mode_theme.dart`
- `mobile/lib/core/theme/crisis_mode_theme.dart`
- `mobile/lib/core/theme/theme_provider.dart`

**Theme Requirements**:
- Peace Mode: Green/White, friendly, gamified
- Crisis Mode: Red/Black, high contrast, minimal
- Dark mode support (optional)

---

### Task 6: Core Services Setup (Stubs)

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Create `lib/core/services/api_service.dart` (stub)
- [ ] Create `lib/core/services/socket_service.dart` (stub)
- [ ] Create `lib/core/services/storage_service.dart` (stub)
- [ ] Create `lib/core/services/connectivity_service.dart` (stub)
- [ ] Create service base classes/interfaces
- [ ] Add basic structure (will implement in later phases)

**Files to Create**:
- `mobile/lib/core/services/api_service.dart`
- `mobile/lib/core/services/socket_service.dart`
- `mobile/lib/core/services/storage_service.dart`
- `mobile/lib/core/services/connectivity_service.dart`

**Note**: These will be stubs initially, full implementation in later phases.

---

### Task 7: Utility Functions

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Create `lib/core/utils/validators.dart`
- [ ] Create `lib/core/utils/helpers.dart`
- [ ] Implement email validation
- [ ] Implement password validation
- [ ] Implement common helper functions
- [ ] Add formatting utilities

**Files to Create**:
- `mobile/lib/core/utils/validators.dart`
- `mobile/lib/core/utils/helpers.dart`

**Functions to Implement**:
- Email validation
- Password validation
- Date formatting
- String utilities
- Error message helpers

---

### Task 8: Update Main.dart

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Update `main.dart` to use environment config
- [ ] Initialize theme system
- [ ] Setup Riverpod providers
- [ ] Initialize Hive boxes
- [ ] Add error handling
- [ ] Update splash screen
- [ ] Add navigation setup (placeholder)

**Files to Update**:
- `mobile/lib/main.dart`

**Requirements**:
- Load environment variables
- Initialize theme
- Setup Riverpod
- Initialize storage
- Error handling

---

### Task 9: Android Configuration

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Update `android/app/build.gradle`
- [ ] Set package ID: `com.kavach.app`
- [ ] Set app name: "KAVACH"
- [ ] Configure min SDK version (21+)
- [ ] Setup debug keystore
- [ ] Add internet permission
- [ ] Configure app icon (placeholder)

**Files to Update**:
- `android/app/build.gradle`
- `android/app/src/main/AndroidManifest.xml`

---

### Task 10: iOS Configuration (if needed)

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Update `ios/Runner/Info.plist`
- [ ] Set bundle identifier: `com.kavach.app`
- [ ] Set app name: "KAVACH"
- [ ] Add required permissions
- [ ] Configure app icon (placeholder)

**Files to Update**:
- `ios/Runner/Info.plist`
- `ios/Runner.xcodeproj/project.pbxproj`

---

### Task 11: Analysis & Linting Setup

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Create/update `analysis_options.yaml`
- [ ] Configure linting rules
- [ ] Add pre-commit hooks (optional)
- [ ] Test linting works

**Files to Create/Update**:
- `mobile/analysis_options.yaml`

---

### Task 12: CI/CD Setup (GitHub Actions)

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Create `.github/workflows/flutter.yml`
- [ ] Setup Flutter analyze job
- [ ] Setup Flutter test job
- [ ] Configure for Android builds
- [ ] Test CI pipeline

**Files to Create**:
- `.github/workflows/flutter.yml`

---

### Task 13: Assets Configuration

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Update `pubspec.yaml` with assets paths
- [ ] Create placeholder app icon
- [ ] Create placeholder splash screen assets
- [ ] Add font configuration (if custom fonts)

**Files to Update**:
- `mobile/pubspec.yaml`

**Assets to Add**:
- App icon (placeholder)
- Splash screen (placeholder)
- Fonts (if needed)

---

### Task 14: Testing Setup

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Create `test/` folder structure
- [ ] Create sample unit test
- [ ] Create sample widget test
- [ ] Verify tests can run
- [ ] Add test utilities

**Files to Create**:
- `mobile/test/core/utils/validators_test.dart` (sample)
- `mobile/test/helpers/test_helpers.dart`

---

### Task 15: Documentation

**Status**: ⏳ Pending

**Subtasks**:
- [ ] Update `mobile/README.md` with setup instructions
- [ ] Document folder structure
- [ ] Document environment setup
- [ ] Document how to run the app
- [ ] Create Phase 2.1 completion doc

**Files to Update/Create**:
- `mobile/README.md`
- `docs/phase-2/PHASE_2.1_COMPLETE.md`

---

## ✅ Acceptance Criteria

Before Phase 2.1 is complete:

- [ ] App builds and runs on Android emulator
- [ ] `main.dart` boots and shows splash screen
- [ ] Folder structure is complete
- [ ] Theme system is functional (can switch themes)
- [ ] Environment variables load correctly
- [ ] Lint and tests run in CI
- [ ] All dependencies installed
- [ ] Documentation updated

---

## 📊 Task Summary

| Task | Subtasks | Status |
|------|----------|--------|
| 1. Verify Flutter Setup | 5 | ⏳ Pending |
| 2. Folder Structure | 15 | ⏳ Pending |
| 3. Environment Config | 6 | ⏳ Pending |
| 4. Constants | 5 | ⏳ Pending |
| 5. Theme System | 7 | ⏳ Pending |
| 6. Core Services (Stubs) | 5 | ⏳ Pending |
| 7. Utilities | 6 | ⏳ Pending |
| 8. Update main.dart | 7 | ⏳ Pending |
| 9. Android Config | 7 | ⏳ Pending |
| 10. iOS Config | 5 | ⏳ Pending |
| 11. Linting Setup | 4 | ⏳ Pending |
| 12. CI/CD Setup | 5 | ⏳ Pending |
| 13. Assets Config | 4 | ⏳ Pending |
| 14. Testing Setup | 5 | ⏳ Pending |
| 15. Documentation | 5 | ⏳ Pending |

**Total Tasks**: 15  
**Total Subtasks**: 95

---

## 🚀 Implementation Order

### Step 1: Foundation (Tasks 1-3)
1. Verify Flutter setup
2. Create folder structure
3. Setup environment configuration

### Step 2: Core Infrastructure (Tasks 4-7)
4. Create constants
5. Implement theme system
6. Create service stubs
7. Create utilities

### Step 3: Integration (Tasks 8-10)
8. Update main.dart
9. Android configuration
10. iOS configuration

### Step 4: Quality & Deployment (Tasks 11-15)
11. Linting setup
12. CI/CD setup
13. Assets configuration
14. Testing setup
15. Documentation

---

## 📝 Notes

- **State Management**: Using Riverpod (already in pubspec.yaml)
- **Local Storage**: Using Hive (already in pubspec.yaml)
- **Networking**: Using Dio (already in pubspec.yaml)
- **Socket.io**: Using socket_io_client (already in pubspec.yaml)

---

**Status**: 📋 **TASKS DEFINED**  
**Ready to Start**: ✅ Yes  
**Next**: Begin Task 1

