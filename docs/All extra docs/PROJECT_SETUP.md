# 🚀 Kavach Project Setup Guide

Complete setup guide for the Kavach Disaster Preparedness & Response Education System.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Backend Setup](#backend-setup)
4. [Mobile App Setup](#mobile-app-setup)
5. [Web Dashboard Setup](#web-dashboard-setup)
6. [Environment Configuration](#environment-configuration)
7. [Running the Project](#running-the-project)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Flutter** 3.24+ ([Download](https://flutter.dev/docs/get-started/install))
- **MongoDB** 7+ ([Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git** ([Download](https://git-scm.com/downloads))

### Optional Software

- **Redis** 7+ (for caching and leaderboards)
- **VS Code** or **Android Studio** (for development)
- **Postman** (for API testing)

### API Keys Required

- **Google Maps API Key** (for maps and location services)
- **Gemini API Key** (for AI hazard detection)
- **Firebase** (for push notifications)
- **Mapbox Access Token** (for web dashboard maps)

---

## Project Structure

```
SIH2025/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── socket/          # Socket.io handlers
│   │   ├── utils/           # Utility functions
│   │   └── server.js        # Entry point
│   ├── scripts/             # Utility scripts
│   ├── tests/               # Test files
│   ├── uploads/             # File uploads
│   ├── package.json
│   ├── env.example          # Environment template
│   └── README.md
│
├── mobile/                   # Flutter Mobile App
│   ├── lib/
│   │   ├── core/            # Core utilities
│   │   ├── features/        # Feature modules
│   │   ├── games/           # Game implementations
│   │   ├── models/          # Data models
│   │   ├── screens/         # Legacy screens
│   │   └── main.dart        # Entry point
│   ├── android/             # Android configuration
│   ├── ios/                 # iOS configuration
│   ├── assets/              # Images, fonts, audio
│   ├── pubspec.yaml
│   ├── .env.example         # Environment template
│   └── README.md
│
├── web/                     # Next.js Admin Dashboard
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and API clients
│   ├── public/              # Static assets
│   ├── package.json
│   ├── .env.example         # Environment template
│   └── README.md
│
├── docs/                    # Documentation
│   ├── phase-0/             # Phase 0 documentation
│   ├── phase-1/             # Phase 1 documentation
│   ├── phase-2/             # Phase 2 documentation
│   └── shared/              # Shared documentation
│
├── .gitignore
├── package.json             # Root workspace config
├── README.md                # Project overview
└── PROJECT_SETUP.md         # This file
```

---

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
# Copy the example file
cp env.example .env

# Edit .env with your configuration
# Windows: notepad .env
# Mac/Linux: nano .env
```

### 4. Required Environment Variables

Edit `backend/.env` with the following:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kavach?retryWrites=true&w=majority
# OR for local: mongodb://localhost:27017/kavach

# JWT Configuration (REQUIRED)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-MUST-BE-AT-LEAST-32-CHARACTERS
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# Firebase Configuration
FIREBASE_SERVER_KEY=your-firebase-server-key

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# CORS Origins
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

### 5. Start the Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The backend will start on `http://localhost:3000`

### 6. Verify Backend is Running

- Health check: `http://localhost:3000/api/health`
- API docs: Check `backend/docs/api/` for API documentation

---

## Mobile App Setup

### 1. Navigate to Mobile Directory

```bash
cd mobile
```

### 2. Install Flutter Dependencies

```bash
flutter pub get
```

### 3. Configure Environment Variables

```bash
# Copy the example file
# Windows: copy .env.example .env
# Mac/Linux: cp .env.example .env
```

### 4. Edit Environment Variables

Edit `mobile/.env` with your backend URL:

```env
# Backend API Base URL
BASE_URL=http://localhost:3000

# For Android Emulator, use:
# BASE_URL=http://10.0.2.2:3000

# For Physical Device, use your computer's IP:
# BASE_URL=http://192.168.1.100:3000

# Socket.io URL
SOCKET_URL=http://localhost:3000

# API Version
API_VERSION=v1

# Environment
ENVIRONMENT=development

# Gemini API Key
GEMINI_API_KEY=your-gemini-api-key
```

### 5. Firebase Setup (Optional but Recommended)

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Add Android app to Firebase project
3. Download `google-services.json` and place it in `mobile/android/app/`
4. For iOS, download `GoogleService-Info.plist` and place it in `mobile/ios/Runner/`

### 6. Run the Mobile App

```bash
# List available devices
flutter devices

# Run on connected device/emulator
flutter run

# Run in release mode
flutter run --release
```

### 7. Platform-Specific Setup

#### Android

- Minimum SDK: 21 (Android 5.0)
- Target SDK: 34 (Android 14)
- Ensure Android Studio is installed with Android SDK

#### iOS (Mac only)

- Minimum iOS: 12.0
- Xcode required
- Run `pod install` in `mobile/ios/` directory

---

## Web Dashboard Setup

### 1. Navigate to Web Directory

```bash
cd web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
# Copy the example file
# Windows: copy .env.example .env.local
# Mac/Linux: cp .env.example .env.local
```

### 4. Edit Environment Variables

Edit `web/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Environment
NODE_ENV=development

# Mapbox (Optional, for map features)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-access-token
```

### 5. Start the Web Dashboard

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The web dashboard will start on `http://localhost:3001`

---

## Environment Configuration

### Backend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | Yes | Server port | `3000` |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://localhost:27017/kavach` |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) | Generated secret |
| `JWT_EXPIRE` | No | JWT expiration time | `15m` |
| `REDIS_URL` | No | Redis connection URL | `redis://localhost:6379` |
| `FIREBASE_SERVER_KEY` | No | Firebase Cloud Messaging key | Firebase console |
| `GOOGLE_MAPS_API_KEY` | No | Google Maps API key | Google Cloud Console |
| `GEMINI_API_KEY` | No | Google Gemini API key | Google AI Studio |
| `CORS_ORIGIN` | Yes | Allowed CORS origins | `http://localhost:3001` |

### Mobile Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `BASE_URL` | Yes | Backend API URL | `http://localhost:3000` |
| `SOCKET_URL` | Yes | Socket.io server URL | `http://localhost:3000` |
| `API_VERSION` | No | API version | `v1` |
| `ENVIRONMENT` | No | Environment mode | `development` |
| `GEMINI_API_KEY` | No | Gemini API key | Google AI Studio |

### Web Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL | `http://localhost:3000/api` |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | Socket.io server URL | `http://localhost:3000` |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | No | Mapbox access token | Mapbox account |

---

## Running the Project

### Quick Start (All Services)

From the root directory:

```bash
# Install all dependencies
npm run install:all

# Start backend (Terminal 1)
npm run dev:backend

# Start web dashboard (Terminal 2)
npm run dev:web

# Start mobile app (Terminal 3)
cd mobile && flutter run
```

### Individual Services

#### Backend Only

```bash
cd backend
npm install
npm run dev
```

#### Web Dashboard Only

```bash
cd web
npm install
npm run dev
```

#### Mobile App Only

```bash
cd mobile
flutter pub get
flutter run
```

---

## Troubleshooting

### Backend Issues

#### MongoDB Connection Error

```bash
# Check MongoDB is running
# Windows: Check Services
# Mac/Linux: brew services list (if using Homebrew)

# Test connection
cd backend
npm run test:connection
```

#### Port Already in Use

```bash
# Change PORT in .env file
# Or kill process using port 3000
# Windows: netstat -ano | findstr :3000
# Mac/Linux: lsof -ti:3000 | xargs kill
```

#### JWT Secret Error

```bash
# Generate a new JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to JWT_SECRET in .env
```

### Mobile App Issues

#### Flutter Dependencies Not Installing

```bash
# Clean and reinstall
flutter clean
flutter pub get
```

#### Backend Connection Failed

- **Android Emulator**: Use `http://10.0.2.2:3000` instead of `localhost`
- **Physical Device**: Use your computer's IP address (e.g., `http://192.168.1.100:3000`)
- Ensure backend is running and accessible
- Check firewall settings

#### Firebase Not Working

- Verify `google-services.json` is in `android/app/`
- Check Firebase project configuration
- Ensure package name matches Firebase project

### Web Dashboard Issues

#### API Connection Failed

- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure backend is running on correct port
- Check CORS settings in backend

#### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

---

## Development Workflow

### 1. Start Development

1. Start MongoDB (if local)
2. Start Redis (if using)
3. Start backend: `cd backend && npm run dev`
4. Start web: `cd web && npm run dev`
5. Start mobile: `cd mobile && flutter run`

### 2. Make Changes

- Backend: Changes auto-reload with nodemon
- Web: Changes auto-reload with Next.js
- Mobile: Use hot reload (`r` in terminal) or hot restart (`R`)

### 3. Testing

```bash
# Backend tests
cd backend
npm test

# Web tests
cd web
npm test
```

### 4. Building for Production

```bash
# Backend
cd backend
npm start

# Web
cd web
npm run build
npm start

# Mobile
cd mobile
flutter build apk  # Android
flutter build ios  # iOS
```

---

## Additional Resources

- [Backend README](./backend/README.md) - Detailed backend documentation
- [Mobile README](./mobile/README.md) - Mobile app documentation
- [Web README](./web/README.md) - Web dashboard documentation
- [API Documentation](./backend/docs/api/) - API endpoint documentation
- [Phase Documentation](./docs/) - Development phase documentation

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the documentation in `docs/`
3. Check existing GitHub issues (if applicable)
4. Contact the development team

---

**Last Updated**: 2025-12-08  
**Project**: Kavach - Disaster Preparedness System  
**Hackathon**: Smart India Hackathon 2025

