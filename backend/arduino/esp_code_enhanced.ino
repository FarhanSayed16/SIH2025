/*
 * KAVACH - Disaster Management IoT Node
 * -------------------------------------------------------------
 * Hardware: ESP32 WROOM, MPU6050, IR Flame Sensor, Water Level Sensor, Active Buzzer
 *
 * Device registration is SERVER-SIDE ONLY (admin JWT or):
 *   cd backend && node scripts/register-iot-device.js <deviceId> "<name>" <institutionId> "<room>"
 * Paste the printed deviceToken into DEVICE_TOKEN_PRESET.
 * This board does not call POST /devices/register (that route requires a user JWT).
 */

#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <freertos/task.h>
#include <time.h>
#include <Preferences.h>

// --- PIN DEFINITIONS ---
const int PIN_FLAME = 35;     // IR Flame Sensor (Digital Input)
const int PIN_WATER = 33;     // Water Level Sensor (Analog Input)
const int PIN_BUZZER = 25;    // Active Buzzer (Digital Output)

// ============ CONFIG (fill locally; do not commit real SSID/password/token) ============
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_URL = "http://YOUR_PC_LAN_IP:3000"; // no trailing slash
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
const char* DEVICE_NAME = "Chemistry Lab Safety Node";
const char* INSTITUTION_ID = "your-mongodb-institution-id";
const char* ROOM = "Chemistry Lab";

// Token from register-iot-device.js. Leave "" if already stored in NVS.
const char* DEVICE_TOKEN_PRESET = "";
// ======================================================================================

// MPU6050 getEvent() is m/s². At rest |a| ≈ 9.81. Do NOT compare |a| > 2.5 (always true).
const int WATER_FLOOD_LEVEL = 2000;
const float GRAVITY_MS2 = 9.81f;
const float EARTHQUAKE_EXCESS_MS2 = 3.0f; // trigger if | |a| - g | exceeds this

const int TELEMETRY_INTERVAL = 10000;
const int ALERT_RETRY_DELAY = 5000;

String deviceToken = "";
Preferences preferences;
Adafruit_MPU6050 mpu;
WiFiClientSecure secureClient; // Owned exclusively by networkWorker.
WiFiClient plainClient; // Local HTTP development configuration only.

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

bool connectToWiFi();
void loadDeviceToken();
bool sendTelemetry(int flameState, int waterLevel, float accelX, float accelY, float accelZ);
bool sendAlert(String alertType, String severity, int waterLevel = 0, float magnitude = 0.0);
bool isShaking(float ax, float ay, float az);

bool isShaking(float ax, float ay, float az) {
  float mag = sqrt(ax * ax + ay * ay + az * az);
  return fabs(mag - GRAVITY_MS2) > EARTHQUAKE_EXCESS_MS2;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n--- KAVACH SYSTEM BOOTING ---");

  pinMode(PIN_FLAME, INPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  Serial.print("Initializing Sensors... ");
  Wire.begin(21, 22);

  if (!mpu.begin()) {
    Serial.println("\nFAILED: MPU6050 not found. Check wiring!");
    while (1) {
      digitalWrite(PIN_BUZZER, HIGH); delay(50); digitalWrite(PIN_BUZZER, LOW); delay(200);
    }
  }
  Serial.println("MPU6050 Connected.");

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  loadDeviceToken();
  startNetworking();

  Serial.println("System Ready. Monitoring Environment...");
}

void loop() {
  static unsigned long lastTelemetry = 0;
  static unsigned long lastAlert[3] = {0, 0, 0};
  static bool alertQueued[3] = {false, false, false};
  int flameState = digitalRead(PIN_FLAME);
  int waterLevel = analogRead(PIN_WATER);
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  float magnitude = sqrt(sq(a.acceleration.x) + sq(a.acceleration.y) + sq(a.acceleration.z));
  float excess = fabs(magnitude - GRAVITY_MS2);
  bool hazards[3] = {flameState == LOW, waterLevel > WATER_FLOOD_LEVEL,
                     isShaking(a.acceleration.x, a.acceleration.y, a.acceleration.z)};
  const unsigned long now = millis();

  // Local actuation precedes network work. Simultaneous shaking must not
  // silence a fire/flood alarm. Patterns never block sensor sampling.
  bool buzzerOn = hazards[0] ? now % 100 < 50 : hazards[1] && now % 1000 < 500;
  digitalWrite(PIN_BUZZER, buzzerOn ? HIGH : LOW);

  for (int i = 0; i < 3; ++i) {
    if (!hazards[i]) {
      alertQueued[i] = false;
    } else if (!alertQueued[i] || now - lastAlert[i] >= ALERT_RETRY_DELAY) {
      if (queueAlert(i + 1, waterLevel, excess)) {
        alertQueued[i] = true;
        lastAlert[i] = now;
      }
    }
  }

  if (telemetryQueue && now - lastTelemetry >= TELEMETRY_INTERVAL) {
    NetworkMessage message = {0, flameState, waterLevel, a.acceleration.x,
                              a.acceleration.y, a.acceleration.z, magnitude};
    xQueueOverwrite(telemetryQueue, &message);
    lastTelemetry = now;
  }
  delay(20);
}

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
    Serial.println("\nWi-Fi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    return true;
  }

  Serial.println("\nWi-Fi Connection Failed!");
  return false;
}

void loadDeviceToken() {
  preferences.begin("kavach", false);
  deviceToken = preferences.getString("deviceToken", "");

  if (deviceToken.length() == 0 && strlen(DEVICE_TOKEN_PRESET) > 0) {
    deviceToken = DEVICE_TOKEN_PRESET;
    preferences.putString("deviceToken", deviceToken);
    Serial.println("Loaded DEVICE_TOKEN_PRESET into NVS.");
  }
  preferences.end();

  if (deviceToken.length() == 0) {
    Serial.println("NO DEVICE TOKEN. Register on the server, then set DEVICE_TOKEN_PRESET and reflash.");
    Serial.println("  node scripts/register-iot-device.js KAV-NODE-001 \"Lab Node\" <institutionId> \"Lab\"");
  } else {
    Serial.print("Device token ready (");
    Serial.print(deviceToken.length());
    Serial.println(" chars). Telemetry/alerts use X-Device-Token.");
  }
}

bool sendTelemetry(int flameState, int waterLevel, float accelX, float accelY, float accelZ) {
  if (deviceToken.length() == 0) {
    Serial.println("No device token. Cannot send telemetry.");
    return false;
  }

  HTTPClient http;
  String url = String(BACKEND_URL) + String(API_VERSION) + "/devices/" + String(DEVICE_ID) + "/telemetry";
  http.setTimeout(NETWORK_TIMEOUT_MS);
  http.setConnectTimeout(NETWORK_TIMEOUT_MS);
  http.setReuse(false);
  if (!http.begin(String(BACKEND_URL).startsWith("https://")
                    ? static_cast<WiFiClient&>(secureClient) : plainClient, url)) {
    return false;
  }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", deviceToken);

  StaticJsonDocument<512> doc;
  doc["readings"]["flame"] = (flameState == LOW);
  doc["readings"]["water"] = waterLevel;
  doc["readings"]["acceleration"]["x"] = accelX;
  doc["readings"]["acceleration"]["y"] = accelY;
  doc["readings"]["acceleration"]["z"] = accelZ;

  float magnitude = sqrt(pow(accelX, 2) + pow(accelY, 2) + pow(accelZ, 2));
  doc["readings"]["magnitude"] = magnitude;
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  http.end();

  if (httpCode == 200 || httpCode == 201) {
    Serial.println("Telemetry sent");
    return true;
  }

  Serial.print("Telemetry failed. HTTP Code: ");
  Serial.println(httpCode);
  return false;
}

bool sendAlert(String alertType, String severity, int waterLevel, float magnitude) {
  if (deviceToken.length() == 0) {
    Serial.println("No device token. Cannot send alert.");
    return false;
  }

  HTTPClient http;
  String url = String(BACKEND_URL) + String(API_VERSION) + "/devices/" + String(DEVICE_ID) + "/alert";
  http.setTimeout(NETWORK_TIMEOUT_MS);
  http.setConnectTimeout(NETWORK_TIMEOUT_MS);
  http.setReuse(false);
  if (!http.begin(String(BACKEND_URL).startsWith("https://")
                    ? static_cast<WiFiClient&>(secureClient) : plainClient, url)) {
    return false;
  }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", deviceToken);

  StaticJsonDocument<512> doc;
  doc["alertType"] = alertType;  // fire / flood / earthquake (backend accepts any case)
  doc["severity"] = severity;

  StaticJsonDocument<256> sensorData;
  if (alertType == "fire") {
    sensorData["flame"] = true;
  } else if (alertType == "flood") {
    sensorData["water"] = waterLevel;
  } else if (alertType == "earthquake") {
    sensorData["magnitude"] = magnitude;
    sensorData["excessMs2"] = magnitude;
  }
  doc["sensorData"] = sensorData;

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  http.end();

  if (httpCode == 200 || httpCode == 201) {
    Serial.print("Alert sent: ");
    Serial.println(alertType);
    return true;
  }

  Serial.print("Alert failed. HTTP Code: ");
  Serial.println(httpCode);
  return false;
}

void startNetworking() {
  const bool https = String(BACKEND_URL).startsWith("https://");
  if ((!https && !String(BACKEND_URL).startsWith("http://")) ||
      (https && strlen(BACKEND_ROOT_CA) == 0)) {
    Serial.println("Networking disabled: configure a valid URL and trusted CA for HTTPS.");
    return;
  }
  if (!https) Serial.println("HTTP development mode: device credentials are unencrypted.");
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
      sendAlert(type, message.kind == 3 ? "critical" : "high", message.water, message.magnitude);
    } else if (xQueueReceive(telemetryQueue, &message, 0) == pdTRUE) {
      sendTelemetry(message.flame, message.water, message.x, message.y, message.z);
    }
    vTaskDelay(pdMS_TO_TICKS(20));
  }
}
