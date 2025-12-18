# 🚀 Quick Start Testing Guide

## ⚡ Fast Track (5 Minutes)

### **1. Set Up MongoDB Atlas (2 minutes)**

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up → Create FREE cluster
3. Database Access → Add user (save password!)
4. Network Access → Allow from anywhere
5. Database → Connect → Copy connection string

### **2. Configure Environment (1 minute)**

```bash
cd backend
cp env.example .env
```

Edit `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kavach?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key-min-32-characters-long
```

### **3. Install & Run (1 minute)**

```bash
npm install
npm run dev
```

**Check**: Should see `✅ MongoDB Connected`

### **4. Test Health (30 seconds)**

```bash
curl http://localhost:3000/health
```

**Expected**: `"db": "connected"`

### **5. Seed Database (1 minute)**

```bash
npm run seed
```

**Check**: Should see seed summary with all data created

---

## ✅ Success Indicators

- ✅ Server starts without errors
- ✅ Health endpoint shows `"db": "connected"`
- ✅ Seed script completes successfully
- ✅ Can register/login users
- ✅ Can access protected routes

---

## 🐛 Quick Fixes

**Connection Failed?**
- Check password in connection string
- Verify network access in Atlas
- Ensure cluster is running

**Port in Use?**
- Change `PORT=3001` in `.env`
- Or kill process: `taskkill /PID <PID> /F`

**Seed Fails?**
- Clear database and try again
- Check MongoDB connection first

---

**Need Help?** See `docs/PHASE_1.4.1_TESTING_GUIDE.md` for detailed guide.

