# Kavach Mobile App - QA Checklist

## 📋 Testing Checklist

### Phase 2.1: Project Setup ✅
- [ ] App builds without errors
- [ ] App launches on Android device/emulator
- [ ] Splash screen displays correctly
- [ ] Theme system works (Peace/Crisis modes)

### Phase 2.2: Authentication ✅
- [ ] Login screen displays correctly
- [ ] User can register new account
- [ ] User can login with valid credentials
- [ ] Login fails with invalid credentials (proper error message)
- [ ] Token stored securely
- [ ] Auto-login works on app restart
- [ ] Logout clears tokens and redirects to login

### Phase 2.3: Dashboard ✅
- [ ] Bottom navigation works
- [ ] Home screen displays correctly
- [ ] Preparedness score shows (placeholder)
- [ ] Quick action cards work
- [ ] Emergency FAB navigates to RedAlert
- [ ] Learn screen shows modules
- [ ] Games screen displays
- [ ] Profile screen shows user info
- [ ] Developer menu accessible (tap version 7 times)

### Phase 2.4: Socket & Real-time ✅
- [ ] Socket connects on login
- [ ] Joins school room automatically
- [ ] Connectivity indicator shows status
- [ ] Receives test CRISIS_ALERT
- [ ] Navigates to RedAlert on alert
- [ ] Reconnection works after disconnect
- [ ] Offline mode shows "Mesh Active"

### Phase 2.5: Push Notifications ✅
- [ ] FCM token registered (if Firebase configured)
- [ ] Notification permissions requested
- [ ] Foreground notifications work
- [ ] Background notifications work (if Firebase configured)

### Phase 2.6: Offline & Sync ✅
- [ ] Modules display when offline
- [ ] Last updated timestamp shows
- [ ] Pull-to-refresh works
- [ ] Mock data injected on first launch
- [ ] Sync indicator shows status
- [ ] Manual sync works

### Phase 2.7: i18n & Accessibility ✅
- [ ] Language switcher works (English/Hindi)
- [ ] All strings localized
- [ ] Screen reader works (VoiceOver/TalkBack)
- [ ] Text scales with system settings
- [ ] High contrast mode available

---

## 🧪 Test Scenarios

### Authentication Flow
1. **Happy Path:**
   - Register → Login → Dashboard → Logout
   - Expected: All steps work smoothly

2. **Error Handling:**
   - Invalid email format
   - Weak password
   - Wrong credentials
   - Expected: Proper error messages

### Real-time Events
1. **Drill Scheduled:**
   - Admin schedules drill
   - Expected: Notification appears on mobile

2. **Crisis Alert:**
   - Admin triggers alert
   - Expected: RedAlert screen appears immediately

3. **Offline Mode:**
   - Turn off WiFi/Data
   - Expected: "Offline: Mesh Active" indicator

### Offline Functionality
1. **Modules:**
   - Go offline → Open Learn screen
   - Expected: Cached modules display

2. **Sync:**
   - Complete quiz offline → Go online → Sync
   - Expected: Data syncs to backend

### Language Switching
1. **Switch Language:**
   - Change language in Profile
   - Expected: All UI text changes immediately

---

## 🐛 Known Issues

### Current Limitations
- Firebase not configured (FCM will not work until configured)
- iOS builds require Apple Developer account
- Some features are placeholders (games, AR, etc.)

### Workarounds
- Use debug builds for testing
- Test on Android devices/emulators
- Mock data provides demo content

---

## ✅ Acceptance Criteria

### Must Have
- [x] App builds and runs on Android
- [x] Authentication works
- [x] Dashboard navigation works
- [x] Socket connection works
- [x] Offline mode works
- [x] Language switching works

### Nice to Have
- [ ] Firebase configured (for FCM)
- [ ] iOS builds working
- [ ] All placeholder features implemented

---

## 📊 Test Results Template

```
Date: __________
Tester: __________
Device: __________
Android Version: __________

Phase 2.1: [ ] Pass [ ] Fail
Phase 2.2: [ ] Pass [ ] Fail
Phase 2.3: [ ] Pass [ ] Fail
Phase 2.4: [ ] Pass [ ] Fail
Phase 2.5: [ ] Pass [ ] Fail
Phase 2.6: [ ] Pass [ ] Fail
Phase 2.7: [ ] Pass [ ] Fail

Issues Found:
1. __________
2. __________

Notes:
__________
```

---

**Status**: QA Checklist Ready ✅  
**Next**: Run tests on physical devices

