# Phase 3.3.3: Badge System - Testing Guide

## ⚠️ Important: Server Restart Required

The badge routes are properly implemented and registered in `server.js`, but the currently running server instance was started **before** the badge routes were added. **The server must be restarted** to load the new routes.

## 🔧 Steps to Test

### Step 1: Restart Backend Server

1. **Stop the current server:**
   - Find the terminal where the backend is running
   - Press `Ctrl+C` to stop it
   - OR kill the node process:
   ```powershell
   Get-Process -Name node | Stop-Process
   ```

2. **Start the server again:**
   ```bash
   cd backend
   npm start
   # or if using nodemon:
   npm run dev
   ```

3. **Verify the server started:**
   - Check the console output for: `🚀 Kavach Backend running on...`
   - Check for any errors about badge routes

### Step 2: (Optional) Seed Badges

Before testing, you can seed sample badges:
```bash
cd backend
node scripts/seed-badges.js
```

This will create 13 badges including:
- Fire Marshal
- Module Master
- Earthquake Expert
- Hazard Detective
- Streak Master
- Safety Champion
- And more...

### Step 3: Run Backend Tests

```bash
cd backend
node scripts/test-phase3.3.3.js
```

**Expected Results After Restart:**
- ✅ Health Check: PASSED
- ✅ Login: PASSED
- ✅ Get All Badges: Should return badges (empty array if not seeded)
- ✅ Get Badge by ID: Should return badge details
- ✅ Get My Badges: Should return user's badges (empty if none earned)
- ✅ Get Badge History: Should return badge award history
- ✅ Check Badges: Should trigger badge checking
- ✅ Filter Badges by Category: Should filter correctly
- ✅ Manual Award Badge: May fail if not admin (expected)

### Step 4: Test Mobile App

1. **Start the mobile app** (if not already running)
2. **Navigate to Profile Screen**
   - Check if badge section appears
   - Verify badge count display
3. **Navigate to Badge Collection Screen**
   - Test "All Badges" tab
   - Test "Earned" tab
   - Test category filtering
   - Test badge detail screen navigation
4. **Test Badge Detail Screen**
   - View badge details
   - Check earned/not earned status

### Step 5: Test Badge Integration

1. **Complete a module** - Should trigger badge checking
2. **Complete a game** - Should trigger badge checking
3. **Check if badges are awarded** - Review badge history

## 📋 Test Checklist

### Backend Tests
- [ ] Server restarts without errors
- [ ] Badge routes are accessible (no "Route not found" errors)
- [ ] Get all badges returns data
- [ ] Get badge by ID works
- [ ] Get my badges returns user's badges
- [ ] Badge history endpoint works
- [ ] Badge checking endpoint works
- [ ] Badge filtering works

### Mobile Tests
- [ ] Badge collection screen loads
- [ ] All badges tab displays badges
- [ ] Earned badges tab displays earned badges
- [ ] Category filtering works
- [ ] Badge detail screen shows correct information
- [ ] Profile screen shows badge section
- [ ] Badge count is accurate
- [ ] Navigation between screens works

### Integration Tests
- [ ] Module completion triggers badge check
- [ ] Game completion triggers badge check
- [ ] Badges are awarded correctly
- [ ] Badge history is updated

## 🐛 Troubleshooting

### Issue: "Route not found" errors
**Solution:** Restart the backend server as described in Step 1.

### Issue: No badges returned
**Solution:** Run the badge seeding script: `node scripts/seed-badges.js`

### Issue: Badge checking not working
**Solution:** 
- Verify badge service is imported correctly in module/game controllers
- Check server logs for badge checking errors
- Ensure user has completed activities that trigger badge checks

### Issue: Mobile app can't connect
**Solution:**
- Check backend server is running
- Verify API base URL in mobile app
- Check network connectivity

## 📊 Expected Test Results

After successful restart and seeding:
- **Backend Tests:** 9/9 passed
- **Mobile Screens:** All functional
- **Integration:** Badge checking works automatically

## ✅ Success Criteria

All tests pass when:
1. Backend server restarts successfully
2. All badge API endpoints return 200 status codes
3. Badge seeding creates badges in database
4. Mobile screens display badges correctly
5. Badge checking triggers on activity completion

