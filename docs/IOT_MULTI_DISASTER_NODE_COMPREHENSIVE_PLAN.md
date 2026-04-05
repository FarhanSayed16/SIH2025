# 🔌 KAVACH MULTI-DISASTER IoT NODE – COMPREHENSIVE INTEGRATION PLAN

## 📋 **Executive Summary**

This document provides a complete plan for integrating ESP32-based Multi-Disaster Safety Nodes into the Kavach disaster management system. Each node will detect Fire, Gas, Water/Flood, and Earthquake, providing local alerts and real-time data to the Kavach server.

---

## ✅ **PART 1: WHAT'S ALREADY IN THE APP**

### **1.1 Backend Infrastructure** ✅ **READY**

#### **Device Management APIs**
- ✅ `POST /api/devices/register` - Device registration endpoint
- ✅ `POST /api/devices/:deviceId/telemetry` - Send sensor telemetry
- ✅ `POST /api/devices/:deviceId/alert` - Send emergency alerts
- ✅ `GET /api/devices` - List all devices
- ✅ `GET /api/devices/:id` - Get device details
- ✅ `GET /api/devices/:deviceId/telemetry` - Get telemetry history
- ✅ Device authentication via `X-Device-Token` header
- ✅ Automatic threshold checking and alert creation
- ✅ Socket.io broadcasting for real-time updates

#### **Alert System**
- ✅ Alert model with types: `fire`, `earthquake`, `flood`, `other`
- ✅ Severity levels: `low`, `medium`, `high`, `critical`
- ✅ Location tracking (GeoJSON)
- ✅ Alert broadcasting via Socket.io (`CRISIS_ALERT`, `DEVICE_ALERT`)
- ✅ Alert status tracking

#### **Real-Time Communication**
- ✅ Socket.io server configured
- ✅ Room-based broadcasting (by institution)
- ✅ Event types: `CRISIS_ALERT`, `DEVICE_ALERT`, `TELEMETRY_UPDATE`, `DEVICE_STATUS_UPDATE`

**Files:**
- `backend/src/controllers/device.controller.js`
- `backend/src/services/iotDeviceMonitoring.service.js`
- `backend/src/models/Device.js`
- `backend/src/models/Alert.js`

---

### **1.2 Web Dashboard** ✅ **READY**

#### **Device Management Pages**
- ✅ `/devices` - Device list and monitoring dashboard
- ✅ Real-time telemetry charts (Line charts, Bar charts)
- ✅ Device health monitoring
- ✅ Historical sensor data visualization
- ✅ Socket.io integration for live updates

#### **Crisis Dashboard**
- ✅ `/admin/crisis-dashboard` - Real-time crisis monitoring
- ✅ Device status display
- ✅ Alert timeline
- ✅ Status counts (safe, help, missing, etc.)

**Files:**
- `web/app/devices/page.tsx`
- `web/app/admin/crisis-dashboard/page.tsx`
- `web/lib/api/devices.ts`
- `web/lib/services/socket-service.ts`

---

### **1.3 Mobile App** ⚠️ **PARTIALLY READY**

#### **What Exists:**
- ✅ Socket.io service (`mobile/lib/core/services/socket_service.dart`)
- ✅ FCM handlers for device alerts (`mobile/lib/features/fcm/handlers/fcm_message_handler.dart`)
- ✅ Alert model (`mobile/lib/core/models/alert_model.dart`)
- ✅ Basic IoT device list screen (`mobile/lib/features/iot/screens/iot_device_list_screen.dart`)
- ✅ Crisis mode screen for emergency alerts
- ✅ Real-time alert notifications

#### **What's Missing:**
- ❌ BLE (Bluetooth Low Energy) setup for ESP32 configuration
- ❌ Device registration from mobile app
- ❌ Real-time sensor data visualization
- ❌ Device status monitoring UI
- ❌ Device configuration UI
- ❌ Local alert acknowledgment
- ❌ Device health monitoring

**Files to Create/Enhance:**
- `mobile/lib/features/iot/services/ble_setup_service.dart` (NEW)
- `mobile/lib/features/iot/models/iot_device_model.dart` (NEW)
- `mobile/lib/features/iot/models/sensor_telemetry_model.dart` (NEW)
- `mobile/lib/features/iot/screens/device_detail_screen.dart` (NEW)
- `mobile/lib/features/iot/screens/device_setup_screen.dart` (NEW)
- `mobile/lib/features/iot/widgets/sensor_chart_widget.dart` (NEW)
- `mobile/lib/features/iot/services/iot_service.dart` (ENHANCE)

---

## 🔧 **PART 2: HARDWARE IMPLEMENTATION PLAN**

### **2.1 Component List & Wiring**

#### **Core Controller**
```
Component: ESP32 Dev Board
Purpose: Main controller, Wi-Fi + BLE + fast ADC
GPIO Pins Used:
  - GPIO 34, 35, 36, 39 (ADC1 - Analog sensors)
  - GPIO 21, 22 (I2C - MPU-6050, DHT22)
  - GPIO 2, 4, 5, 18, 19 (Digital I/O)
  - GPIO 16, 17 (UART - Optional)
```

#### **Fire Detection System**
```
Component: MQ-2 Smoke Sensor
Pin: GPIO 34 (ADC1_CH6)
VCC: 5V
GND: GND
A0: GPIO 34

Component: Flame Sensor (IR)
Pin: GPIO 4 (Digital)
VCC: 5V
GND: GND
DO: GPIO 4 (Digital output)
```

#### **Gas Detection (Optional Enhancement)**
```
Component: MQ-5 / MQ-9 Gas Sensor
Pin: GPIO 35 (ADC1_CH7)
VCC: 5V
GND: GND
A0: GPIO 35
```

#### **Flood / Water Detection**
```
Component: Water Level Sensor (Analog)
Pin: GPIO 36 (ADC1_CH0)
VCC: 5V
GND: GND
A0: GPIO 36

Component: Float Switch (Optional)
Pin: GPIO 5 (Digital)
VCC: 3.3V
GND: GND
Signal: GPIO 5
```

#### **Earthquake Detection**
```
Component: MPU-6050 (Accelerometer + Gyro)
Interface: I2C
SDA: GPIO 21
SCL: GPIO 22
VCC: 3.3V
GND: GND
```

#### **Environment Monitoring**
```
Component: DHT22 / SHT31 (Temperature & Humidity)
Interface: I2C (SHT31) or Digital (DHT22)
Pin: GPIO 19 (DHT22) or I2C (SHT31)
VCC: 3.3V
GND: GND
```

#### **Manual Panic System**
```
Component: Emergency Push Button (Big Red)
Pin: GPIO 2 (Digital with interrupt)
VCC: 3.3V (via pull-up resistor)
GND: GND
Signal: GPIO 2 (with 10kΩ pull-up)
```

#### **Alert Output System**
```
Component: Green LED
Pin: GPIO 18
Resistor: 220Ω

Component: Yellow LED
Pin: GPIO 19
Resistor: 220Ω

Component: Red LED
Pin: GPIO 23
Resistor: 220Ω

Component: Active Buzzer / Siren
Pin: GPIO 25
VCC: 5V
GND: GND
```

#### **Power System**
```
Component: 12V / 5V SMPS Adapter
Output: 5V @ 2A (for ESP32 + sensors)
Input: 220V AC

Component: TP4056 Charging Module
Input: 5V from SMPS
Output: 4.2V (Li-ion battery)
Battery: 18650 Li-ion (3.7V, 2600mAh)
Battery connected to ESP32 VBAT pin
```

#### **Communication**
```
Wi-Fi: Built-in ESP32 (2.4GHz)
BLE: Built-in ESP32 (for mobile app setup)
```

---

### **2.2 Complete Pin Mapping**

| Component | Pin | Type | Notes |
|-----------|-----|------|-------|
| MQ-2 Smoke | GPIO 34 | ADC | Analog reading |
| Flame Sensor | GPIO 4 | Digital | Digital output |
| MQ-5 Gas | GPIO 35 | ADC | Analog reading |
| Water Level | GPIO 36 | ADC | Analog reading |
| Float Switch | GPIO 5 | Digital | Digital input |
| MPU-6050 SDA | GPIO 21 | I2C | I2C data |
| MPU-6050 SCL | GPIO 22 | I2C | I2C clock |
| DHT22 Data | GPIO 19 | Digital | One-wire |
| Panic Button | GPIO 2 | Digital | Interrupt pin |
| Green LED | GPIO 18 | Digital | Output |
| Yellow LED | GPIO 19 | Digital | Output (conflict with DHT22 - use GPIO 26) |
| Red LED | GPIO 23 | Digital | Output |
| Buzzer | GPIO 25 | Digital | PWM for tone |
| Battery Monitor | GPIO 32 | ADC | Optional battery voltage |

**Note:** GPIO 19 conflict - Use GPIO 26 for Yellow LED if using DHT22 on GPIO 19.

---

### **2.3 Power Consumption Estimate**

| Component | Current Draw | Notes |
|-----------|-------------|-------|
| ESP32 (Active) | 80-240mA | Wi-Fi active |
| ESP32 (Deep Sleep) | 10µA | Battery mode |
| MQ-2 Sensor | 150mA | Heater element |
| MPU-6050 | 3.9mA | Always on |
| DHT22 | 1-2.5mA | When reading |
| LEDs (each) | 20mA | When ON |
| Buzzer | 30mA | When active |
| **Total Active** | ~400-500mA | All sensors + Wi-Fi |
| **Battery Life** | ~5-6 hours | 2600mAh battery (active) |
| **Battery Life (Sleep)** | ~260 hours | Deep sleep mode |

**Recommendation:** Use deep sleep between readings (every 10-30 seconds) to extend battery life to 2-3 days.

---

## 💻 **PART 3: SOFTWARE IMPLEMENTATION PLAN**

### **3.1 ESP32 Firmware Development**

#### **3.1.1 Project Structure**
```
iot-node-firmware/
├── src/
│   ├── main.cpp                 # Main entry point
│   ├── config.h                 # Configuration (Wi-Fi, thresholds)
│   ├── sensors/
│   │   ├── fire_sensor.cpp      # MQ-2 + Flame sensor
│   │   ├── gas_sensor.cpp       # MQ-5 gas sensor
│   │   ├── water_sensor.cpp     # Water level + float switch
│   │   ├── earthquake_sensor.cpp # MPU-6050
│   │   └── env_sensor.cpp       # DHT22/SHT31
│   ├── communication/
│   │   ├── wifi_manager.cpp     # Wi-Fi connection
│   │   ├── http_client.cpp      # HTTP requests to backend
│   │   └── ble_setup.cpp        # BLE for mobile app setup
│   ├── alerts/
│   │   ├── led_controller.cpp   # LED status control
│   │   └── buzzer_controller.cpp # Buzzer control
│   └── power/
│       └── battery_manager.cpp  # Battery monitoring & sleep
├── lib/
│   └── (Arduino libraries)
└── platformio.ini              # PlatformIO config
```

#### **3.1.2 Core Firmware Features**

**1. Sensor Reading Functions**
```cpp
// Read all sensors
struct SensorReadings {
  int smokeLevel;        // 0-4095 (MQ-2)
  bool flameDetected;    // true/false
  int gasLevel;          // 0-4095 (MQ-5)
  int waterLevel;        // 0-4095 (Water sensor)
  bool floatSwitch;      // true/false
  float accelerationX;   // m/s² (MPU-6050)
  float accelerationY;
  float accelerationZ;
  float temperature;     // °C (DHT22)
  float humidity;        // % (DHT22)
  bool panicButton;      // true/false
};
```

**2. Threshold Checking**
```cpp
// Thresholds (configurable via BLE/backend)
struct Thresholds {
  int smokeThreshold = 300;      // MQ-2
  int gasThreshold = 250;        // MQ-5
  int waterWarningLevel = 200;   // Water sensor
  int waterDangerLevel = 100;    // Water sensor
  float earthquakeThreshold = 2.0; // m/s² acceleration
  float tempThreshold = 60.0;    // °C
  float humidityThreshold = 90.0; // %
};
```

**3. Alert Logic**
```cpp
enum AlertLevel {
  SAFE,      // Green LED
  WARNING,   // Yellow LED
  DANGER,    // Red LED + Buzzer
  PANIC      // Red LED + Buzzer (continuous)
};

AlertLevel checkSensors(SensorReadings readings) {
  // Fire detection
  if (readings.smokeLevel > thresholds.smokeThreshold || 
      readings.flameDetected) {
    return DANGER;
  }
  
  // Flood detection
  if (readings.waterLevel < thresholds.waterDangerLevel || 
      readings.floatSwitch) {
    return DANGER;
  }
  
  // Earthquake detection
  float magnitude = sqrt(
    pow(readings.accelerationX, 2) + 
    pow(readings.accelerationY, 2) + 
    pow(readings.accelerationZ, 2)
  );
  if (magnitude > thresholds.earthquakeThreshold) {
    return DANGER;
  }
  
  // Warning conditions
  if (readings.waterLevel < thresholds.waterWarningLevel ||
      readings.temperature > thresholds.tempThreshold * 0.8) {
    return WARNING;
  }
  
  return SAFE;
}
```

**4. Backend Communication**
```cpp
// Send telemetry to backend
void sendTelemetry(SensorReadings readings) {
  HTTPClient http;
  http.begin("http://your-server:3000/api/devices/" + deviceId + "/telemetry");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", deviceToken);
  
  String json = "{"
    "\"readings\":{"
      "\"smoke\":" + String(readings.smokeLevel) + ","
      "\"flame\":" + String(readings.flameDetected) + ","
      "\"gas\":" + String(readings.gasLevel) + ","
      "\"water\":" + String(readings.waterLevel) + ","
      "\"acceleration\":{"
        "\"x\":" + String(readings.accelerationX) + ","
        "\"y\":" + String(readings.accelerationY) + ","
        "\"z\":" + String(readings.accelerationZ) + "},"
      "\"temperature\":" + String(readings.temperature) + ","
      "\"humidity\":" + String(readings.humidity) + "},"
    "\"timestamp\":" + String(millis()) + "}";
  
  int httpCode = http.POST(json);
  http.end();
}

// Send alert to backend
void sendAlert(String alertType, String severity, SensorReadings readings) {
  HTTPClient http;
  http.begin("http://your-server:3000/api/devices/" + deviceId + "/alert");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", deviceToken);
  
  String json = "{"
    "\"alertType\":\"" + alertType + "\","
    "\"severity\":\"" + severity + "\","
    "\"sensorData\":{"
      "\"smoke\":" + String(readings.smokeLevel) + ","
      "\"temperature\":" + String(readings.temperature) + "},"
    "\"location\":{"
      "\"building\":\"" + deviceLocation.building + "\","
      "\"floor\":\"" + deviceLocation.floor + "\","
      "\"room\":\"" + deviceLocation.room + "\"}}";
  
  int httpCode = http.POST(json);
  http.end();
}
```

**5. BLE Setup Mode**
```cpp
// BLE service for mobile app setup
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_WIFI_UUID "beb5483e-36e1-4688-b7f5-ea07361b4a32"
#define CHARACTERISTIC_CONFIG_UUID "beb5483e-36e1-4688-b7f5-ea07361b4a33"

class WiFiSetupCallback: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    // Parse Wi-Fi credentials
    // Format: "SSID:PASSWORD"
    // Connect to Wi-Fi
  }
};

void setupBLE() {
  BLEDevice::init("Kavach-Node-Setup");
  BLEServer *pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  BLECharacteristic *pWiFiChar = pService->createCharacteristic(
    CHARACTERISTIC_WIFI_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE
  );
  pWiFiChar->setCallbacks(new WiFiSetupCallback());
  
  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();
}
```

**6. Power Management**
```cpp
// Deep sleep between readings
void goToSleep(int seconds) {
  esp_sleep_enable_timer_wakeup(seconds * 1000000ULL);
  esp_deep_sleep_start();
}

// Battery monitoring
float getBatteryVoltage() {
  int adcValue = analogRead(32); // GPIO 32
  float voltage = (adcValue / 4095.0) * 3.3 * 2; // Voltage divider
  return voltage;
}
```

---

### **3.2 Mobile App Implementation**

#### **3.2.1 BLE Setup Service** (NEW)

**File:** `mobile/lib/features/iot/services/ble_setup_service.dart`

```dart
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

class BleSetupService {
  static const String serviceUUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
  static const String wifiCharacteristicUUID = "beb5483e-36e1-4688-b7f5-ea07361b4a32";
  static const String configCharacteristicUUID = "beb5483e-36e1-4688-b7f5-ea07361b4a33";

  Future<bool> connectToDevice(String deviceName) async {
    // Scan for BLE device
    // Connect
    // Send Wi-Fi credentials
    // Send device configuration
  }

  Future<void> sendWiFiCredentials(String ssid, String password) async {
    // Write to BLE characteristic
  }

  Future<void> sendDeviceConfig(Map<String, dynamic> config) async {
    // Write device configuration
  }
}
```

**Dependencies to Add:**
```yaml
# pubspec.yaml
dependencies:
  flutter_blue_plus: ^1.30.0  # BLE support
```

---

#### **3.2.2 IoT Device Models** (NEW)

**File:** `mobile/lib/features/iot/models/iot_device_model.dart`

```dart
class IoTDevice {
  final String id;
  final String deviceId;
  final String deviceName;
  final String deviceType;
  final String? room;
  final DeviceLocation? location;
  final DeviceStatus status;
  final DateTime? lastSeen;
  final Map<String, dynamic>? configuration;
  
  // Sensor capabilities
  final bool hasFireSensor;
  final bool hasGasSensor;
  final bool hasWaterSensor;
  final bool hasEarthquakeSensor;
  final bool hasPanicButton;
}

class SensorTelemetry {
  final String deviceId;
  final DateTime timestamp;
  final int? smokeLevel;
  final bool? flameDetected;
  final int? gasLevel;
  final int? waterLevel;
  final bool? floatSwitch;
  final Acceleration? acceleration;
  final double? temperature;
  final double? humidity;
  final bool? panicButton;
}

class Acceleration {
  final double x;
  final double y;
  final double z;
}
```

---

#### **3.2.3 IoT Service** (ENHANCE)

**File:** `mobile/lib/features/iot/services/iot_service.dart`

```dart
class IoTService {
  // Register device
  Future<IoTDevice> registerDevice({
    required String deviceId,
    required String deviceType,
    required String deviceName,
    String? room,
    DeviceLocation? location,
    Map<String, dynamic>? configuration,
  });

  // Get device list
  Future<List<IoTDevice>> getDevices();

  // Get device details
  Future<IoTDevice> getDevice(String deviceId);

  // Get telemetry history
  Future<List<SensorTelemetry>> getTelemetryHistory(
    String deviceId, {
    DateTime? startDate,
    DateTime? endDate,
  });

  // Update device configuration
  Future<void> updateDeviceConfig(
    String deviceId,
    Map<String, dynamic> config,
  );
}
```

---

#### **3.2.4 Device Setup Screen** (NEW)

**File:** `mobile/lib/features/iot/screens/device_setup_screen.dart`

**Features:**
- BLE device scanning
- Wi-Fi credentials input
- Device configuration (thresholds, location)
- Device registration
- Test sensor readings

**UI Flow:**
1. Scan for BLE devices ("Kavach-Node-Setup")
2. Connect to device
3. Enter Wi-Fi SSID and password
4. Configure device:
   - Device name
   - Room/location
   - Sensor thresholds
5. Register device with backend
6. Test sensors
7. Save configuration

---

#### **3.2.5 Device Detail Screen** (NEW)

**File:** `mobile/lib/features/iot/screens/device_detail_screen.dart`

**Features:**
- Real-time sensor readings
- Sensor charts (Line charts for trends)
- Alert history
- Device status (online/offline)
- Battery level (if available)
- Manual alert trigger
- Device configuration edit

**UI Components:**
- Sensor cards (Fire, Gas, Water, Earthquake)
- Real-time value displays
- Status LEDs (Green/Yellow/Red)
- Chart widgets for historical data
- Alert timeline

---

#### **3.2.6 Sensor Chart Widget** (NEW)

**File:** `mobile/lib/features/iot/widgets/sensor_chart_widget.dart`

**Features:**
- Line chart for sensor values over time
- Multiple sensor overlay
- Threshold lines
- Zoom and pan
- Time range selection (1h, 6h, 24h, 7d)

**Library:** `fl_chart` or `syncfusion_flutter_charts`

---

#### **3.2.7 Enhanced Device List Screen**

**File:** `mobile/lib/features/iot/screens/iot_device_list_screen.dart` (ENHANCE)

**New Features:**
- Device status indicators (online/offline)
- Last seen timestamp
- Quick sensor status (Green/Yellow/Red)
- Filter by device type
- Search devices
- Add new device button
- Pull to refresh

---

#### **3.2.8 Socket.io Integration**

**File:** `mobile/lib/core/services/socket_service.dart` (ENHANCE)

**New Event Handlers:**
```dart
// Listen for device telemetry updates
socket.on('TELEMETRY_UPDATE', (data) {
  // Update device detail screen if open
  // Update device list status
});

// Listen for device alerts
socket.on('DEVICE_ALERT', (data) {
  // Show alert notification
  // Navigate to device detail or crisis mode
});

// Listen for device status updates
socket.on('DEVICE_STATUS_UPDATE', (data) {
  // Update device online/offline status
});
```

---

### **3.3 Backend Enhancements** (MINOR)

#### **3.3.1 Enhanced Device Model**

**File:** `backend/src/models/Device.js` (ENHANCE)

**Add Fields:**
```javascript
{
  // ... existing fields ...
  sensorCapabilities: {
    fire: Boolean,
    gas: Boolean,
    water: Boolean,
    earthquake: Boolean,
    panicButton: Boolean
  },
  batteryLevel: Number, // 0-100
  lastTelemetry: {
    timestamp: Date,
    readings: {
      smoke: Number,
      flame: Boolean,
      gas: Number,
      water: Number,
      acceleration: { x: Number, y: Number, z: Number },
      temperature: Number,
      humidity: Number
    }
  },
  thresholds: {
    smoke: Number,
    gas: Number,
    waterWarning: Number,
    waterDanger: Number,
    earthquake: Number,
    temperature: Number
  }
}
```

---

#### **3.3.2 Enhanced Telemetry Processing**

**File:** `backend/src/services/iotDeviceMonitoring.service.js` (ENHANCE)

**Add Multi-Sensor Support:**
```javascript
// Process multi-sensor telemetry
async function processMultiSensorTelemetry(deviceId, readings) {
  const alerts = [];
  
  // Fire detection
  if (readings.smoke > device.thresholds.smoke || readings.flame) {
    alerts.push({
      type: 'fire',
      severity: 'high',
      sensorData: { smoke: readings.smoke, flame: readings.flame }
    });
  }
  
  // Flood detection
  if (readings.water < device.thresholds.waterDanger || readings.floatSwitch) {
    alerts.push({
      type: 'flood',
      severity: 'high',
      sensorData: { water: readings.water, floatSwitch: readings.floatSwitch }
    });
  }
  
  // Earthquake detection
  const magnitude = Math.sqrt(
    Math.pow(readings.acceleration.x, 2) +
    Math.pow(readings.acceleration.y, 2) +
    Math.pow(readings.acceleration.z, 2)
  );
  if (magnitude > device.thresholds.earthquake) {
    alerts.push({
      type: 'earthquake',
      severity: 'critical',
      sensorData: { acceleration: readings.acceleration, magnitude }
    });
  }
  
  // Process all alerts
  for (const alert of alerts) {
    await createDeviceAlert(deviceId, alert);
  }
}
```

---

## 📱 **PART 4: INTEGRATION STEPS**

### **Phase 1: Hardware Setup** (Week 1)

1. **Component Procurement**
   - [ ] ESP32 Dev Board (x3 for testing)
   - [ ] MQ-2 Smoke Sensor
   - [ ] Flame Sensor (IR)
   - [ ] MQ-5 Gas Sensor (optional)
   - [ ] Water Level Sensor
   - [ ] Float Switch
   - [ ] MPU-6050
   - [ ] DHT22/SHT31
   - [ ] Emergency Push Button
   - [ ] LEDs (Green, Yellow, Red)
   - [ ] Active Buzzer
   - [ ] TP4056 Charging Module
   - [ ] 18650 Li-ion Battery
   - [ ] 5V/2A SMPS Adapter
   - [ ] Resistors, wires, breadboard

2. **Hardware Assembly**
   - [ ] Wire all sensors to ESP32
   - [ ] Connect LEDs and buzzer
   - [ ] Connect power system
   - [ ] Test individual sensors
   - [ ] Verify power consumption

3. **Basic Firmware Testing**
   - [ ] Flash basic ESP32 program
   - [ ] Test Wi-Fi connection
   - [ ] Test sensor readings
   - [ ] Test LED and buzzer outputs

---

### **Phase 2: Firmware Development** (Week 2)

1. **Core Firmware**
   - [ ] Implement sensor reading functions
   - [ ] Implement threshold checking
   - [ ] Implement alert logic
   - [ ] Implement LED/buzzer control
   - [ ] Test all sensors individually

2. **Backend Communication**
   - [ ] Implement HTTP client
   - [ ] Implement device registration
   - [ ] Implement telemetry sending
   - [ ] Implement alert sending
   - [ ] Test with backend API

3. **BLE Setup**
   - [ ] Implement BLE server
   - [ ] Implement Wi-Fi credential transfer
   - [ ] Implement configuration transfer
   - [ ] Test with mobile app (when ready)

4. **Power Management**
   - [ ] Implement deep sleep
   - [ ] Implement battery monitoring
   - [ ] Test battery life
   - [ ] Optimize power consumption

---

### **Phase 3: Mobile App Development** (Week 2-3)

1. **BLE Setup Service**
   - [ ] Add `flutter_blue_plus` dependency
   - [ ] Implement BLE scanning
   - [ ] Implement device connection
   - [ ] Implement Wi-Fi credential sending
   - [ ] Implement configuration sending
   - [ ] Test with ESP32

2. **IoT Models**
   - [ ] Create `IoTDevice` model
   - [ ] Create `SensorTelemetry` model
   - [ ] Create `Acceleration` model
   - [ ] Add JSON serialization

3. **IoT Service**
   - [ ] Implement device registration
   - [ ] Implement device list fetching
   - [ ] Implement telemetry history fetching
   - [ ] Implement configuration update
   - [ ] Test with backend

4. **Device Setup Screen**
   - [ ] Create BLE scanning UI
   - [ ] Create Wi-Fi input form
   - [ ] Create configuration form
   - [ ] Integrate with BLE service
   - [ ] Test end-to-end setup flow

5. **Device Detail Screen**
   - [ ] Create sensor display cards
   - [ ] Create real-time value displays
   - [ ] Create chart widgets
   - [ ] Integrate Socket.io for live updates
   - [ ] Test with real device

6. **Enhanced Device List**
   - [ ] Add status indicators
   - [ ] Add filtering
   - [ ] Add search
   - [ ] Add pull to refresh
   - [ ] Test with multiple devices

7. **Socket.io Integration**
   - [ ] Add `TELEMETRY_UPDATE` handler
   - [ ] Add `DEVICE_ALERT` handler
   - [ ] Add `DEVICE_STATUS_UPDATE` handler
   - [ ] Test real-time updates

---

### **Phase 4: Backend Enhancements** (Week 3)

1. **Device Model Updates**
   - [ ] Add sensor capabilities field
   - [ ] Add battery level field
   - [ ] Add last telemetry field
   - [ ] Add thresholds field
   - [ ] Run database migration

2. **Telemetry Processing**
   - [ ] Enhance multi-sensor processing
   - [ ] Add earthquake magnitude calculation
   - [ ] Add combined alert logic
   - [ ] Test with real sensor data

3. **API Testing**
   - [ ] Test device registration
   - [ ] Test telemetry endpoint
   - [ ] Test alert endpoint
   - [ ] Test Socket.io broadcasting

---

### **Phase 5: Integration Testing** (Week 4)

1. **End-to-End Testing**
   - [ ] Test device setup from mobile app
   - [ ] Test sensor readings → backend → mobile app
   - [ ] Test alert triggering → notification → crisis mode
   - [ ] Test multiple devices simultaneously
   - [ ] Test offline behavior (battery mode)

2. **Performance Testing**
   - [ ] Test with 10+ devices
   - [ ] Test telemetry frequency (10s, 30s, 60s)
   - [ ] Test battery life
   - [ ] Test network reliability

3. **User Acceptance Testing**
   - [ ] Test with teachers/admins
   - [ ] Gather feedback
   - [ ] Fix issues
   - [ ] Finalize documentation

---

## 🧪 **PART 5: TESTING CHECKLIST**

### **Hardware Tests**
- [ ] All sensors read correctly
- [ ] LEDs light up correctly
- [ ] Buzzer sounds correctly
- [ ] Power system works (AC + battery)
- [ ] Battery charges correctly
- [ ] Deep sleep works
- [ ] Battery life meets requirements (2-3 days)

### **Firmware Tests**
- [ ] Wi-Fi connection stable
- [ ] Sensor readings accurate
- [ ] Threshold checking works
- [ ] Alert logic correct
- [ ] HTTP requests successful
- [ ] BLE setup works
- [ ] Power management works

### **Backend Tests**
- [ ] Device registration works
- [ ] Telemetry storage works
- [ ] Alert creation works
- [ ] Socket.io broadcasting works
- [ ] Multi-sensor processing works
- [ ] API authentication works

### **Mobile App Tests**
- [ ] BLE scanning works
- [ ] Device setup flow works
- [ ] Device list displays correctly
- [ ] Device detail shows real-time data
- [ ] Charts display correctly
- [ ] Socket.io updates work
- [ ] Notifications work
- [ ] Crisis mode triggers correctly

### **Integration Tests**
- [ ] End-to-end flow works
- [ ] Multiple devices work simultaneously
- [ ] Offline mode works
- [ ] Battery backup works
- [ ] Real-time updates work
- [ ] Alert notifications work

---

## 📊 **PART 6: DEPENDENCIES & LIBRARIES**

### **ESP32 Firmware**
```
Arduino Libraries:
- WiFi (built-in)
- HTTPClient (built-in)
- BLEDevice (built-in)
- Wire (I2C - built-in)
- DHT sensor library (Adafruit)
- MPU6050 library (Electronic Cats or Adafruit)
- ArduinoJson (for JSON parsing)
```

### **Mobile App**
```yaml
# pubspec.yaml additions
dependencies:
  flutter_blue_plus: ^1.30.0      # BLE support
  fl_chart: ^0.68.0              # Charts (or syncfusion_flutter_charts)
  # Existing:
  # socket_io_client: ^2.0.3
  # dio: ^5.4.0
  # flutter_riverpod: ^2.4.0
```

### **Backend**
```json
{
  "dependencies": {
    // Existing:
    // "express": "^4.x",
    // "socket.io": "^4.x",
    // "mongoose": "^7.x",
    // No new dependencies needed!
  }
}
```

---

## 💰 **PART 7: COST ESTIMATE**

| Component | Quantity | Unit Price (₹) | Total (₹) |
|-----------|----------|----------------|-----------|
| ESP32 Dev Board | 3 | 300 | 900 |
| MQ-2 Smoke Sensor | 1 | 150 | 150 |
| Flame Sensor (IR) | 1 | 100 | 100 |
| MQ-5 Gas Sensor | 1 | 200 | 200 |
| Water Level Sensor | 1 | 150 | 150 |
| Float Switch | 1 | 50 | 50 |
| MPU-6050 | 1 | 150 | 150 |
| DHT22 | 1 | 200 | 200 |
| Emergency Button | 1 | 50 | 50 |
| LEDs (RGB set) | 1 | 30 | 30 |
| Active Buzzer | 1 | 30 | 30 |
| TP4056 Module | 1 | 50 | 50 |
| 18650 Battery | 1 | 200 | 200 |
| 5V/2A SMPS | 1 | 150 | 150 |
| Resistors, Wires | - | 100 | 100 |
| Breadboard | 1 | 50 | 50 |
| **TOTAL** | - | - | **~2,410** |

**Note:** For production, consider PCB design and enclosure, adding ~₹500-1000 per unit.

---

## 🚀 **PART 8: QUICK START GUIDE**

### **For Hardware Team:**

1. **Assemble Hardware**
   - Follow pin mapping in Section 2.2
   - Use breadboard for prototyping
   - Test each sensor individually

2. **Flash Firmware**
   - Install Arduino IDE
   - Install ESP32 board support
   - Install required libraries
   - Flash `main.cpp` to ESP32

3. **Configure Wi-Fi**
   - Use BLE setup (when mobile app ready)
   - Or hardcode in `config.h` for testing

4. **Test Sensors**
   - Use Serial Monitor to view readings
   - Verify thresholds
   - Test alert triggers

---

### **For Software Team:**

1. **Backend Setup**
   - Ensure device endpoints are working
   - Test with Postman/curl
   - Verify Socket.io broadcasting

2. **Mobile App Setup**
   - Add BLE dependency
   - Implement BLE service
   - Implement device setup screen
   - Test with ESP32

3. **Integration**
   - Connect ESP32 to backend
   - Test telemetry flow
   - Test alert flow
   - Verify mobile app updates

---

## 📝 **PART 9: FILE STRUCTURE SUMMARY**

### **New Files to Create:**

#### **ESP32 Firmware:**
```
iot-node-firmware/
├── src/
│   ├── main.cpp
│   ├── config.h
│   ├── sensors/ (5 files)
│   ├── communication/ (3 files)
│   ├── alerts/ (2 files)
│   └── power/ (1 file)
└── platformio.ini
```

#### **Mobile App:**
```
mobile/lib/features/iot/
├── models/
│   ├── iot_device_model.dart (NEW)
│   └── sensor_telemetry_model.dart (NEW)
├── services/
│   ├── ble_setup_service.dart (NEW)
│   └── iot_service.dart (ENHANCE)
├── screens/
│   ├── device_setup_screen.dart (NEW)
│   ├── device_detail_screen.dart (NEW)
│   └── iot_device_list_screen.dart (ENHANCE)
└── widgets/
    └── sensor_chart_widget.dart (NEW)
```

#### **Backend:**
```
backend/src/
├── models/Device.js (ENHANCE - add fields)
└── services/iotDeviceMonitoring.service.js (ENHANCE - multi-sensor)
```

---

## ✅ **PART 10: COMPLETION CHECKLIST**

### **Hardware:**
- [ ] All components procured
- [ ] Hardware assembled
- [ ] Sensors tested individually
- [ ] Power system tested
- [ ] Battery backup tested

### **Firmware:**
- [ ] Sensor reading functions implemented
- [ ] Threshold checking implemented
- [ ] Alert logic implemented
- [ ] Backend communication implemented
- [ ] BLE setup implemented
- [ ] Power management implemented
- [ ] All features tested

### **Mobile App:**
- [ ] BLE setup service implemented
- [ ] Device models created
- [ ] IoT service enhanced
- [ ] Device setup screen created
- [ ] Device detail screen created
- [ ] Device list screen enhanced
- [ ] Socket.io integration complete
- [ ] All features tested

### **Backend:**
- [ ] Device model enhanced
- [ ] Multi-sensor processing implemented
- [ ] All APIs tested
- [ ] Socket.io broadcasting tested

### **Integration:**
- [ ] End-to-end flow tested
- [ ] Multiple devices tested
- [ ] Offline mode tested
- [ ] Performance validated
- [ ] Documentation complete

---

## 🎯 **PART 11: PRIORITY ORDER**

### **Must Have (MVP):**
1. ✅ Fire detection (MQ-2 + Flame)
2. ✅ Water/Flood detection
3. ✅ Earthquake detection (MPU-6050)
4. ✅ Local alerts (LEDs + Buzzer)
5. ✅ Backend communication
6. ✅ Mobile app device list
7. ✅ Real-time alerts

### **Should Have:**
1. ⚠️ Gas detection (MQ-5)
2. ⚠️ BLE setup from mobile app
3. ⚠️ Device detail screen with charts
4. ⚠️ Battery monitoring
5. ⚠️ Power management (deep sleep)

### **Nice to Have:**
1. 💡 Environment monitoring (DHT22)
2. 💡 Historical data visualization
3. 💡 Device configuration from mobile app
4. 💡 Multiple device management
5. 💡 Advanced analytics

---

## 📞 **PART 12: SUPPORT & RESOURCES**

### **Documentation:**
- ESP32 Arduino Core: https://github.com/espressif/arduino-esp32
- Flutter Blue Plus: https://pub.dev/packages/flutter_blue_plus
- Backend API Docs: `backend/README.md`
- Socket.io Events: `docs/SOCKET_EVENTS.md`

### **Testing Tools:**
- Postman (Backend API testing)
- Serial Monitor (ESP32 debugging)
- BLE Scanner App (Mobile BLE testing)
- Socket.io Client (Real-time testing)

---

## 🎉 **CONCLUSION**

This comprehensive plan covers all aspects of integrating ESP32 Multi-Disaster Safety Nodes into the Kavach system. The backend infrastructure is **already ready**, requiring only minor enhancements. The main work is in:

1. **ESP32 Firmware Development** (2-3 weeks)
2. **Mobile App BLE & IoT Features** (2-3 weeks)
3. **Integration & Testing** (1 week)

**Total Estimated Time:** 5-7 weeks for complete implementation.

**Status:** ✅ **READY TO START**

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Project:** Kavach - Multi-Disaster IoT Node Integration


