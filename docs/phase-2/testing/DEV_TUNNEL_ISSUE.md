# Dev Tunnel Issue - POST Requests Blocked

## Problem

The dev tunnel URL `https://bnc51nt1-3000.inc1.devtunnels.ms` is blocking POST requests:
- ✅ GET requests work (health endpoint: 200 OK)
- ❌ POST requests fail (login endpoint: 401 Unauthorized)

## Root Cause

The dev tunnel appears to require authentication or has security policies that block POST requests to API endpoints. This is a limitation of the dev tunnel service, not our backend.

## Solution: ADB Port Forwarding

Instead of using the dev tunnel, use ADB port forwarding to connect the mobile device to the local backend.

### Setup Steps

1. **Install Android SDK Platform Tools** (if not already installed)
   - Download from: https://developer.android.com/studio/releases/platform-tools
   - Add to PATH

2. **Set up port forwarding**:
   ```bash
   adb reverse tcp:3000 tcp:3000
   ```

3. **Update mobile app `.env`**:
   ```
   BASE_URL=http://localhost:3000
   SOCKET_URL=http://localhost:3000
   API_VERSION=v1
   ENVIRONMENT=development
   ```

4. **Restart mobile app**

### How It Works

- Device's `localhost:3000` → Computer's `localhost:3000`
- No authentication required
- All HTTP methods work (GET, POST, PUT, DELETE)
- Faster and more reliable than dev tunnel

## Alternative: Use Local IP

If ADB is not available:

1. **Find your computer's local IP**:
   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" }
   ```

2. **Update mobile app `.env`**:
   ```
   BASE_URL=http://192.168.x.x:3000
   SOCKET_URL=http://192.168.x.x:3000
   ```

3. **Ensure device and computer are on the same network**

## Current Configuration

✅ **Backend**: Running on `localhost:3000`
✅ **Mobile App**: Configured for `localhost:3000` (with ADB forwarding)
✅ **Login**: Works perfectly on localhost

## Test Credentials

- Email: `rohan.sharma@student.com`
- Password: `student123`

