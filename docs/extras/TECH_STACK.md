# 🛡️ Kavach - Complete Tech Stack Documentation

## 📱 **1. MOBILE APPLICATION (Flutter)**

### Core Framework
- **Flutter 3.24+** (Latest Stable)
  - Single codebase for Android & iOS
  - Native performance (60fps)
  - Excellent for low-end devices
  - Language: **Dart 3.0+**

### State Management
- **Riverpod 2.4+** (Recommended)
  - Modern, type-safe state management
  - Better than Provider/Bloc for complex apps
  - Excellent for dependency injection

### Local Storage & Offline
- **Hive 2.2+** (Primary)
  - Fast NoSQL database
  - Perfect for offline content storage
  - Better performance than SQLite for key-value
- **SQLite (sqflite)** (For complex queries)
  - For drill history, analytics data

### AR/VR Integration
- **ARCore Plugin (ar_flutter_plugin 1.0+)**
  - Android AR support
- **ARKit Plugin (arkit_flutter)**
  - iOS AR support
- **Alternative: Google ARCore SDK** (Direct integration)

### UI/UX Libraries
- **Material Design 3** (Built-in Flutter)
- **Cupertino Design** (iOS native look)
- **flutter_svg** - SVG support
- **cached_network_image** - Image caching
- **lottie** - Animations
- **flutter_map** - Maps integration
- **flutter_compass** - Compass for navigation

### Networking
- **Dio 5.4+** (HTTP client)
  - Better than http package
  - Interceptors, retry logic
- **Socket.io Client (socket_io_client)**
  - Real-time communication

### Offline Mesh Networking
- **Google Nearby Connections API**
  - Primary: Wi-Fi Direct + BLE
- **flutter_nearby_connections** (Flutter wrapper)
- **Alternative: Bridgefy SDK** (Commercial, more reliable)
- **BLE (flutter_blue_plus)** - Direct Bluetooth Low Energy

### Location Services
- **geolocator** - GPS location
- **geocoding** - Address conversion
- **location_permissions** - Permission handling

### Authentication
- **Firebase Auth** (via firebase_auth)
  - Email/Password
  - Google Sign-In
  - Phone OTP (India-specific)

### Push Notifications
- **Firebase Cloud Messaging (FCM)**
  - Real-time alerts
  - Background notifications

### Maps & Navigation
- **Google Maps (google_maps_flutter)**
  - Campus mapping
  - Route visualization
- **Mapbox (mapbox_maps_flutter)** (Alternative)
  - Better customization

### Other Essential Packages
- **shared_preferences** - Simple key-value storage
- **path_provider** - File system paths
- **permission_handler** - Runtime permissions
- **connectivity_plus** - Network status
- **flutter_local_notifications** - Local notifications
- **camera** - Camera for AR
- **sensors_plus** - Accelerometer, gyroscope (for earthquake simulation)

---

## 🌐 **2. WEB DASHBOARD (Admin Panel)**

### Frontend Framework
- **Next.js 14+** (App Router)
  - React framework with SSR
  - Better SEO, performance
  - API routes included
  - Language: **TypeScript 5.0+**

### UI Framework
- **Shadcn/ui** (Recommended)
  - Modern, accessible components
  - Built on Radix UI + Tailwind
- **Tailwind CSS 3.4+**
  - Utility-first CSS
  - Dark mode support

### State Management
- **Zustand 4.4+** (Lightweight)
  - Simple, no boilerplate
- **React Query (TanStack Query)**
  - Server state management
  - Caching, refetching

### Charts & Visualization
- **Recharts** or **Chart.js**
  - Preparedness scores
  - Drill analytics
- **React Flow** (For network diagrams)
- **Mapbox GL JS** (For campus maps)

### Real-time Updates
- **Socket.io Client**
  - Live dashboard updates

### Forms & Validation
- **React Hook Form**
  - Form handling
- **Zod** - Schema validation

### Authentication
- **NextAuth.js v5** (Auth.js)
  - Secure authentication
  - JWT tokens

---

## ⚙️ **3. BACKEND API**

### Framework
- **Express.js 4.18+** (Primary)
  - Lightweight, flexible
  - Fast development
  - Large ecosystem
  - Perfect for hackathons
- **Language**: **Node.js 20+** with **TypeScript 5.0+** (Optional but recommended)
  - Type safety
  - Better IDE support
  - Can use JavaScript if preferred

### Project Structure Pattern
- **MVC (Model-View-Controller)** Architecture
  - `routes/` - API routes
  - `controllers/` - Business logic
  - `models/` - Database schemas (Mongoose)
  - `middleware/` - Custom middleware
  - `utils/` - Helper functions
  - `config/` - Configuration files

### Real-time Communication
- **Socket.io 4.7+**
  - WebSocket server
  - Room-based messaging
  - Namespaces for different user types
  - Easy integration with Express

### API Documentation
- **swagger-jsdoc** + **swagger-ui-express**
  - JSDoc-based API documentation
  - Auto-generated Swagger UI
- **Alternative**: **Postman** (Manual documentation)

### Validation
- **express-validator** (Recommended)
  - Express middleware for validation
  - Built on validator.js
- **Joi** (Alternative)
  - Schema validation library
  - More powerful for complex schemas

### Authentication & Security
- **jsonwebtoken (JWT)**
  - Token-based authentication
- **Passport.js** (Optional, for multiple strategies)
  - JWT Strategy
  - Google OAuth (if needed)
- **bcrypt** - Password hashing
- **helmet** - Security headers
- **express-rate-limit** - API rate limiting
- **cors** - Cross-origin resource sharing
- **express-mongo-sanitize** - Prevent NoSQL injection

### File Upload
- **Multer**
  - Image/document uploads
  - Multipart/form-data handling
- **Cloud Storage**: AWS S3 / Google Cloud Storage / Cloudinary

### Environment Variables
- **dotenv** - Environment configuration
  - Store sensitive data (DB URLs, API keys)

---

## 🗄️ **4. DATABASE**

### Primary Database
- **MongoDB 7+** (Primary Database)
  - NoSQL document database
  - Flexible schema (perfect for evolving requirements)
  - Excellent for JSON data structures
  - Built-in geospatial support (replaces PostGIS)
  - Horizontal scaling capability
  - **Geospatial Features**:
    - `2dsphere` indexes for location queries
    - `$near`, `$geoWithin`, `$geoIntersects` operators
    - Distance calculations
    - Perfect for campus mapping, safe zones, hazard areas

### ODM (Object Data Modeling)
- **Mongoose 8+** (Recommended)
  - Schema definition and validation
  - Middleware (pre/post hooks)
  - Built-in type casting
  - Query building
  - Population (like joins)
  - Index management

### Database Hosting Options
- **MongoDB Atlas** (Recommended for Hackathons)
  - Free tier (512MB storage)
  - Cloud-hosted, no setup needed
  - Automatic backups
  - Built-in monitoring
- **AWS DocumentDB** (Production)
  - MongoDB-compatible
  - Managed service
- **Self-hosted MongoDB** (Local development)
  - Docker container
  - Local installation

### Caching
- **Redis 7+**
  - Session storage
  - Real-time disaster state
  - Rate limiting
  - Pub/Sub for notifications
  - Caching frequently accessed data

### Data Modeling Considerations
- **Embedded Documents**: For related data (e.g., user progress, quiz results)
- **References**: For relationships (e.g., user → institution)
- **Geospatial Indexes**: For location-based queries
- **TTL Indexes**: For auto-expiring data (e.g., temporary sessions)

---

## ☁️ **5. CLOUD SERVICES & HOSTING**

### Backend Hosting
- **AWS EC2 / ECS** (Recommended)
  - Scalable containers
- **Railway.app** (Hackathon-friendly)
  - Easy deployment
  - Free tier available
- **Render.com** (Alternative)
  - Simple deployment

### Database Hosting
- **MongoDB Atlas** (Primary - Recommended)
  - Free tier (512MB, perfect for hackathons)
  - Cloud-hosted, zero setup
  - Automatic backups & monitoring
  - Global clusters available
- **AWS DocumentDB** (Production alternative)
  - MongoDB-compatible managed service

### Redis Hosting
- **Redis Cloud** (Free tier)
- **AWS ElastiCache**

### Frontend Hosting
- **Vercel** (Next.js optimized)
- **Netlify** (Alternative)

### File Storage
- **AWS S3** (Recommended)
- **Google Cloud Storage**
- **Cloudinary** (Image optimization)

### CDN
- **Cloudflare**
  - Global CDN
  - DDoS protection

---

## 🔌 **6. EXTERNAL APIs & INTEGRATIONS**

### Government APIs
- **IMD (India Meteorological Department)**
  - Weather alerts
- **NDMA (National Disaster Management Authority)**
  - Disaster feeds
- **ISRO DMS Program**
  - Satellite data

### Maps & Geocoding
- **Google Maps API**
  - Geocoding, Directions
- **Mapbox API** (Alternative)
  - Custom maps

### SMS/OTP (India)
- **Twilio** (International)
- **MSG91** (India-specific)
- **TextLocal** (India)

### Email Service
- **SendGrid**
- **AWS SES**
- **Resend** (Modern alternative)

---

## 🧪 **7. TESTING**

### Mobile (Flutter)
- **flutter_test** (Unit tests)
- **integration_test** (E2E)
- **mockito** (Mocking)

### Backend (Node.js/Express)
- **Jest** (Unit + Integration)
- **Supertest** (API testing)
- **MongoDB Memory Server** (In-memory DB for testing)

### Frontend (Next.js)
- **Jest** + **React Testing Library**
- **Playwright** (E2E)

---

## 🚀 **8. DEVOPS & CI/CD**

### Version Control
- **Git** + **GitHub**

### CI/CD
- **GitHub Actions**
  - Automated testing
  - Deployment

### Containerization
- **Docker**
  - Containerize backend
- **Docker Compose**
  - Local development

### Monitoring
- **Sentry** (Error tracking)
- **LogRocket** (Session replay)
- **Firebase Analytics** (Mobile)

---

## 📦 **9. DEVELOPMENT TOOLS**

### Code Quality
- **ESLint** (JavaScript/TypeScript)
- **Prettier** (Code formatting)
- **Dart Analyzer** (Flutter)

### Package Managers
- **npm/yarn/pnpm** (Node.js)
- **pub** (Flutter/Dart)

### API Testing
- **Postman** / **Insomnia**
- **Thunder Client** (VS Code)

---

## 🎨 **10. DESIGN & ASSETS**

### Design Tools
- **Figma** (UI/UX Design)
- **Adobe XD** (Alternative)

### Icons
- **Material Icons**
- **Font Awesome**
- **Flaticon**

### Illustrations
- **LottieFiles** (Animations)
- **unDraw** (Illustrations)

---

## 📋 **11. PROJECT STRUCTURE SUMMARY**

```
kavach/
├── mobile/                 # Flutter App
│   ├── lib/
│   │   ├── features/      # Feature modules
│   │   ├── core/          # Core utilities
│   │   └── main.dart
│   └── pubspec.yaml
│
├── web/                    # Next.js Dashboard
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── package.json
│
├── backend/                # Node.js/Express API
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # Mongoose schemas
│   │   ├── middleware/    # Custom middleware
│   │   ├── utils/         # Helper functions
│   │   ├── config/        # Configuration
│   │   └── server.js      # Entry point
│   ├── .env.example       # Environment template
│   └── package.json
│
└── docs/                   # Documentation
```

---

## ✅ **12. QUICK START CHECKLIST**

### Prerequisites
- [ ] Node.js 20+ installed
- [ ] Flutter 3.24+ installed
- [ ] MongoDB 7+ installed (or use MongoDB Atlas)
- [ ] Redis 7+ installed (optional for local dev)
- [ ] Git installed
- [ ] VS Code / Android Studio

### Accounts Needed
- [ ] Google Cloud (ARCore, Maps)
- [ ] Firebase (Auth, FCM, Analytics)
- [ ] AWS / Railway / Render (Hosting)
- [ ] GitHub (Code repository)

---

## 🎯 **RECOMMENDED FOR HACKATHON (Simplified)**

If time is limited, use this minimal stack:

1. **Mobile**: Flutter + Riverpod + Hive
2. **Web**: Next.js + Tailwind + Shadcn/ui
3. **Backend**: Node.js + Express + MongoDB + Socket.io
4. **Hosting**: Railway.app / Render (Backend) + Vercel (Frontend)
5. **Database**: MongoDB Atlas (Free tier, zero setup)
6. **AR**: ARCore plugin (Android only initially)
7. **Mesh**: flutter_nearby_connections (Basic)

---

## 🔄 **KEY CHANGES: Node.js + MongoDB Stack**

### ✅ **Advantages of This Stack**

1. **Faster Development**
   - Express.js is simpler and faster to set up than NestJS
   - Less boilerplate code
   - Perfect for hackathon timeline

2. **MongoDB Benefits**
   - **Flexible Schema**: Easy to add/modify fields (great for evolving features)
   - **Geospatial Built-in**: Native support for location queries (no PostGIS needed)
   - **JSON Native**: Perfect match for Node.js/JavaScript
   - **Horizontal Scaling**: Easy to scale as user base grows
   - **Free Tier**: MongoDB Atlas offers generous free tier

3. **Simpler Architecture**
   - MVC pattern is straightforward
   - Easier for team members to understand
   - Less learning curve

4. **Better for Real-time**
   - MongoDB change streams for real-time updates
   - Socket.io works seamlessly with Express
   - Redis caching for fast reads

### ⚠️ **Considerations**

1. **Geospatial Queries**
   - MongoDB has excellent geospatial support
   - Use `2dsphere` indexes for location-based queries
   - `$near`, `$geoWithin` operators work great
   - **Example**: Finding schools within 10km of a disaster zone

2. **Data Relationships**
   - Use Mongoose `populate()` for references
   - Embed documents for frequently accessed related data
   - Design schema based on access patterns

3. **Transactions**
   - MongoDB supports multi-document transactions (v4.0+)
   - Use for critical operations (e.g., marking students safe)

4. **Validation**
   - Use Mongoose schema validation
   - Add express-validator for API-level validation
   - Double-layer validation is recommended

### 📊 **MongoDB Schema Examples for Kavach**

```javascript
// User Schema
{
  _id: ObjectId,
  email: String,
  role: 'student' | 'teacher' | 'admin' | 'parent',
  institutionId: ObjectId,
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]  // GeoJSON format
  },
  safetyStatus: 'safe' | 'missing' | 'at_risk',
  lastSeen: Date
}

// Institution Schema
{
  _id: ObjectId,
  name: String,
  address: String,
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  safeZones: [{
    name: String,
    location: { type: 'Point', coordinates: [...] }
  }],
  floorPlan: {
    rooms: [...],
    exits: [...],
    hazards: [...]
  }
}

// Drill Schema
{
  _id: ObjectId,
  institutionId: ObjectId,
  type: 'fire' | 'earthquake' | 'flood',
  scheduledAt: Date,
  participants: [ObjectId],  // User IDs
  results: {
    avgEvacuationTime: Number,
    participationRate: Number,
    studentScores: [{
      userId: ObjectId,
      time: Number,
      route: String
    }]
  }
}
```

### 🚀 **Quick Setup Commands**

```bash
# Backend Setup
npm init -y
npm install express mongoose socket.io cors helmet dotenv
npm install -D nodemon typescript @types/node @types/express

# MongoDB Connection (Mongoose)
mongoose.connect(process.env.MONGODB_URI)

# Geospatial Index
institutionSchema.index({ location: '2dsphere' })

# Geospatial Query
Institution.find({
  location: {
    $near: {
      $geometry: { type: 'Point', coordinates: [lng, lat] },
      $maxDistance: 10000  // 10km
    }
  }
})
```

---

**Last Updated**: December 2024
**Project**: Kavach - Disaster Preparedness System

