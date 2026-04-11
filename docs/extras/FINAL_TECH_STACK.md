# 🛡️ Kavach - Finalized Tech Stack

## ✅ **CONFIRMED STACK**

### 📱 **Mobile App**
- **Framework**: Flutter 3.24+ (Dart 3.0+)
- **State Management**: Riverpod 2.4+
- **Storage**: Hive 2.2+ (offline), SQLite (complex queries)
- **AR**: ARCore (Android) + ARKit (iOS)
- **Mesh Networking**: Google Nearby Connections API
- **Maps**: Google Maps / Mapbox
- **Auth**: Firebase Auth
- **Push**: Firebase Cloud Messaging

### 🌐 **Web Dashboard**
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5.0+
- **UI**: Shadcn/ui + Tailwind CSS 3.4+
- **State**: Zustand + React Query
- **Charts**: Recharts
- **Real-time**: Socket.io Client

### ⚙️ **Backend API**
- **Framework**: **Node.js 20+** with **Express.js 4.18+**
- **Language**: TypeScript 5.0+ (or JavaScript)
- **Architecture**: MVC Pattern
- **Real-time**: Socket.io 4.7+
- **Validation**: express-validator
- **Auth**: JWT (jsonwebtoken)
- **Security**: helmet, cors, express-mongo-sanitize
- **File Upload**: Multer

### 🗄️ **Database**
- **Primary**: **MongoDB 7+** (via Mongoose 8+)
- **Hosting**: MongoDB Atlas (Free tier: 512MB)
- **Geospatial**: Built-in (2dsphere indexes)
- **Caching**: Redis 7+
- **Features**:
  - Native JSON support
  - Geospatial queries ($near, $geoWithin)
  - Change Streams (real-time)
  - Flexible schema

### ☁️ **Hosting**
- **Backend**: Railway.app / Render.com
- **Frontend**: Vercel
- **Database**: MongoDB Atlas
- **Storage**: AWS S3 / Cloudinary
- **CDN**: Cloudflare

---

## 📋 **Project Structure**

```
kavach/
├── mobile/                    # Flutter App
│   ├── lib/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── learning/
│   │   │   ├── drills/
│   │   │   ├── emergency/
│   │   │   └── profile/
│   │   ├── core/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── constants/
│   │   └── main.dart
│   └── pubspec.yaml
│
├── web/                       # Next.js Dashboard
│   ├── app/
│   │   ├── (auth)/
│   │   ├── dashboard/
│   │   ├── api/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               # Shadcn components
│   │   ├── charts/
│   │   └── maps/
│   ├── lib/
│   │   ├── utils/
│   │   └── api/
│   └── package.json
│
├── backend/                   # Node.js/Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── users.routes.js
│   │   │   ├── institutions.routes.js
│   │   │   ├── drills.routes.js
│   │   │   └── emergency.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   └── ...
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Institution.js
│   │   │   ├── Drill.js
│   │   │   └── Emergency.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── validation.middleware.js
│   │   ├── utils/
│   │   │   ├── geospatial.js
│   │   │   └── helpers.js
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── socket.io.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── docs/
    ├── TECH_STACK.md
    ├── MONGODB_GUIDE.md
    └── STACK_COMPARISON.md
```

---

## 🚀 **Quick Start Commands**

### **1. Backend Setup**
```bash
cd backend
npm init -y
npm install express mongoose socket.io cors helmet dotenv express-validator jsonwebtoken bcrypt multer express-mongo-sanitize
npm install -D nodemon typescript @types/node @types/express
```

### **2. Mobile Setup**
```bash
cd mobile
flutter create .
flutter pub add riverpod hive dio socket_io_client
flutter pub add ar_flutter_plugin google_maps_flutter
```

### **3. Web Setup**
```bash
cd web
npx create-next-app@latest . --typescript --tailwind --app
npm install zustand @tanstack/react-query recharts socket.io-client
npx shadcn-ui@latest init
```

---

## 📦 **Essential Packages**

### **Backend (package.json)**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "socket.io": "^4.7.0",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5-lts.1",
    "express-mongo-sanitize": "^2.2.0",
    "redis": "^4.6.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/express": "^4.17.21"
  }
}
```

### **Mobile (pubspec.yaml)**
```yaml
dependencies:
  flutter:
    sdk: flutter
  riverpod: ^2.4.0
  hive: ^2.2.0
  dio: ^5.4.0
  socket_io_client: ^2.0.3
  ar_flutter_plugin: ^1.0.0
  google_maps_flutter: ^2.5.0
  geolocator: ^10.1.0
  firebase_auth: ^4.15.0
  firebase_messaging: ^14.7.0
```

### **Web (package.json)**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.0.0",
    "recharts": "^2.10.0",
    "socket.io-client": "^4.7.0"
  }
}
```

---

## 🔑 **Key Features Enabled**

### ✅ **All Features Supported**

1. **Geospatial Queries** ✅
   - MongoDB native geospatial
   - Find schools near disasters
   - Calculate distances
   - Safe zone mapping

2. **Real-time Communication** ✅
   - Socket.io for instant alerts
   - MongoDB Change Streams
   - Live student tracking

3. **Offline Support** ✅
   - Hive for offline storage
   - Mesh networking (BLE/Wi-Fi Direct)
   - Sync when online

4. **AR Features** ✅
   - ARCore/ARKit integration
   - Virtual drills
   - Wayfinding

5. **Scalability** ✅
   - MongoDB horizontal scaling
   - Redis caching
   - Load balancing ready

---

## 🎯 **Why This Stack Works**

1. **Fast Development** ⚡
   - Express.js is simple and fast
   - MongoDB flexible schema
   - Quick iteration

2. **Hackathon-Friendly** 🏆
   - MongoDB Atlas free tier
   - Railway.app easy deployment
   - Minimal setup time

3. **Feature Complete** ✅
   - All required features supported
   - Geospatial built-in
   - Real-time capabilities

4. **Scalable** 📈
   - Can grow with user base
   - Horizontal scaling
   - Cloud-ready

---

## 📝 **Environment Variables**

### **Backend (.env)**
```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kavach

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Redis
REDIS_URL=redis://localhost:6379

# Firebase
FIREBASE_SERVER_KEY=your-firebase-key

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=kavach-uploads

# Google Maps
GOOGLE_MAPS_API_KEY=your-api-key
```

---

## ✅ **Next Steps**

1. ✅ Tech stack finalized
2. ⏳ Initialize project structure
3. ⏳ Set up MongoDB Atlas
4. ⏳ Create basic API endpoints
5. ⏳ Set up Flutter app
6. ⏳ Create admin dashboard
7. ⏳ Implement core features

---

**Status**: ✅ **READY TO START DEVELOPMENT**

**Last Updated**: December 2024
**Project**: Kavach - Disaster Preparedness System

