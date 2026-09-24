// Host-side fakes for the Arduino/ESP32 APIs the sketch uses.
//
// Purpose: compile sketch_jun22a.ino with g++ on the laptop so the logic
// (filter, envelope, packet formatting, handshake, MPU decode, LED states)
// can be tested without a board attached. Nothing here runs on the ESP32 --
// the sketch itself is unmodified and unaware of it.
//
// Every fake records what the sketch did so a test can assert on it.

#pragma once

#include <cstdint>
#include <cstdio>
#include <cstring>
#include <cstdlib>
#include <string>
#include <vector>
#include <deque>

// ---------------------------------------------------------------- time / pins

extern unsigned long g_micros;          // test drives the clock directly
inline unsigned long micros() { return g_micros; }
inline unsigned long millis() { return g_micros / 1000UL; }

// delay() advances the fake clock. In the WiFi-failure path the sketch spins
// forever, so a test can set g_delay_budget to escape via DelayBudgetExhausted.
struct DelayBudgetExhausted {};
extern long g_delay_budget;             // <0 = unlimited
inline void delay(unsigned long ms) {
  g_micros += ms * 1000UL;
  if (g_delay_budget >= 0 && --g_delay_budget < 0) throw DelayBudgetExhausted{};
}
inline void delayMicroseconds(unsigned long us) { g_micros += us; }

// Number bases for Serial.print(v, HEX) etc.
#define DEC 10
#define HEX 16
#define OCT 8
#define BIN 2

#define OUTPUT 1
#define INPUT 0
#define HIGH 1
#define LOW 0

extern std::vector<std::pair<int,int>> g_digital_writes;   // (pin, value)
extern int g_pin_state[64];
inline void pinMode(int, int) {}
inline void digitalWrite(int pin, int val) {
  g_digital_writes.push_back({pin, val});
  if (pin >= 0 && pin < 64) g_pin_state[pin] = val;
}
inline int digitalRead(int pin) { return (pin >= 0 && pin < 64) ? g_pin_state[pin] : 0; }

// ---------------------------------------------------------------------- ADC

extern std::deque<int> g_adc_values;    // fed by the test; repeats last when drained
extern int g_last_adc_value;
inline int analogRead(int) {
  if (!g_adc_values.empty()) { g_last_adc_value = g_adc_values.front(); g_adc_values.pop_front(); }
  return g_last_adc_value;
}
#define ADC_11db 3
inline void analogReadResolution(int) {}
inline void analogSetAttenuation(int) {}
inline void analogSetPinAttenuation(int, int) {}

// ------------------------------------------------------------------ RGB LED

// neopixelWrite is the ESP32 core's built-in WS2812 driver. Record every call
// so a test can assert the colour sequence (blue -> yellow -> green ...).
struct LedWrite { int pin; uint8_t r, g, b; };
extern std::vector<LedWrite> g_led_writes;
inline void neopixelWrite(int pin, uint8_t r, uint8_t g, uint8_t b) {
  g_led_writes.push_back({pin, r, g, b});
}

// ------------------------------------------------------------------- Serial

struct FakeSerial {
  std::string out;
  void begin(unsigned long) {}
  // The sketch waits for USB CDC enumeration with `while (!Serial ...)`.
  // On the host there is no CDC to wait for, so report ready immediately.
  explicit operator bool() const { return true; }
  void print(const char* s) { out += s; }
  void print(int v) { out += std::to_string(v); }
  void print(int v, int base) {
    if (base != HEX) { out += std::to_string(v); return; }
    char buf[16];
    snprintf(buf, sizeof(buf), "%X", (unsigned)v);
    out += buf;
  }
  void println(int v, int base) { print(v, base); out += "\n"; }
  void println(const char* s) { out += s; out += "\n"; }
  void println(int v) { out += std::to_string(v); out += "\n"; }
  void println() { out += "\n"; }
  template <class T> void print(const T& v) { out += std::string(v); }
  template <class T> void println(const T& v) { out += std::string(v); out += "\n"; }
  int printf(const char* fmt, ...) { (void)fmt; return 0; }
};
extern FakeSerial Serial;

// --------------------------------------------------------------------- WiFi

typedef int WiFiEvent_t;
typedef struct { struct { int reason; } wifi_sta_disconnected; } WiFiEventInfo_t;
#define ARDUINO_EVENT_WIFI_STA_DISCONNECTED 1
#define WIFI_STA 1
#define WL_CONNECTED 3
#define WL_IDLE_STATUS 0
#define WIFI_POWER_8_5dBm 34

struct IPAddress {
  std::string s;
  IPAddress(const char* v = "0.0.0.0") : s(v) {}
  operator std::string() const { return s; }
};

// g_wifi_connect_after_ms: how long WiFi.begin() takes to associate.
// Set it beyond WIFI_TIMEOUT_MS to exercise the red-LED failure path.
extern unsigned long g_wifi_connect_after_ms;
extern unsigned long g_wifi_begin_ms;
extern bool g_wifi_begun;

struct FakeWiFi {
  void mode(int) {}
  void setSleep(bool) {}
  void setTxPower(int) {}
  template <class F> void onEvent(F, int) {}
  void begin(const char*, const char*) { g_wifi_begun = true; g_wifi_begin_ms = millis(); }
  int status() {
    if (!g_wifi_begun) return WL_IDLE_STATUS;
    return (millis() - g_wifi_begin_ms >= g_wifi_connect_after_ms) ? WL_CONNECTED : WL_IDLE_STATUS;
  }
  IPAddress localIP() { return IPAddress("192.168.31.99"); }
  IPAddress gatewayIP() { return IPAddress("192.168.31.1"); }
};
extern FakeWiFi WiFi;

// ---------------------------------------------------------------------- UDP

// Captures outbound datagrams and serves inbound ones queued by the test.
struct SentPacket { std::string host; uint16_t port; std::string data; };
extern std::vector<SentPacket> g_udp_sent;
extern std::deque<std::string> g_udp_rx;     // datagrams waiting to be read
extern bool g_udp_endpacket_fails;

struct FakeUDP {
  std::string cur_host; uint16_t cur_port = 0; std::string cur_data;
  std::string rx_current; size_t rx_pos = 0;

  void begin(uint16_t) {}
  int beginPacket(const char* host, uint16_t port) {
    cur_host = host; cur_port = port; cur_data.clear(); return 1;
  }
  size_t write(const uint8_t* buf, size_t len) {
    cur_data.append(reinterpret_cast<const char*>(buf), len); return len;
  }
  int endPacket() {
    if (g_udp_endpacket_fails) return 0;
    g_udp_sent.push_back({cur_host, cur_port, cur_data});
    return 1;
  }
  int parsePacket() {
    if (g_udp_rx.empty()) return 0;
    rx_current = g_udp_rx.front(); g_udp_rx.pop_front(); rx_pos = 0;
    return static_cast<int>(rx_current.size());
  }
  int read(char* buf, size_t maxlen) {
    size_t n = rx_current.size() - rx_pos;
    if (n > maxlen) n = maxlen;
    memcpy(buf, rx_current.data() + rx_pos, n);
    rx_pos += n;
    return static_cast<int>(n);
  }
};
extern FakeUDP udp_fake_unused;   // the sketch declares its own `WiFiUDP udp;`
typedef FakeUDP WiFiUDP;

// --------------------------------------------------------------------- Wire

// Scripted I2C. The test pushes the bytes the MPU6050 should return and can
// read back every register write the sketch performed.
struct I2CWrite { uint8_t addr; std::vector<uint8_t> bytes; };
extern std::vector<I2CWrite> g_i2c_writes;
extern std::deque<uint8_t> g_i2c_rx;
extern int g_i2c_endtransmission_result;   // non-zero simulates NACK / no module

struct FakeWire {
  uint8_t cur_addr = 0;
  std::vector<uint8_t> cur_bytes;
  size_t avail = 0;

  void begin(int, int) {}
  void setClock(uint32_t) {}
  void beginTransmission(uint8_t a) { cur_addr = a; cur_bytes.clear(); }
  size_t write(uint8_t b) { cur_bytes.push_back(b); return 1; }
  uint8_t endTransmission(bool = true) {
    g_i2c_writes.push_back({cur_addr, cur_bytes});
    return static_cast<uint8_t>(g_i2c_endtransmission_result);
  }
  uint8_t requestFrom(uint8_t, size_t n) {
    avail = (g_i2c_rx.size() < n) ? g_i2c_rx.size() : n;
    return static_cast<uint8_t>(avail);
  }
  uint8_t requestFrom(uint8_t a, int n) { return requestFrom(a, static_cast<size_t>(n)); }
  uint8_t requestFrom(int a, int n) { return requestFrom(static_cast<uint8_t>(a), static_cast<size_t>(n)); }
  int available() { return static_cast<int>(avail); }
  int read() {
    if (g_i2c_rx.empty() || avail == 0) return 0;
    uint8_t v = g_i2c_rx.front(); g_i2c_rx.pop_front(); avail--;
    return v;
  }
};
extern FakeWire Wire;

// ------------------------------------------------------------------ helpers

void shim_reset();   // clear every recorder between tests
