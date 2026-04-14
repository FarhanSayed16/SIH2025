# Firebase Verification Checklist

## ✅ Quick Verification Steps

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

**Expected**: `firebase-admin` package installed

---

### Step 2: Start Backend

```bash
cd backend
npm run dev
```

**Check logs for**:
- ✅ "Firebase Admin SDK initialized successfully"

**If you see**: "Firebase Admin SDK initialization failed"
- Check `backend/config/firebase-admin.json` exists
- Verify file path is correct

---

### Step 3: Start Mobile App

```bash
cd mobile
flutter clean
flutter pub get
flutter run
```

**Check logs for**:
- ✅ "Firebase initialized successfully"
- ✅ "FCM token received: ..."

**If you see**: "Firebase initialization failed"
- Check `mobile/android/app/google-services.json` exists
- Verify package name matches: `com.kavach.app`

---

### Step 4: Test FCM Token Registration

1. **Login to mobile app**
2. **Check backend logs** for:
   - ✅ "FCM token updated for user ..."

3. **Verify in database**:
   ```javascript
   db.users.findOne({ email: "your-email@example.com" })
   // Should have deviceToken field with FCM token
   ```

---

### Step 5: Test Push Notification

**From Web Dashboard:**
1. Login as admin
2. Create an alert
3. Check mobile app

**Expected**:
- ✅ Push notification appears
- ✅ Tapping notification opens RedAlert screen
- ✅ Backend logs show: "Push notification sent successfully"

---

## 🔍 Detailed Verification

### Backend Verification

**Check Firebase Admin SDK:**
```bash
cd backend
node -e "import('./src/services/fcm.service.js').then(m => console.log('FCM Service:', m.default.isInitialized()))"
```

**Expected**: `true`

---

### Mobile App Verification

**Check Firebase Initialization:**
- Look for "Firebase initialized successfully" in logs
- Check FCM token is received

**Check FCM Service:**
- App should request notification permissions
- FCM token should be displayed in logs

---

### Integration Verification

**Test Alert Creation:**
1. Create alert from web dashboard
2. Check mobile app receives push
3. Check backend logs show FCM send

**Test Drill Scheduling:**
1. Schedule drill from web dashboard
2. Check mobile app receives push
3. Check backend logs show FCM send

---

## ❌ Common Issues

### Issue: "Firebase Admin SDK initialization failed"

**Solution**:
1. Check `backend/config/firebase-admin.json` exists
2. Verify JSON is valid
3. Check file permissions

### Issue: "Firebase initialization failed" (Mobile)

**Solution**:
1. Check `mobile/android/app/google-services.json` exists
2. Verify package name matches
3. Run `flutter clean && flutter pub get`

### Issue: "No FCM token received"

**Solution**:
1. Check notification permissions granted
2. Verify Firebase initialized before FCM
3. Check device has Google Play Services

### Issue: "Push notification not received"

**Solution**:
1. Verify FCM token in database
2. Check backend logs for FCM errors
3. Verify Firebase Admin SDK initialized
4. Check notification permissions on device

---

## ✅ Success Criteria

All of these should work:
- [ ] Backend starts with Firebase Admin SDK initialized
- [ ] Mobile app initializes Firebase on startup
- [ ] FCM token received and registered
- [ ] Alert creation sends push notification
- [ ] Drill scheduling sends push notification
- [ ] Push notifications appear on device
- [ ] Tapping notification opens correct screen

---

**Status**: Ready for Verification ✅

