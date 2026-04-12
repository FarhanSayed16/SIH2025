# 🧪 Phase 1.4.1: Testing Phase

## ✅ Testing Checklist

Follow these steps in order to test everything we've built:

---

## 📋 Step-by-Step Testing

### **STEP 1: MongoDB Setup** ⏱️ 5 minutes

**Option A: MongoDB Atlas (Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up → Create FREE cluster
3. Database Access → Add user → Save password
4. Network Access → Allow from anywhere
5. Database → Connect → Copy connection string

**Option B: Local MongoDB**
- Install MongoDB locally
- Connection string: `mongodb://localhost:27017/kavach`

---

### **STEP 2: Environment Setup** ⏱️ 2 minutes

```bash
cd backend
cp env.example .env
```

**Edit `.env` file**:
```env
MONGODB_URI=your-connection-string-here
JWT_SECRET=your-super-secret-key-at-least-32-characters
```

---

### **STEP 3: Install Dependencies** ⏱️ 2 minutes

```bash
npm install
```

---

### **STEP 4: Test Connection** ⏱️ 30 seconds

```bash
npm run test:connection
```

**Expected**: `✅ MongoDB Connected Successfully!`

---

### **STEP 5: Start Server** ⏱️ 30 seconds

```bash
npm run dev
```

**Expected Output**:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
🚀 Kavach Backend running on port 3000
📡 Socket.io server ready
```

**Keep this terminal open!**

---

### **STEP 6: Test Health Endpoint** ⏱️ 30 seconds

**Open new terminal** and run:
```bash
curl http://localhost:3000/health
```

**Expected Response**:
```json
{
  "status": "OK",
  "db": "connected"
}
```

✅ **If you see `"db": "connected"`, MongoDB is working!**

---

### **STEP 7: Seed Database** ⏱️ 1 minute

```bash
npm run seed
```

**Expected Output**:
```
✅ Created school: Delhi Public School
✅ Created admin: admin@kavach.com
✅ Created 3 students
✅ Created teacher: teacher@kavach.com
✅ Created 2 learning modules
✅ Created scheduled drill
✅ Created IoT device

📊 Seed Summary:
   - Schools: 1
   - Users: 5
   - Modules: 2
   - Drills: 1
   - Devices: 1

✅ Database seeded successfully!
```

✅ **If seed completes, all models are working!**

---

### **STEP 8: Test Authentication** ⏱️ 2 minutes

**Test Registration**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\",\"name\":\"Test User\",\"role\":\"student\"}"
```

**Expected**: JSON response with `accessToken` and `refreshToken`

**Test Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
```

**Save the `accessToken` from response!**

**Test Protected Route** (replace YOUR_TOKEN):
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

✅ **If profile returns user data, authentication works!**

---

### **STEP 9: Test Geospatial API (Add-on 1)** ⏱️ 30 seconds

```bash
curl "http://localhost:3000/api/schools/nearest?lat=28.6139&lng=77.2090&radius=5000"
```

**Expected**: JSON with schools array

✅ **If schools are returned, geospatial queries work!**

---

### **STEP 10: Test Other APIs** ⏱️ 2 minutes

**List Schools**:
```bash
curl http://localhost:3000/api/schools
```

**List Modules**:
```bash
curl http://localhost:3000/api/modules
```

**List Drills** (requires token):
```bash
curl -X GET http://localhost:3000/api/drills \
  -H "Authorization: Bearer YOUR_TOKEN"
```

✅ **If all return data, APIs are working!**

---

### **STEP 11: Run Automated Tests** ⏱️ 1 minute

**Windows (PowerShell)**:
```powershell
.\scripts\test-apis.ps1
```

**Linux/Mac**:
```bash
chmod +x scripts/test-apis.sh
./scripts/test-apis.sh
```

**Expected**: All tests show ✅ green checkmarks

---

## ✅ Final Checklist

Before moving to Phase 1.5, verify:

- [ ] MongoDB connection successful
- [ ] Health endpoint shows `"db": "connected"`
- [ ] Seed script completed successfully
- [ ] User registration works
- [ ] User login works
- [ ] Protected route works with token
- [ ] Geospatial nearest endpoint works
- [ ] At least 3 other APIs work

---

## 🐛 Common Issues & Fixes

### **MongoDB Connection Failed**
- ✅ Check password in connection string
- ✅ Verify network access in Atlas
- ✅ Ensure cluster is running

### **Port Already in Use**
- ✅ Change `PORT=3001` in `.env`
- ✅ Or kill process using port 3000

### **Seed Script Fails**
- ✅ Clear database first
- ✅ Check MongoDB connection

---

## 📚 Detailed Guides

- **Complete Guide**: `docs/PHASE_1.4.1_TESTING_GUIDE.md`
- **Quick Start**: `backend/TESTING_QUICK_START.md`
- **Connection Test**: `npm run test:connection`

---

## 🎯 Next Steps

**Once all tests pass:**
→ Proceed to **Phase 1.5: Socket.io Real-time Engine**

**If issues found:**
→ Fix them first, then proceed

---

**Status**: Ready for Testing
**Estimated Time**: 15-20 minutes

