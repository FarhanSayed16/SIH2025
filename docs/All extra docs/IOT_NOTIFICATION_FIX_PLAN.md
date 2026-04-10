# 🔔 IoT Notification Fix Plan

## 🔍 Root Cause Analysis

### Problem Identified
**Issue**: IoT notifications are working for **parents only**, not for admin, teachers, or students.

**Root Cause**: 
1. **Backend** (`notification.service.js` line 127): IoT notifications use FCM **topics**:
   ```javascript
   topic: `institution_${institutionId}`, // Send to all users in the institution
   ```

2. **FCM Topics Requirement**: Users must **subscribe** to topics before receiving notifications.

3. **Current State**: Only parents are subscribing to the topic (or only parents have FCM tokens registered).

---

## ✅ Solution: Two Options

### **Option A: Quick Fix (Recommended - 30 minutes)**
**Change from Topics to Individual Tokens**

**Why This Works:**
- ✅ No subscription needed
- ✅ Works immediately for all users with FCM tokens
- ✅ Uses existing `sendNotificationToSchool` pattern
- ✅ Minimal code changes

**Changes Needed:**
1. **Backend**: Modify `notification.service.js` to query users and send to tokens instead of topics
2. **Verify**: Ensure all roles (admin, teacher, student, parent) register FCM tokens

---

### **Option B: Complete Rebuild (4-6 hours)**
**Remove everything and rebuild properly**

**When to Use:**
- If you want a completely clean, unified notification system
- If there are other notification issues beyond IoT
- If you have time for a thorough rebuild

**See**: `NOTIFICATION_SYSTEM_REBUILD_PLAN.md` for full details

---

## 🎯 Recommended: Option A (Quick Fix)

### Step 1: Fix Backend Notification Service (15 minutes)

**File**: `backend/src/services/notification.service.js`

**Change**: Replace topic-based sending with token-based sending

**Before**:
```javascript
topic: `institution_${institutionId}`, // Send to all users in the institution
```

**After**:
```javascript
// Get all users in institution with FCM tokens
const User = (await import('../models/User.js')).default;
const users = await User.find({
  institutionId: institutionId,
  deviceToken: { $exists: true, $ne: null },
  isActive: true
}).select('deviceToken role name');

const fcmTokens = users
  .map(user => user.deviceToken)
  .filter(token => token != null);

if (fcmTokens.length === 0) {
  logger.warn(`No FCM tokens found for institution ${institutionId}`);
  return;
}

// Send to all tokens
const response = await admin.messaging().sendEachForMulticast({
  tokens: fcmTokens,
  ...fcmMessage, // Remove 'topic' from fcmMessage
});
```

---

### Step 2: Verify FCM Token Registration (10 minutes)

**Check**:
1. Are all roles (admin, teacher, student) registering FCM tokens?
2. Is the mobile app calling `/api/users/:id/fcm-token` for all users?

**Files to Check**:
- `mobile/lib/core/services/fcm_service.dart` - Token registration
- `mobile/lib/features/fcm/providers/fcm_provider.dart` - Token registration logic
- `backend/src/controllers/user.controller.js` - FCM token endpoint

**Action**: Ensure all users (not just parents) register their FCM tokens on login.

---

### Step 3: Test (5 minutes)

**Test Cases**:
1. ✅ Admin logs in → FCM token registered
2. ✅ Teacher logs in → FCM token registered
3. ✅ Student logs in → FCM token registered
4. ✅ Parent logs in → FCM token registered
5. ✅ IoT device sends alert → All users receive notification

---

## 📋 Implementation Steps

### **Step 1: Update `notification.service.js`**

Replace the `sendIoTAlertNotification` function to:
1. Query all users in institution with FCM tokens
2. Send to individual tokens instead of topic
3. Log which roles received notifications

### **Step 2: Verify Mobile App**

Ensure:
- All users register FCM tokens (not just parents)
- Token registration happens on login
- Token is sent to backend endpoint

### **Step 3: Test**

1. Login as admin → Check FCM token in database
2. Login as teacher → Check FCM token in database
3. Login as student → Check FCM token in database
4. Trigger IoT alert → Verify all users receive notification

---

## 🔧 Alternative: Fix Topic Subscription

If you prefer to keep topics:

**Backend**: When user registers FCM token, also subscribe them to topic:
```javascript
// In registerFCMToken controller
await admin.messaging().subscribeToTopic([fcmToken], `institution_${user.institutionId}`);
```

**Mobile**: Ensure `subscribeToSchool` is called for all users, not just parents.

---

## ✅ Expected Outcome

After fix:
- ✅ **All roles** (admin, teacher, student, parent) receive IoT notifications
- ✅ Notifications work immediately (no subscription needed)
- ✅ Uses existing, proven pattern (`sendNotificationToSchool`)
- ✅ Minimal code changes

---

## 🚀 Next Steps

**Choose your approach:**
1. **Option A (Quick Fix)** - Fix notification service to use tokens (30 min)
2. **Option B (Complete Rebuild)** - Remove everything and rebuild (4-6 hours)

**My Recommendation**: Start with **Option A** to fix the immediate issue, then do Option B later if needed.

---

## 📝 Notes

- Current system works for parents because they're subscribing to topics
- Other roles aren't subscribing, so they don't receive topic-based notifications
- Token-based sending works for all users with registered tokens
- No subscription needed for token-based notifications

---

**Status**: Ready to implement  
**Time Estimate**: 30 minutes (Option A) or 4-6 hours (Option B)  
**Priority**: High (affects all non-parent users)

