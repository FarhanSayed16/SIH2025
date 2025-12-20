# KAVACH - Complete Project Documentation

**Project Name**: KAVACH (Disaster Preparedness & Response Education System)  
**Version**: 1.0.0  
**Date**: January 2025  
**Platform**: Smart India Hackathon (SIH) 2025  
**Description**: Comprehensive disaster management system for schools and colleges with real-time alerts, IoT integration, gamified learning, and emergency response capabilities.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Features & Modules](#features--modules)
5. [API Keys & Environment Variables](#api-keys--environment-variables)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Real-Time Communication](#real-time-communication)
9. [Deployment](#deployment)
10. [File Structure](#file-structure)

---

## 🎯 Project Overview

KAVACH is a multi-platform disaster preparedness and response system designed for educational institutions. It combines:

- **Real-Time Emergency Response**: IoT alerts, SOS system, drill management
- **Gamified Learning**: Interactive games, quizzes, badges, leaderboards
- **Multi-Role Support**: Admin, Teacher, Student, Parent roles
- **Offline Capability**: Works without internet connectivity
- **AR Navigation**: Augmented reality evacuation routes
- **Analytics & Reporting**: Comprehensive dashboards and insights

### Core Objectives

1. **Education**: Teach disaster preparedness through interactive modules
2. **Response**: Real-time alerts and emergency coordination
3. **Training**: Conduct and track safety drills
4. **Communication**: Multi-channel notifications (Push, SMS, Email)
5. **Monitoring**: Track student safety and location during emergencies

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │     │   Web Dashboard  │     │   IoT Devices   │
│   (Flutter)     │     │   (Next.js)      │     │   (MQTT)        │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                         │
         │                       │                         │
         └───────────────────────┼─────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Backend API Server    │
                    │   (Node.js + Express)  │
                    └────────────┬───────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────▼────────┐   ┌─────────▼─────────┐  ┌─────────▼─────────┐
│   MongoDB       │   │   Redis Cache     │  │   Socket.io       │
│   (Database)    │   │   (Leaderboards)  │  │   (Real-time)     │
└─────────────────┘   └───────────────────┘  └───────────────────┘
```

### Technology Layers

1. **Frontend Layer**
   - Mobile: Flutter (iOS & Android)
   - Web: Next.js 14 (React + TypeScript)

2. **Backend Layer**
   - Node.js + Express.js
   - RESTful API
   - Socket.io for real-time communication

3. **Data Layer**
   - MongoDB (Primary database)
   - Redis (Caching & leaderboards)

4. **External Services**
   - Firebase Cloud Messaging (Push notifications)
   - SendGrid / SMTP (Email)
   - Twilio (SMS - optional)
   - Google Maps API (Maps & geolocation)
   - Mapbox GL JS (Web maps)
   - Google Gemini AI (AI-powered features)
   - MQTT Broker (IoT device communication)

---

## 🛠️ Technology Stack

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | Latest LTS | Runtime environment |
| Express.js | ^4.18.2 | Web framework |
| MongoDB | ^8.0.0 | Database (via Mongoose) |
| Socket.io | ^4.7.0 | Real-time communication |
| Redis | ^4.6.0 | Caching & leaderboards |
| Firebase Admin | ^12.0.0 | Push notifications |
| JWT | ^9.0.2 | Authentication |
| Bcrypt | ^5.1.1 | Password hashing |
| MQTT | ^5.0.0 | IoT device communication |
| Winston | ^3.11.0 | Logging |
| Helmet | ^7.1.0 | Security headers |
| Express Rate Limit | ^7.1.5 | Rate limiting |
| Multer | ^1.4.5-lts.1 | File uploads |
| Sharp | ^0.33.5 | Image processing |
| PDFKit | ^0.17.2 | PDF generation |
| QRCode | ^1.5.4 | QR code generation |
| ExcelJS | ^4.4.0 | Excel export |
| CSV Writer | ^1.6.0 | CSV export |
| Google Generative AI | ^0.2.1 | AI features |
| SendGrid | ^8.1.6 | Email service |
| Nodemailer | ^7.0.11 | SMTP email |
| Axios | ^1.13.2 | HTTP client |

### Frontend Web Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | ^14.0.4 | React framework |
| React | ^18.2.0 | UI library |
| TypeScript | ^5.3.3 | Type safety |
| Tailwind CSS | ^3.4.0 | Styling |
| Zustand | ^4.4.7 | State management |
| Socket.io Client | ^4.7.0 | Real-time |
| Mapbox GL JS | ^3.0.0 | Maps |
| Recharts | ^2.10.3 | Charts |
| React Hook Form | ^7.49.2 | Forms |
| Zod | ^3.22.4 | Validation |
| Framer Motion | ^12.23.25 | Animations |
| Lucide React | ^0.555.0 | Icons |
| QRCode React | ^4.2.0 | QR codes |
| jsPDF | ^3.0.4 | PDF generation |
| html2canvas | ^1.4.1 | Screenshot |

### Mobile Stack (Flutter)

| Package | Version | Purpose |
|---------|---------|---------|
| flutter | SDK | Core framework |
| provider | ^6.0.0 | State management |
| flutter_riverpod | ^2.4.0 | Advanced state management |
| dio | ^5.4.0 | HTTP client |
| socket_io_client | ^2.0.3 | Real-time communication |
| firebase_core | ^2.24.0 | Firebase integration |
| firebase_auth | ^4.15.0 | Authentication |
| firebase_messaging | ^14.7.0 | Push notifications |
| google_maps_flutter | ^2.5.0 | Maps |
| geolocator | ^13.0.1 | Location services |
| geocoding | ^2.1.0 | Reverse geocoding |
| camera | ^0.11.0 | Camera access |
| sensors_plus | ^6.1.0 | Device sensors |
| mobile_scanner | ^5.2.3 | QR/Barcode scanning |
| qr_flutter | ^4.1.0 | QR code generation |
| shared_preferences | ^2.2.2 | Local storage |
| hive | ^2.2.0 | Offline database |
| flutter_secure_storage | ^9.0.0 | Secure storage |
| permission_handler | ^11.4.0 | Permissions |
| url_launcher | ^6.2.5 | External URLs |
| flutter_local_notifications | ^18.0.1 | Local notifications |
| google_generative_ai | ^0.4.0 | AI features |
| flame | ^1.16.0 | Game engine |
| flame_audio | ^2.1.0 | Game audio |
| video_player | ^2.8.1 | Video playback |
| chewie | ^1.7.1 | Video controls |
| youtube_player_flutter | ^9.0.1 | YouTube videos |
| speech_to_text | ^7.0.0 | Speech recognition |
| flutter_tts | ^4.2.0 | Text-to-speech |
| nearby_connections | ^4.0.0 | P2P communication |
| connectivity_plus | ^5.0.0 | Network status |
| flutter_dotenv | ^5.1.0 | Environment variables |
| lottie | ^2.7.0 | Animations |
| cached_network_image | ^3.3.0 | Image caching |
| flutter_svg | ^2.0.9 | SVG support |

---

## 🎨 Features & Modules

### 1. Authentication & Authorization

#### User Roles
- **System Admin**: Full system access
- **Admin**: Institution-level management
- **Teacher**: Class management, drill creation
- **Student**: Learning, games, drills
- **Parent**: Child monitoring, notifications

#### Features
- JWT-based authentication
- Role-based access control (RBAC)
- Password reset via email
- QR code authentication for parents
- Device authentication for IoT
- Approval workflow for new users

### 2. Real-Time Emergency Response

#### SOS System
- **Location Capture**: GPS coordinates on SOS trigger
- **Auto-Dial**: Emergency numbers (112, police, etc.)
- **Notification Fan-out**: Alerts to parents, teachers, admins
- **Socket Events**: `SOS_ALERT`, `SOS_SAFE`
- **Status Tracking**: Active/resolved SOS alerts

#### IoT Integration
- **Device Telemetry**: Real-time sensor data
- **Alert Triggers**: Fire, smoke, earthquake sensors
- **Device Health Monitoring**: Battery, connectivity status
- **MQTT Communication**: Bidirectional device communication
- **Alert Pipeline**: Automatic alert creation from IoT events

#### Drill Management
- **Drill Types**: Fire, Earthquake, Flood, Cyclone, Stampede, Medical
- **Drill Lifecycle**: Scheduled → Active → Completed
- **Real-Time Updates**: Socket events for drill status
- **Preparedness Steps**: 3-step guidance for students
- **Performance Tracking**: Completion rates, timing

### 3. Communication System

#### Broadcast Messages
- **Recipient Types**: All, Students, Teachers, Parents, Admins, Custom
- **Channels**: Push, SMS, Email
- **Priority Levels**: Low, Medium, High, Urgent
- **Template System**: Pre-defined message templates
- **Delivery Tracking**: Read receipts, delivery status

#### Notifications
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Email Notifications**: SendGrid (primary), SMTP (fallback)
- **SMS Notifications**: Twilio (optional)
- **In-App Notifications**: Toast, modal, full-screen alerts
- **Browser Notifications**: Web push notifications

### 4. Learning & Education

#### Modules
- **Module Types**: NDMA, NDRF, Hearing Impaired, Interactive
- **Content Types**: Text, Images, Videos, 360° Images, AR Scenarios
- **Multi-Language**: English, Hindi, Marathi, Punjabi
- **Difficulty Levels**: Beginner, Intermediate, Advanced
- **Age-Based Filtering**: Grade-specific content
- **Progress Tracking**: Completion status, time spent

#### Quizzes
- **AI-Generated Quizzes**: Google Gemini AI integration
- **Question Types**: MCQ, True/False, Image-based
- **Adaptive Difficulty**: Adjusts based on performance
- **Offline Support**: Cached quizzes for offline access
- **Multi-Language**: Quiz content in multiple languages

#### Games
- **Bag Packer**: Drag-and-drop emergency kit packing
- **Hazard Hunter**: Identify hazards in environment
- **Earthquake Shake**: Shake detection and response
- **Group Mode**: Multi-student collaborative gameplay
- **Scoring System**: XP, badges, leaderboards
- **Offline Play**: Games work without internet

### 5. Gamification

#### Scoring System
- **XP Points**: Earned from modules, quizzes, games
- **Preparedness Score**: Overall safety readiness
- **Badge System**: Achievement badges for milestones
- **Leaderboards**: School-wide, class-wide rankings
- **Certificates**: Digital certificates for completion

#### Achievements
- **Module Completion**: Badges for finishing modules
- **Quiz Master**: High quiz scores
- **Game Champion**: Top game scores
- **Drill Participation**: Regular drill attendance
- **Emergency Response**: Quick SOS response

### 6. Maps & Navigation

#### Web Maps (Mapbox)
- **Device Markers**: Real-time IoT device locations
- **Blueprint Overlay**: Floor plans on maps
- **Alert Visualization**: Alert locations on map
- **Interactive Controls**: Zoom, pan, toggle layers

#### Mobile Maps (Google Maps)
- **Student Location**: Real-time tracking (parent view)
- **Safe Zones**: Marked evacuation areas
- **AR Navigation**: Augmented reality routes
- **Offline Maps**: Cached map tiles

### 7. Analytics & Reporting

#### Dashboards
- **Admin Dashboard**: Institution-wide metrics
- **Teacher Dashboard**: Class performance, student progress
- **Parent Dashboard**: Child activity, location, alerts
- **Student Dashboard**: Personal progress, achievements

#### Metrics
- **Drill Performance**: Completion rates, timing
- **Alert Statistics**: Alert frequency, response times
- **Learning Analytics**: Module completion, quiz scores
- **Game Statistics**: Scores, play frequency
- **Device Health**: IoT device status, uptime

#### Reports
- **PDF Reports**: Drill reports, performance reports
- **Excel Export**: Data export for analysis
- **CSV Export**: Bulk data export
- **Custom Reports**: Filtered, date-range reports

### 8. Parent Features

#### Child Monitoring
- **Location Tracking**: Real-time GPS location
- **Activity Log**: Learning, game, drill activity
- **Progress Reports**: Academic and safety progress
- **Alert Notifications**: Emergency alerts, SOS alerts

#### QR Code Linking
- **QR Generation**: Generate QR codes for child linking
- **QR Scanning**: Scan student QR to link accounts
- **Verification**: Admin/teacher approval for links

### 9. AR Features

#### AR Navigation
- **Evacuation Routes**: AR-guided paths to exits
- **Waypoint Marking**: Mark safe zones in AR
- **Compass Fallback**: Direction guidance when AR unavailable

#### AR Simulations
- **Fire Simulation**: AR fire scenarios for training
- **Hazard Visualization**: AR hazard overlays

### 10. Offline Support

#### Mobile Offline
- **Content Caching**: Modules, quizzes cached locally
- **Game State**: Offline game play and scoring
- **Sync Queue**: Background sync when online
- **Conflict Resolution**: Last-write-wins strategy

#### Web Offline
- **Service Workers**: PWA support (partial)
- **Local Storage**: User preferences, cache

### 11. Security & Compliance

#### Security Features
- **Encryption**: AES-256-GCM for sensitive data
- **Rate Limiting**: API rate limits
- **Input Validation**: Sanitization, validation
- **Audit Logging**: All actions logged
- **GDPR Compliance**: Data export, deletion

#### Authentication Security
- **JWT Tokens**: Secure token-based auth
- **Refresh Tokens**: Long-lived refresh tokens
- **Password Hashing**: Bcrypt with salt rounds
- **Session Management**: Secure session handling

---

## 🔑 API Keys & Environment Variables

### Backend Environment Variables

#### Required Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kavach

# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Encryption Key (RECOMMENDED - prevents data loss on restart)
ENCRYPTION_KEY=64-character-hex-encryption-key
```

#### Optional Variables

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Firebase Configuration
FIREBASE_SERVER_KEY=your-firebase-server-key
FIREBASE_SERVICE_ACCOUNT=path/to/service-account.json

# MQTT Configuration (IoT)
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USER=your-mqtt-username
MQTT_PASS=your-mqtt-password

# AWS S3 Configuration (File Storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=kavach-uploads
AWS_REGION=ap-south-1

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Email Configuration (SendGrid - Primary)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@kavach.com
SENDGRID_FROM_NAME=Kavach

# Email Configuration (SMTP - Fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Kavach Security <noreply@kavach.com>

# SMS Configuration (Twilio - Optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# CORS Origins
CORS_ORIGIN=http://localhost:3001,http://localhost:3000

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3001

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# QR Code Secret
QR_CODE_SECRET=your-qr-code-secret
```

### Web Environment Variables

```env
# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Mapbox (Web Maps)
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-access-token

# Firebase (Web Push)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Mobile Environment Variables

```env
# API Configuration
API_BASE_URL=http://localhost:3000
SOCKET_URL=http://localhost:3000

# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

### API Key Setup Guide

1. **Firebase**: Create project at https://console.firebase.google.com
   - Enable Cloud Messaging
   - Download service account JSON
   - Get web config for frontend

2. **Google Maps**: Get API key from https://console.cloud.google.com
   - Enable Maps SDK for Android/iOS
   - Enable Maps JavaScript API for web
   - Restrict API key to your domains

3. **Mapbox**: Get token from https://account.mapbox.com
   - Create access token
   - Use for web maps

4. **SendGrid**: Sign up at https://sendgrid.com
   - Create API key
   - Verify sender email

5. **Gemini AI**: Get API key from https://makersuite.google.com/app/apikey
   - Enable Gemini API
   - Copy API key

6. **Twilio** (Optional): Sign up at https://www.twilio.com
   - Get Account SID and Auth Token
   - Purchase phone number

---

## 🗄️ Database Schema

### Core Models

#### User Model
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed),
  role: ['system_admin', 'admin', 'teacher', 'student', 'parent'],
  firstName: String,
  lastName: String,
  phone: String,
  institutionId: ObjectId (ref: School),
  classId: ObjectId (ref: Class) [for students],
  deviceToken: String (FCM token),
  approvalStatus: ['registered', 'pending', 'approved', 'rejected'],
  createdAt: Date,
  updatedAt: Date
}
```

#### School Model
```javascript
{
  _id: ObjectId,
  name: String,
  address: String,
  location: {
    type: 'Point',
    coordinates: [lng, lat]
  },
  adminId: ObjectId (ref: User),
  createdAt: Date
}
```

#### Class Model
```javascript
{
  _id: ObjectId,
  name: String,
  grade: String,
  institutionId: ObjectId (ref: School),
  teacherId: ObjectId (ref: User),
  studentIds: [ObjectId] (ref: User),
  createdAt: Date
}
```

#### Alert Model
```javascript
{
  _id: ObjectId,
  type: ['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'medical', 'sos', 'other'],
  severity: ['low', 'medium', 'high', 'critical'],
  title: String,
  description: String,
  location: {
    type: 'Point',
    coordinates: [lng, lat]
  },
  institutionId: ObjectId (ref: School),
  triggeredBy: ObjectId (ref: User),
  status: ['active', 'resolved', 'false_alarm'],
  metadata: {
    sos: Boolean,
    deviceId: ObjectId,
    drillId: ObjectId
  },
  createdAt: Date,
  resolvedAt: Date
}
```

#### Drill Model
```javascript
{
  _id: ObjectId,
  type: ['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'medical'],
  status: ['scheduled', 'active', 'completed'],
  institutionId: ObjectId (ref: School),
  createdBy: ObjectId (ref: User),
  scheduledAt: Date,
  startedAt: Date,
  completedAt: Date,
  participants: [ObjectId] (ref: User),
  performance: {
    averageTime: Number,
    completionRate: Number
  }
}
```

#### Module Model
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String,
  difficulty: ['beginner', 'intermediate', 'advanced'],
  content: {
    sections: [{
      type: ['text', 'image', 'video', '360', 'ar'],
      content: String,
      mediaUrl: String
    }]
  },
  quiz: ObjectId (ref: Quiz),
  languages: [String],
  createdAt: Date
}
```

#### GameScore Model
```javascript
{
  _id: ObjectId,
  gameType: ['bag_packer', 'hazard_hunter', 'earthquake_shake'],
  userId: ObjectId (ref: User),
  score: Number,
  xp: Number,
  level: Number,
  isGroupMode: Boolean,
  groupId: ObjectId (ref: GroupActivity),
  metadata: Object,
  createdAt: Date
}
```

#### BroadcastMessage Model
```javascript
{
  _id: ObjectId,
  title: String,
  message: String,
  recipientType: ['all', 'students', 'teachers', 'parents', 'admins', 'custom'],
  recipientIds: [ObjectId] (ref: User),
  channels: ['push', 'sms', 'email'],
  priority: ['low', 'medium', 'high', 'urgent'],
  institutionId: ObjectId (ref: School),
  sentBy: ObjectId (ref: User),
  status: ['pending', 'sent', 'failed'],
  sentAt: Date,
  createdAt: Date
}
```

#### Device Model (IoT)
```javascript
{
  _id: ObjectId,
  deviceId: String (unique),
  name: String,
  type: ['fire_sensor', 'smoke_detector', 'earthquake_sensor', 'flood_sensor'],
  institutionId: ObjectId (ref: School),
  location: {
    type: 'Point',
    coordinates: [lng, lat]
  },
  status: ['active', 'inactive', 'maintenance'],
  lastSeen: Date,
  batteryLevel: Number,
  metadata: Object
}
```

#### IoTSensorTelemetry Model
```javascript
{
  _id: ObjectId,
  deviceId: ObjectId (ref: Device),
  sensorType: String,
  value: Number,
  unit: String,
  alertTriggered: Boolean,
  timestamp: Date
}
```

---

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login              - Login
POST   /api/auth/refresh            - Refresh token
POST   /api/auth/forgot-password    - Request password reset
POST   /api/auth/reset-password    - Reset password
GET    /api/auth/me                 - Get current user
```

### Users

```
GET    /api/users                   - List users (admin)
GET    /api/users/:id               - Get user details
PUT    /api/users/:id               - Update user
DELETE /api/users/:id               - Delete user
PUT    /api/users/:id/approve       - Approve user (admin)
PUT    /api/users/:id/reject        - Reject user (admin)
```

### Alerts

```
GET    /api/alerts                  - List alerts
POST   /api/alerts                  - Create alert
GET    /api/alerts/:id              - Get alert details
PUT    /api/alerts/:id/resolve     - Resolve alert
POST   /api/alerts/:id/cancel      - Cancel alert
```

### Drills

```
GET    /api/drills                  - List drills
POST   /api/drills                  - Create drill
GET    /api/drills/:id              - Get drill details
PUT    /api/drills/:id/start        - Start drill
PUT    /api/drills/:id/complete     - Complete drill
DELETE /api/drills/:id              - Delete drill
```

### Broadcasts

```
GET    /api/broadcast               - List broadcasts
POST   /api/broadcast               - Send broadcast
GET    /api/broadcast/:id           - Get broadcast details
```

### Modules

```
GET    /api/modules                 - List modules
POST   /api/modules                 - Create module (admin)
GET    /api/modules/:id             - Get module details
PUT    /api/modules/:id             - Update module
DELETE /api/modules/:id             - Delete module
GET    /api/modules/:id/progress    - Get user progress
```

### Games

```
GET    /api/games/scores            - List game scores
POST   /api/games/scores            - Submit game score
GET    /api/games/leaderboard       - Get leaderboard
GET    /api/games/items             - Get game items (bag packer)
```

### IoT Devices

```
GET    /api/devices                 - List devices
POST   /api/devices                 - Register device
GET    /api/devices/:id             - Get device details
GET    /api/devices/:id/telemetry   - Get device telemetry
PUT    /api/devices/:id             - Update device
DELETE /api/devices/:id             - Delete device
```

### Analytics

```
GET    /api/analytics/dashboard     - Dashboard metrics
GET    /api/analytics/drills        - Drill analytics
GET    /api/analytics/learning      - Learning analytics
GET    /api/analytics/games         - Game analytics
```

### Maps

```
GET    /api/maps/devices            - Get device locations
GET    /api/maps/blueprint          - Get blueprint data
GET    /api/maps/safe-zones         - Get safe zones
```

---

## 📡 Real-Time Communication

### Socket.io Events

#### Client → Server Events

```javascript
// Authentication
socket.emit('authenticate', { token: 'jwt-token' })

// Join school room
socket.emit('join_school', { schoolId: 'school-id' })

// SOS Alert
socket.emit('SOS_ALERT', {
  location: { lat: 0, lng: 0 },
  message: 'Help needed'
})

// SOS Safe
socket.emit('SOS_SAFE', { alertId: 'alert-id' })
```

#### Server → Client Events

```javascript
// Device Alert (IoT)
socket.on('DEVICE_ALERT', (data) => {
  // { deviceId, type, severity, location, message }
})

// Drill Start
socket.on('DRILL_START', (data) => {
  // { drillId, type, message }
})

// Drill Scheduled
socket.on('DRILL_SCHEDULED', (data) => {
  // { drillId, scheduledAt, type }
})

// SOS Alert
socket.on('SOS_ALERT', (data) => {
  // { userId, location, message, timestamp }
})

// SOS Safe
socket.on('SOS_SAFE', (data) => {
  // { userId, alertId }
})

// Telemetry Update
socket.on('TELEMETRY_UPDATE', (data) => {
  // { deviceId, telemetry }
})

// Broadcast Message
socket.on('BROADCAST_MESSAGE', (data) => {
  // { title, message, priority }
})
```

### Socket Rooms

- `school:{schoolId}` - School-specific room
- `class:{classId}` - Class-specific room
- `user:{userId}` - User-specific room

---

## 🚀 Deployment

### Backend Deployment

1. **Environment Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with production values
   ```

2. **Database Setup**
   - MongoDB Atlas cluster
   - Create database user
   - Whitelist IP addresses

3. **Start Server**
   ```bash
   npm start  # Production
   npm run dev  # Development
   ```

### Web Deployment

1. **Build**
   ```bash
   cd web
   npm install
   npm run build
   ```

2. **Start**
   ```bash
   npm start
   ```

3. **Deploy to Vercel/Netlify**
   - Connect GitHub repository
   - Set environment variables
   - Deploy

### Mobile Deployment

1. **Android**
   ```bash
   cd mobile
   flutter build apk --release
   ```

2. **iOS**
   ```bash
   flutter build ios --release
   ```

---

## 📁 File Structure

```
SIH2025/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Express middleware
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── socket/           # Socket.io handlers
│   │   ├── utils/            # Utility functions
│   │   └── server.js         # Entry point
│   ├── scripts/              # Utility scripts
│   ├── tests/                # Test files
│   ├── .env                  # Environment variables
│   └── package.json
│
├── web/
│   ├── app/                  # Next.js app directory
│   │   ├── admin/            # Admin pages
│   │   ├── dashboard/        # Dashboard page
│   │   ├── map/              # Map page
│   │   ├── broadcast/        # Broadcast page
│   │   └── ...
│   ├── lib/
│   │   ├── api/              # API clients
│   │   ├── services/         # Services
│   │   ├── store/             # State management
│   │   └── components/        # React components
│   ├── .env.local            # Environment variables
│   └── package.json
│
├── mobile/
│   ├── lib/
│   │   ├── core/             # Core utilities
│   │   ├── features/         # Feature modules
│   │   │   ├── auth/         # Authentication
│   │   │   ├── dashboard/    # Dashboard
│   │   │   ├── emergency/    # SOS & alerts
│   │   │   ├── games/        # Games
│   │   │   ├── modules/      # Learning modules
│   │   │   ├── maps/         # Maps
│   │   │   └── ...
│   │   └── main.dart         # Entry point
│   ├── assets/               # Assets (images, fonts, etc.)
│   ├── .env                  # Environment variables
│   └── pubspec.yaml
│
└── docs/                     # Documentation
```

---

## 📝 Additional Notes

### Development Workflow

1. **Backend**: Node.js + Express + MongoDB
2. **Web**: Next.js development server on port 3001
3. **Mobile**: Flutter development with hot reload
4. **Real-Time**: Socket.io for instant updates

### Testing

- Backend: Jest for unit/integration tests
- Web: Vitest for component tests
- Mobile: Flutter test framework

### Security Considerations

- All passwords hashed with bcrypt
- JWT tokens for authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js for security headers
- Encryption for sensitive data

### Performance Optimizations

- Redis caching for leaderboards
- MongoDB indexes on frequently queried fields
- Image optimization with Sharp
- Lazy loading for web components
- Offline support for mobile app

---

## 📞 Support & Contact

For issues, questions, or contributions, please refer to the project repository or contact the development team.

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready

