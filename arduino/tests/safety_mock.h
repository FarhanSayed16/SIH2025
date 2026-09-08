#pragma once
// Host-only Arduino/FreeRTOS doubles. These do not emulate ESP32 scheduling,
// TLS verification, real sensors, or physical alarm response times.
#include <cassert>
#include <cmath>
#include <cstring>
#include <ctime>
#include <string>
#include <vector>
#include <deque>
#include <algorithm>
#include <iostream>
class String: public std::string {
 public:
 using std::string::string;
 String(const std::string& value): std::string(value) {}
 bool startsWith(const char* prefix) const { return rfind(prefix, 0) == 0; }
};
struct SerialMock { void begin(int) {} template<class T> void print(T) {} template<class T> void println(T) {} } Serial;
constexpr int LOW=0, HIGH=1, INPUT=0, OUTPUT=1, WIFI_STA=1, WL_CONNECTED=3;
constexpr int MPU6050_RANGE_8_G=1, MPU6050_BAND_21_HZ=1;
unsigned long nowValue=10000, largestDelay=0;
int flameValue=LOW, waterValue=0, wifiCalls=0, httpCalls=0, buzzerValue=LOW;
int wifiState=0, sensorReads=0;
float acceleration=9.81f;
std::vector<std::string> events;
unsigned long millis() { return nowValue; }
void delay(unsigned long value) { largestDelay=std::max(largestDelay, value); }
void pinMode(int,int) {}
void digitalWrite(int,int state) { events.push_back("buzzer"); buzzerValue=state; }
int digitalRead(int) { ++sensorReads; return flameValue; }
int analogRead(int) { ++sensorReads; return waterValue; }
template<class T> T sq(T value) { return value*value; }
struct WireMock { void begin(int,int) {} } Wire;
struct sensors_event_t { struct {float x=0, y=0, z=0;} acceleration; };
struct Adafruit_MPU6050 {
 bool begin() { return true; }
 void setAccelerometerRange(int) {}
 void setFilterBandwidth(int) {}
 void getEvent(sensors_event_t* a,sensors_event_t*,sensors_event_t*) { ++sensorReads; a->acceleration.z=acceleration; }
};
struct IPMock { String toString() { return "127.0.0.1"; } };
struct WiFiMock {
 int status() { return wifiState; }
 void mode(int) {}
 void begin(const char*,const char*) { ++wifiCalls; }
 IPMock localIP() { return {}; }
} WiFi;
struct WiFiClient {};
struct WiFiClientSecure: WiFiClient {
 void setCACert(const char*) {}
 void setHandshakeTimeout(unsigned long) {}
};
struct HTTPClient {
 void setTimeout(int) {}
 void setConnectTimeout(int) {}
 void setReuse(bool) {}
 bool begin(WiFiClient&,String) { return true; }
 void addHeader(const char*,String) {}
 int POST(String) { ++httpCalls; return 500; }
 String getString() { return ""; }
 String errorToString(int) { return "error"; }
 void end() {}
};
struct JsonObject {
 JsonObject operator[](const char*) { return {}; }
 template<class T> JsonObject& operator=(T) { return *this; }
};
template<int Size> struct StaticJsonDocument: JsonObject {
 JsonObject createNestedObject(const char*) { return {}; }
};
template<class T> void serializeJson(T&,String&) {}
struct Preferences {
 void begin(const char*,bool) {}
 String getString(const char*,const char*) { return ""; }
 void putString(const char*,String) {}
 void end() {}
};
struct Queue { size_t capacity, width; std::deque<std::vector<char>> values; };
using QueueHandle_t=Queue*;
constexpr int pdPASS=1,pdTRUE=1;
QueueHandle_t xQueueCreate(int capacity,int width) { return new Queue{size_t(capacity),size_t(width),{}}; }
void vQueueDelete(QueueHandle_t queue) { delete queue; }
// Record successful task creation without running the infinite worker on host.
int xTaskCreate(void(*)(void*),const char*,int,void*,int,void*) { return pdPASS; }
int xQueueSend(QueueHandle_t queue,const void* data,int timeout) {
 assert(timeout==0); events.push_back("alert");
 if(queue->values.size()>=queue->capacity) return 0;
 queue->values.emplace_back((const char*)data,(const char*)data+queue->width); return pdTRUE;
}
int xQueueOverwrite(QueueHandle_t queue,const void* data) {
 events.push_back("telemetry"); queue->values.clear();
 queue->values.emplace_back((const char*)data,(const char*)data+queue->width); return pdTRUE;
}
int xQueueReceive(QueueHandle_t queue,void* output,int) {
 if(queue->values.empty()) return 0;
 memcpy(output,queue->values.front().data(),queue->width); queue->values.pop_front(); return pdTRUE;
}
int pdMS_TO_TICKS(int value) { return value; }
void vTaskDelay(int) {}
void configTime(int,int,const char*) {}
