# Phase 201: IoT Multi-Sensor Integration
**KAVACH (कवच) - Phase 201: Multi-Sensor IoT Node System**

**Date:** Current Session  
**Status:** 📋 **COMPREHENSIVE PLAN READY**

---

## 🎯 **Phase Overview**

Phase 201 is a **standalone phase** dedicated to integrating **Wi-Fi based Multi-Sensor Disaster Safety Nodes** (ESP32) with the KAVACH system. This phase builds upon existing IoT infrastructure from Phase 1.6 and integrates seamlessly with Phase 5's mesh networking for hybrid communication.

**Phase 201 is separate from Phase 5** (Mesh Networking & AR) and focuses exclusively on IoT hardware integration, multi-sensor monitoring, and real-time dashboard visualization.

---

## 📋 **Executive Summary**

This phase implements a complete **Multi-Sensor IoT Disaster Detection System** using ESP32 microcontrollers. Each school can deploy multiple sensor nodes that continuously monitor environmental conditions (fire, smoke, gas leaks, floods, earthquakes) and automatically trigger digital disaster alerts in the KAVACH mobile and web systems.

**Key Features:**
- Multi-sensor ESP32 nodes (smoke, gas, temperature, humidity, water, vibration)
- Manual panic button support
- Local audio-visual alerts (buzzer + LEDs)
- Wi-Fi communication with backend
- Real-time telemetry and dashboard visualization
- Automatic crisis mode triggering
- Hybrid communication (Wi-Fi primary, mesh fallback via Phase 5)

---

## 🎯 **Goals**

1. ✅ Integrate multi-sensor ESP32 hardware with KAVACH backend
2. ✅ Enable real-time sensor monitoring and alerting
3. ✅ Provide mobile app interface for IoT device management
4. ✅ Create web dashboard for sensor visualization
5. ✅ Integrate with existing alert system (Phase 4)
6. ✅ Support hybrid communication (Wi-Fi + mesh fallback from Phase 5)

---

## 🔌 **IoT System Architecture**

### **Hardware Configuration**

**Core Controller:**
- ESP32 Dev Board / NodeMCU
- Wi-Fi communication
- Multiple ADC & digital pins
- Secure token-based authentication

**Environmental Sensors:**
1. **Smoke / Fire Detection** - MQ-2 or MQ-135 Gas Sensor
2. **Gas Leak Detection** - MQ-5 or MQ-9
3. **Temperature & Humidity** - DHT22 Sensor
4. **Flood / Water Detection** - Water level sensor / float switch
5. **Vibration / Structural Shock** (Optional) - MPU-6050 or vibration switch

**Human Interaction & Feedback:**
- Manual Panic Button (physical emergency trigger)
- Buzzer (local audible alert)
- LED Indicators (Green = Normal, Yellow = Warning, Red = Emergency)

---

### **Communication Architecture**

✅ **Primary Path (Wi-Fi):**
```
ESP32 Multi-Sensor Node
        ↓ (Wi-Fi / HTTP)
Node.js Backend Server
        ↓
Socket.io + Push Notifications
        ↓
Mobile App + Admin Dashboard + Projector
```

✅ **Fallback Path (When Wi-Fi Fails):**
```
ESP32 (Local Alarm Active: Buzzer + LED)
        ↓
Nearby Phones (Phase 5 Mesh Network)
        ↓
Bridge Node (Phase 5)
        ↓
Backend Server
```

**Note:** Phase 5 mesh networking is already implemented and will handle the fallback communication. Phase 201 focuses on the Wi-Fi primary path and ESP32 hardware integration.

---

## 📊 **Phase 201 Breakdown**

### **Phase 201.1: Backend Multi-Sensor Support** (Priority: HIGH)
### **Phase 201.2: ESP32 Firmware Development** (Priority: HIGH)
### **Phase 201.3: Mobile App IoT Integration** (Priority: HIGH)
### **Phase 201.4: Web Dashboard Visualization** (Priority: MEDIUM)
### **Phase 201.5: Hybrid Communication Integration** (Priority: MEDIUM)
### **Phase 201.6: Testing & Documentation** (Priority: HIGH)

---

## 🔧 **PHASE 201.1: Backend Multi-Sensor Support**

### **201.1.1: Device Model Enhancements**

**File:** `backend/src/models/Device.js`

**Changes:**
- ✅ Add "multi-sensor" to deviceType enum
- ✅ Enhance configuration schema for all sensor thresholds
- ✅ Add sensor capabilities tracking
- ✅ Add panic button state tracking

**Enhanced Configuration Schema:**
```javascript
configuration: {
  // Sensor Thresholds
  smokeThreshold: { type: Number, default: 300 },
  gasThreshold: { type: Number, default: 200 },
  temperatureThreshold: { type: Number, default: 60 },
  humidityThreshold: { type: Number, default: 90 },
  waterLevelThreshold: { type: Number, default: 1 },
  vibrationThreshold: { type: Number, default: 0.5 },
  
  // Alert Settings
  alertEnabled: { type: Boolean, default: true },
  localAlertsEnabled: { type: Boolean, default: true },
  telemetryInterval: { type: Number, default: 5000 },
  
  // Sensor Capabilities
  sensors: {
    smoke: { enabled: Boolean, pin: Number },
    gas: { enabled: Boolean, pin: Number },
    temperature: { enabled: Boolean, pin: Number },
    humidity: { enabled: Boolean, pin: Number },
    water: { enabled: Boolean, pin: Number },
    vibration: { enabled: Boolean, pin: Number },
    panicButton: { enabled: Boolean, pin: Number }
  }
}
```

**New Fields:**
```javascript
sensorCapabilities: {
  smoke: Boolean,
  gas: Boolean,
  temperature: Boolean,
  humidity: Boolean,
  water: Boolean,
  vibration: Boolean,
  panicButton: Boolean
}
```

---

### **201.1.2: Enhanced Telemetry Processing**

**File:** `backend/src/services/iotDeviceMonitoring.service.js`

**Multi-Sensor Telemetry Data Structure:**
```javascript
{
  // Multi-Sensor Readings
  smoke: 220,              // 0-1023 (MQ-2/MQ-135)
  gas: 35,                 // 0-1023 (MQ-5/MQ-9)
  temperature: 31.4,       // Celsius (DHT22)
  humidity: 58,            // % (DHT22)
  waterLevel: 0,           // 0-1023 (Water sensor)
  vibration: 0.02,         // g-force (MPU-6050)
  
  // Device State
  panicButtonPressed: false,
  localAlarmActive: false,
  
  // Metadata
  timestamp: "2025-11-28T10:15:22Z",
  wifiStrength: -65,       // dBm
  batteryLevel: null
}
```

**Enhanced Threshold Checking:**
- Multi-sensor threshold validation
- Alert type determination (FIRE, GAS_LEAK, FLOOD, EARTHQUAKE, MANUAL)
- Severity calculation based on sensor readings
- Multi-threshold breach handling

---

### **201.1.3: Enhanced Device Registration**

**File:** `backend/src/controllers/device.controller.js`

**Enhanced Registration Request:**
```javascript
{
  "deviceId": "KAV-SN-01",
  "deviceName": "Chemistry Lab Safety Node",
  "deviceType": "multi-sensor",
  "institutionId": "school-id",
  "location": {
    "type": "Point",
    "coordinates": [77.2090, 28.6139]
  },
  "room": "Chemistry Lab",
  "configuration": {
    "sensors": {
      "smoke": { "enabled": true, "pin": 34 },
      "gas": { "enabled": true, "pin": 35 },
      "temperature": { "enabled": true, "pin": 4 },
      "humidity": { "enabled": true, "pin": 4 },
      "panicButton": { "enabled": true, "pin": 0 }
    },
    "smokeThreshold": 300,
    "gasThreshold": 200,
    "temperatureThreshold": 60,
    "telemetryInterval": 5000
  }
}
```

---

### **201.1.4: Real-Time Telemetry Broadcasting**

**New Service:** `backend/src/services/iotTelemetryBroadcast.service.js`

**Features:**
- Broadcast real-time telemetry via Socket.io
- Device-specific Socket.io rooms
- Threshold warning events
- Device status updates

**Socket.io Events:**
- `TELEMETRY_UPDATE` - Real-time sensor readings
- `DEVICE_STATUS_UPDATE` - Device online/offline
- `THRESHOLD_WARNING` - Pre-alert warnings
- `DEVICE_ALERT_ACTIVE` - Active alert state

---

### **201.1.5: Device Status Monitoring**

**Enhancement:** Device health monitoring
- Online/offline tracking (lastSeen)
- Telemetry frequency monitoring
- Alert rate tracking
- Device health score calculation

---

## 📱 **PHASE 201.2: ESP32 Firmware Development**

### **201.2.1: Core Firmware Architecture**

**Structure:**
- WiFi connection management
- Sensor reading functions
- HTTP client for backend communication
- Local alarm control (buzzer + LED)
- Panic button handling
- Configuration management

---

### **201.2.2: Sensor Reading Implementation**

**Sensors to Implement:**
1. MQ-2/MQ-135 (Smoke) - Analog pin reading
2. MQ-5/MQ-9 (Gas) - Analog pin reading
3. DHT22 (Temperature/Humidity) - Digital pin with library
4. Water Level Sensor - Analog pin reading
5. MPU-6050 (Vibration) - I2C communication
6. Panic Button - Digital pin with interrupt

---

### **201.2.3: Backend Communication**

**Endpoints to Use:**
- `POST /api/devices/register` - Device registration
- `POST /api/devices/:deviceId/telemetry` - Send telemetry
- `POST /api/devices/:deviceId/alert` - Send alerts

**Communication Features:**
- HTTP POST requests
- Device token authentication
- Retry logic for failed requests
- Offline queue (store telemetry when Wi-Fi fails)

---

### **201.2.4: Local Alarm System**

**Features:**
- Buzzer activation on threshold breach
- LED status indicators (Green/Yellow/Red)
- Panic button override
- Alarm silencing option

---

## 📱 **PHASE 201.3: Mobile App IoT Integration**

### **201.3.1: IoT Device Models**

**New Files:**
- `mobile/lib/features/iot/models/iot_device.dart`
- `mobile/lib/features/iot/models/device_telemetry.dart`
- `mobile/lib/features/iot/models/sensor_capabilities.dart`

---

### **201.3.2: IoT Service**

**New File:** `mobile/lib/features/iot/services/iot_service.dart`

**Features:**
- Fetch IoT devices for school
- Get real-time telemetry
- Listen to Socket.io updates
- Get device health status

---

### **201.3.3: IoT Device List Screen**

**New File:** `mobile/lib/features/iot/screens/iot_device_list_screen.dart`

**Features:**
- List all IoT devices
- Show device status (online/offline)
- Show last seen timestamp
- Show active alerts
- Filter and search

---

### **201.3.4: IoT Device Details Screen**

**New File:** `mobile/lib/features/iot/screens/iot_device_details_screen.dart`

**Features:**
- Real-time sensor readings display
- Sensor value visualization
- Device configuration view
- Alert history
- Device health metrics

---

### **201.3.5: Socket.io Integration**

**Enhancement:** `mobile/lib/features/socket/handlers/socket_event_handler.dart`

**New Event Handlers:**
- `TELEMETRY_UPDATE` - Update device telemetry
- `DEVICE_STATUS_UPDATE` - Update device status
- `THRESHOLD_WARNING` - Show warnings
- `DEVICE_ALERT_ACTIVE` - Show alerts

---

## 🌐 **PHASE 201.4: Web Dashboard Visualization**

### **201.4.1: IoT Device Dashboard Widget**

**New File:** `web/app/dashboard/components/IoTDeviceWidget.tsx`

**Features:**
- Real-time sensor readings
- Device status overview
- Active alerts summary
- Quick actions

---

### **201.4.2: IoT Device Management Page**

**New File:** `web/app/dashboard/iot-devices/page.tsx`

**Features:**
- List all IoT devices
- Device configuration
- Threshold settings
- Device registration form
- Status monitoring

---

### **201.4.3: Real-Time Sensor Visualization**

**New File:** `web/app/dashboard/iot-devices/[deviceId]/page.tsx`

**Features:**
- Live sensor readings dashboard
- Real-time charts (Chart.js/Recharts)
- Sensor value gauges
- Historical trends
- Alert timeline

---

## 📡 **PHASE 201.5: Hybrid Communication Integration**

### **201.5.1: Integration with Phase 5 Mesh Networking**

**Documentation:** How Phase 201 IoT integrates with Phase 5 mesh:

**Primary Path (Wi-Fi Available):**
```
ESP32 → Wi-Fi → Backend → Socket.io → Mobile Apps
```

**Fallback Path (Wi-Fi Failed):**
```
ESP32 → Local Alarm (Buzzer + LED) ✅
Nearby Phone → Mesh Network (Phase 5) → Bridge Node → Backend ✅
```

**Note:** Phase 5 mesh networking is already complete. Phase 201 IoT devices will:
- Use Wi-Fi as primary communication
- Activate local alarms when Wi-Fi fails
- Mesh networking (Phase 5) handles phone-to-phone communication
- No changes needed to Phase 5 mesh system

---

### **201.5.2: IoT Alert Integration**

**Enhancement:** Existing alert system integration

**Features:**
- IoT alerts trigger existing `CRISIS_ALERT` events (already implemented)
- Mobile app already handles `CRISIS_ALERT` (Phase 4)
- Add IoT device metadata to alert display
- Show sensor readings in alert details

---

## ✅ **PHASE 201.6: Testing & Documentation**

### **201.6.1: Testing Checklist**

- [ ] ESP32 device registration
- [ ] Multi-sensor telemetry processing
- [ ] Threshold checking for all sensors
- [ ] Alert creation for each alert type
- [ ] Socket.io real-time updates
- [ ] Mobile app device list
- [ ] Mobile app device details
- [ ] Web dashboard visualization
- [ ] Device health monitoring
- [ ] Panic button functionality
- [ ] Local alarm system (buzzer/LED)
- [ ] Wi-Fi failure handling
- [ ] Integration with Phase 5 mesh (fallback)

---

### **201.6.2: Documentation**

**Files to Create:**
- `docs/phase-201/PHASE_201_COMPLETE.md` - Implementation summary
- `docs/phase-201/ESP32_FIRMWARE_GUIDE.md` - ESP32 code guide
- `docs/phase-201/IOT_MESH_INTEGRATION.md` - Integration with Phase 5
- `docs/phase-201/IOT_DASHBOARD_GUIDE.md` - Dashboard usage guide
- `docs/phase-201/HARDWARE_SETUP_GUIDE.md` - Hardware wiring guide

---

## 📊 **Implementation Priority**

### **Must Have (Week 1):**
1. ✅ Backend multi-sensor support (201.1.1 - 201.1.3)
2. ✅ ESP32 firmware core (201.2.1 - 201.2.3)
3. ✅ Enhanced telemetry processing (201.1.2)

### **High Priority (Week 2):**
4. ✅ Mobile app device list (201.3.3)
5. ✅ Socket.io real-time updates (201.3.5)
6. ✅ ESP32 local alarms (201.2.4)
7. ✅ Web dashboard widgets (201.4.1)

### **Medium Priority (Week 3):**
8. ⏳ Mobile app device details (201.3.4)
9. ⏳ Web device management (201.4.2)
10. ⏳ Real-time charts (201.4.3)

---

## 🔧 **Files to Create/Modify**

### **Backend:**
- ✅ `backend/src/models/Device.js` (MODIFY - multi-sensor support)
- ✅ `backend/src/services/iotDeviceMonitoring.service.js` (MODIFY - multi-sensor)
- ✅ `backend/src/controllers/device.controller.js` (MODIFY - registration)
- ✅ `backend/src/services/iotTelemetryBroadcast.service.js` (CREATE)

### **ESP32 Firmware:**
- ✅ `firmware/esp32/main/main.cpp` (CREATE)
- ✅ `firmware/esp32/include/sensors.h` (CREATE)
- ✅ `firmware/esp32/include/wifi_manager.h` (CREATE)
- ✅ `firmware/esp32/include/alarm_system.h` (CREATE)

### **Mobile:**
- ✅ `mobile/lib/features/iot/models/iot_device.dart` (CREATE)
- ✅ `mobile/lib/features/iot/services/iot_service.dart` (CREATE)
- ✅ `mobile/lib/features/iot/screens/iot_device_list_screen.dart` (CREATE)
- ✅ `mobile/lib/features/iot/screens/iot_device_details_screen.dart` (CREATE)

### **Web:**
- ✅ `web/app/dashboard/components/IoTDeviceWidget.tsx` (CREATE)
- ✅ `web/app/dashboard/iot-devices/page.tsx` (CREATE)
- ✅ `web/app/dashboard/iot-devices/[deviceId]/page.tsx` (CREATE)

---

## 🎯 **Success Criteria**

### **Backend:**
- ✅ Multi-sensor device registration works
- ✅ All sensor types processed correctly
- ✅ Threshold checking works for all sensors
- ✅ Alerts created for all alert types
- ✅ Real-time Socket.io updates work
- ✅ Device health monitoring works

### **ESP32 Firmware:**
- ✅ All sensors read correctly
- ✅ Telemetry sent to backend
- ✅ Alerts triggered on threshold breach
- ✅ Local alarms (buzzer/LED) work
- ✅ Panic button functions
- ✅ Wi-Fi reconnection handling

### **Mobile App:**
- ✅ Device list displays all devices
- ✅ Device details show real-time readings
- ✅ Socket.io updates work in real-time
- ✅ IoT alerts trigger crisis mode correctly

### **Web Dashboard:**
- ✅ IoT widgets display on dashboard
- ✅ Device management page works
- ✅ Real-time charts update correctly
- ✅ Device registration form works

---

## ⏱️ **Timeline Estimate**

**Phase 201.1 (Backend):** 2-3 days
**Phase 201.2 (ESP32 Firmware):** 3-4 days (hardware dependent)
**Phase 201.3 (Mobile):** 2-3 days
**Phase 201.4 (Web):** 2-3 days
**Phase 201.5 (Integration):** 1 day
**Phase 201.6 (Testing):** 2-3 days

**Total:** 12-17 days (2-3 weeks)

---

## 🚀 **Dependencies**

**Requires:**
- ✅ Phase 1.6 (IoT device endpoints - already exists)
- ✅ Phase 4 (Alert system - already exists)
- ✅ Phase 5 (Mesh networking - already exists)

**Integrates With:**
- ✅ Existing Device model and endpoints
- ✅ Existing Alert pipeline
- ✅ Existing Socket.io infrastructure
- ✅ Phase 5 mesh networking (as fallback)

---

## 📝 **Key Points**

1. **Phase 201 is SEPARATE from Phase 5**
   - Phase 5: Mesh Networking & AR (COMPLETE)
   - Phase 201: IoT Multi-Sensor Integration (NEW)

2. **No Changes to Phase 5**
   - Phase 5 mesh networking works as-is
   - Phase 201 uses Phase 5 as fallback mechanism
   - No code modifications to Phase 5 needed

3. **Builds on Existing Infrastructure**
   - Uses Phase 1.6 IoT endpoints
   - Integrates with Phase 4 alerts
   - Leverages Phase 5 mesh for fallback

4. **Hardware-Focused Phase**
   - ESP32 firmware development
   - Sensor integration
   - Hardware testing required

---

## 🔗 **Integration with Existing Phases**

**Phase 1.6 (IoT Endpoints):**
- ✅ Device registration endpoint
- ✅ Telemetry endpoint
- ✅ Alert endpoint
- **Enhancement:** Multi-sensor support

**Phase 4 (Alert System):**
- ✅ CRISIS_ALERT events
- ✅ Alert pipeline
- **Integration:** IoT alerts trigger existing alert system

**Phase 5 (Mesh Networking):**
- ✅ Mesh networking complete
- ✅ Bridge node functionality
- **Integration:** Used as fallback when Wi-Fi fails

---

**Status:** 📋 **PHASE 201 PLAN READY**

This phase is designed as a standalone IoT integration phase, separate from Phase 5. It focuses exclusively on multi-sensor ESP32 hardware integration with the KAVACH system.

