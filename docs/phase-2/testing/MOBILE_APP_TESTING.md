# Mobile App Testing Session

## Date: 2025-11-24

## Configuration

- **Device**: 2312DRA50I (Android 15, API 35)
- **Backend URL**: `https://bnc51nt1-3000.inc1.devtunnels.ms`
- **Socket URL**: `https://bnc51nt1-3000.inc1.devtunnels.ms`
- **Backend Status**: Running and accessible

## Test Credentials

**Student**:
- Email: `rohan.sharma@student.com`
- Password: `student123`

**Admin**:
- Email: `admin@school.com`
- Password: `admin123`

## Testing Checklist

### Build Phase
- [ ] App builds successfully
- [ ] No Gradle errors
- [ ] No dependency conflicts
- [ ] App installs on device

### Runtime Phase
- [ ] App launches without crashes
- [ ] Login screen appears
- [ ] Can enter credentials
- [ ] Login button works
- [ ] API connection successful
- [ ] Login response parsed correctly
- [ ] Navigation to home screen works

### API Testing
- [ ] Login endpoint accessible
- [ ] User profile fetch works
- [ ] FCM token registration works
- [ ] Socket.io connection works

## Common Issues & Fixes

### Build Errors
- **Gradle errors**: Check Android SDK versions, Gradle versions
- **Dependency conflicts**: Update pubspec.yaml versions
- **Missing files**: Check asset paths, config files

### Runtime Errors
- **API connection**: Check .env file, backend URL
- **SSL errors**: Should be bypassed in development
- **Parsing errors**: Check response format matches models
- **Navigation errors**: Check route definitions

### Authentication Errors
- **401 Unauthorized**: Check credentials, token storage
- **403 Forbidden**: Check user permissions
- **Token expired**: Check refresh token logic

## Error Log

(Errors will be logged here as they occur)

## Status

🟢 **Running** - App is building/launching, monitoring for errors...

