# Phase 3.4.0: Sync Queue & Conflict Resolution - Testing Guide

## Summary

We've successfully implemented Phase 3.4.0 sync queue and conflict resolution features for both backend and mobile.

## Backend Implementation

### Files Created/Modified:
1. **`backend/src/models/SyncQueue.js`** - MongoDB model for sync queue
2. **`backend/src/services/syncQueue.service.js`** - Queue management service
3. **`backend/src/services/sync.service.js`** - Enhanced to support games
4. **`backend/src/controllers/sync.controller.js`** - Enhanced with queue support
5. **`backend/src/routes/sync.routes.js`** - New endpoints added
6. **`backend/scripts/test-phase3.4.0.js`** - Test script

### New Endpoints:
- `POST /api/sync` - Enhanced with `useQueue` option
- `GET /api/sync/status` - Enhanced with queue status
- `POST /api/sync/process-queue` - Process queue manually
- `POST /api/sync/resolve-conflict/:queueItemId` - Resolve conflicts

## Testing Instructions

### Prerequisites:
1. **MongoDB must be running** (required for backend)
2. Backend server must be started
3. Test user credentials must exist in database

### Step 1: Start MongoDB
Make sure MongoDB is running on your system.

### Step 2: Start Backend Server

Open a terminal and run:
```bash
cd E:\SIH2025\backend
npm start
```

Wait for the message: **"Server running on port 5000"**

### Step 3: Run Tests

In a **separate terminal**, run:
```bash
cd E:\SIH2025\backend
node scripts/test-phase3.4.0.js
```

## Test Coverage

The test script will test:

1. ✅ Health Check
2. ✅ Get Initial Sync Status
3. ✅ Add Quiz to Sync Queue
4. ✅ Add Drill Log to Sync Queue
5. ✅ Add Game Score to Sync Queue
6. ✅ Get Queue Status (After Adding Items)
7. ✅ Process Sync Queue
8. ✅ Get Final Queue Status
9. ✅ Direct Sync (Without Queue)

## Expected Results

All tests should pass with green checkmarks (✅). The test will show:
- Number of items queued
- Queue status (pending, processing, synced, failed)
- Sync results

## Troubleshooting

### Server Won't Start:
- Check if MongoDB is running
- Check if port 5000 is already in use
- Look for errors in the server console

### Login Fails:
- Ensure test user exists: `rohan.sharma@student.com` / `student123`
- Or update credentials in `test-phase3.4.0.js`

### Queue Tests Fail:
- Check MongoDB connection
- Verify SyncQueue model is registered
- Check server logs for errors

## Next Steps

After backend tests pass:
1. ✅ Mobile sync queue service is already implemented
2. ⏳ Create conflict resolution UI
3. ⏳ Create enhanced sync status UI
4. ⏳ Test full integration

## Files Reference

- Test Script: `backend/scripts/test-phase3.4.0.js`
- Models: `backend/src/models/SyncQueue.js`
- Service: `backend/src/services/syncQueue.service.js`
- Controller: `backend/src/controllers/sync.controller.js`

