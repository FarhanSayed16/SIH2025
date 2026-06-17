# Kavach Mobile App

Flutter mobile application for disaster preparedness and emergency response education system for schools and colleges.

## 📋 Table of Contents

- [Setup](#setup)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Features](#features)
- [Development](#development)
- [Testing](#testing)
- [Build](#build)

---

## 🚀 Setup

### Prerequisites

- Flutter SDK 3.24.0 or higher
- Dart SDK 3.0.0 or higher
- Android Studio / VS Code with Flutter extensions
- Android SDK (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Install Flutter dependencies:**
   ```bash
   cd mobile
   flutter pub get
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your backend URLs
   ```

3. **Initialize Hive (local storage):**
   ```bash
   flutter pub run build_runner build
   ```

4. **Run the app:**
   ```bash
   flutter run
   ```

---

## 📁 Project Structure

```
mobile/
├── lib/
│   ├── core/
│   │   ├── config/
│   │   │   └── env.dart              # Environment configuration
│   │   ├── constants/
│   │   │   ├── app_constants.dart    # App-wide constants
│   │   │   └── api_endpoints.dart    # API endpoint constants
│   │   ├── services/
│   │   │   ├── api_service.dart      # HTTP API service
│   │   │   ├── socket_service.dart   # Socket.io service
│   │   │   ├── storage_service.dart  # Secure & local storage
│   │   │   └── connectivity_service.dart # Network monitoring
│   │   ├── theme/
│   │   │   ├── app_theme.dart        # Base theme
│   │   │   ├── peace_mode_theme.dart # Peace mode (green/white)
│   │   │   ├── crisis_mode_theme.dart # Crisis mode (red/black)
│   │   │   └── theme_provider.dart   # Theme state management
│   │   └── utils/
│   │       ├── validators.dart       # Validation utilities
│   │       └── helpers.dart          # Helper functions
│   ├── features/
│   │   ├── auth/                     # Authentication (Phase 2.2)
│   │   ├── dashboard/                # Dashboard screens (Phase 2.3)
│   │   ├── emergency/                # Emergency screens (Phase 2.3)
│   │   ├── games/                    # Games (Phase 3)
│   │   └── ar/                       # AR features (Phase 5)
│   └── main.dart                     # App entry point
├── assets/
│   ├── images/                       # Image assets
│   ├── icons/                        # Icon assets
│   ├── animations/                   # Lottie animations
│   ├── fonts/                        # Custom fonts
│   └── mock_data.json                # Mock data for demos
├── test/                             # Unit & widget tests
├── .env                              # Environment variables (not in git)
├── .env.example                      # Environment template
├── analysis_options.yaml             # Linting rules
└── pubspec.yaml                      # Dependencies
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the `mobile/` directory:

```env
BASE_URL=http://localhost:3000
SOCKET_URL=http://localhost:3000
API_VERSION=v1
ENVIRONMENT=development
```

**Note**: `.env` is gitignored. Use `.env.example` as a template.

---

## ✨ Features

### Phase 2.1 (Current) ✅

- ✅ Project structure setup
- ✅ Theme system (Peace/Crisis modes)
- ✅ Environment configuration
- ✅ Core services (stubs)
- ✅ Utilities (validators, helpers)
- ✅ State management (Riverpod)
- ✅ Local storage (Hive)
- ✅ CI/CD setup

### Phase 2.2 (Next) 🔄

- Authentication flow
- Token management
- Login/Register screens

### Phase 2.3 (Planned) 📋

- Dashboard shell
- Navigation
- RedAlert screen

### Phase 2.4 (Planned) 📋

- Socket.io integration
- Real-time event handling
- Connectivity monitoring

---

## 🛠️ Development

### Running the App

```bash
# Run on connected device/emulator
flutter run

# Run in release mode
flutter run --release

# Run on specific device
flutter devices
flutter run -d <device-id>
```

### Code Analysis

```bash
# Analyze code
flutter analyze

# Format code
flutter format lib/
```

### State Management

This project uses **Riverpod** for state management.

**Providers are located in:**
- `lib/core/theme/theme_provider.dart` - Theme & app mode
- `lib/features/*/providers/` - Feature-specific providers

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/core/utils/validators_test.dart

# Run with coverage
flutter test --coverage
```

### Test Structure

```
test/
├── core/
│   └── utils/
│       └── validators_test.dart
└── helpers/
    └── test_helpers.dart
```

---

## 📦 Build

### Android

```bash
# Debug APK
flutter build apk --debug

# Release APK
flutter build apk --release

# App Bundle (for Play Store)
flutter build appbundle --release
```

### iOS

```bash
# Debug build
flutter build ios --debug

# Release build
flutter build ios --release
```

---

## 🔧 Configuration

### Android

- **Package ID**: `com.kavach.app`
- **Min SDK**: 21
- **Target SDK**: 34

### iOS

- **Bundle ID**: `com.kavach.app`
- **Min iOS**: 12.0

---

## 📚 Dependencies

### Core Dependencies

- `flutter_riverpod` - State management
- `hive` / `hive_flutter` - Local storage
- `flutter_secure_storage` - Secure token storage
- `dio` - HTTP client
- `socket_io_client` - Socket.io client
- `flutter_dotenv` - Environment variables
- `connectivity_plus` - Network monitoring

### Development Dependencies

- `flutter_test` - Testing framework
- `flutter_lints` - Linting rules
- `build_runner` - Code generation

---

## 🐛 Troubleshooting

### Common Issues

1. **Hive initialization error:**
   ```bash
   flutter clean
   flutter pub get
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

2. **Environment variables not loading:**
   - Ensure `.env` file exists in `mobile/` directory
   - Check `pubspec.yaml` includes `.env` in assets

3. **Socket.io connection issues:**
   - Verify `SOCKET_URL` in `.env`
   - Check backend server is running
   - Ensure CORS is configured on backend

---

## 📖 Documentation

- [Phase 2.1 Complete](./docs/phase-2/PHASE_2.1_COMPLETE.md)
- [Phase 2 Plan](./docs/phase-2/PHASE_2_COMPLETE_PLAN.md)
- [Architecture](./docs/ARCHITECTURE.md)

---

## 👥 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

---

## 📄 License

This project is part of the Kavach disaster preparedness system.

---

**Status**: Phase 2.1 Complete ✅  
**Next**: Phase 2.2 - Authentication Flow
