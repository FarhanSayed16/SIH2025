/*
 * KAVACH - Disaster Management IoT Node (Final Stable Version)
 * -------------------------------------------------------------
 * Hardware: ESP32 WROOM, MPU6050, IR Flame Sensor, Water Level Sensor, Active Buzzer
 */

 #include <Wire.h>
 #include <Adafruit_MPU6050.h>
 #include <Adafruit_Sensor.h>
 #include <WiFi.h>
 #include <HTTPClient.h>
 #include <WiFiClientSecure.h>
 #include <ArduinoJson.h>
 
 // --- PIN DEFINITIONS ---
 const int PIN_FLAME = 35;     // IR Flame Sensor (Digital Input)
 const int PIN_WATER = 33;     // Water Level Sensor (Analog Input)
 const int PIN_BUZZER = 25;    // Active Buzzer (Digital Output)
 
 // --- NETWORK CONFIGURATION ---
 const char* WIFI_SSID = "Password-manas007";        
 const char* WIFI_PASSWORD = "ghebhikari";           
 const char* BACKEND_URL = "https://bnc51nt1-3000.inc1.devtunnels.ms"; // UPDATE THIS DAILY
 const char* API_VERSION = "/api";
 
 // --- DEVICE CONFIGURATION ---
 const char* DEVICE_ID = "KAV-NODE-001";             
 // FALLBACK TOKEN: If registration fails, use this (from your previous logs)
 String deviceToken = "dev_ie3TLE45MtxvXjpLUkFwuZFFbhaieu1c"; 
 
 // --- THRESHOLDS ---
 const int WATER_FLOOD_LEVEL = 2000; 
 // Earthquake: We look for vibration force ABOVE gravity (9.8m/s^2)
 const float GRAVITY = 9.8;
 const float SHAKE_THRESHOLD = 3.0; // Trigger if shaking adds 3.0 m/s^2 force
 
 // --- TIMERS ---
 unsigned long lastTelemetry = 0;
 unsigned long lastAlertTime = 0;
 const int TELEMETRY_INTERVAL = 10000; // 10 Seconds
 const int ALERT_COOLDOWN = 5000;      // 5 Seconds between alerts
 
// --- OBJECTS ---
Adafruit_MPU6050 mpu;

// --- NETWORK CLIENT (Static to prevent scope issues) ---
static WiFiClientSecure secureClient; // Static to persist across calls

// --- FUNCTIONS ---
void connectToWiFi();
void sendTelemetry(int flame, int water, float accelX, float accelY, float accelZ, float magnitude);
void sendAlert(String type, float value);
void playSound(String type);
 
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
   Wire.begin(21, 22); // SDA=21, SCL=22
   
   if (!mpu.begin()) {
     Serial.println("\n❌ FAILED: MPU6050 not found.");
     while (1) { digitalWrite(PIN_BUZZER, HIGH); delay(100); digitalWrite(PIN_BUZZER, LOW); delay(100); } 
   }
   Serial.println("✅ MPU6050 Connected.");
   
   // 3. Configure MPU
   mpu.setAccelerometerRange(MPU6050_RANGE_8_G); 
   mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
   
   // 4. Connect to Wi-Fi
   connectToWiFi();
   
   Serial.println("✅ System Ready. Monitoring Environment...");
 }
 
 void loop() {
   // Reconnect Wi-Fi if dropped
   if (WiFi.status() != WL_CONNECTED) {
     connectToWiFi();
   }
 
  // --- READ SENSORS ---
  int flameState = digitalRead(PIN_FLAME); // LOW (0) = FIRE
  int waterLevel = analogRead(PIN_WATER);  // 0 - 4095
  
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp); 
  
  // Calculate magnitude for earthquake detection
  float magnitude = sqrt(sq(a.acceleration.x) + sq(a.acceleration.y) + sq(a.acceleration.z));
  float vibration = abs(magnitude - GRAVITY); // Vibration above gravity
 
  // --- TELEMETRY (Heartbeat) ---
  if (millis() - lastTelemetry > TELEMETRY_INTERVAL) {
    sendTelemetry(flameState, waterLevel, a.acceleration.x, a.acceleration.y, a.acceleration.z, magnitude);
    lastTelemetry = millis();
  }
 
   // --- ALERTS LOGIC ---
 
  // 1. FIRE (Priority 1)
  if (flameState == LOW) {
    Serial.println("🔥🔥 CRITICAL: FIRE DETECTED! 🔥🔥");
    playSound("FIRE");
    if (millis() - lastAlertTime > ALERT_COOLDOWN) {
      delay(300); // Add delay before HTTP call
      sendAlert("fire", 1.0); // 1.0 = True
      lastAlertTime = millis();
      delay(300); // Add delay after
    }
  }
  
  // 2. FLOOD (Priority 2)
  else if (waterLevel > WATER_FLOOD_LEVEL) {
    Serial.print("🌊 FLOOD ALERT! Level: "); Serial.println(waterLevel);
    playSound("FLOOD");
    if (millis() - lastAlertTime > ALERT_COOLDOWN) {
      delay(300); // Add delay before HTTP call
      sendAlert("flood", (float)waterLevel);
      lastAlertTime = millis();
      delay(300); // Add delay after
    }
  }
   
    // 3. EARTHQUAKE (Priority 3)
    else if (vibration > SHAKE_THRESHOLD) {
      Serial.print("⚠️ SHAKING! Force: "); Serial.println(vibration);
      // Silent Alarm (No Sound), just data
      if (millis() - lastAlertTime > ALERT_COOLDOWN) {
        delay(500); // Add delay before HTTP call to prevent crashes
        sendAlert("earthquake", vibration);
        lastAlertTime = millis();
        delay(500); // Add delay after to prevent rapid calls
      }
    }
   
   // SAFE STATE
   else {
     digitalWrite(PIN_BUZZER, LOW);
   }
   
  delay(200); // Increased delay for stability and to prevent watchdog issues
}
 
 // --- NETWORK FUNCTIONS ---
 
 void connectToWiFi() {
   if(WiFi.status() == WL_CONNECTED) return;
   
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
     Serial.println("\n✅ Connected! IP: " + WiFi.localIP().toString());
   } else {
     Serial.println("\n❌ Wi-Fi Failed. Retrying later...");
   }
 }
 
void sendAlert(String type, float value) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Wi-Fi not connected. Cannot send alert.");
    return;
  }

  // Add delay to prevent rapid calls
  delay(200);
  
  // Use static client to prevent scope issues
  secureClient.setInsecure(); // IGNORE SSL ERRORS (Crucial for DevTunnels)
  secureClient.setTimeout(10000);
  
  HTTPClient http;
  http.setTimeout(10000);
  http.setReuse(false); // Don't reuse connection
  
  String url = String(BACKEND_URL) + API_VERSION + "/devices/" + String(DEVICE_ID) + "/alert";
  
  if (!http.begin(secureClient, url)) {
    Serial.println("❌ Failed to begin HTTPS connection");
    return;
  }
  
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", deviceToken);

  StaticJsonDocument<256> doc;
  // Backend validation expects uppercase alertType (FIRE, FLOOD, EARTHQUAKE)
  // Convert to uppercase for validation, backend will convert to lowercase
  const char* alertTypeUpper;
  if (type == "fire") {
    alertTypeUpper = "FIRE";
  } else if (type == "flood") {
    alertTypeUpper = "FLOOD";
  } else if (type == "earthquake") {
    alertTypeUpper = "EARTHQUAKE";
  } else {
    alertTypeUpper = "FIRE";  // Fallback
  }
  
  doc["alertType"] = alertTypeUpper;  // "FIRE", "FLOOD", "EARTHQUAKE" (uppercase for validation)
  doc["severity"] = "HIGH";  // Backend converts uppercase to lowercase
  
  // Backend expects sensorData as an object
  JsonObject sensorDataObj = doc.createNestedObject("sensorData");
  if (type == "fire") {
    sensorDataObj["flame"] = true;
  } else if (type == "flood") {
    sensorDataObj["water"] = (int)value;
  } else if (type == "earthquake") {
    sensorDataObj["magnitude"] = value;
  }

  String payload;
  serializeJson(doc, payload);
  
  // Debug: Print payload for troubleshooting
  Serial.print("Alert Payload: "); Serial.println(payload);

  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    if (httpCode == 200 || httpCode == 201) {
      Serial.print("✅ Alert Sent: "); Serial.println(type);
    } else {
      Serial.print("❌ Alert Failed. Code: "); Serial.println(httpCode);
      // Print response for debugging
      String response = http.getString();
      if (response.length() > 0 && response.length() < 300) {
        Serial.print("Response: "); Serial.println(response);
      }
    }
  } else {
    Serial.print("❌ Alert Error: "); Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
  delay(100); // Small delay after HTTP call
}
 
void sendTelemetry(int flame, int water, float accelX, float accelY, float accelZ, float magnitude) {
  if (WiFi.status() != WL_CONNECTED) return;

  // Use static client to prevent scope issues
  secureClient.setInsecure();
  secureClient.setTimeout(10000);
  
  HTTPClient http;
  http.setTimeout(10000);
  http.setReuse(false);
  
  String url = String(BACKEND_URL) + API_VERSION + "/devices/" + String(DEVICE_ID) + "/telemetry";
  
  if (!http.begin(secureClient, url)) {
    Serial.println("❌ Failed to begin telemetry connection");
    return;
  }
  
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", deviceToken);

  // Backend expects: { readings: { flame, water, acceleration: {x, y, z}, magnitude } }
  StaticJsonDocument<384> doc;
  doc["readings"]["flame"] = (flame == LOW);
  doc["readings"]["water"] = water;
  doc["readings"]["acceleration"]["x"] = accelX;
  doc["readings"]["acceleration"]["y"] = accelY;
  doc["readings"]["acceleration"]["z"] = accelZ;
  doc["readings"]["magnitude"] = magnitude;
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);
  
  // Debug: Print payload for troubleshooting (first time only)
  static bool firstTelemetry = true;
  if (firstTelemetry) {
    Serial.print("Telemetry Payload: "); Serial.println(payload);
    firstTelemetry = false;
  }
  
  int httpCode = http.POST(payload);
  if(httpCode == 200 || httpCode == 201) {
    Serial.println("✅ Telemetry Sent");
  } else if (httpCode > 0) {
    Serial.print("⚠️ Telemetry Code: "); Serial.println(httpCode);
    // Print response for debugging
    String response = http.getString();
    if (response.length() > 0 && response.length() < 300) {
      Serial.print("Response: "); Serial.println(response);
    }
  } else {
    Serial.print("❌ Telemetry Error: "); Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
}
 
 void playSound(String type) {
   if (type == "FIRE") {
     // Siren
     for(int i=0; i<5; i++) {
       digitalWrite(PIN_BUZZER, HIGH); delay(50);
       digitalWrite(PIN_BUZZER, LOW); delay(50);
     }
   } else if (type == "FLOOD") {
     // Beep
     digitalWrite(PIN_BUZZER, HIGH); delay(300);
     digitalWrite(PIN_BUZZER, LOW); delay(100);
   }
 }