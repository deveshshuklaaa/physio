// PHASE 1 -- ESP32-C3 -> ESP32-S3 port (PORT_C3_TO_S3.md sections 1-2).
//
// What must change: INPUT_PIN off the GPIO3 strapping pin, and the plain
// active-LOW LED replaced by the WS2812 helpers. digitalWrite() on the LED pin
// compiles and runs on the S3 but lights nothing, which would leave a
// powerbank demo with no status channel at all.

#include "harness.h"

int main() {
  std::cout << "PHASE 1: C3 -> S3 port (pins, RGB LED)\n";

  g_current_test = "INPUT_PIN moved off strapping pin GPIO3";
  CHECK_EQ(INPUT_PIN, 4, "INPUT_PIN must be 4 (ADC1_CH3, not a strapping pin). Rewire the BioAmp OUT lead too.");

  g_current_test = "no PSRAM or strapping pins claimed";
  CHECK(INPUT_PIN != 35 && INPUT_PIN != 36 && INPUT_PIN != 37,
        "GPIO35/36/37 are taken by OPI PSRAM on the N16R8");
  CHECK(INPUT_PIN != 0 && INPUT_PIN != 46, "GPIO0 and GPIO46 are strapping pins");

  g_current_test = "RGB_LED_PIN defined for the S3 WS2812";
  CHECK_EQ(RGB_LED_PIN, 48, "RGB_LED_PIN must be 48 (try 38 if nothing lights on your board revision)");

  g_current_test = "ledSet drives the WS2812";
  base_reset();
  ledSet(1, 2, 3);
  CHECK_EQ(g_led_writes.size(), (size_t)1, "ledSet must call neopixelWrite exactly once");
  if (!g_led_writes.empty()) {
    CHECK_EQ(g_led_writes[0].pin, RGB_LED_PIN, "ledSet must write to RGB_LED_PIN");
    CHECK_EQ((int)g_led_writes[0].r, 1, "red channel passed through");
    CHECK_EQ((int)g_led_writes[0].g, 2, "green channel passed through");
    CHECK_EQ((int)g_led_writes[0].b, 3, "blue channel passed through");
  }

  g_current_test = "named colours match the spec, at low brightness";
  struct Case { const char* name; void (*fn)(); int r, g, b; };
  Case cases[] = {
    {"ledBlue",   ledBlue,   0,  0,  40},
    {"ledYellow", ledYellow, 40, 30, 0 },
    {"ledGreen",  ledGreen,  0,  40, 0 },
    {"ledRed",    ledRed,    40, 0,  0 },
    {"ledOff",    ledOff,    0,  0,  0 },
  };
  for (auto& c : cases) {
    base_reset();
    c.fn();
    CHECK_EQ(g_led_writes.size(), (size_t)1, std::string(c.name) + " must emit exactly one LED write");
    if (g_led_writes.empty()) continue;
    CHECK_EQ((int)g_led_writes[0].r, c.r, std::string(c.name) + " red channel");
    CHECK_EQ((int)g_led_writes[0].g, c.g, std::string(c.name) + " green channel");
    CHECK_EQ((int)g_led_writes[0].b, c.b, std::string(c.name) + " blue channel");
    CHECK(c.r <= 64 && c.g <= 64 && c.b <= 64,
          std::string(c.name) + " must stay dim -- full-scale WS2812 is blinding up close and wastes powerbank current");
  }

  g_current_test = "the old digitalWrite LED code is gone";
  base_reset();
  g_wifi_connect_after_ms = 300;
  setup();
  bool wrote_led_gpio = false;
  for (auto& w : g_digital_writes) if (w.first == 8 || w.first == 48) wrote_led_gpio = true;
  CHECK(!wrote_led_gpio, "digitalWrite() on the LED pin lights nothing on the S3 -- remove it");
  CHECK(g_led_writes.size() > 0, "setup() must show status through neopixelWrite instead");

  g_current_test = "EMGFilter is untouched by the port";
  // Same 500 Hz coefficients as the C3 build: a DC input must decay toward zero
  // through the band-pass, and the filter must stay finite.
  base_reset();
  float last = 0.0f;
  for (int i = 0; i < 2000; i++) last = EMGFilter(2048.0f);
  CHECK(last == last, "EMGFilter must not produce NaN");
  CHECK(last > -1.0f && last < 1.0f, "a constant input must settle near zero through a 74.5-149.5 Hz band-pass");

  g_current_test = "getEnvelop is untouched by the port";
  base_reset();
  int env = 0;
  for (int i = 0; i < BUFFER_SIZE; i++) env = getEnvelop(100);
  CHECK_EQ(env, 200, "a steady |signal| of 100 over a full 128-sample window must give (100)*2");

  return report();
}
