# 🧪 Phase 1.4.1: Testing & Verification Guide

## 📋 Overview

This guide will help you test all components built in Phase 1.0 through Phase 1.4, including:
- Database connection (MongoDB)
- Models and seed script
- Authentication system
- All REST APIs
- Geospatial queries (Add-on 1)
- Sync endpoint (Add-on 2)

---

## 🔧 Step 1: MongoDB Setup

### **Option A: MongoDB Atlas (Recommended - Free & Easy)**

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free account

2. **Create Cluster**
   - Click "Build a Database"
   - Choose **FREE** tier (M0 Sandbox)
   - Select region closest to you (e.g., Mumbai for India)
   - Click "Create"

3. **Create Database User**
   - Go to "Database Access" → "Add New Database User"
   - Username: `kavach-admin` (or your choice)
   - Password: Generate secure password (save it!)
   - Database User Privileges: "Atlas admin"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with `kavach` (or keep default)

**Example Connection String**:
```
mongodb+srv://kavach-admin:YourPassword123@cluster0.xxxxx.mongodb.net/kavach?retryWrites=true&w=majority
```

### **Option B: Local MongoDB**

1. **Install MongoDB**
   - Download from: https://www.mongodb.com/try/download/community
   - Install MongoDB Community Server
   - Start MongoDB service

2. **Connection String**
   ```
   mongodb://localhost:27017/kavach
   ```

---

## ⚙️ Step 2: Environment Configuration

### **Create `.env` File**

1. Navigate to `backend` folder
2. Copy the example file:
   ```bash
   cd backend
   cp env.example .env
   ```

3. **Edit `.env` file** with your values:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kavach?retryWrites=true&w=majority
# OR for local: mongodb://localhost:27017/kavach

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# CORS Origins
CORS_ORIGIN=http://localhost:3001,http://localhost:3000

# Redis (Optional - can skip for now)
REDIS_URL=redis://localhost:6379

# Firebase (Optional - for Phase 2)
FIREBASE_SERVER_KEY=your-firebase-key

# MQTT (Optional - for IoT)
MQTT_HOST=localhost
MQTT_PORT=1883

# Google Maps (Optional)
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

**Important**: 
- Replace `MONGODB_URI` with your actual connection string
- Generate a strong `JWT_SECRET` (at least 32 characters)
- You can skip optional fields for now

---

## 📦 Step 3: Install Dependencies

```bash
cd backend
npm install
```

This will install all required packages.

---

## 🗄️ Step 4: Test Database Connection

### **Test 1: Basic Connection**

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Expected Output**:
   ```
   ✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
   🚀 Kavach Backend running on port 3000
   📡 Socket.io server ready
   🌍 Environment: development
   ```

3. **Test Health Endpoint**:
   ```bash
   curl http://localhost:3000/health
   ```

   **Expected Response**:
   ```json
   {
     "status": "OK",
     "message": "Kavach API is running",
     "timestamp": "2024-01-01T10:00:00.000Z",
     "db": "connected"
   }
   ```

   ✅ **If you see `"db": "connected"`, MongoDB connection is working!**

---

## 🌱 Step 5: Seed Database

### **Run Seed Script**

```bash
cd backend
npm run seed
```

**Expected Output**:
```
✅ MongoDB Connected for seeding
🗑️  Database cleared
✅ Created school: Delhi Public School (ID: ...)
✅ Created admin: admin@kavach.com
✅ Created 3 students
✅ Created teacher: teacher@kavach.com
✅ Created 2 learning modules
✅ Created scheduled drill: fire (ID: ...)
✅ Created IoT device: Chemistry Lab Fire Sensor (ID: ...)

📊 Seed Summary:
   - Schools: 1
   - Users: 5 (1 admin, 3 students, 1 teacher)
   - Modules: 2
   - Drills: 1 (scheduled)
   - Devices: 1 (fire sensor)

✅ Database seeded successfully!
```

✅ **If seed runs successfully, all models are working!**

---

## 🔐 Step 6: Test Authentication

### **Test 1: Register User**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User",
    "role": "student"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "email": "test@example.com",
      "name": "Test User",
      "role": "student"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

✅ **Save the `accessToken` for next tests!**

### **Test 2: Login**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

**Expected**: Same response format with tokens

### **Test 3: Get Profile (Protected Route)**

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": { ... }
  }
}
```

✅ **If this works, authentication is working!**

---

## 🌍 Step 7: Test Geospatial API (Add-on 1)

### **Test Nearest Schools**

```bash
curl "http://localhost:3000/api/schools/nearest?lat=28.6139&lng=77.2090&radius=5000"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Nearest schools retrieved successfully",
  "data": {
    "schools": [
      {
        "_id": "...",
        "name": "Delhi Public School",
        "address": "...",
        "location": {
          "type": "Point",
          "coordinates": [77.2090, 28.6139]
        }
      }
    ],
    "query": {
      "location": { "lat": 28.6139, "lng": 77.2090 },
      "radius": 5000,
      "count": 1
    }
  }
}
```

✅ **If you see schools returned, geospatial queries are working!**

---

## 🔄 Step 8: Test Sync Endpoint (Add-on 2)

### **Get Access Token First**

```bash
# Login to get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

echo $TOKEN
```

### **Test Sync**

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quizzes": [
      {
        "moduleId": "MODULE_ID_FROM_SEED",
        "score": 85,
        "completedAt": "2024-01-01T10:00:00Z",
        "answers": []
      }
    ],
    "drillLogs": [
      {
        "drillId": "DRILL_ID_FROM_SEED",
        "evacuationTime": 120,
        "completedAt": "2024-01-01T10:00:00Z"
      }
    ]
  }'
```

**Note**: Replace `MODULE_ID_FROM_SEED` and `DRILL_ID_FROM_SEED` with actual IDs from seed data.

**Expected Response**:
```json
{
  "success": true,
  "message": "Sync completed successfully",
  "data": {
    "quizzes": { "synced": 1, "failed": 0 },
    "drillLogs": { "synced": 1, "failed": 0 },
    "conflicts": [],
    "message": "Synced 2 items successfully"
  }
}
```

✅ **If sync works, offline data sync is working!**

---

## 📋 Step 9: Test All APIs

### **Quick Test Checklist**

Use these commands to test each endpoint:

#### **Schools**
```bash
# List schools
curl http://localhost:3000/api/schools

# Get school by ID
curl http://localhost:3000/api/schools/SCHOOL_ID

# Nearest schools (tested above)
```

#### **Drills**
```bash
# List drills (requires auth)
curl -X GET http://localhost:3000/api/drills \
  -H "Authorization: Bearer $TOKEN"

# Get drill by ID
curl -X GET http://localhost:3000/api/drills/DRILL_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### **Modules**
```bash
# List modules
curl http://localhost:3000/api/modules

# Get module by ID
curl http://localhost:3000/api/modules/MODULE_ID
```

#### **Leaderboard**
```bash
# Get leaderboard
curl "http://localhost:3000/api/leaderboard?schoolId=SCHOOL_ID&type=overall"
```

---

## 🐛 Troubleshooting

### **Issue: MongoDB Connection Failed**

**Error**: `MongoServerError: Authentication failed`

**Solution**:
- Check username/password in connection string
- Ensure password is URL-encoded (replace special chars with % encoding)
- Verify database user has correct permissions

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution**:
- Check if MongoDB service is running (local)
- Verify network access in Atlas (if using Atlas)
- Check firewall settings

### **Issue: JWT Secret Error**

**Error**: `jwt malformed` or `invalid signature`

**Solution**:
- Ensure `JWT_SECRET` is set in `.env`
- Use a strong secret (32+ characters)
- Restart server after changing `.env`

### **Issue: Port Already in Use**

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change PORT in .env
```

### **Issue: Seed Script Fails**

**Error**: `ValidationError` or duplicate key

**Solution**:
- Clear database first: `mongo kavach --eval "db.dropDatabase()"`
- Or delete collections manually
- Run seed again

---

## ✅ Testing Checklist

Before moving to Phase 1.5, verify:

- [ ] MongoDB connection successful
- [ ] Health endpoint returns `"db": "connected"`
- [ ] Seed script runs without errors
- [ ] User registration works
- [ ] User login works
- [ ] Protected route (profile) works with token
- [ ] Geospatial nearest endpoint works
- [ ] Sync endpoint accepts and processes data
- [ ] At least 2-3 other APIs work (schools, drills, modules)

---

## 📝 Test Results Template

Document your test results:

```
Phase 1.4.1 Test Results
=========================

Date: ___________

MongoDB Connection: [ ] Pass [ ] Fail
Seed Script: [ ] Pass [ ] Fail
Authentication: [ ] Pass [ ] Fail
Geospatial API: [ ] Pass [ ] Fail
Sync Endpoint: [ ] Pass [ ] Fail
Other APIs: [ ] Pass [ ] Fail

Issues Found:
- 
- 

Notes:
- 
- 
```

---

## 🚀 Next Steps

Once all tests pass:

1. ✅ **If all tests pass** → Move to Phase 1.5 (Socket.io)
2. ⚠️ **If issues found** → Fix them first, then proceed

---

**Last Updated**: Phase 1.4.1 Testing Guide
**Status**: Ready for Testing

