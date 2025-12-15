# 📝 Device Registration Guide for ESP32

## ⚠️ **IMPORTANT: Device Registration**

The ESP32 code requires a **device token** to communicate with the backend. Device registration requires **admin authentication**.

---

## 🔧 **OPTION 1: Pre-Register Device via Admin Dashboard** (Recommended)

### **Steps:**

1. **Log into Admin Dashboard**
   - Navigate to: `/admin/devices` or `/admin/iot-devices`
   - Click "Add New Device" or "Register Device"

2. **Fill Device Information:**
   ```
   Device ID: KAV-NODE-001
   Device Name: Chemistry Lab Safety Node
   Device Type: multi-sensor
   Institution: [Select your school]
   Room: Chemistry Lab
   ```

3. **Copy Device Token**
   - After registration, copy the `deviceToken`
   - This token will be used by ESP32

4. **Set Token in ESP32 Code:**
   ```cpp
   // Option A: Hardcode token (for testing)
   String deviceToken = "your-token-here";
   
   // Option B: Use Preferences (already implemented)
   // Token will be stored automatically after first registration
   ```

---

## 🔧 **OPTION 2: Register via API** (Using Admin Token)

### **Using cURL:**
```bash
curl -X POST http://your-server:3000/api/devices/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "deviceId": "KAV-NODE-001",
    "deviceName": "Chemistry Lab Safety Node",
    "deviceType": "multi-sensor",
    "institutionId": "your-school-id",
    "room": "Chemistry Lab",
    "configuration": {
      "sensors": {
        "fire": {"enabled": true, "pin": 35},
        "water": {"enabled": true, "pin": 33},
        "earthquake": {"enabled": true}
      },
      "thresholds": {
        "waterWarning": 1500,
        "waterDanger": 2000,
        "earthquake": 2.5
      }
    }
  }'
```

### **Response:**
```json
{
  "success": true,
  "data": {
    "device": {...},
    "deviceToken": "abc123def456..."
  }
}
```

**Copy the `deviceToken` and set it in ESP32 code or store it in Preferences.**

---

## 🔧 **OPTION 3: Modify Code to Use Pre-Set Token**

If you already have a device token, you can set it directly:

```cpp
// In setup() function, before registerDevice():
preferences.begin("kavach", false);
preferences.putString("deviceToken", "your-token-here");
preferences.end();
deviceToken = "your-token-here";
```

---

## 📋 **QUICK REGISTRATION CHECKLIST**

- [ ] Device registered in admin dashboard
- [ ] Device token copied
- [ ] Token set in ESP32 code (or will be stored automatically)
- [ ] Institution ID configured in ESP32 code
- [ ] Backend URL configured in ESP32 code
- [ ] Wi-Fi credentials configured

---

## 🚀 **AFTER REGISTRATION**

Once device is registered:
1. ESP32 will use stored token for all requests
2. Token persists after ESP32 reboot
3. If token is invalid, ESP32 will attempt re-registration
4. All telemetry and alerts will use this token

---

**Note:** For production, consider creating a public registration endpoint for IoT devices with a registration key/secret.

