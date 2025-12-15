/*
 * KAVACH - Disaster Management IoT Node (Silent Quake Version)
 * -------------------------------------------------------------
 * Hardware: ESP32 WROOM, MPU6050, IR Flame Sensor, Water Level Sensor, Active Buzzer
 */

#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// --- PIN DEFINITIONS ---
const int PIN_FLAME = 35;     // IR Flame Sensor (Digital Input)
const int PIN_WATER = 33;     // Water Level Sensor (Analog Input)
const int PIN_BUZZER = 25;    // Active Buzzer (Digital Output)

// --- THRESHOLDS ---
const int WATER_FLOOD_LEVEL = 2000; // Value > 2000 triggers Flood Alert
const float EARTHQUAKE_G_FORCE = 2.5; // Acceleration > 2.5G triggers Quake Alert

// --- OBJECTS ---
Adafruit_MPU6050 mpu;

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
  
  Serial.println("✅ System Ready. Monitoring Environment...");
}

void loop() {
  // --- READ SENSORS ---
  int flameState = digitalRead(PIN_FLAME); // LOW (0) = FIRE
  int waterLevel = analogRead(PIN_WATER);  // 0 - 4095
  
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp); // Read Motion

  // --- LOGIC & ALARMS ---

  // 🚨 PRIORITY 1: FIRE (SOUND ON)
  if (flameState == LOW) {
    Serial.println("🔥🔥 CRITICAL: FIRE DETECTED! 🔥🔥");
    
    // Fast Strobe Sound
    for(int i=0; i<10; i++) {
      digitalWrite(PIN_BUZZER, HIGH);
      delay(50); 
      digitalWrite(PIN_BUZZER, LOW);
      delay(50);
    }
  }
  
  // 🌊 PRIORITY 2: FLOOD (SOUND ON)
  else if (waterLevel > WATER_FLOOD_LEVEL) {
    Serial.print("🌊 FLOOD ALERT! Level: ");
    Serial.println(waterLevel);
    
    // Long Beep Pattern
    digitalWrite(PIN_BUZZER, HIGH);
    delay(500); 
    digitalWrite(PIN_BUZZER, LOW);
    delay(500);
  }
  
  // ⚠️ PRIORITY 3: EARTHQUAKE (SILENT MONITOR)
  else if (abs(a.acceleration.x) > EARTHQUAKE_G_FORCE || abs(a.acceleration.y) > EARTHQUAKE_G_FORCE) {
     Serial.print("⚠️ SHAKING DETECTED! Force: ");
     Serial.println(abs(a.acceleration.x));
     
     // NO BUZZER HERE (Silent Mode)
     digitalWrite(PIN_BUZZER, LOW);
     
     delay(200); // Delay to prevent spamming Serial Monitor
  }
  
  // ✅ SAFE STATE
  else {
    digitalWrite(PIN_BUZZER, LOW); // Silence
    
    // Optional: Print safe status every 2 seconds
    static unsigned long lastPrint = 0;
    if (millis() - lastPrint > 2000) {
      Serial.println("[SAFE] Monitoring...");
      lastPrint = millis();
    }
  }
}