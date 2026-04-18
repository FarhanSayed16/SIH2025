# Mobile App Running Status

## Date: 2025-11-24

## Configuration

### Environment
- **Device**: 2312DRA50I (Android 15, API 35)
- **Backend URL**: `https://bnc51nt1-3000.inc1.devtunnels.ms`
- **Socket URL**: `https://bnc51nt1-3000.inc1.devtunnels.ms`

### Changes Made

1. **Updated `.env` file**:
   ```
   BASE_URL=https://bnc51nt1-3000.inc1.devtunnels.ms
   SOCKET_URL=https://bnc51nt1-3000.inc1.devtunnels.ms
   ```

2. **Updated Backend CORS** (`backend/src/server.js`):
   - Added dev tunnel URL to allowed origins
   - Socket.io configured for dev tunnel
   - CORS allows dev tunnel in development mode

3. **SSL Certificate Handling**:
   - Mobile app configured to bypass SSL certificate validation in development
   - `api_service.dart` has `badCertificateCallback` for dev tunnels

## Running the App

### Command
```bash
cd mobile
flutter run -d 2312DRA50I
```

### Expected Behavior
1. App builds and installs on device
2. App connects to backend via dev tunnel
3. Login screen appears
4. Can login with test credentials

## Test Credentials

**Student**:
- Email: `rohan.sharma@student.com`
- Password: `student123`

**Admin**:
- Email: `admin@school.com`
- Password: `admin123`

## Monitoring

### What to Watch For

1. **Build Errors**:
   - Gradle build failures
   - Dependency conflicts
   - Missing files

2. **Runtime Errors**:
   - Connection errors (backend not accessible)
   - SSL certificate errors (should be bypassed)
   - API endpoint errors (404, 500, etc.)
   - Authentication errors (401, 403)

3. **Network Issues**:
   - Timeout errors
   - DNS resolution failures
   - CORS errors

### Debug Output

The app logs all API requests/responses:
- `📤 API Request: [method] [path]`
- `✅ API Response: [status] [path]`
- `❌ API Error: [method] [path]`

## Troubleshooting

### Backend Not Accessible
1. Check if backend is running: `http://localhost:3000/health`
2. Verify dev tunnel is forwarding port 3000
3. Check backend CORS configuration

### SSL Certificate Errors
- Should be automatically bypassed in development
- Check `api_service.dart` has `badCertificateCallback`

### Authentication Errors
- Verify credentials are correct
- Check backend is running and accessible
- Check token is being sent in headers

## Next Steps

1. Monitor app output for errors
2. Test login functionality
3. Test API connectivity
4. Fix any issues that arise

