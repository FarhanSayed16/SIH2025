# Kavach Mobile App - Build Guide

## 📱 Building the App

### Prerequisites

1. **Flutter SDK** (3.24.0 or higher)
   ```bash
   flutter --version
   ```

2. **Android SDK** (API 34)
   - Android Studio installed
   - Android SDK configured

3. **Environment Variables**
   - `.env` file configured in `mobile/` directory

---

## 🚀 Quick Build

### Using Scripts

**Windows (PowerShell):**
```powershell
cd mobile
.\scripts\build.ps1
.\scripts\build.ps1 -BuildType release
.\scripts\build.ps1 -BuildType bundle
```

**Linux/Mac (Bash):**
```bash
cd mobile
chmod +x scripts/build.sh
./scripts/build.sh
./scripts/build.sh release
./scripts/build.sh bundle
```

### Manual Build

**Debug APK:**
```bash
cd mobile
flutter clean
flutter pub get
flutter build apk --debug
```

**Release APK:**
```bash
cd mobile
flutter clean
flutter pub get
flutter build apk --release
```

**App Bundle (for Play Store):**
```bash
cd mobile
flutter clean
flutter pub get
flutter build appbundle --release
```

---

## 📦 Build Outputs

### Debug APK
- **Location**: `mobile/build/app/outputs/flutter-apk/app-debug.apk`
- **Use**: Testing and development
- **Size**: ~50-80 MB

### Release APK
- **Location**: `mobile/build/app/outputs/flutter-apk/app-release.apk`
- **Use**: Distribution to testers
- **Size**: ~30-50 MB (optimized)

### App Bundle
- **Location**: `mobile/build/app/outputs/bundle/release/app-release.aab`
- **Use**: Google Play Store upload
- **Size**: ~25-40 MB (optimized, split by device)

---

## 🔧 Build Configuration

### Android

**Package ID**: `com.kavach.app`  
**App Name**: KAVACH  
**Min SDK**: 21 (Android 5.0)  
**Target SDK**: 34 (Android 14)  
**Version**: 1.0.0+1

### Build Variants

- **Debug**: Development builds with debugging enabled
- **Release**: Production-ready builds (optimized, signed)

---

## 📋 Pre-Build Checklist

- [ ] Flutter SDK installed and configured
- [ ] Android SDK installed (API 34)
- [ ] `.env` file configured
- [ ] Dependencies installed (`flutter pub get`)
- [ ] Code analyzed (`flutter analyze`)
- [ ] Tests passing (`flutter test`)

---

## 🐛 Troubleshooting

### Build Fails

1. **Clean build:**
   ```bash
   flutter clean
   flutter pub get
   ```

2. **Check Flutter version:**
   ```bash
   flutter --version
   ```

3. **Check Android SDK:**
   ```bash
   flutter doctor
   ```

### APK Not Installing

- Ensure device allows installation from unknown sources
- Check if APK is for correct architecture (arm64-v8a, armeabi-v7a, x86_64)

### Signing Issues

- Debug builds are auto-signed
- Release builds require signing configuration (see Android documentation)

---

## 📱 Distribution

### Internal Testing

1. **Firebase App Distribution** (Recommended)
   - Upload APK to Firebase
   - Share link with testers

2. **Direct APK Share**
   - Share APK file via email/cloud storage
   - Testers install manually

3. **GitHub Releases**
   - Upload APK as release asset
   - Share release link

### Play Store (Future)

1. Build App Bundle
2. Create Play Store listing
3. Upload bundle
4. Submit for review

---

## ✅ Build Verification

After building, verify:

- [ ] APK installs on test device
- [ ] App launches successfully
- [ ] Login works
- [ ] Navigation works
- [ ] Socket connection works
- [ ] Offline mode works

---

**Status**: Build system ready ✅  
**Next**: Test builds on physical devices

