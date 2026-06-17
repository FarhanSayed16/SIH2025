# Kavach Mobile App - Distribution Guide

## 📦 Distribution Methods

### 1. Firebase App Distribution (Recommended)

**Setup:**
1. Create Firebase project
2. Enable App Distribution
3. Add testers/groups
4. Upload APK

**Steps:**
```bash
# Build release APK
flutter build apk --release

# Upload to Firebase App Distribution
firebase appdistribution:distribute build/app/outputs/flutter-apk/app-release.apk \
  --app YOUR_APP_ID \
  --groups "testers"
```

**Benefits:**
- Easy tester management
- Automatic updates
- Crash reporting
- Analytics

---

### 2. Direct APK Distribution

**Steps:**
1. Build release APK
2. Upload to cloud storage (Google Drive, Dropbox, etc.)
3. Share download link with testers
4. Testers enable "Install from unknown sources"

**Security:**
- Use secure sharing method
- Verify tester identity
- Limit distribution

---

### 3. GitHub Releases

**Steps:**
1. Build release APK
2. Create GitHub release
3. Upload APK as release asset
4. Share release link

**Benefits:**
- Version tracking
- Release notes
- Easy access

---

### 4. Internal Testing (Play Store)

**Steps:**
1. Build App Bundle
2. Create Play Store listing
3. Upload to Internal Testing track
4. Add testers via email

**Requirements:**
- Google Play Developer account ($25 one-time)
- App Bundle format (.aab)
- Signing key configured

---

## 🔐 Signing Configuration

### Debug Builds
- Auto-signed by Flutter
- No configuration needed
- For development only

### Release Builds
- Require signing key
- Create keystore:
  ```bash
  keytool -genkey -v -keystore ~/kavach-key.jks \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -alias kavach
  ```

- Configure in `android/app/build.gradle`:
  ```gradle
  signingConfigs {
    release {
      keyAlias keystoreProperties['keyAlias']
      keyPassword keystoreProperties['keyPassword']
      storeFile keystoreProperties['storeFile']
      storePassword keystoreProperties['storePassword']
    }
  }
  ```

---

## 📱 Build Types

### Debug APK
- **Use**: Development and testing
- **Size**: ~50-80 MB
- **Features**: Debugging enabled, larger size

### Release APK
- **Use**: Distribution to testers
- **Size**: ~30-50 MB
- **Features**: Optimized, smaller size

### App Bundle
- **Use**: Play Store upload
- **Size**: ~25-40 MB
- **Features**: Split by device architecture

---

## 🎯 Distribution Checklist

### Pre-Distribution
- [ ] App tested on multiple devices
- [ ] All features working
- [ ] No critical bugs
- [ ] Version number updated
- [ ] Release notes prepared

### Distribution
- [ ] APK/Bundle built
- [ ] Signed (for release)
- [ ] Uploaded to distribution platform
- [ ] Testers notified
- [ ] Download link shared

### Post-Distribution
- [ ] Monitor crash reports
- [ ] Collect feedback
- [ ] Track installs
- [ ] Address issues

---

## 📊 Version Management

### Version Format
- **Format**: `major.minor.patch+build`
- **Example**: `1.0.0+1`
- **Location**: `pubspec.yaml`

### Versioning Strategy
- **Major**: Breaking changes
- **Minor**: New features
- **Patch**: Bug fixes
- **Build**: Build number (increment each build)

---

## 🔄 Update Process

1. **Fix bugs / Add features**
2. **Update version in `pubspec.yaml`**
3. **Build new APK/Bundle**
4. **Upload to distribution platform**
5. **Notify testers**
6. **Monitor feedback**

---

## 📝 Release Notes Template

```
## Version 1.0.0

### New Features
- Authentication system
- Real-time alerts
- Offline support
- Hindi language support

### Improvements
- Better error handling
- Improved UI

### Bug Fixes
- Fixed login issue
- Fixed sync problem

### Known Issues
- Firebase not configured (FCM disabled)
```

---

**Status**: Distribution Guide Ready ✅  
**Next**: Build and distribute test builds

