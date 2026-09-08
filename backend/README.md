# Kavach Backend API

**Disaster Preparedness and Response Education System for Schools and Colleges**

Node.js + Express + MongoDB backend for the Kavach disaster preparedness platform.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Testing](#testing)
- [Docker Setup](#docker-setup)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## ✨ Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens and RBAC
- **Real-time Communication**: Socket.io for live updates and alerts
- **IoT Integration**: Device registration, telemetry, and alert endpoints
- **AI-Powered Analysis**: Gemini AI for hazard detection in images
- **Geospatial Queries**: Find nearest safe zones using MongoDB geospatial indexes
- **Offline Sync**: Bulk data synchronization for offline-first mobile apps
- **Gamification**: Leaderboards and preparedness scoring
- **Comprehensive Testing**: Unit and integration tests with Jest
- **Observability**: Request tracing, metrics, and structured logging

---

## 🛠 Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.io
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Winston
- **Testing**: Jest, Supertest
- **AI**: Google Gemini API

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- MongoDB (local or Atlas)
- (Optional) Redis for caching

### Installation

1. **Clone and navigate to backend**:
```bash
cd backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp env.example .env
```

4. **Update `.env` with your configuration**:
```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
NODE_ENV=development
```

5. **Seed the database (optional)**:
```bash
npm run seed
```

6. **Start development server**:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

---

## 🔐 Environment Variables

See `env.example` for all available environment variables. Key variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ Yes |
| `JWT_SECRET` | Secret key for JWT tokens | ✅ Yes |
| `JWT_EXPIRE` | Access token expiry (default: 15m) | ❌ No |
| `JWT_REFRESH_EXPIRE` | Refresh token expiry (default: 7d) | ❌ No |
| `PORT` | Server port (default: 3000) | ❌ No |
| `NODE_ENV` | Environment (development/production) | ❌ No |
| `GEMINI_API_KEY` | Google Gemini API key (for AI features) | ❌ No |
| `REDIS_URL` | Redis connection URL (optional) | ❌ No |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | ❌ No |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration (database, logger, redis)
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware (auth, RBAC, validation)
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── socket/         # Socket.io handlers
│   ├── utils/          # Utility functions
│   └── server.js       # Express app entry point
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── setup.js        # Test configuration
├── scripts/
│   ├── seed.js         # Database seeding script
│   └── test-*.js       # Testing scripts
├── docker/
│   ├── Dockerfile      # Docker image
│   └── docker-compose.yml  # Local dev setup
├── docs/
│   └── openapi.yaml    # OpenAPI specification
├── .github/
│   └── workflows/
│       └── ci.yml      # CI/CD pipeline
├── .env.example        # Environment template
├── jest.config.js      # Jest configuration
├── package.json
└── README.md
```

---

## 📚 API Documentation

### OpenAPI/Swagger

Full API documentation is available in OpenAPI 3.0 format:

- **File**: `backend/docs/openapi.yaml`
- **View Online**: Import into [Swagger Editor](https://editor.swagger.io/) or [Postman](https://www.postman.com/)

### API Endpoints

#### Health & Metrics
- `GET /health` - Health check
- `GET /api/metrics` - System metrics

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile

#### Users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/location` - Update user location
- `PUT /api/users/:id/safety-status` - Update safety status
- `GET /api/users` - List users (Admin)

#### Schools
- `GET /api/schools` - List schools
- `GET /api/schools/:id` - Get school details
- `GET /api/schools/nearest?lat=30.0&long=75.0` - Find nearest schools (Geo-Spatial)
- `POST /api/schools` - Create school (Admin)

#### Drills
- `GET /api/drills` - List drills
- `GET /api/drills/:id` - Get drill details
- `POST /api/drills` - Schedule drill (Teacher/Admin)
- `POST /api/drills/:id/trigger` - Trigger drill immediately
- `POST /api/drills/:id/acknowledge` - Acknowledge drill participation
- `POST /api/drills/:id/complete` - Complete drill participation

#### Alerts
- `GET /api/alerts` - List alerts
- `GET /api/alerts/:id` - Get alert details
- `POST /api/alerts` - Create alert
- `PUT /api/alerts/:id/resolve` - Resolve alert (Teacher/Admin)

#### Modules
- `GET /api/modules` - List educational modules
- `GET /api/modules/:id` - Get module details
- `POST /api/modules/:id/complete` - Complete module/quiz

#### Devices (IoT)
- `POST /api/devices/register` - Register IoT device
- `GET /api/devices` - List devices (Teacher/Admin)
- `GET /api/devices/:id` - Get device details
- `POST /api/devices/:deviceId/telemetry` - Send telemetry data
- `POST /api/devices/:deviceId/alert` - Create device alert
- `PUT /api/devices/:deviceId/location` - Update device location

#### AI
- `POST /api/ai/analyze` - Analyze hazard in image (Gemini AI)

#### Sync
- `POST /api/sync` - Sync offline data (bulk sync)

#### Leaderboard
- `GET /api/leaderboard` - Get leaderboard

---

## 🔑 Authentication

### JWT Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login** to get `accessToken` and `refreshToken`
2. **Include token** in requests:
   ```
   Authorization: Bearer <accessToken>
   ```
3. **Refresh token** when access token expires:
   ```
   POST /api/auth/refresh
   Body: { "refreshToken": "<refreshToken>" }
   ```

### Roles

- **student**: Can view modules, participate in drills
- **teacher**: Can create drills, manage alerts, view devices
- **admin**: Full access to all resources
- **parent**: Can view child's status and alerts

### Device Authentication

IoT devices use device tokens:
```
X-Device-Token: <deviceToken>
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode
npm run test:watch
```

### Test Coverage

Coverage reports are generated in `coverage/` directory:
```bash
npm test -- --coverage
```

### Test Environment

Create `.env.test` for test-specific configuration:
```env
MONGODB_URI=mongodb://localhost:27017/kavach-test
JWT_SECRET=test-secret-key
NODE_ENV=test
```

---

## 🐳 Docker Setup

### Using Docker Compose

1. **Start all services** (MongoDB, Redis, Backend):
```bash
cd docker
docker-compose up -d
```

2. **View logs**:
```bash
docker-compose logs -f backend
```

3. **Stop services**:
```bash
docker-compose down
```

### Build Docker Image

```bash
docker build -f backend/docker/Dockerfile -t kavach-backend:latest . # Run from repository root
```

---

## 📦 Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server (nodemon) |
| `npm test` | Run all tests with coverage |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run seed` | Seed database with sample data |
| `npm run test:connection` | Test MongoDB connection |

---

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure MongoDB Atlas connection
- [ ] Set up Redis (optional)
- [ ] Configure CORS origins
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting
- [ ] Set up CI/CD pipeline

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<strong-random-secret>
CORS_ORIGIN=https://yourdomain.com
PORT=3000
```

---

## 📖 Additional Documentation

- **OpenAPI Spec**: `backend/docs/openapi.yaml`
- **Postman Collection**: `backend/docs/postman-collection.json`
- **Architecture Diagram**: `docs/ARCHITECTURE.md`
- **Phase Documentation**: `docs/PHASE_*.md`

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Submit a pull request

---

## 📄 License

MIT License

---

## 🆘 Support

For issues and questions:
- Check existing documentation
- Review OpenAPI spec
- Check test files for usage examples

---

**Last Updated**: Phase 1.8 Completion
