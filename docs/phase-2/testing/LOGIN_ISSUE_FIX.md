# Login Issue Fix

## Date: 2025-11-24

## Problem

Mobile app login was not working when using the dev tunnel URL (`https://bnc51nt1-3000.inc1.devtunnels.ms`).

### Symptoms
- API returns `401 Unauthorized` when accessing `/api/auth/login` via dev tunnel
- Health endpoint works (200 OK) via dev tunnel
- Login works perfectly on `localhost:3000`

## Root Cause

The dev tunnel appears to be blocking or requiring authentication for API endpoints, even though the health endpoint is accessible. This could be due to:
1. Dev tunnel middleware/authentication requirements
2. CORS/security policies on the dev tunnel
3. Routing issues in the dev tunnel configuration

## Solution

### Option 1: Use Localhost with ADB Port Forwarding (Recommended for Testing)

1. **Set up ADB port forwarding**:
   ```bash
   adb reverse tcp:3000 tcp:3000
   ```

2. **Update `.env` file**:
   ```
   BASE_URL=http://localhost:3000
   SOCKET_URL=http://localhost:3000
   API_VERSION=v1
   ENVIRONMENT=development
   ```

3. **Restart the app** - it will now connect to `localhost:3000` which is forwarded to your computer's backend.

### Option 2: Use Local IP Address

1. **Find your computer's local IP**:
   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" }
   ```

2. **Update `.env` file**:
   ```
   BASE_URL=http://192.168.x.x:3000
   SOCKET_URL=http://192.168.x.x:3000
   ```

3. **Ensure device and computer are on the same network**

### Option 3: Fix Dev Tunnel (Future)

To use the dev tunnel, we need to:
1. Check dev tunnel authentication requirements
2. Configure backend to work with dev tunnel authentication
3. Update CORS to properly handle dev tunnel requests

## Current Status

✅ **Backend**: Running on `localhost:3000`
✅ **Login API**: Working on `localhost:3000`
✅ **ADB Port Forwarding**: Set up (if ADB is available)
✅ **Mobile App**: Configured to use `localhost:3000`

## Test Credentials

**Student**:
- Email: `rohan.sharma@student.com`
- Password: `student123`

**Admin**:
- Email: `admin@school.com`
- Password: `admin123`

## Next Steps

1. **Test login with localhost** (using ADB port forwarding)
2. If login works, proceed with testing other features
3. If dev tunnel is needed later, investigate authentication requirements

## Debugging Tips

### Check if backend is running:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

### Test login API:
```powershell
$body = @{ email = "rohan.sharma@student.com"; password = "student123" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
```

### Check ADB port forwarding:
```bash
adb reverse --list
```

### View mobile app logs:
```bash
flutter run -d <device-id> --verbose
```

## Files Modified

1. `mobile/.env` - Updated to use localhost
2. `backend/src/server.js` - CORS configured for dev tunnel (ready when needed)

