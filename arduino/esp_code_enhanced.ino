/*
 * KAVACH - Disaster Management IoT Node (Enhanced with Backend Integration)
 * -------------------------------------------------------------
 * Hardware: ESP32 WROOM, MPU6050, IR Flame Sensor, Water Level Sensor, Active Buzzer
 * 
 * ENHANCEMENTS:
 * - Wi-Fi connectivity to backend
 * - Device registration with backend
 * - Telemetry sending (sensor readings)
 * - Alert sending (fire/flood/earthquake)
 * - Device authentication (token-based)
 * - Error handling & retry logic
 */

#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// --- PIN DEFINITIONS ---
const int PIN_FLAME = 35;     // IR Flame Sensor (Digital Input)
const int PIN_WATER = 33;     // Water Level Sensor (Analog Input)
const int PIN_BUZZER = 25;    // Active Buzzer (Digital Output)

// --- NETWORK CONFIGURATION ---
const char* WIFI_SSID = "YOUR_WIFI_SSID";           // TODO: Set your Wi-Fi SSID
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";   // TODO: Set your Wi-Fi password
const char* BACKEND_URL = "http://your-server:3000"; // TODO: Set your backend URL
const char* API_VERSION = "/api";

// --- DEVICE CONFIGURATION ---
const char* DEVICE_ID = "KAV-NODE-001";             // TODO: Set unique device ID
const char* DEVICE_NAME = "Chemistry Lab Safety Node"; // TODO: Set device name
const char* INSTITUTION_ID = "your-school-id";      // TODO: Set your school/institution ID
const char* ROOM = "Chemistry Lab";                 // TODO: Set room location

// --- THRESHOLDS ---
const int WATER_FLOOD_LEVEL = 2000; // Value > 2000 triggers Flood Alert
const float EARTHQUAKE_G_FORCE = 2.5; // Acceleration > 2.5G triggers Quake Alert

// --- COMMUNICATION SETTINGS ---
const int TELEMETRY_INTERVAL = 10000;  // Send telemetry every 10 seconds
const int ALERT_RETRY_DELAY = 5000;    // Retry failed alerts after 5s
const int MAX_RETRIES = 3;             // Max retry attempts

// --- DEVICE AUTHENTICATION ---
String deviceToken = "";
Preferences preferences;

// --- OBJECTS ---
Adafruit_MPU6050 mpu;

// --- FUNCTION DECLARATIONS ---
bool connectToWiFi();
bool registerDevice();
bool sendTelemetry(int flameState, int waterLevel, float accelX, float accelY, float accelZ);
bool sendAlert(String alertType, String severity, int waterLevel = 0, float magnitude = 0.0);

void setup() {
  Serial.begin(115200);
  delay(1000); 
  
  Serial.println("\n--- KAVACH SYSTEM BOOTING ---");
  
  // 1. Setup Pins
  pinMode(PIN_FLAME, INPUT); 
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW); // Ensure silent at startup
  
  // 2. Setup MPU6050
  Serial.print("Initializing Sensors... ");
  Wire.begin(21, 22); // SDA=21, SCL=22
  
  if (!mpu.begin()) {
    Serial.println("\n❌ FAILED: MPU6050 not found. Check wiring!");
    while (1) { 
      // Blink light to indicate error
      digitalWrite(PIN_BUZZER, HIGH); delay(50); digitalWrite(PIN_BUZZER, LOW); delay(200);
    } 
  }
  Serial.println("✅ MPU6050 Connected.");
  
  // 3. Configure MPU Sensitivity
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G); 
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  
  // 4. Initialize Preferences
  preferences.begin("kavach", false);
  preferences.end();
  
  // 5. Connect to Wi-Fi
  if (!connectToWiFi()) {
    Serial.println("⚠️ Continuing without Wi-Fi (local mode only)");
  } else {
    // 6. Register device
    if (!registerDevice()) {
      Serial.println("⚠️ Device registration failed. Retrying in 10s...");
      delay(10000);
      registerDevice();  // Retry once
    }
  }
  
  Serial.println("✅ System Ready. Monitoring Environment...");
}

void loop() {
  static unsigned long lastTelemetry = 0;
  static unsigned long lastFireAlert = 0;
  static unsigned long lastFloodAlert = 0;
  static unsigned long lastQuakeAlert = 0;
  static bool fireAlertSent = false;
  static bool floodAlertSent = false;
  static bool quakeAlertSent = false;
  
  // --- READ SENSORS ---
  int flameState = digitalRead(PIN_FLAME); // LOW (0) = FIRE
  int waterLevel = analogRead(PIN_WATER);  // 0 - 4095
  
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp); // Read Motion
  
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

// --- FUNCTION IMPLEMENTATIONS ---

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
  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("Response: ");
    Serial.println(response);
  }
  http.end();
  return false;
}

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

bool sendAlert(String alertType, String severity, int waterLevel, float magnitude) {
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

