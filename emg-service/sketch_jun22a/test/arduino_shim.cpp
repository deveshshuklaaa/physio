#include "arduino_shim.h"

unsigned long g_micros = 0;
long g_delay_budget = -1;

std::vector<std::pair<int,int>> g_digital_writes;
int g_pin_state[64] = {0};

std::deque<int> g_adc_values;
int g_last_adc_value = 2048;

std::vector<LedWrite> g_led_writes;

FakeSerial Serial;

unsigned long g_wifi_connect_after_ms = 500;
unsigned long g_wifi_begin_ms = 0;
bool g_wifi_begun = false;
FakeWiFi WiFi;

std::vector<SentPacket> g_udp_sent;
std::deque<std::string> g_udp_rx;
bool g_udp_endpacket_fails = false;
FakeUDP udp_fake_unused;

std::vector<I2CWrite> g_i2c_writes;
std::deque<uint8_t> g_i2c_rx;
int g_i2c_endtransmission_result = 0;
FakeWire Wire;

void shim_reset() {
  // Deliberately does NOT rewind g_micros. Real micros() only ever moves
  // forward, and loop()'s `past`/`timer` statics are unreachable from a test,
  // so rewinding the clock here would hand the firmware a backwards jump it
  // can never see on hardware and wedge the sample timer.
  g_delay_budget = -1;
  g_digital_writes.clear();
  memset(g_pin_state, 0, sizeof(g_pin_state));
  g_adc_values.clear();
  g_last_adc_value = 2048;
  g_led_writes.clear();
  Serial.out.clear();
  g_wifi_connect_after_ms = 500;
  g_wifi_begin_ms = 0;
  g_wifi_begun = false;
  g_udp_sent.clear();
  g_udp_rx.clear();
  g_udp_endpacket_fails = false;
  g_i2c_writes.clear();
  g_i2c_rx.clear();
  g_i2c_endtransmission_result = 0;
}
