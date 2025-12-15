# 🔧 Step-by-Step Wi-Fi Setup Guide

**Date:** December 8, 2025  
**Status:** 📋 **TROUBLESHOOTING GUIDE**

---

## 🎯 **PROBLEM**

ESP32 is not connecting to Wi-Fi network:
```
❌ Wi-Fi Connection Failed!
```

---

## 📋 **STEP 1: Test Wi-Fi Connection (Simple Test)**

### **1.1 Upload Wi-Fi Test Sketch**

1. Open `arduino/wifi_test.ino` in Arduino IDE
2. Verify it compiles
3. Upload to ESP32
4. Open Serial Monitor (115200 baud)

### **1.2 Expected Output (Success):**
```
=== KAVACH Wi-Fi Connection Test ===

SSID: Password-manas007
Password: ********

Starting Wi-Fi connection...
Connecting..........
✅ Wi-Fi Connected Successfully!

Connection Details:
  SSID: Password-manas007
  IP Address: 192.168.x.x
  Gateway: 192.168.x.1
  RSSI: -45 dBm
```

### **1.3 If Still Failing:**

Check the error status:
- `NO SSID AVAILABLE` → SSID not found (check spelling)
- `CONNECTION FAILED` → Password wrong or network issue
- `DISCONNECTED` → Network dropped connection

---

## 🔍 **STEP 2: Troubleshooting Checklist**

### **2.1 Verify Wi-Fi Settings:**

**Current Configuration:**
- SSID: `Password-manas007`
- Password: `ghebihkari`

**Check:**
- [ ] SSID spelling is exact (case-sensitive)
- [ ] Password spelling is exact (case-sensitive)
- [ ] No extra spaces before/after SSID or password
- [ ] Wi-Fi network is 2.4GHz (ESP32 doesn't support 5GHz)

### **2.2 Check Wi-Fi Network:**

**On Your Phone/Computer:**
1. Connect to `Password-manas007` network
2. Verify password `ghebihkari` works
3. Check if network is visible
4. Note the signal strength

**Common Issues:**
- Network might be hidden (not broadcasting SSID)
- Network might be 5GHz only
- Network might have MAC filtering enabled
- Network might require WPA3 (ESP32 supports WPA2)

### **2.3 Check ESP32 Hardware:**

- [ ] ESP32 is powered properly
- [ ] Antenna is connected (if external)
- [ ] No physical damage to Wi-Fi module
- [ ] Try different ESP32 board if available

---

## 🔧 **STEP 3: Alternative Wi-Fi Configurations**

### **3.1 Try Different SSID/Password:**

If you have another Wi-Fi network, test with it:

```cpp
const char* WIFI_SSID = "YourOtherNetwork";
const char* WIFI_PASSWORD = "YourOtherPassword";
```

### **3.2 Check for Hidden Network:**

If network is hidden, you might need to add:

```cpp
WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
WiFi.setAutoReconnect(true);
WiFi.persistent(true);
```

### **3.3 Try Static IP (if DHCP fails):**

```cpp
IPAddress local_IP(192, 168, 1, 100);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress primaryDNS(8, 8, 8, 8);

WiFi.config(local_IP, gateway, subnet, primaryDNS);
WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
```

---

## 📊 **STEP 4: Enhanced Wi-Fi Test (With Scanning)**

If basic test fails, try scanning for networks:

### **4.1 Network Scanner Code:**

Add this to your test sketch:

```cpp
void scanNetworks() {
  Serial.println("Scanning for networks...");
  int n = WiFi.scanNetworks();
  
  if (n == 0) {
    Serial.println("No networks found");
  } else {
    Serial.print(n);
    Serial.println(" networks found:");
    for (int i = 0; i < n; ++i) {
      Serial.print(i + 1);
      Serial.print(": ");
      Serial.print(WiFi.SSID(i));
      Serial.print(" (");
      Serial.print(WiFi.RSSI(i));
      Serial.print(" dBm)");
      Serial.print(" [");
      Serial.print(WiFi.encryptionType(i) == WIFI_AUTH_OPEN ? "Open" : "Encrypted");
      Serial.println("]");
      
      // Check if this is our network
      if (WiFi.SSID(i) == WIFI_SSID) {
        Serial.println("  ✅ Found target network!");
      }
    }
  }
}
```

---

## 🚀 **STEP 5: Once Wi-Fi Works**

After Wi-Fi connection is successful:

1. ✅ Note the IP address
2. ✅ Test ping from computer: `ping <ESP32_IP>`
3. ✅ Then proceed with backend connection test
4. ✅ Then add full sensor code

---

## 📝 **QUICK FIXES TO TRY**

### **Fix 1: Increase Timeout**
```cpp
int maxAttempts = 60; // Try for 60 seconds instead of 30
```

### **Fix 2: Add Delay After Begin**
```cpp
WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
delay(2000); // Wait 2 seconds
```

### **Fix 3: Set Power Mode**
```cpp
WiFi.setTxPower(WIFI_POWER_19_5dBm); // Maximum power
```

### **Fix 4: Disable Power Save**
```cpp
WiFi.setSleep(false); // Disable power save mode
```

---

## ✅ **SUCCESS CRITERIA**

Wi-Fi test is successful when you see:
- ✅ `Wi-Fi Connected Successfully!`
- ✅ IP address assigned
- ✅ RSSI > -70 dBm (good signal)
- ✅ Connection stable for > 30 seconds

---

## 🆘 **STILL NOT WORKING?**

If Wi-Fi still doesn't connect:

1. **Try Mobile Hotspot:**
   - Create hotspot on phone
   - Use that SSID/password
   - Test if ESP32 connects

2. **Check Router Settings:**
   - Disable MAC filtering
   - Disable AP isolation
   - Enable 2.4GHz band
   - Check if WPA2 is enabled

3. **Try Different ESP32:**
   - Wi-Fi module might be faulty
   - Test with another ESP32 board

4. **Check Serial Output:**
   - Look for specific error codes
   - Note the exact status message

---

**Next Step:** Run `wifi_test.ino` and share the Serial Monitor output!

