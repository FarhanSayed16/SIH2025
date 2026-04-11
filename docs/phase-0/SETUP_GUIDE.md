# 🚀 Kavach - Quick Setup Guide

## Prerequisites

- Node.js 20+ installed
- Flutter 3.24+ installed
- MongoDB 7+ (or MongoDB Atlas account)
- Git installed

## Step 1: Clone & Install

```bash
# If cloning from repository
git clone <repository-url>
cd kavach

# Install all dependencies
npm run setup
# OR manually:
npm install
cd backend && npm install
cd ../web && npm install
cd ../mobile && flutter pub get
```

## Step 2: MongoDB Setup

### Option A: MongoDB Atlas (Recommended for Hackathon)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster (Free tier: M0)
4. Get connection string
5. Add to `backend/.env`

### Option B: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/kavach`

## Step 3: Environment Configuration

### Backend
```bash
cd backend
# Create .env file
```

Add to `backend/.env`:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secret-key
CORS_ORIGIN=http://localhost:3001
```

### Web
```bash
cd web
# Create .env.local file
```

Add to `web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### Mobile
Update `mobile/lib/core/constants/app_constants.dart`:
```dart
static const String baseUrl = 'http://YOUR_COMPUTER_IP:3000/api';
static const String socketUrl = 'http://YOUR_COMPUTER_IP:3000';
```

**Note**: For mobile, use your computer's local IP (not localhost). Find it with:
- Windows: `ipconfig` (look for IPv4)
- Mac/Linux: `ifconfig` or `ip addr`

## Step 4: Start Development

### Terminal 1: Backend
```bash
cd backend
npm run dev
```
✅ Backend running on http://localhost:3000

### Terminal 2: Web Dashboard
```bash
cd web
npm run dev
```
✅ Web dashboard on http://localhost:3001

### Terminal 3: Mobile App
```bash
cd mobile
flutter run
```
✅ Mobile app on your device/emulator

## Step 5: Verify Setup

1. **Backend Health Check**
   - Open: http://localhost:3000/health
   - Should return: `{"status":"OK","message":"Kavach API is running"}`

2. **Web Dashboard**
   - Open: http://localhost:3001
   - Should show Kavach homepage

3. **Mobile App**
   - Should show splash screen with Kavach logo

## Troubleshooting

### MongoDB Connection Failed
- Check MongoDB URI in `.env`
- Ensure MongoDB is running (if local)
- Check network access (if Atlas)

### Port Already in Use
- Change PORT in `backend/.env`
- Or kill process using port 3000/3001

### Flutter Dependencies Error
```bash
cd mobile
flutter clean
flutter pub get
```

### Next.js Build Error
```bash
cd web
rm -rf .next
npm install
npm run dev
```

## Next Steps

After Phase 0 setup is complete, proceed to Phase 1:
- Backend API development
- Authentication system
- Database models
- Core features

See `docs/PHASE_0_SETUP.md` for detailed information.

---

**Need Help?** Check the documentation in `docs/` folder.

