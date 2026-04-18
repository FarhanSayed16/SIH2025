# Quick Start - Testing Everything

## 🚀 Quick Setup (5 minutes)

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

**This installs**: `firebase-admin` package

---

### 2. Start Backend

```bash
cd backend
npm run dev
```

**Check for**:
- ✅ "Firebase Admin SDK initialized successfully"
- ✅ "🚀 Kavach Backend running on port 3000"

---

### 3. Start Mobile App

```bash
cd mobile
flutter clean
flutter pub get
flutter run
```

**Check for**:
- ✅ "Firebase initialized successfully"
- ✅ "FCM token received: ..."

---

### 4. Start Web Dashboard

```bash
cd web
npm install
npm run dev
```

**Check for**:
- ✅ Dashboard accessible at `http://localhost:3001`

---

## ✅ Quick Test (2 minutes)

### Test 1: Login & FCM Token

1. **Mobile App**: Login with admin credentials
2. **Check Backend Logs**: Should see "FCM token updated for user ..."
3. **Verify**: User in database has `deviceToken` field

### Test 2: Create Alert & Push Notification

1. **Web Dashboard**: Login → Create alert
2. **Mobile App**: Should receive push notification
3. **Check**: RedAlert screen appears

### Test 3: Schedule Drill & Push Notification

1. **Web Dashboard**: Schedule a drill
2. **Mobile App**: Should receive push notification
3. **Check**: Notification appears

---

## 📋 Full Testing

See: `docs/phase-2/REAL_TESTING_GUIDE.md` for complete testing guide.

---

**Status**: Ready to Test! ✅

