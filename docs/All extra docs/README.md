# 🛡️ Kavach - Disaster Preparedness & Response Education System

> A comprehensive digital platform for disaster management education, simulation, and real-time emergency response for schools and colleges in India.

## 📋 Project Overview

Kavach is a dual-mode disaster preparedness ecosystem that operates in:
- **Peace Mode**: Gamified learning, AR simulations, and interactive drills
- **Crisis Mode**: Real-time SOS, offline mesh networking, and emergency coordination

## 🏗️ Project Structure

```
kavach/
├── backend/          # Node.js + Express API
├── mobile/           # Flutter Mobile App
├── web/              # Next.js Admin Dashboard
└── docs/             # Documentation
```

## 🚀 Tech Stack

### Backend
- **Framework**: Node.js 20+ with Express.js 4.18+
- **Database**: MongoDB 7+ (Mongoose 8+)
- **Real-time**: Socket.io 4.7+
- **Cache**: Redis 7+
- **Language**: TypeScript/JavaScript

### Mobile
- **Framework**: Flutter 3.24+ (Dart 3.0+)
- **State**: Riverpod 2.4+
- **Storage**: Hive 2.2+ (offline)
- **AR**: ARCore/ARKit
- **Maps**: Google Maps

### Web
- **Framework**: Next.js 14+ (App Router)
- **UI**: Shadcn/ui + Tailwind CSS
- **State**: Zustand + React Query
- **Charts**: Recharts

## 📦 Prerequisites

- Node.js 20+
- Flutter 3.24+
- MongoDB 7+ (or MongoDB Atlas)
- Redis 7+ (optional for local dev)
- Git

## 🛠️ Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd kavach
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and other configs
npm run dev
```

### 3. Mobile Setup
```bash
cd mobile
flutter pub get
flutter run
```

### 4. Web Setup
```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

## 📚 Documentation

### Phase Documentation
- **Phase 0**: [Setup Guide](./docs/phase-0/) - Initial project setup
- **Phase 1**: [Backend Core](./docs/phase-1/) - Backend API complete ✅
- **Phase 2**: [Mobile & Admin Shells](./docs/phase-2/) - Planning complete 📋

### Shared Documentation
- [Architecture](./docs/shared/ARCHITECTURE.md) - System architecture
- [Development Methodology](./docs/shared/CURSOR_AI_METHODOLOGY.md) - How we build
- [Acceptance Checklist](./docs/shared/ACCEPTANCE_TEST_CHECKLIST.md) - Testing guide

### Quick Links
- [Backend README](./backend/README.md) - Backend API documentation
- [Phase 2 Complete Plan](./docs/phase-2/PHASE_2_COMPLETE_PLAN.md) - Phase 2 implementation plan

## 🎯 Development Status

### Phase 1: Backend Core ✅ COMPLETE
- ✅ REST APIs (Users, Schools, Drills, Alerts, Modules, Devices)
- ✅ Authentication & Authorization (JWT + RBAC)
- ✅ Real-time Engine (Socket.io)
- ✅ IoT Device Integration
- ✅ AI Hazard Detection (Gemini)
- ✅ Geospatial Queries
- ✅ Offline Sync Endpoint
- ✅ Testing & DevOps
- ✅ Complete Documentation

### Phase 2: Mobile & Admin Shells 📋 PLANNING COMPLETE
- 📋 Flutter Mobile App (In Progress)
- 📋 React Admin Dashboard (Planned)
- 📋 Real-time Integration
- 📋 Push Notifications
- 📋 Offline Caching

### Phase 3+: Future Phases
- 📅 Gamification & Content
- 📅 AR Simulations
- 📅 Mesh Networking
- 📅 Advanced Features

## 🎯 Features

### Implemented (Phase 1)
- ✅ Complete backend API
- ✅ Real-time Socket.io server
- ✅ IoT device management
- ✅ AI hazard detection
- ✅ Geospatial queries
- ✅ Offline data sync

### Planned (Phase 2+)
- 📋 Mobile app with authentication
- 📋 Admin dashboard
- 📋 Push notifications
- 📋 AR-based simulations
- 📋 Offline mesh networking
- 📋 Gamified learning modules

## 🤝 Contributing

This is a hackathon project for SIH 2025.

## 📄 License

[Add License]

## 👥 Team

[Add Team Members]

---

**Project**: Kavach - Disaster Preparedness System  
**Hackathon**: Smart India Hackathon 2025  
**Problem Statement ID**: 25008

