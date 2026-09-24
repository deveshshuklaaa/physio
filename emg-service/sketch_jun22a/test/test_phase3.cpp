// PHASE 3 -- HELLO/ACK handshake (RGB_MPU6050_WEBSITE.md section 2.1).
//
// Without this the firmware fires UDP one-way and never learns whether anything
// is listening, so a wrong HOST_IP or a blocking firewall shows up as a
// confident "connected" light. Green must mean "app.py is actually receiving".

#include "harness.h"

static void reset() {
  base_reset();
  handshaked = false;
  last_ack_ms = 0;
  last_hello_ms = 0;
  // Phase 11's LED table keys on mpu_ok as well as the link state. This file
  // tests the LINK, so declare a healthy IMU and let phase 11 cover the
  // MPU-fault colours.
  mpu_ok = true;
  calibrating = false;
}

static int count_hellos() {
  int n = 0;
  for (auto& p : g_udp_sent) if (p.data.rfind("HELLO", 0) == 0) n++;
  return n;
}

int main() {
  std::cout << "PHASE 3: HELLO/ACK handshake\n";

  g_current_test = "sendHello emits HELLO to the configured host";
  reset();
  sendHello();
  CHECK_EQ(g_udp_sent.size(), (size_t)1, "sendHello must send exactly one datagram");
  if (!g_udp_sent.empty()) {
    CHECK(g_udp_sent[0].data.rfind("HELLO", 0) == 0,
          "must begin with HELLO so a server that only checks the prefix still matches "
          "(phase 11 appends the calibration payload and owns its exact format)");
    CHECK_EQ(g_udp_sent[0].host, std::string(HOST_IP), "must be addressed to HOST_IP");
    CHECK_EQ((int)g_udp_sent[0].port, (int)HOST_PORT, "must be addressed to HOST_PORT");
  }

  g_current_test = "pollRx is a no-op when nothing is waiting";
  reset();
  pollRx();
  CHECK(!handshaked, "no inbound packet means no handshake");
  CHECK_EQ(last_ack_ms, 0UL, "last_ack_ms must not move without an ACK");

  g_current_test = "pollRx accepts ACK and stamps the time";
  reset();
  g_micros += 7000 * 1000UL;                   // the fake clock only moves forward
  unsigned long now = millis();
  g_udp_rx.push_back("ACK\n");
  pollRx();
  CHECK(handshaked, "an ACK datagram must set handshaked");
  CHECK_EQ(last_ack_ms, now, "last_ack_ms must be stamped with millis()");

  g_current_test = "pollRx ignores unrelated traffic";
  reset();
  g_udp_rx.push_back("NOPE\n");
  pollRx();
  CHECK(!handshaked, "a non-ACK payload must not fake a handshake");

  g_current_test = "pollRx handles an oversized packet safely";
  reset();
  g_udp_rx.push_back(std::string(200, 'A'));   // larger than rxbuf
  pollRx();
  CHECK(!handshaked, "oversized junk must not be read as an ACK, and must not overrun rxbuf");

  g_current_test = "loop re-announces about every 2 s until acknowledged";
  reset();
  pump_samples(SAMPLE_RATE * 5);               // 5 seconds
  int hellos = count_hellos();
  CHECK(hellos >= 2, "a late-started app.py must still get picked up without a board reset");
  CHECK(hellos <= 4, "do not announce faster than every 2 s");

  g_current_test = "loop stops announcing once acknowledged";
  reset();
  g_udp_rx.push_back("ACK\n");
  pump_samples(SAMPLE_RATE * 3);
  CHECK(handshaked, "loop() must call pollRx and pick up the queued ACK");
  CHECK_EQ(count_hellos(), 0, "no further HELLO once handshaked");

  g_current_test = "green pulses only while handshaked";
  reset();
  g_udp_rx.push_back("ACK\n");
  pump_samples(SAMPLE_RATE * 2);
  int green_pulses = 0;
  for (auto& w : g_led_writes) if (w.r == 0 && w.b == 0 && w.g > 0) green_pulses++;
  CHECK(green_pulses >= 2, "a confirmed link must show a ~2 Hz green pulse");

  g_current_test = "no green heartbeat before the handshake";
  reset();
  pump_samples(SAMPLE_RATE * 2);
  int bright_green = 0;
  for (auto& w : g_led_writes) if (w.r == 0 && w.b == 0 && w.g >= 40) bright_green++;
  CHECK_EQ(bright_green, 0, "unacknowledged streaming must not look the same as a confirmed link");

  g_current_test = "LED calls stay rare enough not to glitch the sample loop";
  reset();
  g_udp_rx.push_back("ACK\n");
  pump_samples(SAMPLE_RATE);                   // 1 second
  CHECK(g_led_writes.size() <= 6,
        "WS2812 timing is interrupt-sensitive -- at most a couple of LED writes per second");

  g_current_test = "a stale ACK falls back to yellow within 5 s";
  reset();
  g_udp_rx.push_back("ACK\n");
  pump_samples(SAMPLE_RATE);                   // 1 s: handshake lands
  CHECK(handshaked, "precondition: handshake established");
  g_led_writes.clear();
  pump_samples(SAMPLE_RATE * 7);               // 7 s of server silence
  CHECK(!handshaked, "an ACK older than 5 s means the server went away");
  bool yellow = false;
  for (auto& w : g_led_writes) if (w.r == 40 && w.g == 30 && w.b == 0) yellow = true;
  CHECK(yellow, "going stale must drop the LED back to YELLOW");

  g_current_test = "a fresh ACK re-establishes the link";
  g_udp_rx.push_back("ACK\n");
  pump_samples(SAMPLE_RATE);
  CHECK(handshaked, "the link must recover when app.py comes back, without a reset");

  g_current_test = "sample streaming continues regardless of handshake state";
  reset();
  int before = (int)g_udp_sent.size();
  pump_samples(SAMPLE_RATE * 2);
  int data_packets = 0;
  for (size_t i = before; i < g_udp_sent.size(); i++)
    if (g_udp_sent[i].data.rfind("HELLO", 0) != 0) data_packets++;
  CHECK(data_packets > 0, "an unacknowledged board must still stream samples -- the handshake is status only");

  return report();
}
