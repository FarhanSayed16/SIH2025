# 🚀 Phase 1: Step-by-Step Implementation Guide

## 📋 Overview

This document provides a detailed, step-by-step guide for implementing Phase 1 of the Kavach backend. Follow this guide sequentially to build a complete, production-ready backend.

---

## ✅ Phase 1.1: Project Skeleton & Infrastructure

### **Status**: ✅ COMPLETE

**What's Done:**
- ✅ Project structure created
- ✅ Docker setup (Dockerfile + docker-compose.yml)
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Logger configuration (Winston)
- ✅ Redis configuration
- ✅ Node version manager (.nvmrc)
- ✅ Utility functions (response, geospatial, helpers)
- ✅ Middleware (validator, rate limiter)

**Next Steps**: Proceed to Phase 1.2

---

## 📦 Phase 1.2: Core Models & Persistence Layer

### **Step 1: Install Additional Dependencies**

```bash
cd backend
npm install
```

### **Step 2: Create Mongoose Models**

Create the following models in `backend/src/models/`:

1. **User.js** - User model with roles
2. **School.js** - School model with geospatial location
3. **Drill.js** - Drill scheduling and results
4. **Alert.js** - Emergency alerts
5. **Module.js** - Learning modules
6. **Device.js** - IoT device registration
7. **QuizResult.js** - Quiz completion records
8. **DrillLog.js** - Drill participation logs

### **Step 3: Create Seed Script**

Create `backend/scripts/seed.js` to populate:
- 1 school with geospatial data
- 1 admin user
- 3 student users
- 2 learning modules
- 1 scheduled drill

### **Step 4: Test Database Connection**

```bash
npm run dev
# Should see: "✅ MongoDB Connected"
```

---

## 🔐 Phase 1.3: Authentication & Authorization

### **Step 1: Create Auth Service**

Create `backend/src/services/auth.service.js`:
- Password hashing (bcrypt)
- JWT token generation
- Refresh token management
- Token validation

### **Step 2: Create Auth Middleware**

Create `backend/src/middleware/auth.middleware.js`:
- JWT validation
- User attachment to request
- Token refresh handling

### **Step 3: Create RBAC Middleware**

Create `backend/src/middleware/rbac.middleware.js`:
- Role-based access control
- Support for: STUDENT, TEACHER, ADMIN, PARENT

### **Step 4: Create Auth Routes**

Create `backend/src/routes/auth.routes.js`:
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

### **Step 5: Create Auth Controller**

Create `backend/src/controllers/auth.controller.js`:
- Register logic
- Login logic
- Refresh token logic
- Logout logic

### **Step 6: Test Authentication**

```bash
# Test register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User","role":"student"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 🌐 Phase 1.4: Core REST APIs

### **Step 1: User APIs**

**Routes**: `backend/src/routes/user.routes.js`
- GET /api/users/:id - Get user profile
- PUT /api/users/:id - Update user profile
- GET /api/users - List users (admin only)

**Controller**: `backend/src/controllers/user.controller.js`

### **Step 2: School APIs (with Geospatial)**

**Routes**: `backend/src/routes/school.routes.js`
- GET /api/schools - List all schools
- POST /api/schools - Create school (admin)
- GET /api/schools/:id - Get school details
- PUT /api/schools/:id - Update school (admin)
- **GET /api/schools/nearest?lat=30.0&lng=75.0&radius=5000** - Find nearest schools (Add-on 1)

**Controller**: `backend/src/controllers/school.controller.js`
- Use `createNearQuery` from `utils/geospatial.js`

### **Step 3: Drill APIs**

**Routes**: `backend/src/routes/drill.routes.js`
- POST /api/drills - Schedule drill (admin)
- GET /api/drills?schoolId=xxx - List drills
- GET /api/drills/:id - Get drill details
- POST /api/drills/:id/trigger - Trigger drill immediately
- GET /api/drills/:id/results - Get drill results

**Controller**: `backend/src/controllers/drill.controller.js`
**Service**: `backend/src/services/drill.service.js`

### **Step 4: Alert APIs**

**Routes**: `backend/src/routes/alert.routes.js`
- POST /api/alerts - Create alert
- GET /api/alerts?schoolId=xxx - List alerts
- GET /api/alerts/:id - Get alert details
- PUT /api/alerts/:id/resolve - Resolve alert

**Controller**: `backend/src/controllers/alert.controller.js`
**Service**: `backend/src/services/alert.service.js`

### **Step 5: Module APIs**

**Routes**: `backend/src/routes/module.routes.js`
- GET /api/modules - List modules
- GET /api/modules/:id - Get module details
- POST /api/modules/:id/complete - Mark module complete

**Controller**: `backend/src/controllers/module.controller.js`

### **Step 6: Sync Endpoint (Add-on 2)**

**Routes**: `backend/src/routes/sync.routes.js`
- **POST /api/sync** - Bulk sync offline data

**Controller**: `backend/src/controllers/sync.controller.js`
**Service**: `backend/src/services/sync.service.js`

**Payload Format**:
```json
{
  "quizzes": [
    {
      "moduleId": "xxx",
      "score": 85,
      "completedAt": "2024-01-01T10:00:00Z"
    }
  ],
  "drillLogs": [
    {
      "drillId": "xxx",
      "evacuationTime": 120,
      "completedAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### **Step 7: Leaderboard API**

**Routes**: `backend/src/routes/leaderboard.routes.js`
- GET /api/leaderboard?schoolId=xxx - Get school leaderboard

**Controller**: `backend/src/controllers/leaderboard.controller.js`

---

## 🔌 Phase 1.5: Real-time Engine (Socket.io)

### **Step 1: Update Server.js**

Integrate Socket.io into `backend/src/server.js`:
- Import socket handler
- Initialize socket.io
- Pass io instance to routes

### **Step 2: Create Socket Handler**

Create `backend/src/socket/socketHandler.js`:
- Connection handling
- Authentication middleware
- Room management
- Event broadcasting

### **Step 3: Create Socket Events**

Create `backend/src/socket/events.js`:
- JOIN_ROOM - Client joins school room
- DRILL_ACK - Client acknowledges drill
- CLIENT_HEARTBEAT - Keep-alive
- DRILL_SCHEDULED - Server broadcasts drill
- CRISIS_ALERT - Server broadcasts alert
- DRILL_SUMMARY - Server sends drill summary

### **Step 4: Create Room Manager**

Create `backend/src/socket/rooms.js`:
- `joinSchoolRoom(socket, schoolId)`
- `leaveSchoolRoom(socket, schoolId)`
- `broadcastToSchool(schoolId, event, payload)`

### **Step 5: Test Socket.io**

Use a Socket.io client or Postman WebSocket:
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  query: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  socket.emit('JOIN_ROOM', { schoolId: 'xxx' });
});

socket.on('CRISIS_ALERT', (data) => {
  console.log('Alert received:', data);
});
```

---

## 🔧 Phase 1.6: Device / IoT Endpoints

### **Step 1: Device Registration**

**Route**: POST /api/devices/register
- Accept deviceId, schoolId, deviceType
- Generate device token
- Store device in database

### **Step 2: Device Telemetry**

**Route**: POST /api/devices/:deviceId/telemetry
- Accept sensor data (smoke, temperature, water level)
- Store telemetry in database
- Check thresholds and trigger alerts if needed

### **Step 3: Device Alert**

**Route**: POST /api/devices/:deviceId/alert
- Accept alert type and data
- Create Alert record
- Broadcast CRISIS_ALERT via Socket.io
- Optionally send FCM push

### **Step 4: Device Authentication**

Create `backend/src/middleware/deviceAuth.middleware.js`:
- Validate device token
- Attach device to request

### **Step 5: AI Proxy Endpoint (Add-on 3)**

**Route**: POST /api/ai/analyze

**Controller**: `backend/src/controllers/ai.controller.js`
**Service**: `backend/src/services/ai.service.js`

**Implementation**:
```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeHazard = async (req, res) => {
  // 1. Get image from request (base64 or multipart)
  // 2. Call Gemini API
  // 3. Parse response
  // 4. Store analysis in database
  // 5. Return JSON response
};
```

**Payload Format**:
```json
{
  "image": "base64_encoded_image",
  "mimeType": "image/jpeg"
}
```

---

## 🧪 Phase 1.7: Testing, Observability & DevOps

### **Step 1: Set Up Jest**

Create `backend/tests/setup.js`:
- Test database connection
- Test environment setup
- Cleanup utilities

### **Step 2: Write Unit Tests**

Create tests in `backend/tests/unit/`:
- `auth.test.js` - Auth service tests
- `services.test.js` - Service layer tests
- `utils.test.js` - Utility function tests

### **Step 3: Write Integration Tests**

Create tests in `backend/tests/integration/`:
- `auth.test.js` - Auth endpoint tests
- `api.test.js` - API endpoint tests
- `socket.test.js` - Socket.io tests

### **Step 4: Update Health Endpoint**

Update `GET /health` to include:
- Database connection status
- Redis connection status (if enabled)
- Server uptime

### **Step 5: Add Logging**

Integrate Winston logger:
- Request logging middleware
- Error logging
- Event logging (drill triggers, alerts)

### **Step 6: Docker Setup**

Test Docker setup:
```bash
cd backend
docker-compose up -d
# Should start: backend, mongo, redis
```

---

## 📚 Phase 1.8: Documentation & Handover

### **Step 1: OpenAPI/Swagger**

Create `backend/docs/api/openapi.yaml`:
- All endpoints documented
- Request/response schemas
- Authentication flow

### **Step 2: Update README**

Update `backend/README.md` with:
- Setup instructions
- Environment variables
- API documentation link
- Testing instructions

### **Step 3: Create Postman Collection**

Export Postman collection with:
- All endpoints
- Auth flow
- Sample requests
- Environment variables

### **Step 4: Architecture Documentation**

Create `backend/docs/architecture.md`:
- System architecture
- Database schema
- API flow diagrams
- Socket.io event flow

---

## 🔒 Phase 1.9: Security & Compliance

### **Security Checklist**

- [ ] HTTPS enforced (production)
- [ ] JWT secrets in environment variables
- [ ] Rate limiting on all auth endpoints
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention
- [ ] CORS properly configured
- [ ] Device registration rate limited
- [ ] Sensitive data not logged
- [ ] Error messages don't leak info

### **Compliance**

- [ ] Event logging (login, drill trigger, alerts)
- [ ] Data retention policy documented
- [ ] Privacy policy considerations

---

## ✅ Phase 1 Acceptance Criteria

Before moving to Phase 2, verify:

1. ✅ Backend server runs and connects to MongoDB
2. ✅ `/health` returns `{status: 'ok', db: 'connected'}`
3. ✅ Auth flows work: register, login, refresh, logout
4. ✅ Protected routes require valid JWT
5. ✅ RBAC restricts routes by role
6. ✅ Socket.io: client can JOIN_ROOM and receive events
7. ✅ Admin can POST /drills → emits DRILL_SCHEDULED
8. ✅ Device can POST /devices/:id/alert → triggers CRISIS_ALERT
9. ✅ **GET /api/schools/nearest works with lat/lng**
10. ✅ **POST /api/sync accepts offline data**
11. ✅ **POST /api/ai/analyze processes images**
12. ✅ Seed script populates test data
13. ✅ OpenAPI spec available
14. ✅ CI runs lint & tests on PRs

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
cd backend && npm install

# Set up environment
cp env.example .env
# Edit .env with your MongoDB URI

# Run seed script
npm run seed

# Start development server
npm run dev

# Run tests
npm test

# Start with Docker
docker-compose up -d
```

---

**Last Updated**: Phase 1 Implementation Guide
**Status**: Ready for Step-by-Step Implementation

