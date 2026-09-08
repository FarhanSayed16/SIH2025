/*
 * KAVACH - Disaster Management IoT Node (HTTPS / tunnel)
 * -------------------------------------------------------------
 * Hardware: ESP32 WROOM, MPU6050, IR Flame Sensor, Water Level Sensor, Active Buzzer
 *
 * Register the device on the SERVER (not from this sketch):
 *   node scripts/register-iot-device.js <deviceId> "<name>" <institutionId> "<room>"
 * Then set DEVICE_TOKEN_PRESET. Do not commit real Wi-Fi or tokens.
 */

 #include <Wire.h>
 #include <Adafruit_MPU6050.h>
 #include <Adafruit_Sensor.h>
 #include <WiFi.h>
 #include <HTTPClient.h>
 #include <WiFiClientSecure.h>
 #include <ArduinoJson.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <freertos/task.h>
#include <time.h>
 
 const int PIN_FLAME = 35;
 const int PIN_WATER = 33;
 const int PIN_BUZZER = 25;
 
 // ============ CONFIG (fill locally) ============
 const char* WIFI_SSID = "YOUR_WIFI_SSID";
 const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
 const char* BACKEND_URL = "https://YOUR_TUNNEL_OR_HOST"; // no trailing slash
 const char* API_VERSION = "/api";
// Paste the PEM root CA that signs BACKEND_URL's certificate here, for example
// R"PEM(-----BEGIN CERTIFICATE-----
// ...
// -----END CERTIFICATE-----)PEM".
// Obtain it from your server/CA administrator. Empty means HTTPS is disabled.
const char* BACKEND_ROOT_CA = "";
const char* NTP_SERVER = "pool.ntp.org"; // Set a reachable time server locally.
const int NETWORK_TIMEOUT_MS = 5000;

 const char* DEVICE_ID = "KAV-NODE-001";
 const char* DEVICE_TOKEN_PRESET = ""; // from register-iot-device.js
 // ===============================================

 String deviceToken = String(DEVICE_TOKEN_PRESET);
 
 const int WATER_FLOOD_LEVEL = 2000;
 const float GRAVITY = 9.81f;
 const float SHAKE_THRESHOLD = 3.0f; // | |a| - g | in m/s²
 
 // --- TIMERS ---
 unsigned long lastTelemetry = 0;
 unsigned long lastAlertTime = 0;
 const int TELEMETRY_INTERVAL = 10000; // 10 Seconds
 const int ALERT_COOLDOWN = 5000;      // 5 Seconds between alerts
 
// --- OBJECTS ---
Adafruit_MPU6050 mpu;

// --- NETWORK CLIENT (Static to prevent scope issues) ---
static WiFiClientSecure secureClient; // Owned exclusively by networkWorker.

// --- FUNCTIONS ---
// Fixed-size messages only: FreeRTOS queues copy bytes, not String ownership.
struct NetworkMessage {
  int kind; // 0 telemetry, 1 fire, 2 flood, 3 earthquake
  int flame;
  int water;
  float x;
  float y;
  float z;
  float magnitude;
};
QueueHandle_t alertQueue = nullptr;
QueueHandle_t telemetryQueue = nullptr;
void networkWorker(void* argument);
bool queueAlert(int kind, int water, float magnitude);
void startNetworking();

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
   
   // Networking never runs on the sensor/alarm task.
   startNetworking();

   if (deviceToken.length() == 0) {
     Serial.println("NO DEVICE TOKEN. Set DEVICE_TOKEN_PRESET from register-iot-device.js");
   }

   Serial.println("✅ System Ready. Monitoring Environment...");
 }
 
 void loop() {
  int flameState = digitalRead(PIN_FLAME);
  int waterLevel = analogRead(PIN_WATER);
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  float magnitude = sqrt(sq(a.acceleration.x) + sq(a.acceleration.y) + sq(a.acceleration.z));
  float vibration = fabs(magnitude - GRAVITY);
  const unsigned long now = millis();

  // Local actuation always precedes queuing any network work.
  int hazard = 0;
  if (flameState == LOW) {
    hazard = 1;
    playSound("FIRE");
  } else if (waterLevel > WATER_FLOOD_LEVEL) {
    hazard = 2;
    playSound("FLOOD");
  } else {
    digitalWrite(PIN_BUZZER, LOW); // Earthquake alerts remain silent.
    if (vibration > SHAKE_THRESHOLD) hazard = 3;
  }

  static int previousHazard = 0;
  if (hazard && (hazard != previousHazard || now - lastAlertTime >= ALERT_COOLDOWN)) {
    if (queueAlert(hazard, waterLevel, vibration)) {
      lastAlertTime = now;
      previousHazard = hazard;
   }
  }
  if (!hazard) previousHazard = 0;

  if (telemetryQueue && now - lastTelemetry >= TELEMETRY_INTERVAL) {
    NetworkMessage message = {0, flameState, waterLevel, a.acceleration.x,
                              a.acceleration.y, a.acceleration.z, magnitude};
    xQueueOverwrite(telemetryQueue, &message); // Retain only the latest reading.
    lastTelemetry = now;
  }
  delay(20); // Yield to ESP32 tasks without waiting for network operations.
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
  if (WiFi.status() != WL_CONNECTED || deviceToken.length() == 0) {
    Serial.println("Wi-Fi or device token unavailable. Cannot send alert.");
    return;
  }

  HTTPClient http;
  http.setTimeout(NETWORK_TIMEOUT_MS);
  http.setConnectTimeout(NETWORK_TIMEOUT_MS);
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
}
 
void sendTelemetry(int flame, int water, float accelX, float accelY, float accelZ, float magnitude) {
  if (WiFi.status() != WL_CONNECTED || deviceToken.length() == 0) return;

  HTTPClient http;
  http.setTimeout(NETWORK_TIMEOUT_MS);
  http.setConnectTimeout(NETWORK_TIMEOUT_MS);
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
  // Nonblocking active-buzzer patterns keep sensors sampling during alarms.
  const unsigned long now = millis();
  bool on = type == "FIRE" ? now % 100 < 50 : now % 400 < 300;
  digitalWrite(PIN_BUZZER, on ? HIGH : LOW);
}

void startNetworking() {
  if (!String(BACKEND_URL).startsWith("https://") || strlen(BACKEND_ROOT_CA) == 0) {
    Serial.println("Networking disabled: configure HTTPS BACKEND_URL and BACKEND_ROOT_CA.");
    return;
  }
  alertQueue = xQueueCreate(6, sizeof(NetworkMessage));
  telemetryQueue = xQueueCreate(1, sizeof(NetworkMessage));
  if (!alertQueue || !telemetryQueue ||
      xTaskCreate(networkWorker, "kavach-network", 8192, nullptr, 1, nullptr) != pdPASS) {
    if (alertQueue) vQueueDelete(alertQueue);
    if (telemetryQueue) vQueueDelete(telemetryQueue);
    alertQueue = nullptr;
    telemetryQueue = nullptr;
    Serial.println("Network task unavailable. Local alarms remain active.");
  }
}

bool queueAlert(int kind, int water, float magnitude) {
  if (!alertQueue) return false;
  NetworkMessage message = {kind, 0, water, 0, 0, 0, magnitude};
  // Best-effort bounded buffer: a full queue never blocks the safety loop.
  // Active hazards retry enqueueing on the next sample; queued != delivered.
  return xQueueSend(alertQueue, &message, 0) == pdTRUE;
}

void networkWorker(void* argument) {
  secureClient.setCACert(BACKEND_ROOT_CA);
  secureClient.setHandshakeTimeout(5); // Seconds; HTTP timeouts use milliseconds.
  unsigned long lastReconnect = 0;
  bool attemptedConnection = false;
  bool timeStarted = false;
  for (;;) {
    if (WiFi.status() != WL_CONNECTED) {
      if (!attemptedConnection || millis() - lastReconnect >= 30000) {
        connectToWiFi(); // Any connection wait is isolated from local alarms.
        lastReconnect = millis();
        attemptedConnection = true;
     }
      vTaskDelay(pdMS_TO_TICKS(100));
      continue;
   }
    if (String(BACKEND_URL).startsWith("https://")) {
      if (!timeStarted) {
        configTime(0, 0, NTP_SERVER);
        timeStarted = true;
     }
      // Certificate validity needs a synchronized clock. Fail closed until ready.
      if (time(nullptr) < 1704067200) {
        vTaskDelay(pdMS_TO_TICKS(100));
        continue;
     }
   }
    NetworkMessage message;
    if (xQueueReceive(alertQueue, &message, 0) == pdTRUE) {
      const char* type = message.kind == 1 ? "fire" : message.kind == 2 ? "flood" : "earthquake";
      sendAlert(type, message.kind == 1 ? 1.0f : message.kind == 2
                        ? static_cast<float>(message.water) : message.magnitude);
    } else if (xQueueReceive(telemetryQueue, &message, 0) == pdTRUE) {
      sendTelemetry(message.flame, message.water, message.x, message.y, message.z, message.magnitude);
   }
    vTaskDelay(pdMS_TO_TICKS(20));
  }
}
