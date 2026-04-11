# Quick Start - Testing Everything

## 🚀 Start All Services (3 Terminals)

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

**Check for**:
- ✅ "Firebase Admin SDK initialized successfully"
- ✅ "🚀 Kavach Backend running on port 3000"

### Terminal 2: Mobile App
```bash
cd mobile
flutter run
```

**Check for**:
- ✅ "Firebase initialized successfully"
- ✅ "FCM token received: ..."

### Terminal 3: Web Dashboard
```bash
cd web
npm run dev
```

**Check for**:
- ✅ Dashboard at `http://localhost:3001`

---

## ✅ Quick Test (5 minutes)

### 1. Login Test
- **Mobile**: Login with `admin@school.com` / `admin123`
- **Web**: Login with same credentials
- **Expected**: Both login successfully

### 2. FCM Token Test
- **Mobile**: Check logs for "FCM token received"
- **Backend**: Check logs for "FCM token updated for user"
- **Expected**: Token registered in database

### 3. Push Notification Test
- **Web**: Create an alert
- **Mobile**: Should receive push notification
- **Expected**: Notification appears, RedAlert screen opens

### 4. Real-time Event Test
- **Web**: Schedule a drill
- **Mobile**: Should receive Socket.io event
- **Expected**: Event received, notification appears

---

## 📋 Full Testing

See: `docs/phase-2/REAL_TESTING_GUIDE.md` for complete testing guide.

---

**Status**: ✅ Ready to Test!

