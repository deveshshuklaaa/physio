// PHASE 4 -- MPU6050 over raw Wire (RGB_MPU6050_WEBSITE.md section 3).
//
// No Adafruit library: a library install can fail without internet. Raw
// register access only. A missing or miswired module must degrade to zeros,
// never take the demo down.

#include "harness.h"

// Did mpuInit/mpuRead write this (register, value) pair to the MPU?
static bool wrote_reg(uint8_t reg, uint8_t val) {
  for (auto& w : g_i2c_writes)
    if (w.addr == MPU_ADDR && w.bytes.size() == 2 && w.bytes[0] == reg && w.bytes[1] == val)
      return true;
  return false;
}

static int count_bursts_from(uint8_t reg) {
  int n = 0;
  for (auto& w : g_i2c_writes)
    if (w.addr == MPU_ADDR && w.bytes.size() == 1 && w.bytes[0] == reg) n++;
  return n;
}

int main() {
  std::cout << "PHASE 4: MPU6050\n";

  g_current_test = "I2C pins are free on the S3";
  CHECK_EQ(I2C_SDA, 8, "SDA on GPIO8");
  CHECK_EQ(I2C_SCL, 9, "SCL on GPIO9");
  CHECK(I2C_SDA != 35 && I2C_SDA != 36 && I2C_SDA != 37 &&
        I2C_SCL != 35 && I2C_SCL != 36 && I2C_SCL != 37,
        "GPIO35/36/37 are claimed by OPI PSRAM on the N16R8");
  CHECK_EQ(MPU_ADDR, 0x68, "AD0 tied low");

  g_current_test = "mpuInit succeeds on a healthy module";
  base_reset();
  g_i2c_rx.push_back(0x68);                 // WHO_AM_I reply
  mpuInit();
  CHECK(mpu_ok, "WHO_AM_I 0x68 must be accepted");
  CHECK(wrote_reg(0x6B, 0x00), "PWR_MGMT_1 = 0 wakes the device from sleep");
  CHECK(wrote_reg(0x1A, 0x03), "CONFIG = 3 sets DLPF to ~44 Hz");
  CHECK(wrote_reg(0x1B, 0x08), "GYRO_CONFIG = 0x08 selects +/-500 deg/s");
  CHECK(wrote_reg(0x1C, 0x00), "ACCEL_CONFIG = 0x00 selects +/-2 g");

  g_current_test = "mpuInit accepts the MPU6500-marked variant";
  base_reset();
  g_i2c_rx.push_back(0x72);
  mpuInit();
  CHECK(mpu_ok, "0x72 is a valid WHO_AM_I on modules often sold as MPU6050");

  g_current_test = "mpuInit rejects a wrong WHO_AM_I";
  base_reset();
  g_i2c_rx.push_back(0xFF);
  mpuInit();
  CHECK(!mpu_ok, "a bogus WHO_AM_I must not be treated as a working module");

  g_current_test = "mpuInit survives an absent module (I2C NACK)";
  base_reset();
  g_i2c_endtransmission_result = 2;         // address NACK, nothing on the bus
  mpuInit();
  CHECK(!mpu_ok, "an unplugged module must set mpu_ok = false, not hang or crash");

  g_current_test = "mpuInit survives a module that NACKs after addressing";
  base_reset();
  g_i2c_endtransmission_result = 0;
  // no WHO_AM_I byte queued: requestFrom returns nothing
  mpuInit();
  CHECK(!mpu_ok, "no reply to WHO_AM_I must fail closed");

  g_current_test = "mpuRead zeroes the fields when the module is absent";
  base_reset();
  g_i2c_endtransmission_result = 2;
  mpuInit();
  ax = ay = az = gx = gy = gz = 1234;
  mpuRead();
  CHECK(ax == 0 && ay == 0 && az == 0 && gx == 0 && gy == 0 && gz == 0,
        "a dead IMU must stream zeros, never stale garbage");

  g_current_test = "mpuRead decodes 14 bytes big-endian and discards temperature";
  base_reset();
  g_i2c_rx.push_back(0x68);
  mpuInit();
  CHECK(mpu_ok, "precondition: module initialised");
  g_i2c_writes.clear();
  const uint8_t frame[14] = {
    0x01, 0x02,   // ax = 0x0102 =   258
    0xFF, 0xFE,   // ay = 0xFFFE =    -2
    0x40, 0x00,   // az = 0x4000 = 16384  (1 g at +/-2 g)
    0x12, 0x34,   // temperature -- discarded
    0x00, 0x64,   // gx =   100
    0x80, 0x00,   // gy = -32768
    0x7F, 0xFF,   // gz =  32767
  };
  for (uint8_t b : frame) g_i2c_rx.push_back(b);
  mpuRead();
  // Careful: `ax = (Wire.read() << 8) | Wire.read();` has UNSEQUENCED operands
  // in C++. The compiler may evaluate right-to-left and silently swap the two
  // bytes. Read the high byte into its own variable first.
  CHECK_EQ((int)ax, 258,    "ax must decode high byte first (byte-swap bug if this reads 513)");
  CHECK_EQ((int)ay, -2,     "ay must sign-extend correctly");
  CHECK_EQ((int)az, 16384,  "az must decode high byte first");
  CHECK_EQ((int)gx, 100,    "gx must land after the two temperature bytes are discarded");
  CHECK_EQ((int)gy, -32768, "gy at the negative rail");
  CHECK_EQ((int)gz, 32767,  "gz at the positive rail");
  CHECK(count_bursts_from(0x3B) >= 1, "the 14-byte burst must start at ACCEL_XOUT_H (0x3B)");

  g_current_test = "mpuRead survives a short I2C reply";
  base_reset();
  g_i2c_rx.push_back(0x68);
  mpuInit();
  for (int i = 0; i < 6; i++) g_i2c_rx.push_back(0xAA);   // only 6 of 14 bytes
  mpuRead();
  CHECK(true, "a truncated burst must not hang or read past the buffer");

  g_current_test = "the IMU is polled at 50 Hz, not 500 Hz";
  base_reset();
  g_i2c_rx.push_back(0x68);
  mpuInit();
  g_i2c_writes.clear();
  for (int i = 0; i < 4000; i++) g_i2c_rx.push_back(0x00);
  pump_samples(SAMPLE_RATE);                  // exactly one second
  int bursts = count_bursts_from(0x3B);
  CHECK(bursts >= 45 && bursts <= 55,
        "expect ~50 bursts/s (every 10th sample); a 14-byte burst at 500 Hz eats ~15% of the sample budget");

  g_current_test = "the last IMU value is held between reads";
  base_reset();
  g_i2c_rx.push_back(0x68);
  mpuInit();
  for (uint8_t b : frame) g_i2c_rx.push_back(b);
  mpuRead();
  int16_t held_ax = ax;
  // no further I2C data queued: the next few sample ticks must not zero it
  pump_samples(5);
  CHECK_EQ((int)ax, (int)held_ax, "between 50 Hz reads the previous sample must be held, not blanked");

  g_current_test = "a failed MPU does not stop EMG streaming";
  base_reset();
  g_i2c_endtransmission_result = 2;
  mpuInit();
  CHECK(!mpu_ok, "precondition: MPU marked dead");
  pump_samples(SAMPLE_RATE);
  CHECK(g_udp_sent.size() > 0, "an unseated IMU jumper must not take down the whole demo");

  return report();
}
