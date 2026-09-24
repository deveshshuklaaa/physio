// PHASE 10 -- MPU6050 resting-offset calibration.
//
// mpuInit() sets ranges and wakes the chip but never measures a resting bias,
// so a flat still board reads a few hundred LSB off zero on each axis.
//
// Decided calibration semantics:
//   gyro  -> fully zeroed (offset = mean at rest)
//   accel -> X and Y zeroed, Z keeps gravity (offset = mean_az - 16384)
// so a flat, still board reads (0, 0, 16384) and tilt stays visible.

#include "harness.h"

// Queue `n` copies of one 14-byte MPU frame for the fake Wire to serve.
static void queue_frames(int n, int16_t ax_v, int16_t ay_v, int16_t az_v,
                         int16_t gx_v, int16_t gy_v, int16_t gz_v) {
  for (int i = 0; i < n; i++) {
    int16_t vals[7] = {ax_v, ay_v, az_v, 0 /*temp*/, gx_v, gy_v, gz_v};
    for (int k = 0; k < 7; k++) {
      g_i2c_rx.push_back((uint8_t)((vals[k] >> 8) & 0xFF));
      g_i2c_rx.push_back((uint8_t)(vals[k] & 0xFF));
    }
  }
}

// Bring the MPU up healthy, then clear the init chatter from the recorders.
static void init_ok() {
  base_reset();
  g_i2c_rx.push_back(0x68);            // WHO_AM_I
  mpuInit();
  g_i2c_writes.clear();
  g_led_writes.clear();
}

int main() {
  std::cout << "PHASE 10: MPU6050 calibration\n";

  g_current_test = "calibration constants";
  CHECK_EQ(CAL_SAMPLES, 200, "average 200 resting samples");
  CHECK_EQ(ACCEL_1G, 16384, "1 g at the +/-2 g range configured in mpuInit()");
  CHECK(CAL_SHAKY_LSB > 0 && CAL_SHAKY_LSB <= 4000,
        "CAL_SHAKY_LSB must flag a board that moved during calibration (~2000 = 0.12 g)");

  g_current_test = "raw read and corrected read are separate";
  init_ok();
  queue_frames(1, 300, -150, 16500, -20, 8, 3);
  mpuReadRaw();
  CHECK_EQ((int)ax, 300, "mpuReadRaw must not apply any offset");
  CHECK_EQ((int)az, 16500, "raw az straight from the registers");

  g_current_test = "mpuRead subtracts the stored offsets";
  init_ok();
  cal_ax = 300; cal_ay = -150; cal_az = 116;   // 16500 - 16384
  cal_gx = -20; cal_gy = 8;    cal_gz = 3;
  queue_frames(1, 300, -150, 16500, -20, 8, 3);
  mpuRead();
  CHECK_EQ((int)ax, 0, "ax zeroed at rest");
  CHECK_EQ((int)ay, 0, "ay zeroed at rest");
  CHECK_EQ((int)az, ACCEL_1G, "az keeps gravity: a flat board reads 1 g, not 0");
  CHECK_EQ((int)gx, 0, "gx zeroed at rest");
  CHECK_EQ((int)gy, 0, "gy zeroed at rest");
  CHECK_EQ((int)gz, 0, "gz zeroed at rest");

  g_current_test = "calibration computes the offsets from a still board";
  init_ok();
  queue_frames(CAL_SAMPLES + 4, 300, -150, 16500, -20, 8, 3);
  mpuCalibrate();
  CHECK(cal_valid, "a successful calibration must set cal_valid");
  CHECK_EQ((int)cal_ax, 300, "ax offset is the resting mean");
  CHECK_EQ((int)cal_ay, -150, "ay offset is the resting mean");
  CHECK_EQ((int)cal_az, 116, "az offset is mean - 16384, so gravity survives");
  CHECK_EQ((int)cal_gx, -20, "gx offset is the resting mean");
  CHECK_EQ((int)cal_gy, 8, "gy offset is the resting mean");
  CHECK_EQ((int)cal_gz, 3, "gz offset is the resting mean");
  CHECK(!cal_shaky, "a perfectly still board must not be flagged shaky");

  g_current_test = "calibrate then read gives the intended resting values";
  // The whole point: after calibrating, the same physical reading must come out
  // as (0, 0, 1g) with the gyro at rest.
  // Drain first: mpuCalibrate() may legitimately discard a few settling reads,
  // so how many frames it consumed is its business, not this test's.
  g_i2c_rx.clear();
  queue_frames(1, 300, -150, 16500, -20, 8, 3);
  mpuRead();
  CHECK_EQ((int)ax, 0, "flat board reads ax = 0 after calibration");
  CHECK_EQ((int)ay, 0, "flat board reads ay = 0 after calibration");
  CHECK_EQ((int)az, ACCEL_1G, "flat board reads az = 1 g after calibration");
  CHECK_EQ((int)gx, 0, "still board reads gx = 0 after calibration");

  g_current_test = "tilt is still visible after calibration";
  // Rotate 90 degrees: gravity moves from Z to X. Offsets must not eat it.
  g_i2c_rx.clear();
  queue_frames(1, 300 + ACCEL_1G, -150, 16500 - ACCEL_1G, -20, 8, 3);
  mpuRead();
  CHECK_EQ((int)ax, ACCEL_1G, "tilted on its side, gravity appears on ax");
  CHECK_EQ((int)az, 0, "and leaves az");

  g_current_test = "averaging actually averages";
  init_ok();
  // Alternate two values around a mean of 100 on gx.
  for (int i = 0; i < CAL_SAMPLES / 2; i++) {
    queue_frames(1, 0, 0, ACCEL_1G, 80, 0, 0);
    queue_frames(1, 0, 0, ACCEL_1G, 120, 0, 0);
  }
  queue_frames(4, 0, 0, ACCEL_1G, 100, 0, 0);
  mpuCalibrate();
  CHECK(cal_gx >= 99 && cal_gx <= 101, "gx offset must be the mean (100), not the first sample");
  CHECK_EQ((int)cal_az, 0, "a board already reading exactly 1 g needs no az offset");

  g_current_test = "a board that moved during calibration is flagged";
  init_ok();
  for (int i = 0; i < CAL_SAMPLES / 2; i++) {
    queue_frames(1, -6000, 0, ACCEL_1G, 0, 0, 0);
    queue_frames(1, 6000, 0, ACCEL_1G, 0, 0, 0);   // 12000 LSB swing
  }
  queue_frames(4, 0, 0, ACCEL_1G, 0, 0, 0);
  mpuCalibrate();
  CHECK(cal_shaky,
        "a board moved during calibration produces confidently wrong offsets -- it must be flagged");

  g_current_test = "a dead MPU calibrates to zeros without hanging";
  base_reset();
  g_i2c_endtransmission_result = 2;      // nothing on the bus
  mpuInit();
  CHECK(!mpu_ok, "precondition: MPU marked dead");
  cal_ax = cal_ay = cal_az = cal_gx = cal_gy = cal_gz = 999;
  cal_shaky = true;
  mpuCalibrate();
  CHECK(!cal_valid, "calibration cannot be valid with no sensor");
  CHECK(cal_ax == 0 && cal_ay == 0 && cal_az == 0 &&
        cal_gx == 0 && cal_gy == 0 && cal_gz == 0,
        "a dead MPU must leave the offsets at zero, not stale garbage");

  g_current_test = "calibration takes a bounded amount of time";
  init_ok();
  queue_frames(CAL_SAMPLES + 4, 0, 0, ACCEL_1G, 0, 0, 0);
  unsigned long t0 = millis();
  mpuCalibrate();
  unsigned long elapsed = millis() - t0;
  CHECK(elapsed >= 100, "calibration must actually spread its samples over time, not burst-read");
  CHECK(elapsed <= 1500, "calibration must not stall the demo for more than ~1 s");

  g_current_test = "setup() calibrates while the LED is blue";
  base_reset();
  g_i2c_rx.push_back(0x68);
  queue_frames(CAL_SAMPLES + 4, 100, 100, ACCEL_1G, 5, 5, 5);
  g_wifi_connect_after_ms = 300;
  setup();
  CHECK(cal_valid, "setup() must calibrate the IMU at boot");
  CHECK(!g_led_writes.empty(), "setup() must show status");
  if (!g_led_writes.empty()) {
    LedWrite first = g_led_writes.front();
    CHECK(first.r == 0 && first.g == 0 && first.b == 40,
          "the LED must be BLUE while calibrating -- it is the boot/calibrating colour");
  }

  return report();
}
