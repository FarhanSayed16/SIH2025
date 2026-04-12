# 🚀 Phase 1: Backend Core - Complete Plan

## 📋 Overview

**Goal**: Implement a secure, reliable, and well-documented backend that provides REST APIs, real-time messaging, device endpoints, and a deployable dev/staging environment. This is the foundation for mobile/web/games/IoT integration.

**Duration**: 2-3 Sprints (4-6 weeks)

---

## ✅ Phase 1 Outcomes

When Phase 1 is complete, you will have:

- ✅ A running Node.js backend with Express connected to MongoDB Atlas
- ✅ Authentication (JWT + Refresh) and RBAC middleware
- ✅ Core REST APIs for Users, Schools, Drills, Alerts, Modules, Devices
- ✅ **Geospatial APIs** (nearest safe zones, location-based queries)
- ✅ **Sync endpoint** for offline data synchronization
- ✅ **AI Proxy endpoint** for Gemini hazard detection
- ✅ Socket.io real-time engine with school rooms and basic events
- ✅ Basic device registration endpoint for IoT proof-of-concept
- ✅ Logging, configuration, CI pipeline, and seed data for demo
- ✅ Documentation: OpenAPI spec and README for backend developers

---

## 📦 Sub-Phases Breakdown

### **1.1 Project Skeleton & Infrastructure** ✅ (Already Done in Phase 0)
- [x] Project structure created
- [x] Docker setup needed
- [x] CI/CD pipeline needed
- [x] MongoDB Atlas connection

### **1.2 Core Models & Persistence Layer**
- [ ] Mongoose models with geospatial support
- [ ] Indexes (geo, time, unique)
- [ ] Seed script with demo data
- [ ] DB connection with retry logic

### **1.3 Authentication & Authorization**
- [ ] Register/Login/Refresh/Logout endpoints
- [ ] JWT middleware
- [ ] RBAC middleware
- [ ] Rate limiting

### **1.4 Core REST APIs**
- [ ] User management APIs
- [ ] School CRUD with geospatial queries
- [ ] Drill scheduling and management
- [ ] Alert creation
- [ ] Module/Quiz APIs
- [ ] **GET /api/schools/nearest** (Add-on 1)
- [ ] **POST /api/sync** (Add-on 2)
- [ ] Leaderboard endpoint

### **1.5 Real-time Engine (Socket.io)**
- [ ] Socket.io server setup
- [ ] Room-based messaging (school rooms)
- [ ] Event handlers (JOIN_ROOM, DRILL_ACK, etc.)
- [ ] Broadcast functions
- [ ] Connection auth

### **1.6 Device / IoT Endpoints**
- [ ] Device registration
- [ ] Telemetry endpoint
- [ ] Device alert endpoint
- [ ] Device token authentication
- [ ] **POST /api/ai/analyze** (Add-on 3)

### **1.7 Testing, Observability & DevOps**
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] Structured logging (winston/pino)
- [ ] Health endpoints
- [ ] Docker & docker-compose
- [ ] GitHub Actions CI

### **1.8 Documentation & Handover**
- [ ] OpenAPI/Swagger spec
- [ ] README with setup instructions
- [ ] Postman/Insomnia collection
- [ ] Architecture diagrams
- [ ] Event flow documentation

### **1.9 Security & Compliance**
- [ ] HTTPS enforcement
- [ ] JWT secrets management
- [ ] Rate limiting
- [ ] Input validation & sanitization
- [ ] Event logging
- [ ] Device registration limits

---

## 🎯 Critical Add-ons Integration

### **Add-on 1: Geo-Spatial Engine** 🌍

**Endpoint**: `GET /api/schools/nearest?lat=30.0&lng=75.0&radius=5000`

**Purpose**: Find nearest safe zones/schools during disasters

**Implementation**:
- Add `location` field to School model with `2dsphere` index
- Use MongoDB `$near` operator for geospatial queries
- Return schools within specified radius (default 5km)

**Why Critical**: Judges can demo live location-based safety features

---

### **Add-on 2: Sync Endpoint** 🔄

**Endpoint**: `POST /api/sync`

**Purpose**: Bulk synchronization of offline data (quizzes, drill logs, etc.)

**Implementation**:
- Accept array of offline actions
- Bulk insert quiz results, drill logs
- Recalculate user preparedness score
- Return sync status and conflicts (if any)

**Why Critical**: Proves offline-first capability and resilience

---

### **Add-on 3: AI Proxy (Gemini)** 🤖

**Endpoint**: `POST /api/ai/analyze`

**Purpose**: Secure AI hazard detection (keeps API key on server)

**Implementation**:
- Accept image (base64 or multipart)
- Call Google Gemini API from server
- Return hazard analysis JSON
- Store analysis in database

**Why Critical**: Security best practice + impressive AI feature

---

## 📁 Phase 1 Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          ✅ (Done)
│   │   ├── redis.js             ⏳ (Phase 1.1)
│   │   └── logger.js            ⏳ (Phase 1.7)
│   │
│   ├── models/
│   │   ├── User.js              ⏳ (Phase 1.2)
│   │   ├── School.js            ⏳ (Phase 1.2) - with geospatial
│   │   ├── Drill.js             ⏳ (Phase 1.2)
│   │   ├── Alert.js             ⏳ (Phase 1.2)
│   │   ├── Module.js            ⏳ (Phase 1.2)
│   │   ├── Device.js            ⏳ (Phase 1.2)
│   │   ├── QuizResult.js        ⏳ (Phase 1.2)
│   │   └── DrillLog.js          ⏳ (Phase 1.2)
│   │
│   ├── controllers/
│   │   ├── auth.controller.js   ⏳ (Phase 1.3)
│   │   ├── user.controller.js   ⏳ (Phase 1.4)
│   │   ├── school.controller.js ⏳ (Phase 1.4) - with nearest
│   │   ├── drill.controller.js ⏳ (Phase 1.4)
│   │   ├── alert.controller.js  ⏳ (Phase 1.4)
│   │   ├── module.controller.js ⏳ (Phase 1.4)
│   │   ├── device.controller.js ⏳ (Phase 1.6)
│   │   ├── sync.controller.js   ⏳ (Phase 1.4) - Add-on 2
│   │   └── ai.controller.js      ⏳ (Phase 1.6) - Add-on 3
│   │
│   ├── routes/
│   │   ├── auth.routes.js       ⏳ (Phase 1.3)
│   │   ├── user.routes.js       ⏳ (Phase 1.4)
│   │   ├── school.routes.js     ⏳ (Phase 1.4)
│   │   ├── drill.routes.js      ⏳ (Phase 1.4)
│   │   ├── alert.routes.js      ⏳ (Phase 1.4)
│   │   ├── module.routes.js     ⏳ (Phase 1.4)
│   │   ├── device.routes.js     ⏳ (Phase 1.6)
│   │   ├── sync.routes.js       ⏳ (Phase 1.4) - Add-on 2
│   │   └── ai.routes.js         ⏳ (Phase 1.6) - Add-on 3
│   │
│   ├── services/
│   │   ├── auth.service.js      ⏳ (Phase 1.3)
│   │   ├── drill.service.js     ⏳ (Phase 1.4)
│   │   ├── alert.service.js     ⏳ (Phase 1.4)
│   │   ├── sync.service.js      ⏳ (Phase 1.4) - Add-on 2
│   │   └── ai.service.js        ⏳ (Phase 1.6) - Add-on 3
│   │
│   ├── middleware/
│   │   ├── error.middleware.js  ✅ (Done)
│   │   ├── auth.middleware.js   ⏳ (Phase 1.3)
│   │   ├── rbac.middleware.js  ⏳ (Phase 1.3)
│   │   ├── rateLimiter.js       ⏳ (Phase 1.3)
│   │   └── validator.js         ⏳ (Phase 1.4)
│   │
│   ├── utils/
│   │   ├── geospatial.js        ⏳ (Phase 1.4) - Add-on 1
│   │   ├── response.js         ⏳ (Phase 1.4)
│   │   └── helpers.js          ⏳ (Phase 1.4)
│   │
│   ├── socket/
│   │   ├── socketHandler.js     ⏳ (Phase 1.5)
│   │   ├── events.js            ⏳ (Phase 1.5)
│   │   └── rooms.js             ⏳ (Phase 1.5)
│   │
│   └── server.js                ✅ (Done - needs Socket.io integration)
│
├── scripts/
│   ├── seed.js                  ⏳ (Phase 1.2)
│   └── migrate.js               ⏳ (Phase 1.2)
│
├── tests/
│   ├── unit/
│   │   ├── auth.test.js         ⏳ (Phase 1.7)
│   │   └── services.test.js     ⏳ (Phase 1.7)
│   ├── integration/
│   │   ├── auth.test.js         ⏳ (Phase 1.7)
│   │   └── api.test.js          ⏳ (Phase 1.7)
│   └── setup.js                 ⏳ (Phase 1.7)
│
├── docker/
│   ├── Dockerfile               ⏳ (Phase 1.1)
│   └── docker-compose.yml      ⏳ (Phase 1.1)
│
├── .github/
│   └── workflows/
│       └── ci.yml              ⏳ (Phase 1.1)
│
├── docs/
│   ├── api/
│   │   └── openapi.yaml        ⏳ (Phase 1.8)
│   └── architecture.md          ⏳ (Phase 1.8)
│
├── .env.example                 ✅ (Done)
├── .nvmrc                       ⏳ (Phase 1.1)
├── package.json                 ✅ (Done)
└── README.md                    ✅ (Done - needs update)
```

---

## 🔄 Implementation Order

### **Sprint 1 (Week 1-2)**

1. **Infrastructure** (1.1)
   - Docker setup
   - CI/CD pipeline
   - Redis configuration (optional)

2. **Models & Database** (1.2)
   - All Mongoose models
   - Geospatial indexes
   - Seed script

3. **Authentication** (1.3)
   - Auth endpoints
   - JWT middleware
   - RBAC middleware

4. **Basic APIs** (1.4 - Partial)
   - User APIs
   - School CRUD
   - Geospatial nearest endpoint (Add-on 1)

### **Sprint 2 (Week 3-4)**

5. **Core APIs** (1.4 - Complete)
   - Drill APIs
   - Alert APIs
   - Module APIs
   - Sync endpoint (Add-on 2)
   - Leaderboard

6. **Socket.io** (1.5)
   - Real-time server
   - Room management
   - Event handlers

7. **IoT & AI** (1.6)
   - Device endpoints
   - AI proxy (Add-on 3)

8. **Testing & DevOps** (1.7)
   - Unit tests
   - Integration tests
   - Logging
   - Health endpoints

### **Sprint 3 (Week 5-6)**

9. **Documentation** (1.8)
   - OpenAPI spec
   - Postman collection
   - Architecture docs

10. **Security & Polish** (1.9)
    - Security audit
    - Rate limiting
    - Input validation
    - Final testing

---

## 🎯 Acceptance Criteria

### **Must Have (Before Phase 2)**

- [ ] Backend server runs and connects to MongoDB Atlas
- [ ] `/health` endpoint returns `{status: 'ok', db: 'connected'}`
- [ ] Auth flows work: register, login, refresh, logout
- [ ] Protected routes require valid JWT
- [ ] RBAC restricts routes by role
- [ ] Socket.io: client can JOIN_ROOM and receive events
- [ ] Admin can POST /drills → emits DRILL_SCHEDULED
- [ ] Device can POST /devices/:id/alert → triggers CRISIS_ALERT
- [ ] **GET /api/schools/nearest works with lat/lng**
- [ ] **POST /api/sync accepts offline data**
- [ ] **POST /api/ai/analyze processes images**
- [ ] Seed script populates test data
- [ ] OpenAPI spec available
- [ ] CI runs lint & tests on PRs

---

## 📊 Success Metrics

- ✅ All endpoints return correct HTTP codes
- ✅ Response time < 200ms for 95% of requests
- ✅ Socket.io latency < 100ms
- ✅ Test coverage > 70%
- ✅ Zero critical security vulnerabilities
- ✅ Documentation complete and accurate

---

## 🔐 Security Checklist

- [ ] HTTPS enforced (production)
- [ ] JWT secrets in environment variables
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention
- [ ] CORS properly configured
- [ ] Device registration rate limited
- [ ] Sensitive data logged securely
- [ ] Error messages don't leak info

---

**Last Updated**: Phase 1 Planning
**Status**: Ready for Implementation

