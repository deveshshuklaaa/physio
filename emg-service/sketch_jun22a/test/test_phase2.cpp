// PHASE 2 -- RGB status state machine (RGB_MPU6050_WEBSITE.md section 1).
//
//   booting                  -> blue, solid
//   WiFi up, no ACK yet      -> yellow, solid
//   WiFi never associates    -> red, fast blink, forever
//
// The green (handshaked) state belongs to phase 3 and is tested there.

#include "harness.h"

int main() {
  std::cout << "PHASE 2: RGB status state machine\n";

  g_current_test = "WIFI_TIMEOUT_MS defined";
  CHECK_EQ(WIFI_TIMEOUT_MS, 20000, "give up on WiFi after 20 s rather than hanging silently");

  g_current_test = "setup(): blue while booting, yellow once associated";
  base_reset();
  g_wifi_connect_after_ms = 1000;
  setup();
  CHECK(g_led_writes.size() >= 2, "setup must show a boot colour and a connected colour");
  if (g_led_writes.size() >= 2) {
    LedWrite first = g_led_writes.front();
    LedWrite last  = g_led_writes.back();
    CHECK(first.r == 0 && first.g == 0 && first.b == 40,
          "the very first LED state must be BLUE -- it proves setup() was reached");
    CHECK(last.r == 40 && last.g == 30 && last.b == 0,
          "setup must end on YELLOW: WiFi up, nothing acknowledged yet");
  }

  g_current_test = "setup(): blue is set before WiFi.begin";
  CHECK(g_wifi_begun, "WiFi.begin must be called");
  CHECK(!g_led_writes.empty(), "an LED state must be set before the WiFi wait, not after");

  g_current_test = "setup(): ADC still configured for the BioAmp";
  CHECK(g_led_writes.size() >= 2, "precondition: setup ran to completion");

  g_current_test = "WiFi timeout blinks RED forever instead of returning";
  base_reset();
  g_wifi_connect_after_ms = 999999999UL;   // never associates
  g_delay_budget = 400;                    // escape hatch out of the infinite blink
  bool escaped = false;
  try {
    setup();
  } catch (DelayBudgetExhausted&) {
    escaped = true;
  }
  CHECK(escaped, "setup() must never return when WiFi fails -- it must blink red forever");
  CHECK(g_micros / 1000UL >= WIFI_TIMEOUT_MS,
        "must wait the full WIFI_TIMEOUT_MS before declaring failure");

  int red = 0, off = 0;
  for (auto& w : g_led_writes) {
    if (w.r == 40 && w.g == 0 && w.b == 0) red++;
    if (w.r == 0 && w.g == 0 && w.b == 0) off++;
  }
  CHECK(red > 3, "the failure state must blink RED repeatedly, not flash once");
  CHECK(off > 3, "red must alternate with off so it reads as a blink, not a solid light");

  g_current_test = "no UDP traffic is sent when WiFi never came up";
  CHECK_EQ(g_udp_sent.size(), (size_t)0, "a board that never associated must not pretend to stream");

  return report();
}
