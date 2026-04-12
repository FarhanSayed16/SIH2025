# 📘 Phase 1.6: IoT & AI Integration - Complete Guide

## 🎯 Overview

Phase 1.6 implements a complete **IoT device management system** and **AI-powered hazard detection** for the Kavach disaster preparedness platform. This phase enables real-world hardware integration and intelligent safety analysis.

---

## 🔌 Part 1: IoT Device System

### **What Was Built**

A complete device management system that allows physical IoT devices (ESP32, sensors, buttons) to:
- Register with the backend
- Send real-time sensor data
- Trigger automatic alerts
- Track location and status
- Store telemetry history

### **Key Capabilities**

#### **1. Device Registration**
- **Endpoint**: `POST /api/devices/register`
- **Purpose**: Register new IoT devices (one-time setup)
- **Returns**: Unique `deviceToken` for authentication
- **Features**:
  - Unique device ID tracking
  - Institution association
  - Device type classification
  - Location tracking
  - Custom configuration

#### **2. Real-Time Telemetry**
- **Endpoint**: `POST /api/devices/:deviceId/telemetry`
- **Purpose**: Send sensor data continuously
- **Features**:
  - Stores last 100 telemetry entries
  - Automatic threshold checking
  - Auto-triggers alerts if threshold breached
  - Broadcasts via Socket.io
  - Updates device `lastSeen` timestamp

#### **3. Device Alerts**
- **Endpoint**: `POST /api/devices/:deviceId/alert`
- **Purpose**: Immediate alert creation by devices
- **Features**:
  - Creates Alert record in database
  - Broadcasts `CRISIS_ALERT` to all connected clients
  - Location tracking
  - Severity levels

#### **4. Device Management**
- **Endpoints**:
  - `GET /api/devices` - List all devices (Admin/Teacher)
  - `GET /api/devices/:id` - Get device details
  - `GET /api/devices/:deviceId/telemetry` - Get telemetry history
  - `PUT /api/devices/:deviceId/location` - Update device location

---

## 🤖 Part 2: AI Hazard Detection

### **What Was Built**

An AI proxy service that:
- Accepts images from mobile app
- Analyzes them using Google Gemini AI
- Detects safety hazards
- Creates hazard reports
- Triggers alerts for critical hazards

### **Key Capabilities**

#### **1. Image Analysis**
- **Endpoint**: `POST /api/ai/analyze`
- **Input**: Base64 encoded image
- **AI Model**: Google Gemini 1.5 Flash
- **Output**: Structured hazard analysis

#### **2. Hazard Detection**
Detects:
- **Fire hazards**: Exposed wires, overheating, flammable materials
- **Structural hazards**: Cracks, loose fixtures, blocked exits
- **Electrical hazards**: Damaged outlets, exposed wiring
- **Other safety concerns**: General safety issues

#### **3. Analysis Response**
Returns:
- `hazardDetected`: Boolean
- `hazardType`: fire | structural | electrical | other
- `severity`: low | medium | high
- `description`: Detailed explanation
- `recommendations`: Action items
- `confidence`: 0.0-1.0 score

#### **4. Automatic Reporting**
- Creates `HazardReport` record if hazard detected
- Links to user and institution
- Stores location and AI analysis
- Triggers Socket.io alert if high severity

---

## 🔐 Security & Authentication

### **Device Authentication**
- **Token System**: Each device gets unique `deviceToken` at registration
- **Header**: `X-Device-Token: <token>`
- **Validation**: Middleware checks token on each request
- **Status Check**: Device must be `active` to authenticate

### **Rate Limiting**
- Device registration: 10 requests/hour per IP
- AI analysis: 100 requests/15 minutes
- Prevents abuse and API overuse

---

## 📊 Data Models

### **Device Model**
```javascript
{
  deviceId: String (unique),
  institutionId: ObjectId,
  type: String (fire-sensor, flood-sensor, panic-button, etc.),
  name: String,
  location: GeoJSON Point,
  deviceToken: String (hashed),
  status: String (active, inactive, maintenance),
  telemetry: Array (last 100 entries),
  lastSeen: Date,
  configuration: Object (thresholds, settings)
}
```

### **HazardReport Model**
```javascript
{
  reportedBy: ObjectId (User),
  institutionId: ObjectId,
  type: String (fire, structural, electrical, other),
  location: GeoJSON Point,
  imageUrl: String (optional),
  aiConfidence: Number,
  severity: String (low, medium, high),
  description: String,
  recommendations: Array,
  status: String (pending, reviewed, resolved),
  aiAnalysis: Object (full AI response)
}
```

---

## 🔗 Integration Points

### **Socket.io Integration**
- Device alerts → `CRISIS_ALERT` event
- High-severity hazards → `CRISIS_ALERT` event
- Broadcasts to school rooms
- Real-time updates to all connected clients

### **Alert System Integration**
- Device alerts create `Alert` records
- Telemetry threshold breaches create alerts
- AI-detected hazards create alerts
- All alerts stored in database

### **Location Tracking**
- Devices can update location
- Geospatial queries supported
- Integration with nearest safe zone API

---

## 🚀 Future Integration Possibilities

### **1. Hardware Integration**

#### **ESP32 Fire Sensor**
```javascript
// What you can do:
- Connect MQ-2 smoke sensor
- Connect DHT22 temperature sensor
- Register device once
- Send telemetry every 5 seconds
- Automatic alert if smoke > 300 or temp > 60°C
```

#### **ESP32 Flood Sensor**
```javascript
// What you can do:
- Connect ultrasonic water level sensor
- Register device
- Send water level data
- Automatic alert if water level < 20cm
```

#### **Physical Panic Button**
```javascript
// What you can do:
- Connect button to ESP32 GPIO
- Register as "panic-button" type
- On button press → POST /devices/:id/alert
- Instant CRISIS_ALERT broadcast
```

#### **Smart LED Strips**
```javascript
// What you can do:
- Register LED strip device
- Backend can send commands (future)
- Light up safe routes during drills
- Visual evacuation guidance
```

### **2. Mobile App Integration**

#### **Hazard Detection Feature**
```javascript
// Mobile app can:
1. User takes photo of hazard
2. Convert to base64
3. POST /api/ai/analyze
4. Display analysis results
5. Show recommendations
6. Create hazard report automatically
```

#### **Device Monitoring**
```javascript
// Admin dashboard can:
1. List all devices
2. View real-time telemetry
3. See device status
4. Monitor threshold breaches
5. View alert history
```

### **3. Advanced Features (Future)**

#### **Predictive Analytics**
- Analyze telemetry patterns
- Predict potential hazards
- Early warning system

#### **Device Commands**
- Send commands to devices
- Control LED strips
- Trigger sirens remotely
- Update device configuration

#### **Multi-Sensor Fusion**
- Combine data from multiple sensors
- Cross-validate alerts
- Reduce false positives

#### **Historical Analysis**
- Analyze telemetry trends
- Identify patterns
- Generate safety reports

---

## 📋 API Reference

### **Device Endpoints**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/devices/register` | POST | Optional | Register new device |
| `/api/devices` | GET | User | List devices |
| `/api/devices/:id` | GET | Teacher | Get device details |
| `/api/devices/:deviceId/telemetry` | POST | Device | Send telemetry data |
| `/api/devices/:deviceId/telemetry` | GET | Device | Get telemetry history |
| `/api/devices/:deviceId/alert` | POST | Device | Create device alert |
| `/api/devices/:deviceId/location` | PUT | Device | Update location |

### **AI Endpoints**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/ai/analyze` | POST | Optional | Analyze hazard in image |

---

## 🛠️ Setup & Configuration

### **Environment Variables**
```env
# Required
GEMINI_API_KEY=your-gemini-api-key

# Optional (for future MQTT)
MQTT_HOST=localhost
MQTT_PORT=1883
```

### **Device Registration Flow**
1. Hardware sends registration request
2. Backend creates device record
3. Returns `deviceToken`
4. Device stores token securely
5. Use token in all subsequent requests

### **Telemetry Flow**
1. Device reads sensor data
2. POST to `/api/devices/:deviceId/telemetry`
3. Backend stores data
4. Checks thresholds
5. Triggers alert if needed
6. Broadcasts via Socket.io

---

## 📈 What This Enables

### **For Hackathon Demo**
- ✅ Physical button press → Instant app alert
- ✅ Sensor reading → Automatic alert
- ✅ Photo analysis → Hazard detection
- ✅ Real-time dashboard updates
- ✅ Impressive IoT integration

### **For Production**
- ✅ Scalable device management
- ✅ Secure device authentication
- ✅ Real-time monitoring
- ✅ Historical data analysis
- ✅ AI-powered safety detection

---

## 🎯 Key Benefits

1. **Hardware Ready**: ESP32 code examples provided
2. **Secure**: Device token authentication
3. **Real-Time**: Socket.io integration
4. **Intelligent**: AI hazard detection
5. **Scalable**: Supports unlimited devices
6. **Flexible**: Custom device types supported

---

## 📚 Documentation Files

- `docs/IOT_INTEGRATION_READY.md` - ESP32 integration guide
- `docs/PHASE_1.6_COMPLETE.md` - Technical completion details
- `backend/src/models/Device.js` - Device model
- `backend/src/models/HazardReport.js` - Hazard report model

---

## ✅ Status

**Phase 1.6**: ✅ **COMPLETE**

**Ready for**:
- Hardware integration
- Mobile app integration
- Phase 1.7 (Testing & DevOps)

**Last Updated**: Phase 1.6 Completion

