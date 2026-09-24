// PHASE 11 -- RECAL command, calibration payloads, six-state LED.
//
// The board never re-runs setup() on a soft recalibration, so offsets travel by
// two paths with an identical payload: appended to HELLO at real boot, and as a
// standalone CAL message after a RECAL command.
//
// LED table:
//   setup / calibrating      blue        solid
//   WiFi failed              red         blink (setup, forever)
//   no handshake, MPU ok     yellow      solid
//   no handshake, MPU bad    purple      blink
//   handshake,    MPU ok     green       blink
//   handshake,    MPU bad    light blue  blink

#include "harness.h"

static void queue_frames(int n, int16_t ax_v, int16_t ay_v, int16_t az_v,
                         int16_t gx_v, int16_t gy_v, int16_t gz_v) {
  for (int i = 0; i < n; i++) {
    int16_t vals[7] = {ax_v, ay_v, az_v, 0, gx_v, gy_v, gz_v};
    for (int k = 0; k < 7; k++) {
      g_i2c_rx.push_back((uint8_t)((vals[k] >> 8) & 0xFF));
      g_i2c_rx.push_back((uint8_t)(vals[k] & 0xFF));
    }
  }
}

static void reset_linked() {
  base_reset();
  g_i2c_rx.push_back(0x68);
  mpuInit();
  handshaked = false;
  last_ack_ms = 0;
  last_hello_ms = 0;
  calibrating = false;
  g_led_writes.clear();
  g_udp_sent.clear();
}

static const SentPacket* find_prefix(const char* pfx) {
  for (auto& p : g_udp_sent) if (p.data.rfind(pfx, 0) == 0) return &p;
  return nullptr;
}

int main() {
  std::cout << "PHASE 11: RECAL command, payloads, LED state machine\n";

  // ---------------------------------------------------------------- payloads

  g_current_test = "HELLO carries the calibration offsets";
  reset_linked();
  cal_ax = 300; cal_ay = -150; cal_az = 116;
  cal_gx = -20; cal_gy = 8;    cal_gz = 3;
  cal_shaky = false;
  sendHello();
  CHECK_EQ(g_udp_sent.size(), (size_t)1, "one datagram");
  if (!g_udp_sent.empty()) {
    std::string d = g_udp_sent[0].data;
    CHECK(d.rfind("HELLO ", 0) == 0, "must still begin with HELLO so an old server still matches");
    CHECK_EQ(d, std::string("HELLO 300,-150,116,-20,8,3,1,0\n"),
             "payload is ax,ay,az,gx,gy,gz,mpu_ok,shaky");
  }

  g_current_test = "HELLO reports a dead MPU and a shaky calibration";
  reset_linked();
  mpu_ok = false;
  cal_ax = cal_ay = cal_az = cal_gx = cal_gy = cal_gz = 0;
  cal_shaky = true;
  sendHello();
  if (!g_udp_sent.empty())
    CHECK_EQ(g_udp_sent[0].data, std::string("HELLO 0,0,0,0,0,0,0,1\n"),
             "mpu_ok=0 and shaky=1 must reach the server");

  g_current_test = "CAL uses the same payload after the keyword";
  reset_linked();
  cal_ax = 1; cal_ay = 2; cal_az = 3; cal_gx = 4; cal_gy = 5; cal_gz = 6;
  cal_shaky = false;
  sendCal();
  CHECK_EQ(g_udp_sent.size(), (size_t)1, "one datagram");
  if (!g_udp_sent.empty())
    CHECK_EQ(g_udp_sent[0].data, std::string("CAL 1,2,3,4,5,6,1,0\n"),
             "one parser must serve both HELLO and CAL");

  // ------------------------------------------------------------------- RECAL

  g_current_test = "pollRx still accepts ACK";
  reset_linked();
  g_micros += 5000 * 1000UL;
  unsigned long now = millis();
  g_udp_rx.push_back("ACK\n");
  pollRx();
  CHECK(handshaked, "ACK must still establish the handshake");
  CHECK_EQ(last_ack_ms, now, "and stamp last_ack_ms");

  g_current_test = "RECAL triggers a calibration and reports back";
  reset_linked();
  g_udp_rx.push_back("ACK\n");
  pollRx();
  g_udp_sent.clear();
  queue_frames(CAL_SAMPLES + 4, 500, -200, 16400, -7, 2, 9);
  g_udp_rx.push_back("RECAL\n");
  pollRx();
  CHECK(cal_valid, "RECAL must actually re-run the calibration");
  CHECK_EQ((int)cal_ax, 500, "offsets come from the new resting reading");
  CHECK_EQ((int)cal_az, 16, "az offset stays gravity-relative (16400 - 16384)");
  const SentPacket* cal = find_prefix("CAL ");
  CHECK(cal != nullptr, "RECAL must answer with a CAL message carrying the new offsets");
  if (cal) CHECK_EQ(cal->data, std::string("CAL 500,-200,16,-7,2,9,1,0\n"), "CAL payload");

  g_current_test = "RECAL does not tear down the handshake";
  CHECK(handshaked, "a soft recalibration must leave the link up -- no reboot, no re-handshake");
  CHECK(find_prefix("HELLO") == nullptr, "RECAL must not re-announce with HELLO");

  g_current_test = "RECAL clears the calibrating flag when done";
  CHECK(!calibrating, "calibrating must be false again once the offsets are computed");

  g_current_test = "RECAL flushes a partial batch instead of corrupting it";
  reset_linked();
  g_udp_rx.push_back("ACK\n");
  pollRx();
  queue_frames(4000, 0, 0, ACCEL_1G, 0, 0, 0);
  pump_samples(BATCH_SIZE / 2);            // half a batch sitting in txbuf
  g_udp_sent.clear();
  g_udp_rx.push_back("RECAL\n");
  pollRx();
  CHECK_EQ(txlen, 0, "txbuf must be emptied across a recalibration");
  CHECK_EQ(batch, 0, "the batch counter must be reset with it");
  for (auto& p : g_udp_sent) {
    if (p.data.rfind("CAL", 0) == 0) continue;
    CHECK(!p.data.empty() && p.data.back() == '\n',
          "any flushed sample datagram must end on a line boundary");
  }

  g_current_test = "an unknown command is ignored";
  reset_linked();
  g_udp_rx.push_back("WOBBLE\n");
  pollRx();
  CHECK(!handshaked, "junk must not establish a handshake");
  CHECK_EQ(g_udp_sent.size(), (size_t)0, "junk must not trigger a reply");

  // --------------------------------------------------------------- LED table

  g_current_test = "ledState resolves the six states";
  reset_linked();
  calibrating = true;  handshaked = false; mpu_ok = true;
  CHECK_EQ((int)ledState(), (int)LED_CALIBRATING, "calibrating outranks link state");
  calibrating = true;  handshaked = true;  mpu_ok = false;
  CHECK_EQ((int)ledState(), (int)LED_CALIBRATING, "still calibrating even with a dead MPU");

  calibrating = false; handshaked = false; mpu_ok = true;
  CHECK_EQ((int)ledState(), (int)LED_NO_ACK_OK, "no handshake, MPU ok");
  calibrating = false; handshaked = false; mpu_ok = false;
  CHECK_EQ((int)ledState(), (int)LED_NO_ACK_BAD, "no handshake, MPU bad");
  calibrating = false; handshaked = true;  mpu_ok = true;
  CHECK_EQ((int)ledState(), (int)LED_OK, "handshake, MPU ok");
  calibrating = false; handshaked = true;  mpu_ok = false;
  CHECK_EQ((int)ledState(), (int)LED_MPU_BAD, "handshake, MPU bad");

  g_current_test = "no handshake + MPU ok is a solid yellow glow";
  reset_linked();
  handshaked = false; mpu_ok = true; calibrating = false;
  for (int i = 0; i < 6; i++) ledUpdate();
  CHECK(g_led_writes.size() >= 2, "ledUpdate must drive the LED");
  {
    bool all_yellow = true;
    for (auto& w : g_led_writes) if (!(w.r == 40 && w.g == 30 && w.b == 0)) all_yellow = false;
    CHECK(all_yellow, "yellow must glow solid, never blink");
  }

  g_current_test = "calibrating is a solid blue glow";
  reset_linked();
  calibrating = true;
  for (int i = 0; i < 6; i++) ledUpdate();
  {
    bool all_blue = true;
    for (auto& w : g_led_writes) if (!(w.r == 0 && w.g == 0 && w.b == 40)) all_blue = false;
    CHECK(all_blue, "blue must glow solid while calibrating");
  }

  g_current_test = "handshake + MPU ok blinks green, not a dim glow";
  reset_linked();
  handshaked = true; mpu_ok = true; calibrating = false;
  for (int i = 0; i < 6; i++) ledUpdate();
  {
    int on = 0, off = 0, dim = 0;
    for (auto& w : g_led_writes) {
      if (w.r == 0 && w.g == 40 && w.b == 0) on++;
      else if (w.r == 0 && w.g == 0 && w.b == 0) off++;
      else if (w.g > 0 && w.g < 40) dim++;
    }
    CHECK(on >= 2, "green must actually light");
    CHECK(off >= 2, "green must go fully OFF between pulses -- a blink, not a dim glow");
    CHECK_EQ(dim, 0, "no half-brightness green: the old dim-green heartbeat is gone");
  }

  g_current_test = "no handshake + MPU bad blinks purple";
  reset_linked();
  handshaked = false; mpu_ok = false; calibrating = false;
  for (int i = 0; i < 6; i++) ledUpdate();
  {
    int on = 0, off = 0;
    for (auto& w : g_led_writes) {
      if (w.r > 0 && w.b > 0 && w.g == 0) on++;
      if (w.r == 0 && w.g == 0 && w.b == 0) off++;
    }
    CHECK(on >= 2, "purple = red and blue together, no green");
    CHECK(off >= 2, "purple must blink");
  }

  g_current_test = "handshake + MPU bad blinks light blue";
  reset_linked();
  handshaked = true; mpu_ok = false; calibrating = false;
  for (int i = 0; i < 6; i++) ledUpdate();
  {
    int on = 0, off = 0;
    for (auto& w : g_led_writes) {
      if (w.r == 0 && w.g > 0 && w.b > 0) on++;      // cyan-ish: green + blue, no red
      if (w.r == 0 && w.g == 0 && w.b == 0) off++;
    }
    CHECK(on >= 2, "light blue = green and blue together, no red");
    CHECK(off >= 2, "light blue must blink");
  }

  g_current_test = "the four blink states are visually distinct";
  {
    LedWrite seen[4];
    const bool hs[4]  = {false, false, true,  true};
    const bool mpu[4] = {true,  false, true,  false};
    for (int i = 0; i < 4; i++) {
      reset_linked();
      calibrating = false; handshaked = hs[i]; mpu_ok = mpu[i];
      ledUpdate();
      seen[i] = g_led_writes.empty() ? LedWrite{0, 0, 0, 0} : g_led_writes.front();
    }
    for (int i = 0; i < 4; i++)
      for (int j = i + 1; j < 4; j++)
        CHECK(!(seen[i].r == seen[j].r && seen[i].g == seen[j].g && seen[i].b == seen[j].b),
              "states " + std::to_string(i) + " and " + std::to_string(j) +
              " must not share a colour -- the LED is the only status channel on battery");
  }

  g_current_test = "LED writes stay rare enough not to glitch a sample";
  reset_linked();
  g_udp_rx.push_back("ACK\n");
  queue_frames(4000, 0, 0, ACCEL_1G, 0, 0, 0);
  pump_samples(SAMPLE_RATE);              // one second
  CHECK(g_led_writes.size() <= 6,
        "WS2812 timing is interrupt-sensitive: at most a couple of writes per second");

  return report();
}
