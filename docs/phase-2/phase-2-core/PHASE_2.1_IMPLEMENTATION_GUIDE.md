# Phase 2.1: Implementation Guide

## 🎯 Quick Reference

This guide provides step-by-step instructions for implementing Phase 2.1.

---

## 📋 Task Execution Order

### Phase A: Foundation Setup (Tasks 1-3)

#### Task 1: Verify Flutter Setup
```bash
# Check Flutter version
flutter --version

# Navigate to mobile directory
cd mobile

# Update pubspec.yaml dependencies
# Run pub get
flutter pub get

# Verify build
flutter build apk --debug
```

#### Task 2: Create Folder Structure
```bash
# Create all required folders
mkdir -p lib/core/constants
mkdir -p lib/core/theme
mkdir -p lib/core/services
mkdir -p lib/core/utils
mkdir -p lib/core/config
mkdir -p lib/features/auth/screens
mkdir -p lib/features/auth/providers
mkdir -p lib/features/dashboard/screens
mkdir -p lib/features/dashboard/widgets
mkdir -p lib/features/emergency/screens
mkdir -p lib/features/games
mkdir -p lib/features/ar
mkdir -p assets/images
mkdir -p assets/icons
mkdir -p assets/animations
mkdir -p assets/fonts
```

#### Task 3: Environment Configuration
- Create `.env` file
- Create `.env.example` file
- Create `lib/core/config/env.dart`
- Load environment variables in `main.dart`

---

### Phase B: Core Infrastructure (Tasks 4-7)

#### Task 4: Constants
- Create `app_constants.dart` with app-wide constants
- Create `api_endpoints.dart` with API endpoint strings

#### Task 5: Theme System
- Create base theme
- Create Peace Mode theme (green/white)
- Create Crisis Mode theme (red/black)
- Create theme provider

#### Task 6: Service Stubs
- Create API service stub
- Create Socket service stub
- Create Storage service stub
- Create Connectivity service stub

#### Task 7: Utilities
- Create validators
- Create helpers

---

### Phase C: Integration (Tasks 8-10)

#### Task 8: Update main.dart
- Load environment
- Initialize theme
- Setup providers
- Initialize storage

#### Task 9: Android Config
- Update build.gradle
- Update AndroidManifest.xml
- Set package ID and app name

#### Task 10: iOS Config (if needed)
- Update Info.plist
- Set bundle identifier

---

### Phase D: Quality & Deployment (Tasks 11-15)

#### Task 11: Linting
- Create analysis_options.yaml
- Configure rules

#### Task 12: CI/CD
- Create GitHub Actions workflow
- Setup analyze and test jobs

#### Task 13: Assets
- Update pubspec.yaml
- Add placeholder assets

#### Task 14: Testing
- Create test structure
- Add sample tests

#### Task 15: Documentation
- Update README
- Create completion doc

---

## 🔧 Key Implementation Details

### Environment Variables
```dart
// lib/core/config/env.dart
class Env {
  static String get baseUrl => dotenv.env['BASE_URL'] ?? 'http://localhost:3000';
  static String get socketUrl => dotenv.env['SOCKET_URL'] ?? 'http://localhost:3000';
  static String get apiVersion => dotenv.env['API_VERSION'] ?? 'v1';
}
```

### Theme Provider
```dart
// lib/core/theme/theme_provider.dart
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier();
});

final appModeProvider = StateNotifierProvider<AppModeNotifier, AppMode>((ref) {
  return AppModeNotifier();
});
```

### Constants Structure
```dart
// lib/core/constants/app_constants.dart
class AppConstants {
  static const String appName = 'Kavach';
  static const String appVersion = '1.0.0';
  // ... more constants
}
```

---

## ✅ Verification Checklist

After each task:
- [ ] Code compiles without errors
- [ ] No linting errors
- [ ] Files created in correct locations
- [ ] Dependencies added to pubspec.yaml
- [ ] Documentation updated

---

**Ready to Start**: ✅ Yes  
**Follow**: Task order above

