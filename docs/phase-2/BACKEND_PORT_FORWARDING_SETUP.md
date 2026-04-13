# 🔧 Backend Port Forwarding Setup

## ✅ **Backend Configured for VS Code Port Forwarding**

**Dev Tunnel URL**: `https://bnc51nt1-3000.inc1.devtunnels.ms/`

---

## 🔧 **Configuration Changes**

### **1. CORS Configuration**
- ✅ Added dev tunnel URL to allowed origins
- ✅ Configured to allow localhost (3000, 3001)
- ✅ Enabled credentials for cross-origin requests
- ✅ Added flexible origin checking for dev tunnels

### **2. Server Configuration**
- ✅ Set `trust proxy` to `true` (already configured)
- ✅ Changed host to `0.0.0.0` to listen on all interfaces
- ✅ Added dev tunnel URL logging

### **3. Socket.io Configuration**
- ✅ Updated CORS for Socket.io to allow dev tunnel
- ✅ Enabled credentials

### **4. Helmet Configuration**
- ✅ Disabled strict CSP for dev tunnels
- ✅ Allowed iframes and cross-origin embeds

---

## 📝 **Files Modified**

1. **`backend/src/server.js`**:
   - Updated CORS configuration
   - Updated Socket.io CORS
   - Updated Helmet configuration
   - Added dev tunnel URL to logging
   - Changed host to `0.0.0.0`

---

## 🚀 **How to Use**

### **Start Backend**
```bash
cd backend
npm run dev
```

### **Access Backend**
- **Local**: `http://localhost:3000`
- **Dev Tunnel**: `https://bnc51nt1-3000.inc1.devtunnels.ms`
- **Health Check**: `https://bnc51nt1-3000.inc1.devtunnels.ms/health`

### **Update Client Apps**

**Mobile App** (`.env`):
```
API_BASE_URL=https://bnc51nt1-3000.inc1.devtunnels.ms/api
```

**Web App** (`.env.local`):
```
NEXT_PUBLIC_API_URL=https://bnc51nt1-3000.inc1.devtunnels.ms/api
```

---

## ✅ **What's Fixed**

1. ✅ CORS allows dev tunnel URL
2. ✅ Trust proxy enabled for port forwarding
3. ✅ Server listens on all interfaces (0.0.0.0)
4. ✅ Socket.io configured for dev tunnel
5. ✅ Helmet configured for dev tunnels
6. ✅ All endpoints accessible via dev tunnel

---

## 🎯 **Testing**

### **Test Health Endpoint**
```bash
curl https://bnc51nt1-3000.inc1.devtunnels.ms/health
```

### **Test API Endpoint**
```bash
curl https://bnc51nt1-3000.inc1.devtunnels.ms/api
```

---

**✅ Backend is now fully configured for port forwarding!**

