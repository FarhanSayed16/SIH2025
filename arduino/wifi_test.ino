/*
 * KAVACH - Wi-Fi Connection Test
 * Simple test to verify Wi-Fi connectivity
 */

#include <WiFi.h>

// --- NETWORK CONFIGURATION ---
const char* WIFI_SSID = "Password-manas007";
const char* WIFI_PASSWORD = "ghebihkari";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== KAVACH Wi-Fi Connection Test ===\n");
  
  // Print Wi-Fi configuration
  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);
  Serial.print("Password: ");
  Serial.println("********"); // Don't print password
  Serial.println();
  
  // Start Wi-Fi connection
  Serial.println("Starting Wi-Fi connection...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  Serial.print("Connecting");
  
  int attempts = 0;
  int maxAttempts = 30; // Try for 30 seconds
  
  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    delay(500);
    Serial.print(".");
    attempts++;
    
    // Print status every 5 seconds
    if (attempts % 10 == 0) {
      Serial.print("\nStatus: ");
      Serial.print(getWiFiStatusString(WiFi.status()));
      Serial.print(" (Attempt ");
      Serial.print(attempts);
      Serial.println(")");
      Serial.print("Connecting");
    }
  }
  
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Wi-Fi Connected Successfully!");
    Serial.println("\nConnection Details:");
    Serial.print("  SSID: ");
    Serial.println(WiFi.SSID());
    Serial.print("  IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("  Gateway: ");
    Serial.println(WiFi.gatewayIP());
    Serial.print("  Subnet: ");
    Serial.println(WiFi.subnetMask());
    Serial.print("  DNS: ");
    Serial.println(WiFi.dnsIP());
    Serial.print("  RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    Serial.print("  MAC Address: ");
    Serial.println(WiFi.macAddress());
    
    Serial.println("\n✅ Wi-Fi test PASSED!");
    Serial.println("You can now proceed with the full code.");
  } else {
    Serial.println("\n❌ Wi-Fi Connection Failed!");
    Serial.println("\nTroubleshooting Steps:");
    Serial.println("1. Check SSID spelling: " + String(WIFI_SSID));
    Serial.println("2. Check password spelling");
    Serial.println("3. Ensure Wi-Fi is 2.4GHz (ESP32 doesn't support 5GHz)");
    Serial.println("4. Check signal strength (move closer to router)");
    Serial.println("5. Verify router is not blocking ESP32 MAC address");
    Serial.print("\nFinal Status: ");
    Serial.println(getWiFiStatusString(WiFi.status()));
    Serial.println("\n❌ Wi-Fi test FAILED!");
  }
}

void loop() {
  // Check connection status every 5 seconds
  static unsigned long lastCheck = 0;
  
  if (millis() - lastCheck > 5000) {
    lastCheck = millis();
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("[");
      Serial.print(millis() / 1000);
      Serial.print("s] Connected - IP: ");
      Serial.print(WiFi.localIP());
      Serial.print(" | RSSI: ");
      Serial.print(WiFi.RSSI());
      Serial.println(" dBm");
    } else {
      Serial.print("[");
      Serial.print(millis() / 1000);
      Serial.print("s] Disconnected - Status: ");
      Serial.println(getWiFiStatusString(WiFi.status()));
      Serial.println("Attempting reconnection...");
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
  }
  
  delay(100);
}

String getWiFiStatusString(wl_status_t status) {
  switch (status) {
    case WL_IDLE_STATUS:
      return "IDLE";
    case WL_NO_SSID_AVAIL:
      return "NO SSID AVAILABLE";
    case WL_SCAN_COMPLETED:
      return "SCAN COMPLETED";
    case WL_CONNECTED:
      return "CONNECTED";
    case WL_CONNECT_FAILED:
      return "CONNECTION FAILED";
    case WL_CONNECTION_LOST:
      return "CONNECTION LOST";
    case WL_DISCONNECTED:
      return "DISCONNECTED";
    default:
      return "UNKNOWN (" + String(status) + ")";
  }
}

