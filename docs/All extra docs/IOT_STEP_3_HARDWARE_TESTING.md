# ✅ Step 3: Hardware Testing Guide

**Date:** December 8, 2025  
**Status:** 📋 **READY FOR TESTING**

---

## 🎯 **PRE-TESTING CHECKLIST**

### **Before Uploading Code:**

- [ ] Arduino IDE installed
- [ ] ESP32 board support installed
- [ ] Required libraries installed:
  - [ ] ArduinoJson
  - [ ] Adafruit MPU6050
- [ ] Wi-Fi credentials configured
- [ ] Backend URL configured
- [ ] Device ID configured
- [ ] Institution ID configured
- [ ] Device pre-registered (or registration script ready)

---

## 📚 **LIBRARY INSTALLATION**

### **1. Install ArduinoJson:**
1. Open Arduino IDE
2. Go to **Tools → Manage Libraries**
3. Search: `ArduinoJson`
4. Install: **ArduinoJson by Benoit Blanchon** (v6.22.0 or v7.x)

### **2. Install Adafruit MPU6050:**
1. Go to **Tools → Manage Libraries**
2. Search: `Adafruit MPU6050`
3. Install: **Adafruit MPU6050** (latest version)
4. Also install: **Adafruit Unified Sensor** (dependency)

---

## ⚙️ **CODE CONFIGURATION**

### **1. Open Enhanced Code:**
- File: `arduino/esp_code_integrated.ino`

### **2. Configure Wi-Fi:**
```cpp
const char* WIFI_SSID = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPassword";
```

### **3. Configure Backend:**
```cpp
const char* BACKEND_URL = "http://192.168.1.100:3000";  // Your backend IP
// OR
const char* BACKEND_URL = "http://your-domain.com:3000"; // Your backend domain
```

### **4. Configure Device:**
```cpp
const char* DEVICE_ID = "KAV-NODE-001";
const char* DEVICE_NAME = "Chemistry Lab Safety Node";
const char* INSTITUTION_ID = "507f1f77bcf86cd799439011";  // Your school MongoDB ID
const char* ROOM = "Chemistry Lab";
```

---

## 📤 **UPLOAD CODE**

### **1. Select Board:**
- **Tools → Board → ESP32 Dev Module**

### **2. Select Port:**
- **Tools → Port → COMx** (Windows) or `/dev/ttyUSBx` (Linux/Mac)

### **3. Upload:**
- Click **Upload** button
- Wait for compilation and upload
- Watch for "Done uploading" message

---

## 🔍 **MONITOR SERIAL OUTPUT**

### **1. Open Serial Monitor:**
- **Tools → Serial Monitor**
- Set baud rate: **115200**

### **2. Expected Output:**
```
--- KAVACH SYSTEM BOOTING ---
Initializing Sensors... ✅ MPU6050 Connected.
✅ MPU6050 Connected.
Connecting to Wi-Fi: YourWiFiName
✅ Wi-Fi Connected!
IP Address: 192.168.1.100
Registering device with backend...
✅ Device registered successfully!
Token: abc123...
✅ System Ready. Monitoring Environment...
[SAFE] Monitoring...
✅ Telemetry sent successfully
```

---

## 🧪 **TESTING PROCEDURES**

### **Test 1: Wi-Fi Connection**
- [ ] ESP32 connects to Wi-Fi
- [ ] IP address displayed
- [ ] Connection stable

### **Test 2: Device Registration**
- [ ] Device registration successful
- [ ] Token received and stored
- [ ] OR: Pre-registered device token loaded

### **Test 3: Telemetry Sending**
- [ ] "✅ Telemetry sent successfully" appears every 10 seconds
- [ ] No HTTP errors
- [ ] Backend receives telemetry

### **Test 4: Fire Detection**
- [ ] Bring flame near sensor
- [ ] Buzzer activates (fast strobe)
- [ ] Serial shows "🔥🔥 CRITICAL: FIRE DETECTED!"
- [ ] Alert sent to backend
- [ ] Backend creates fire alert

### **Test 5: Flood Detection**
- [ ] Increase water level (submerge sensor)
- [ ] Buzzer activates (long beep)
- [ ] Serial shows "🌊 FLOOD ALERT!"
- [ ] Alert sent to backend
- [ ] Backend creates flood alert

### **Test 6: Earthquake Detection**
- [ ] Shake device vigorously
- [ ] Serial shows "⚠️ SHAKING DETECTED!"
- [ ] Buzzer remains silent (silent mode)
- [ ] Alert sent to backend
- [ ] Backend creates earthquake alert

### **Test 7: Wi-Fi Reconnection**
- [ ] Disconnect Wi-Fi router
- [ ] ESP32 detects disconnection
- [ ] Reconnect router
- [ ] ESP32 reconnects automatically
- [ ] Telemetry resumes

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Wi-Fi Connection Failed**
**Symptoms:** "❌ Wi-Fi Connection Failed!"
**Solutions:**
- Check SSID and password
- Ensure Wi-Fi is 2.4GHz (ESP32 doesn't support 5GHz)
- Check signal strength
- Try moving closer to router

### **Issue: Device Registration Failed**
**Symptoms:** "❌ Registration failed. HTTP Code: 401"
**Solutions:**
- Device registration requires admin authentication
- Pre-register device using admin dashboard or registration script
- Or set deviceToken manually in code

### **Issue: Telemetry Not Sending**
**Symptoms:** No "✅ Telemetry sent successfully" messages
**Solutions:**
- Check device token is set
- Verify backend URL is correct
- Check backend is running
- Verify network connectivity
- Check HTTP response code in Serial Monitor

### **Issue: MPU6050 Not Found**
**Symptoms:** "❌ FAILED: MPU6050 not found"
**Solutions:**
- Check I2C wiring (SDA=GPIO 21, SCL=GPIO 22)
- Verify MPU6050 power (3.3V)
- Check I2C pull-up resistors
- Try different I2C address

### **Issue: Compilation Errors**
**Symptoms:** Arduino IDE shows errors
**Solutions:**
- Install missing libraries
- Check ESP32 board support is installed
- Verify Arduino IDE version (1.8.19+)
- Check for syntax errors

---

## ✅ **SUCCESS CRITERIA**

### **Hardware:**
- [x] ESP32 boots correctly
- [x] All sensors read correctly
- [x] Buzzer activates on fire/flood
- [x] Buzzer silent on earthquake

### **Communication:**
- [x] Wi-Fi connects successfully
- [x] Device registered (or token loaded)
- [x] Telemetry sent every 10 seconds
- [x] Alerts sent on detection

### **Backend:**
- [x] Device appears in admin dashboard
- [x] Telemetry received in backend
- [x] Alerts created in backend
- [x] Socket.io broadcasting works

---

## 🚀 **NEXT STEP: Step 4 - Backend Verification**

After successful hardware testing:
1. Verify device in admin dashboard
2. Check telemetry data
3. Verify alerts are created
4. Test Socket.io real-time updates

---

**Status:** 📋 **READY FOR TESTING**  
**Next:** Test hardware and verify backend communication

