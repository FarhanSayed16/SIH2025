# 🔌 KAVACH IoT Node - Complete Integration Plan

**Date:** December 8, 2025  
**Status:** 📋 **INTEGRATION PLAN READY**  
**Hardware:** ESP32 + Flame Sensor + MPU6050 + Water Level + Buzzer

---

## 📋 **EXECUTIVE SUMMARY**

This document provides a **complete step-by-step plan** to integrate your working ESP32 code with the KAVACH backend system. Your current code handles local alerts (buzzer), and we need to add:

1. **Wi-Fi connectivity** to backend
2. **Device registration** with backend
3. **Telemetry sending** (sensor readings)
4. **Alert sending** (fire/flood/earthquake)
5. **Device authentication** (token-based)
6. **Error handling & retry logic**

---

## ✅ **PART 1: CURRENT STATE ANALYSIS**

### **1.1 Your Working Code Analysis**

**Current Features:**
- ✅ Flame sensor reading (GPIO 35)
- ✅ Water level sensor reading (GPIO 33)
- ✅ MPU6050 earthquake detection (I2C)
- ✅ Local buzzer alerts (GPIO 25)
- ✅ Priority-based alert logic (Fire > Flood > Earthquake)

**Current Limitations:**
- ❌ No Wi-Fi connection
- ❌ No backend communication
- ❌ No device registration
- ❌ No telemetry sending
- ❌ No alert reporting to backend
- ❌ No device authentication

**Hardware Configuration:**
```
Flame Sensor:    GPIO 35 (Digital Input)
Water Level:     GPIO 33 (Analog Input, 0-4095)
MPU6050:         GPIO 21 (SDA), GPIO 22 (SCL)
Buzzer:          GPIO 25 (Digital Output)
```

---

## 🔧 **PART 2: CODE ENHANCEMENTS REQUIRED**

### **2.1 Required Libraries**

Add to your Arduino code:
```cpp
#include <WiFi.h>              // ESP32 Wi-Fi
#include <HTTPClient.h>        // HTTP requests
#include <ArduinoJson.h>       // JSON parsing (v6 or v7)
#include <Preferences.h>       // Non-volatile storage (for device token)
```

**Install via Library Manager:**
- `ArduinoJson` by Benoit Blanchon (v6.22.0 or v7.x)

---

### **2.2 Configuration Variables**

Add to your code:
```cpp
// --- NETWORK CONFIGURATION ---
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_URL = "http://your-server:3000";  // Backend API URL
const char* API_VERSION = "/api";                      // API version

// --- DEVICE CONFIGURATION ---
const char* DEVICE_ID = "KAV-NODE-001";               // Unique device ID
const char* DEVICE_NAME = "Chemistry Lab Safety Node"; // Device name
const char* INSTITUTION_ID = "your-school-id";         // School/Institution ID
const char* ROOM = "Chemistry Lab";                    // Room location

// --- DEVICE AUTHENTICATION ---
String deviceToken = "";                              // Will be set after registration
Preferences preferences;                               // For storing token

// --- COMMUNICATION SETTINGS ---
const int TELEMETRY_INTERVAL = 10000;                 // Send telemetry every 10 seconds
const int ALERT_RETRY_DELAY = 5000;                   // Retry failed alerts after 5s
const int MAX_RETRIES = 3;                            // Max retry attempts
```

---

### **2.3 Wi-Fi Connection Function**

Add this function:
```cpp
bool connectToWiFi() {
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Wi-Fi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println("\n❌ Wi-Fi Connection Failed!");
    return false;
  }
}
```

---

### **2.4 Device Registration Function**

Add this function:
```cpp
bool registerDevice() {
  // Check if already registered
  preferences.begin("kavach", false);
  deviceToken = preferences.getString("deviceToken", "");
  preferences.end();
  
  if (deviceToken.length() > 0) {
    Serial.println("✅ Device already registered. Token found.");
    return true;
  }
  
  Serial.println("Registering device with backend...");
  
  HTTPClient http;
  String url = String(BACKEND_URL) + String(API_VERSION) + "/devices/register";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Create registration payload
  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["deviceName"] = DEVICE_NAME;
  doc["deviceType"] = "multi-sensor";
  doc["institutionId"] = INSTITUTION_ID;
  doc["room"] = ROOM;
  doc["configuration"] = JsonObject();
  doc["configuration"]["sensors"] = JsonObject();
  doc["configuration"]["sensors"]["fire"] = JsonObject();
  doc["configuration"]["sensors"]["fire"]["enabled"] = true;
  doc["configuration"]["sensors"]["fire"]["pin"] = PIN_FLAME;
  doc["configuration"]["sensors"]["water"] = JsonObject();
  doc["configuration"]["sensors"]["water"]["enabled"] = true;
  doc["configuration"]["sensors"]["water"]["pin"] = PIN_WATER;
  doc["configuration"]["sensors"]["earthquake"] = JsonObject();
  doc["configuration"]["sensors"]["earthquake"]["enabled"] = true;
  doc["configuration"]["thresholds"] = JsonObject();
  doc["configuration"]["thresholds"]["waterWarning"] = 1500;
  doc["configuration"]["thresholds"]["waterDanger"] = WATER_FLOOD_LEVEL;
  doc["configuration"]["thresholds"]["earthquake"] = EARTHQUAKE_G_FORCE;
  
  String payload;
  serializeJson(doc, payload);
  
  int httpCode = http.POST(payload);
  
  if (httpCode == 200 || httpCode == 201) {
    String response = http.getString();
    StaticJsonDocument<256> responseDoc;
    deserializeJson(responseDoc, response);
    
    if (responseDoc["data"] && responseDoc["data"]["deviceToken"]) {
      deviceToken = responseDoc["data"]["deviceToken"].as<String>();
      
      // Store token in preferences
      preferences.begin("kavach", false);
      preferences.putString("deviceToken", deviceToken);
      preferences.end();
      
      Serial.println("✅ Device registered successfully!");
      Serial.print("Token: ");
      Serial.println(deviceToken.substring(0, 20) + "...");
      http.end();
      return true;
    }
  }
  
  Serial.print("❌ Registration failed. HTTP Code: ");
  Serial.println(httpCode);
  http.end();
  return false;
}
```

---

### **2.5 Send Telemetry Function**

Add this function:
```cpp
bool sendTelemetry(int flameState, int waterLevel, float accelX, float accelY, float accelZ) {
  if (deviceToken.length() == 0) {
    Serial.println("⚠️ No device token. Cannot send telemetry.");
    return false;
  }
  
  HTTPClient http;
  String url = String(BACKEND_URL) + String(API_VERSION) + "/devices/" + String(DEVICE_ID) + "/telemetry";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", deviceToken);
  
  // Create telemetry payload
  StaticJsonDocument<512> doc;
  doc["readings"]["flame"] = (flameState == LOW);  // true if fire detected
  doc["readings"]["water"] = waterLevel;
  doc["readings"]["acceleration"]["x"] = accelX;
  doc["readings"]["acceleration"]["y"] = accelY;
  doc["readings"]["acceleration"]["z"] = accelZ;
  
  // Calculate magnitude
  float magnitude = sqrt(pow(accelX, 2) + pow(accelY, 2) + pow(accelZ, 2));
  doc["readings"]["magnitude"] = magnitude;
  doc["timestamp"] = millis();
  
  String payload;
  serializeJson(doc, payload);
  
  int httpCode = http.POST(payload);
  http.end();
  
  if (httpCode == 200 || httpCode == 201) {
    Serial.println("✅ Telemetry sent successfully");
    return true;
  } else {
    Serial.print("❌ Telemetry failed. HTTP Code: ");
    Serial.println(httpCode);
    return false;
  }
}
```

---

### **2.6 Send Alert Function**

Add this function:
```cpp
bool sendAlert(String alertType, String severity, int waterLevel = 0, float magnitude = 0.0) {
  if (deviceToken.length() == 0) {
    Serial.println("⚠️ No device token. Cannot send alert.");
    return false;
  }
  
  HTTPClient http;
  String url = String(BACKEND_URL) + String(API_VERSION) + "/devices/" + String(DEVICE_ID) + "/alert";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", deviceToken);
  
  // Create alert payload
  StaticJsonDocument<512> doc;
  doc["alertType"] = alertType;  // "fire", "flood", "earthquake"
  doc["severity"] = severity;    // "high", "critical"
  
  // Add sensor data
  StaticJsonDocument<256> sensorData;
  if (alertType == "fire") {
    sensorData["flame"] = true;
  } else if (alertType == "flood") {
    sensorData["water"] = waterLevel;
  } else if (alertType == "earthquake") {
    sensorData["magnitude"] = magnitude;
  }
  doc["sensorData"] = sensorData;
  
  String payload;
  serializeJson(doc, payload);
  
  int httpCode = http.POST(payload);
  http.end();
  
  if (httpCode == 200 || httpCode == 201) {
    Serial.print("✅ Alert sent: ");
    Serial.println(alertType);
    return true;
  } else {
    Serial.print("❌ Alert failed. HTTP Code: ");
    Serial.println(httpCode);
    return false;
  }
}
```

---

### **2.7 Enhanced Setup Function**

Modify your `setup()` function:
```cpp
void setup() {
  Serial.begin(115200);
  delay(1000); 
  
  Serial.println("\n--- KAVACH SYSTEM BOOTING ---");
  
  // 1. Setup Pins
  pinMode(PIN_FLAME, INPUT); 
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  
  // 2. Setup MPU6050
  Serial.print("Initializing Sensors... ");
  Wire.begin(21, 22);
  
  if (!mpu.begin()) {
    Serial.println("\n❌ FAILED: MPU6050 not found. Check wiring!");
    while (1) { 
      digitalWrite(PIN_BUZZER, HIGH); delay(50); 
      digitalWrite(PIN_BUZZER, LOW); delay(200);
    } 
  }
  Serial.println("✅ MPU6050 Connected.");
  
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G); 
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  
  // 3. NEW: Initialize Preferences
  preferences.begin("kavach", false);
  preferences.end();
  
  // 4. NEW: Connect to Wi-Fi
  if (!connectToWiFi()) {
    Serial.println("⚠️ Continuing without Wi-Fi (local mode only)");
  } else {
    // 5. NEW: Register device
    if (!registerDevice()) {
      Serial.println("⚠️ Device registration failed. Retrying in 10s...");
      delay(10000);
      registerDevice();  // Retry once
    }
  }
  
  Serial.println("✅ System Ready. Monitoring Environment...");
}
```

---

### **2.8 Enhanced Loop Function**

Modify your `loop()` function:
```cpp
void loop() {
  static unsigned long lastTelemetry = 0;
  static unsigned long lastFireAlert = 0;
  static unsigned long lastFloodAlert = 0;
  static unsigned long lastQuakeAlert = 0;
  static bool fireAlertSent = false;
  static bool floodAlertSent = false;
  static bool quakeAlertSent = false;
  
  // --- READ SENSORS ---
  int flameState = digitalRead(PIN_FLAME);
  int waterLevel = analogRead(PIN_WATER);
  
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  
  float magnitude = sqrt(pow(a.acceleration.x, 2) + pow(a.acceleration.y, 2) + pow(a.acceleration.z, 2));
  
  // --- SEND TELEMETRY (every 10 seconds) ---
  if (WiFi.status() == WL_CONNECTED && millis() - lastTelemetry > TELEMETRY_INTERVAL) {
    sendTelemetry(flameState, waterLevel, a.acceleration.x, a.acceleration.y, a.acceleration.z);
    lastTelemetry = millis();
  }
  
  // --- LOGIC & ALARMS ---
  
  // 🚨 PRIORITY 1: FIRE (SOUND ON + SEND ALERT)
  if (flameState == LOW) {
    Serial.println("🔥🔥 CRITICAL: FIRE DETECTED! 🔥🔥");
    
    // Fast Strobe Sound
    for(int i=0; i<10; i++) {
      digitalWrite(PIN_BUZZER, HIGH);
      delay(50); 
      digitalWrite(PIN_BUZZER, LOW);
      delay(50);
    }
    
    // Send alert to backend (only once per detection, retry if failed)
    if (!fireAlertSent || (millis() - lastFireAlert > ALERT_RETRY_DELAY)) {
      if (sendAlert("fire", "high", 0, 0.0)) {
        fireAlertSent = true;
        lastFireAlert = millis();
      }
    }
  } else {
    fireAlertSent = false;  // Reset when fire is gone
  }
  
  // 🌊 PRIORITY 2: FLOOD (SOUND ON + SEND ALERT)
  if (waterLevel > WATER_FLOOD_LEVEL) {
    Serial.print("🌊 FLOOD ALERT! Level: ");
    Serial.println(waterLevel);
    
    // Long Beep Pattern
    digitalWrite(PIN_BUZZER, HIGH);
    delay(500); 
    digitalWrite(PIN_BUZZER, LOW);
    delay(500);
    
    // Send alert to backend
    if (!floodAlertSent || (millis() - lastFloodAlert > ALERT_RETRY_DELAY)) {
      if (sendAlert("flood", "high", waterLevel, 0.0)) {
        floodAlertSent = true;
        lastFloodAlert = millis();
      }
    }
  } else {
    floodAlertSent = false;  // Reset when water level normal
  }
  
  // ⚠️ PRIORITY 3: EARTHQUAKE (SILENT MONITOR + SEND ALERT)
  if (abs(a.acceleration.x) > EARTHQUAKE_G_FORCE || 
      abs(a.acceleration.y) > EARTHQUAKE_G_FORCE ||
      magnitude > EARTHQUAKE_G_FORCE) {
    Serial.print("⚠️ SHAKING DETECTED! Force: ");
    Serial.println(magnitude);
    
    // NO BUZZER HERE (Silent Mode)
    digitalWrite(PIN_BUZZER, LOW);
    
    // Send alert to backend
    if (!quakeAlertSent || (millis() - lastQuakeAlert > ALERT_RETRY_DELAY)) {
      if (sendAlert("earthquake", "critical", 0, magnitude)) {
        quakeAlertSent = true;
        lastQuakeAlert = millis();
      }
    }
    
    delay(200);  // Prevent spamming
  } else {
    quakeAlertSent = false;  // Reset when shaking stops
  }
  
  // ✅ SAFE STATE
  if (flameState != LOW && waterLevel <= WATER_FLOOD_LEVEL && 
      abs(a.acceleration.x) <= EARTHQUAKE_G_FORCE && 
      abs(a.acceleration.y) <= EARTHQUAKE_G_FORCE) {
    digitalWrite(PIN_BUZZER, LOW);
    
    // Optional: Print safe status every 2 seconds
    static unsigned long lastPrint = 0;
    if (millis() - lastPrint > 2000) {
      Serial.println("[SAFE] Monitoring...");
      lastPrint = millis();
    }
  }
  
  // Reconnect Wi-Fi if disconnected
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastReconnectAttempt = 0;
    if (millis() - lastReconnectAttempt > 30000) {  // Try every 30s
      Serial.println("⚠️ Wi-Fi disconnected. Attempting reconnect...");
      connectToWiFi();
      lastReconnectAttempt = millis();
    }
  }
  
  delay(100);  // Small delay to prevent watchdog issues
}
```

---

## 📊 **PART 3: STEP-BY-STEP INTEGRATION PROCESS**

### **Step 1: Backend Preparation** (Day 1)

#### **1.1 Verify Backend Endpoints**
- ✅ Ensure `/api/devices/register` endpoint exists
- ✅ Ensure `/api/devices/:deviceId/telemetry` endpoint exists
- ✅ Ensure `/api/devices/:deviceId/alert` endpoint exists
- ✅ Test endpoints with Postman/curl

#### **1.2 Get Backend URL**
- Get your backend server URL (e.g., `http://your-server:3000`)
- Ensure backend is accessible from your network
- Test connectivity: `curl http://your-server:3000/api/health`

#### **1.3 Get Institution ID**
- Log into admin dashboard
- Navigate to Schools/Institutions
- Copy the Institution/School ID
- This will be used in device registration

---

### **Step 2: Code Enhancement** (Day 1-2)

#### **2.1 Install Required Libraries**
1. Open Arduino IDE
2. Go to **Tools → Manage Libraries**
3. Search and install:
   - `ArduinoJson` by Benoit Blanchon (v6.22.0 or v7.x)
4. ESP32 libraries (WiFi, HTTPClient) are built-in

#### **2.2 Add Configuration**
1. Open your `.ino` file
2. Add Wi-Fi credentials:
   ```cpp
   const char* WIFI_SSID = "YourWiFiName";
   const char* WIFI_PASSWORD = "YourWiFiPassword";
   ```
3. Add backend URL:
   ```cpp
   const char* BACKEND_URL = "http://your-server:3000";
   ```
4. Add device info:
   ```cpp
   const char* DEVICE_ID = "KAV-NODE-001";
   const char* DEVICE_NAME = "Chemistry Lab Safety Node";
   const char* INSTITUTION_ID = "your-school-id";
   ```

#### **2.3 Add New Functions**
1. Copy `connectToWiFi()` function
2. Copy `registerDevice()` function
3. Copy `sendTelemetry()` function
4. Copy `sendAlert()` function
5. Modify `setup()` function (add Wi-Fi and registration)
6. Modify `loop()` function (add telemetry and alert sending)

#### **2.4 Test Compilation**
- Click **Verify** in Arduino IDE
- Fix any compilation errors
- Ensure all libraries are installed

---

### **Step 3: Hardware Testing** (Day 2)

#### **3.1 Upload Code**
1. Connect ESP32 via USB
2. Select board: **Tools → Board → ESP32 Dev Module**
3. Select port: **Tools → Port → COMx** (Windows) or `/dev/ttyUSBx` (Linux/Mac)
4. Click **Upload**
5. Open Serial Monitor (115200 baud)

#### **3.2 Monitor Serial Output**
Expected output:
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

#### **3.3 Test Sensors**
1. **Fire Test:** Bring flame near sensor → Should see "🔥🔥 CRITICAL: FIRE DETECTED!"
2. **Flood Test:** Increase water level → Should see "🌊 FLOOD ALERT!"
3. **Earthquake Test:** Shake device → Should see "⚠️ SHAKING DETECTED!"

---

### **Step 4: Backend Verification** (Day 2-3)

#### **4.1 Check Device Registration**
- Log into admin dashboard
- Navigate to Devices page
- Verify your device appears with name "Chemistry Lab Safety Node"
- Verify device status is "active"

#### **4.2 Check Telemetry**
- Navigate to device details page
- Verify telemetry data is being received
- Check sensor readings (flame, water, acceleration)

#### **4.3 Check Alerts**
- Trigger a fire/flood/earthquake
- Navigate to Alerts page
- Verify alert was created
- Verify alert type and severity

---

### **Step 5: Mobile App Integration** (Day 3-4)

#### **5.1 Verify Mobile App Can See Device**
- Open mobile app
- Navigate to IoT Devices
- Verify your device appears in list
- Check device status (online/offline)

#### **5.2 Test Real-Time Updates**
- Open device detail screen
- Trigger sensor (fire/flood/earthquake)
- Verify real-time updates appear
- Verify alert notification appears

---

### **Step 6: Web Dashboard Integration** (Day 4-5)

#### **6.1 Verify Web Dashboard**
- Log into admin dashboard
- Navigate to IoT Devices page
- Verify device appears
- Check real-time sensor readings

#### **6.2 Test Alert Visualization**
- Trigger alert
- Verify alert appears in crisis dashboard
- Check alert timeline

---

## 🧪 **PART 4: TESTING CHECKLIST**

### **Hardware Tests:**
- [ ] ESP32 boots correctly
- [ ] All sensors read correctly
- [ ] Buzzer activates on fire/flood
- [ ] Buzzer silent on earthquake
- [ ] Serial monitor shows correct readings

### **Wi-Fi Tests:**
- [ ] ESP32 connects to Wi-Fi
- [ ] IP address assigned correctly
- [ ] Reconnection works after disconnect
- [ ] Connection stable

### **Backend Communication Tests:**
- [ ] Device registration successful
- [ ] Device token stored in preferences
- [ ] Telemetry sent every 10 seconds
- [ ] Alerts sent on detection
- [ ] HTTP requests successful (200/201)

### **Alert Tests:**
- [ ] Fire alert sent to backend
- [ ] Flood alert sent to backend
- [ ] Earthquake alert sent to backend
- [ ] Alerts appear in backend dashboard
- [ ] Alerts trigger mobile notifications

### **Integration Tests:**
- [ ] Mobile app shows device
- [ ] Mobile app shows real-time readings
- [ ] Web dashboard shows device
- [ ] Web dashboard shows alerts
- [ ] Socket.io updates work

---

## 🔧 **PART 5: TROUBLESHOOTING**

### **Common Issues:**

#### **1. Wi-Fi Connection Failed**
**Symptoms:** "❌ Wi-Fi Connection Failed!"
**Solutions:**
- Check SSID and password
- Ensure Wi-Fi is 2.4GHz (ESP32 doesn't support 5GHz)
- Check signal strength
- Try moving closer to router

#### **2. Device Registration Failed**
**Symptoms:** "❌ Registration failed. HTTP Code: XXX"
**Solutions:**
- Check backend URL is correct
- Ensure backend is running
- Check backend logs for errors
- Verify institution ID is correct
- Check network connectivity

#### **3. Telemetry Not Sending**
**Symptoms:** No "✅ Telemetry sent successfully" messages
**Solutions:**
- Check device token is stored
- Verify backend endpoint is accessible
- Check HTTP response code
- Verify JSON payload format

#### **4. Alerts Not Sending**
**Symptoms:** Local buzzer works but no backend alert
**Solutions:**
- Check `sendAlert()` function is called
- Verify device token is valid
- Check backend alert endpoint
- Verify alert payload format

#### **5. MPU6050 Not Found**
**Symptoms:** "❌ FAILED: MPU6050 not found"
**Solutions:**
- Check I2C wiring (SDA=GPIO 21, SCL=GPIO 22)
- Verify MPU6050 power (3.3V)
- Check I2C pull-up resistors
- Try different I2C address

---

## 📁 **PART 6: FILE STRUCTURE**

### **Arduino Code:**
```
arduino/
├── kavach_iot_node.ino          # Main code (enhanced)
└── libraries/                    # Installed libraries
    └── ArduinoJson/
```

### **Backend (No Changes Needed):**
- ✅ Device endpoints already exist
- ✅ Telemetry processing already exists
- ✅ Alert creation already exists

### **Mobile App (Enhancement Needed):**
- ⏳ Device detail screen (if not exists)
- ⏳ Real-time sensor visualization

### **Web Dashboard (Enhancement Needed):**
- ⏳ IoT device management page (if not exists)
- ⏳ Real-time sensor charts

---

## 🚀 **PART 7: QUICK START GUIDE**

### **For Hardware Team:**

1. **Upload Enhanced Code:**
   ```bash
   # Open Arduino IDE
   # Load kavach_iot_node.ino
   # Configure Wi-Fi and backend URL
   # Upload to ESP32
   ```

2. **Monitor Serial Output:**
   - Open Serial Monitor (115200 baud)
   - Verify Wi-Fi connection
   - Verify device registration
   - Monitor sensor readings

3. **Test Sensors:**
   - Fire: Bring flame near sensor
   - Flood: Increase water level
   - Earthquake: Shake device

---

### **For Software Team:**

1. **Backend Setup:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Verify Endpoints:**
   ```bash
   # Test device registration
   curl -X POST http://localhost:3000/api/devices/register \
     -H "Content-Type: application/json" \
     -d '{"deviceId":"TEST-001","deviceName":"Test Node",...}'
   ```

3. **Monitor Backend Logs:**
   - Check device registration logs
   - Check telemetry processing logs
   - Check alert creation logs

---

## 📝 **PART 8: ENHANCEMENT CHECKLIST**

### **Code Enhancements:**
- [ ] Add Wi-Fi library
- [ ] Add HTTPClient library
- [ ] Add ArduinoJson library
- [ ] Add Preferences library
- [ ] Add Wi-Fi connection function
- [ ] Add device registration function
- [ ] Add telemetry sending function
- [ ] Add alert sending function
- [ ] Modify setup() function
- [ ] Modify loop() function
- [ ] Add error handling
- [ ] Add retry logic

### **Configuration:**
- [ ] Set Wi-Fi SSID
- [ ] Set Wi-Fi password
- [ ] Set backend URL
- [ ] Set device ID
- [ ] Set device name
- [ ] Set institution ID
- [ ] Set room name

### **Testing:**
- [ ] Test Wi-Fi connection
- [ ] Test device registration
- [ ] Test telemetry sending
- [ ] Test fire alert
- [ ] Test flood alert
- [ ] Test earthquake alert
- [ ] Test backend integration
- [ ] Test mobile app integration
- [ ] Test web dashboard integration

---

## 🎯 **PART 9: NEXT STEPS AFTER INTEGRATION**

### **Immediate Next Steps:**
1. ✅ Deploy multiple nodes (different rooms)
2. ✅ Configure different device IDs
3. ✅ Test with multiple devices simultaneously
4. ✅ Monitor backend performance

### **Future Enhancements:**
1. ⏳ Add BLE setup for Wi-Fi configuration
2. ⏳ Add battery monitoring
3. ⏳ Add deep sleep mode
4. ⏳ Add OTA (Over-The-Air) updates
5. ⏳ Add device configuration from mobile app
6. ⏳ Add historical data storage
7. ⏳ Add analytics dashboard

---

## ✅ **PART 10: SUCCESS CRITERIA**

### **Hardware:**
- ✅ ESP32 boots and connects to Wi-Fi
- ✅ All sensors read correctly
- ✅ Buzzer activates on fire/flood
- ✅ Buzzer silent on earthquake

### **Backend:**
- ✅ Device registered successfully
- ✅ Telemetry received every 10 seconds
- ✅ Alerts created on detection
- ✅ Socket.io broadcasting works

### **Mobile/Web:**
- ✅ Device appears in device list
- ✅ Real-time sensor readings displayed
- ✅ Alerts trigger notifications
- ✅ Crisis mode activates on alerts

---

## 📞 **SUPPORT & RESOURCES**

### **Documentation:**
- ESP32 Arduino Core: https://github.com/espressif/arduino-esp32
- ArduinoJson: https://arduinojson.org/
- Backend API Docs: `backend/README.md`

### **Testing Tools:**
- Serial Monitor (Arduino IDE)
- Postman (Backend API testing)
- Browser DevTools (WebSocket testing)

---

**Status:** 📋 **INTEGRATION PLAN READY**  
**Timeline:** 4-5 days for complete integration  
**Next Step:** Start with Step 1 (Backend Preparation)

---

**Last Updated:** December 8, 2025  
**Version:** 1.0  
**Project:** Kavach - IoT Node Integration

