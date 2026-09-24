// PHASE 5 -- 8-field packet format and buffer sizing
// (RGB_MPU6050_WEBSITE.md section 4).
//
//   <signal>,<envelop>,<ax>,<ay>,<az>,<gx>,<gy>,<gz>\n
//
// The old line was ~10 chars; the new one is up to 56. snprintf truncates
// rather than crashing, so an undersized txbuf fails as corrupted trailing
// samples -- silent, and only visible as garbage at the end of every packet.

#include "harness.h"

// Bring the MPU up with a healthy WHO_AM_I and queue plenty of IMU frames so
// loop() never stalls waiting for I2C data.
static void reset_with_mpu(uint8_t fill = 0x00) {
  base_reset();
  g_i2c_rx.push_back(0x68);
  mpuInit();
  for (int i = 0; i < 8000; i++) g_i2c_rx.push_back(fill);
}

int main() {
  std::cout << "PHASE 5: packet format and buffer sizing\n";

  g_current_test = "txbuf and the batch size were both raised";
  CHECK(sizeof(txbuf) >= 1024,
        "txbuf[512] overflows with 8 fields -- snprintf truncates silently");
  CHECK(BATCH_SIZE <= 20,
        "a batch of 50 wide lines will not fit in one datagram");
  CHECK(BATCH_SIZE >= 10,
        "too small a batch wastes airtime on UDP headers");

  g_current_test = "a worst-case batch fits with no truncation";
  {
    // Every field at its widest ("-32768" = 6 chars): 8*6 + 7 commas + \n = 56.
    char probe[sizeof(txbuf)];
    int len = 0;
    bool truncated = false;
    for (int i = 0; i < BATCH_SIZE; i++) {
      int n = snprintf(probe + len, sizeof(probe) - len,
                       "%d,%d,%d,%d,%d,%d,%d,%d\n",
                       -32768, -32768, -32768, -32768, -32768, -32768, -32768, -32768);
      if (n < 0 || (size_t)n >= sizeof(probe) - (size_t)len) truncated = true;
      len += n;
    }
    CHECK(!truncated,
          "BATCH_SIZE widest-case lines must fit in txbuf -- size txbuf for 56 bytes/line, not the ~48 byte average");
    CHECK(len <= 1400, "one datagram must stay under the ~1470 byte UDP MTU");
  }

  g_current_test = "a full batch goes out as one datagram of 8-field lines";
  reset_with_mpu(0x11);
  for (int i = 0; i < 400; i++) g_adc_values.push_back(2048 + (i % 64) * 8);
  pump_samples(BATCH_SIZE);
  CHECK_EQ(g_udp_sent.size(), (size_t)1, "exactly one datagram after BATCH_SIZE samples");
  if (!g_udp_sent.empty()) {
    const std::string& d = g_udp_sent[0].data;
    CHECK(!d.empty() && d.back() == '\n',
          "the datagram must end on a line boundary -- a trailing partial line is truncation");
    auto lines = split_lines(d);
    CHECK_EQ(lines.size(), (size_t)BATCH_SIZE, "one line per sample");
    for (size_t i = 0; i < lines.size(); i++)
      CHECK_EQ(split_fields(lines[i]).size(), (size_t)8,
               "line " + std::to_string(i) + " must be signal,envelop,ax,ay,az,gx,gy,gz");
  }

  g_current_test = "the packet carries the live IMU values";
  reset_with_mpu(0x00);                      // all-zero IMU frames
  pump_samples(BATCH_SIZE);
  if (!g_udp_sent.empty()) {
    auto lines = split_lines(g_udp_sent[0].data);
    if (!lines.empty()) {
      auto f = split_fields(lines.back());
      CHECK_EQ(f.size(), (size_t)8, "8 fields on the wire");
      if (f.size() == 8)
        for (int i = 2; i < 8; i++)
          CHECK_EQ(f[i], std::string("0"),
                   "field " + std::to_string(i) + " must come from mpuRead, not be hard-coded");
    }
  }

  g_current_test = "IMU fields track a non-zero reading";
  base_reset();
  g_i2c_rx.push_back(0x68);
  mpuInit();
  {
    const uint8_t frame[14] = {
      0x01, 0x02,   // ax =  258
      0xFF, 0xFE,   // ay =   -2
      0x40, 0x00,   // az = 16384
      0x00, 0x00,   // temperature
      0x00, 0x64,   // gx =  100
      0x00, 0x00,   // gy =    0
      0x00, 0x00,   // gz =    0
    };
    for (int rep = 0; rep < 200; rep++)
      for (uint8_t b : frame) g_i2c_rx.push_back(b);
  }
  pump_samples(BATCH_SIZE);
  if (!g_udp_sent.empty()) {
    auto lines = split_lines(g_udp_sent[0].data);
    if (!lines.empty()) {
      auto f = split_fields(lines.back());
      if (f.size() == 8) {
        CHECK_EQ(f[2], std::string("258"),   "ax on the wire");
        CHECK_EQ(f[3], std::string("-2"),    "ay on the wire, negative values must survive formatting");
        CHECK_EQ(f[4], std::string("16384"), "az on the wire");
        CHECK_EQ(f[5], std::string("100"),   "gx on the wire");
      }
    }
  }

  g_current_test = "buffer state resets after every send";
  reset_with_mpu(0x22);
  pump_samples(BATCH_SIZE * 3);
  CHECK_EQ(g_udp_sent.size(), (size_t)3, "three full batches produce three datagrams");
  for (size_t i = 0; i < g_udp_sent.size(); i++)
    CHECK_EQ(split_lines(g_udp_sent[i].data).size(), (size_t)BATCH_SIZE,
             "datagram " + std::to_string(i) + " must be a whole batch (txlen and batch reset after send)");

  g_current_test = "a failed send does not wedge the buffer";
  reset_with_mpu(0x00);
  g_udp_endpacket_fails = true;
  pump_samples(BATCH_SIZE * 2);              // two batches lost to send failures
  g_udp_endpacket_fails = false;
  pump_samples(BATCH_SIZE);
  CHECK_EQ(g_udp_sent.size(), (size_t)1, "after send failures the next batch must still go out");
  if (!g_udp_sent.empty())
    CHECK_EQ(split_lines(g_udp_sent[0].data).size(), (size_t)BATCH_SIZE,
             "a failed endPacket must still clear txlen -- otherwise the buffer fills and every later packet truncates");

  g_current_test = "sustained streaming never truncates a line";
  reset_with_mpu(0x33);
  for (int i = 0; i < 4000; i++) g_adc_values.push_back((i * 137) % 4096);
  pump_samples(BATCH_SIZE * 40);
  CHECK(g_udp_sent.size() >= 40, "sustained sampling must keep producing datagrams");
  for (size_t i = 0; i < g_udp_sent.size(); i++) {
    const std::string& d = g_udp_sent[i].data;
    CHECK(!d.empty() && d.back() == '\n', "datagram " + std::to_string(i) + " ends on a line boundary");
    CHECK(d.size() <= 1400, "datagram " + std::to_string(i) + " stays under the UDP MTU");
    for (auto& ln : split_lines(d))
      if (split_fields(ln).size() != 8) {
        CHECK(false, "truncated line in datagram " + std::to_string(i) + ": \"" + ln + "\"");
        break;
      }
  }

  return report();
}
