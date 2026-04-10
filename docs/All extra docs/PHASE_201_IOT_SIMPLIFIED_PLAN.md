# 🔌 Phase 201: IoT Multi-Disaster Node - SIMPLIFIED PLAN

**Date:** December 8, 2025  
**Status:** 📋 **PLAN READY - SIMPLIFIED HARDWARE**  
**Hardware:** Flame Sensor + MPU-6050 + Water Level Sensor + Buzzer

---

## 🎯 **HARDWARE CONFIGURATION (SIMPLIFIED)**

### **Core Controller:**
- **ESP32 Dev Board / NodeMCU**
- Wi-Fi communication
- Secure token-based authentication

### **Sensors (ACTUAL SETUP):**
1. ✅ **Flame Sensor (IR)** - Fire detection
2. ✅ **MPU-6050** - Earthquake/Vibration detection
3. ✅ **Water Level Sensor (Analog)** - Flood detection
4. ✅ **Buzzer** - Local audible alert

### **NOT INCLUDED:**
- ❌ MQ-2 Smoke Sensor
- ❌ MQ-5 Gas Sensor
- ❌ DHT22 Temperature/Humidity Sensor
- ❌ Panic Button
- ❌ Status LEDs (Green/Yellow/Red)

---

## 📡 **COMMUNICATION ARCHITECTURE**

### **✅ Primary Path (Wi-Fi):**
```
ESP32 Multi-Disaster Node
        ↓ (Wi-Fi / HTTP)
Node.js Backend Server
        ↓
Socket.io + Push Notifications
        ↓
Mobile App + Admin Dashboard
```

### **✅ Fallback Path (Wi-Fi Fails):**
```
ESP32 (Local Buzzer Active)
        ↓
Nearby Phones (Phase 5 Mesh Network)
        ↓
Bridge Node (Phase 5)
        ↓
Backend Server
```

---

## 🔧 **HARDWARE WIRING (SIMPLIFIED)**

### **Pin Mapping:**

| Component | Pin | Type | Notes |
|-----------|-----|------|-------|
| **Flame Sensor** | GPIO 4 | Digital | Digital output (DO) |
| **Water Level Sensor** | GPIO 36 | ADC | Analog reading (ADC1_CH0) |
| **MPU-6050 SDA** | GPIO 21 | I2C | I2C data line |
| **MPU-6050 SCL** | GPIO 22 | I2C | I2C clock line |
| **Buzzer** | GPIO 25 | Digital | PWM for tone control |

### **Power:**
- ESP32: 5V via USB or external power
- Sensors: 5V (Flame, Water Level), 3.3V (MPU-6050)
- Buzzer: 5V

---

## 💻 **SOFTWARE IMPLEMENTATION**

### **3.1 ESP32 Firmware (SIMPLIFIED)**

#### **Sensor Reading Structure:**
```cpp
struct SensorReadings {
  bool flameDetected;      // true/false (Flame Sensor)
  int waterLevel;          // 0-4095 (Water Level Sensor)
  float accelerationX;     // m/s² (MPU-6050)
  float accelerationY;
  float accelerationZ;
  float magnitude;         // Calculated earthquake magnitude
};
```

#### **Threshold Configuration:**
```cpp
struct Thresholds {
  bool flameThreshold = true;           // Any flame = danger
  int waterWarningLevel = 200;          // Water sensor (lower = more water)
  int waterDangerLevel = 100;           // Critical water level
  float earthquakeThreshold = 2.0;      // m/s² acceleration magnitude
};
```

#### **Alert Logic:**
```cpp
enum AlertLevel {
  SAFE,      // No alerts
  WARNING,   // Water level approaching danger
  DANGER,    // Fire, Flood, or Earthquake detected
};

AlertLevel checkSensors(SensorReadings readings) {
  // Fire detection
  if (readings.flameDetected) {
    return DANGER;  // Trigger buzzer + send alert
  }
  
  // Flood detection
  if (readings.waterLevel < thresholds.waterDangerLevel) {
    return DANGER;  // Trigger buzzer + send alert
  }
  
  // Earthquake detection
  float magnitude = sqrt(
    pow(readings.accelerationX, 2) + 
    pow(readings.accelerationY, 2) + 
    pow(readings.accelerationZ, 2)
  );
  if (magnitude > thresholds.earthquakeThreshold) {
    return DANGER;  // Trigger buzzer + send alert
  }
  
  // Warning conditions
  if (readings.waterLevel < thresholds.waterWarningLevel) {
    return WARNING;  // Send warning (no buzzer)
  }
  
  return SAFE;
}
```

#### **Buzzer Control:**
```cpp
void activateBuzzer(AlertLevel level) {
  if (level == DANGER) {
    // Continuous buzzer for danger
    tone(25, 2000, 0);  // GPIO 25, 2000Hz, continuous
  } else {
    // No buzzer for warning/safe
    noTone(25);
  }
}
```

#### **Backend Telemetry Format:**
```json
{
  "readings": {
    "flame": true,
    "water": 150,
    "acceleration": {
      "x": 0.5,
      "y": 0.3,
      "z": 9.8
    },
    "magnitude": 9.85
  },
  "timestamp": 1234567890
}
```

---

### **3.2 Backend Enhancements (MINIMAL)**

#### **Device Model Updates:**
**File:** `backend/src/models/Device.js`

**Add Fields:**
```javascript
{
  // ... existing fields ...
  sensorCapabilities: {
    fire: Boolean,        // Flame sensor
    water: Boolean,       // Water level sensor
    earthquake: Boolean,  // MPU-6050
    buzzer: Boolean      // Buzzer output
  },
  thresholds: {
    waterWarning: Number,    // Default: 200
    waterDanger: Number,     // Default: 100
    earthquake: Number       // Default: 2.0 m/s²
  }
}
```

#### **Telemetry Processing:**
**File:** `backend/src/services/iotDeviceMonitoring.service.js`

**Simplified Processing:**
```javascript
async function processSimplifiedTelemetry(deviceId, readings) {
  const alerts = [];
  
  // Fire detection (flame sensor)
  if (readings.flame) {
    alerts.push({
      type: 'fire',
      severity: 'high',
      sensorData: { flame: readings.flame }
    });
  }
  
  // Flood detection (water level sensor)
  if (readings.water < device.thresholds.waterDanger) {
    alerts.push({
      type: 'flood',
      severity: 'high',
      sensorData: { water: readings.water }
    });
  }
  
  // Earthquake detection (MPU-6050)
  const magnitude = readings.magnitude || 
    Math.sqrt(
      Math.pow(readings.acceleration?.x || 0, 2) +
      Math.pow(readings.acceleration?.y || 0, 2) +
      Math.pow(readings.acceleration?.z || 0, 2)
    );
  if (magnitude > device.thresholds.earthquake) {
    alerts.push({
      type: 'earthquake',
      severity: 'critical',
      sensorData: { 
        acceleration: readings.acceleration, 
        magnitude 
      }
    });
  }
  
  // Process all alerts
  for (const alert of alerts) {
    await createDeviceAlert(deviceId, alert);
  }
}
```

---

### **3.3 Mobile App (SIMPLIFIED)**

#### **Sensor Telemetry Model:**
```dart
class SensorTelemetry {
  final String deviceId;
  final DateTime timestamp;
  final bool? flameDetected;
  final int? waterLevel;
  final Acceleration? acceleration;
  final double? magnitude;
}

class Acceleration {
  final double x;
  final double y;
  final double z;
}
```

#### **Device Detail Screen:**
**Simplified UI:**
- **Fire Status Card:** Flame detected (Yes/No)
- **Water Level Card:** Current water level (0-4095) with gauge
- **Earthquake Card:** Acceleration magnitude with indicator
- **Buzzer Status:** Active/Inactive
- **Real-time updates** via Socket.io

---

## 📊 **IMPLEMENTATION PRIORITY**

### **Must Have (Week 1):**
1. ✅ ESP32 firmware with 3 sensors
2. ✅ Backend telemetry processing
3. ✅ Alert creation for fire/flood/earthquake
4. ✅ Buzzer control
5. ✅ Basic mobile app device list

### **High Priority (Week 2):**
6. ✅ Real-time Socket.io updates
7. ✅ Mobile app device detail screen
8. ✅ Web dashboard visualization
9. ✅ Device health monitoring

### **Medium Priority (Week 3):**
10. ⏳ Historical data charts
11. ⏳ Device configuration UI
12. ⏳ Threshold adjustment

---

## 📁 **FILES TO CREATE/MODIFY**

### **ESP32 Firmware:**
```
iot-node-firmware/
├── src/
│   ├── main.cpp                 # Main entry point
│   ├── config.h                 # Wi-Fi, thresholds
│   ├── sensors/
│   │   ├── flame_sensor.cpp     # Flame sensor reading
│   │   ├── water_sensor.cpp     # Water level reading
│   │   └── earthquake_sensor.cpp # MPU-6050 reading
│   ├── communication/
│   │   ├── wifi_manager.cpp     # Wi-Fi connection
│   │   └── http_client.cpp      # HTTP requests
│   └── alerts/
│       └── buzzer_controller.cpp # Buzzer control
└── platformio.ini
```

### **Backend:**
- ✅ `backend/src/models/Device.js` (MODIFY - add simplified sensor capabilities)
- ✅ `backend/src/services/iotDeviceMonitoring.service.js` (MODIFY - 3-sensor processing)

### **Mobile:**
- ✅ `mobile/lib/features/iot/models/sensor_telemetry_model.dart` (CREATE - simplified)
- ✅ `mobile/lib/features/iot/screens/device_detail_screen.dart` (CREATE - 3 sensors)

### **Web:**
- ✅ `web/app/dashboard/iot-devices/page.tsx` (CREATE - simplified visualization)

---

## 🎯 **SUCCESS CRITERIA**

### **ESP32 Firmware:**
- ✅ Flame sensor reads correctly
- ✅ Water level sensor reads correctly
- ✅ MPU-6050 reads acceleration correctly
- ✅ Earthquake magnitude calculated correctly
- ✅ Buzzer activates on danger alerts
- ✅ Telemetry sent to backend
- ✅ Alerts triggered correctly

### **Backend:**
- ✅ 3-sensor telemetry processed
- ✅ Fire alerts created (flame detected)
- ✅ Flood alerts created (water level low)
- ✅ Earthquake alerts created (magnitude > threshold)
- ✅ Socket.io broadcasting works

### **Mobile App:**
- ✅ Device list shows all devices
- ✅ Device detail shows 3 sensor readings
- ✅ Real-time updates work
- ✅ Alerts trigger crisis mode

### **Web Dashboard:**
- ✅ Device visualization works
- ✅ Real-time sensor readings
- ✅ Alert timeline

---

## ⏱️ **SIMPLIFIED TIMELINE**

| Phase | Duration | Priority |
|-------|----------|----------|
| **ESP32 Firmware** | 3-4 days | HIGH |
| **Backend Enhancements** | 1-2 days | HIGH |
| **Mobile App** | 2-3 days | HIGH |
| **Web Dashboard** | 1-2 days | MEDIUM |
| **Testing** | 2-3 days | HIGH |
| **Total** | **9-14 days** | **(1.5-2 weeks)** |

---

## 🔗 **INTEGRATION POINTS**

### **Uses Existing:**
- ✅ Phase 1.6: IoT device endpoints
- ✅ Phase 4: Alert system
- ✅ Phase 5: Mesh networking (fallback)

### **Alert Types:**
- `fire` - Flame sensor detected
- `flood` - Water level below danger threshold
- `earthquake` - Acceleration magnitude > threshold

---

## 📝 **KEY DIFFERENCES FROM FULL PLAN**

### **Removed:**
- ❌ Smoke sensor (MQ-2)
- ❌ Gas sensor (MQ-5)
- ❌ Temperature/Humidity sensor (DHT22)
- ❌ Panic button
- ❌ Status LEDs
- ❌ BLE setup (can add later if needed)

### **Simplified:**
- ✅ Only 3 sensors to read
- ✅ Only buzzer for local alerts
- ✅ Simpler telemetry structure
- ✅ Faster implementation

---

## 🚀 **QUICK START**

### **1. ESP32 Firmware:**
```cpp
// Read sensors
bool flame = digitalRead(4);  // GPIO 4
int water = analogRead(36);   // GPIO 36
// MPU-6050 via I2C (GPIO 21, 22)

// Check thresholds
if (flame || water < 100 || magnitude > 2.0) {
  tone(25, 2000);  // Activate buzzer
  sendAlert();     // Send to backend
}
```

### **2. Backend:**
```javascript
// Process telemetry
if (readings.flame) createAlert('fire', 'high');
if (readings.water < 100) createAlert('flood', 'high');
if (readings.magnitude > 2.0) createAlert('earthquake', 'critical');
```

### **3. Mobile App:**
```dart
// Display sensors
FlameCard(flame: telemetry.flameDetected),
WaterLevelCard(level: telemetry.waterLevel),
EarthquakeCard(magnitude: telemetry.magnitude),
```

---

## ✅ **TESTING CHECKLIST**

### **Hardware:**
- [ ] Flame sensor detects flame
- [ ] Water level sensor reads correctly
- [ ] MPU-6050 reads acceleration
- [ ] Buzzer sounds on danger

### **Firmware:**
- [ ] All 3 sensors read correctly
- [ ] Threshold checking works
- [ ] Buzzer activates correctly
- [ ] Telemetry sent to backend
- [ ] Alerts sent correctly

### **Backend:**
- [ ] Telemetry processed correctly
- [ ] Fire alerts created
- [ ] Flood alerts created
- [ ] Earthquake alerts created
- [ ] Socket.io broadcasting works

### **Mobile/Web:**
- [ ] Device list displays
- [ ] Sensor readings show correctly
- [ ] Real-time updates work
- [ ] Alerts trigger correctly

---

**Status:** 📋 **SIMPLIFIED PLAN READY**  
**Timeline:** 9-14 days (1.5-2 weeks)  
**Hardware:** Flame + MPU-6050 + Water Level + Buzzer

