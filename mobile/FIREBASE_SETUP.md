# Firebase Setup - Quick Reference

## 📋 Quick Setup Steps

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create project: "Kavach"

2. **Add Android App**
   - Package: `com.kavach.app`
   - Download `google-services.json`
   - Place in: `mobile/android/app/google-services.json`

3. **Enable Cloud Messaging**
   - Firebase Console → Cloud Messaging
   - Get Server Key

4. **Update Backend**
   - Add to `backend/.env`: `FIREBASE_SERVER_KEY=your-key`

5. **Verify**
   - Run app: `flutter run`
   - Check logs for: "Firebase initialized successfully"
   - Check logs for: "FCM token received"

## 🔧 Files to Update

- ✅ `mobile/android/app/google-services.json` (download from Firebase)
- ✅ `backend/.env` (add FIREBASE_SERVER_KEY)

## 📖 Full Guide

See: `docs/phase-2/FIREBASE_SETUP_GUIDE.md`

