// EMG Envelop - ESP32-S3 port, WiFi/UDP version
// Original: Muscle BioAmp Candy by Upside Down Labs
// https://github.com/upsidedownlabs/Muscle-BioAmp-Candy
//
// Battery-powered (TP4056 + LiPo), no USB serial monitor available at runtime.
// Onboard WS2812 RGB LED is the only feedback channel. The six running states
// and their colours live in led_state.h; ledState()/ledUpdate() apply them.
// Two states are not in that enum because they never reach ledUpdate():
//   - Red fast blink (200 ms) = WiFi failed to connect within WIFI_TIMEOUT_MS
//                               (setup() blinks this forever and never returns)
//   - LED never lights at all = board not powered / crashed before setup() finished
//
// UDP line format (one line per sample, batched into one datagram per
// BATCH_SIZE samples): <signal>,<envelop>,<ax>,<ay>,<az>,<gx>,<gy>,<gz>\n
// app.py and the website must parse all 8 comma-separated fields.


#include <WiFi.h>
#include <WiFiUdp.h>
#include <Wire.h>
#include <string.h>
#include "led_state.h"


#define SAMPLE_RATE 500
#define BAUD_RATE 115200
#define INPUT_PIN 4         // ADC1_CH3 on ESP32-S3, not a strapping pin (unlike GPIO3).
#define BUFFER_SIZE 128
#define RGB_LED_PIN 48      // WS2812 on ESP32-S3-DevKitC-1.
                            // If nothing lights, try 38 - some revisions differ.
#define WIFI_TIMEOUT_MS 20000 // give up and go red after this

#define I2C_SDA 8
#define I2C_SCL 9
#define MPU_ADDR 0x68

#define CAL_SAMPLES 200      // resting samples to average
#define ACCEL_1G 16384       // 1 g at the +/-2 g range set in mpuInit()
#define CAL_SHAKY_LSB 2000   // accel spread above this = the board moved (~0.12 g)
#define CAL_DISCARD 4        // settling reads dropped before averaging

bool mpu_ok = false;
uint8_t mpu_who = 0;      // raw WHO_AM_I, for the boot log
int16_t ax, ay, az, gx, gy, gz;
int16_t cal_ax = 0, cal_ay = 0, cal_az = 0, cal_gx = 0, cal_gy = 0, cal_gz = 0;
bool cal_shaky = false;
bool calibrating = false;

const char* WIFI_SSID   = "test";
const char* WIFI_PASS   = "cheeseballs";
const char* HOST_IP     = "10.64.159.141";   // <-- set to your PC's LAN IP (app.py prints this at startup)
const uint16_t HOST_PORT = 8888;

#define BATCH_SIZE 20        // was 50 -- 20 lines * 56 bytes worst-case = 1120, fits txbuf and MTU
char txbuf[1300];            // worst case: 8 fields * 6 chars ("-32768") + 7 commas + 1 newline = 56/line
int txlen = 0;
int batch = 0;

WiFiUDP udp;
int circular_buffer[BUFFER_SIZE];
int data_index, sum;

// The Arduino IDE generates prototypes automatically; plain g++ (the host
// tests in test/) does not. Only these two are called before their definition.
float EMGFilter(float input);
int getEnvelop(int abs_emg);

unsigned long last_ack_ms = 0;
unsigned long last_hello_ms = 0;
bool handshaked = false;
char rxbuf[64];

void ledSet(uint8_t r, uint8_t g, uint8_t b) {
  neopixelWrite(RGB_LED_PIN, r, g, b);
}

void ledBlue()      { ledSet(0,  0,  40); }
void ledYellow()    { ledSet(40, 30, 0);  }
void ledGreen()     { ledSet(0,  40, 0);  }
void ledRed()       { ledSet(40, 0,  0);  }
void ledPurple()    { ledSet(30, 0,  40); }
void ledLightBlue() { ledSet(0,  30, 40); }
void ledOff()        { ledSet(0,  0,  0);  }


LedState ledState() {
  if (calibrating) return LED_CALIBRATING;
  if (!handshaked) return mpu_ok ? LED_NO_ACK_OK : LED_NO_ACK_BAD;
  return mpu_ok ? LED_OK : LED_MPU_BAD;
}

// Applies ledState(). Solid states write the same colour every call; blink
// states alternate colour/off, toggling an internal phase each call.
void ledUpdate() {
  static bool phase = false;
  LedState st = ledState();
  switch (st) {
    case LED_CALIBRATING: ledBlue();   return;
    case LED_NO_ACK_OK:   ledYellow(); return;
    default: break;
  }
  phase = !phase;
  switch (st) {
    case LED_NO_ACK_BAD: if (phase) ledPurple();    else ledOff(); break;
    case LED_OK:         if (phase) ledGreen();     else ledOff(); break;
    case LED_MPU_BAD:    if (phase) ledLightBlue(); else ledOff(); break;
    default: break;
  }
}

// Read WHO_AM_I. `repeated_start` picks between a repeated start (the usual
// way) and a full stop before the read -- some MPU6050 clones only answer the
// second form. Returns false if the device never answered at all.
bool mpuWhoAmI(bool repeated_start, uint8_t* out) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x75);
  if (Wire.endTransmission(!repeated_start) != 0) return false;
  Wire.requestFrom(MPU_ADDR, 1);
  if (!Wire.available()) return false;
  *out = Wire.read();
  return true;
}

// Print every address that ACKs. Only called when the MPU did not come up, so
// the serial log says whether nothing is on the bus (wiring/power), or
// something is but at an unexpected address (AD0 high -> 0x69, SDA/SCL swapped).
void i2cScan() {
  Serial.println("I2C scan:");
  int found = 0;
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.print("  device at 0x"); Serial.println(addr, HEX);
      found++;
    }
  }
  if (found == 0) Serial.println("  nothing responded - check SDA=8 SCL=9, 3V3, GND");
}

void mpuInit() {
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(400000);

  // WHO_AM_I sanity check - catches a dead or miswired module at boot
  // instead of silently streaming zeros all through the demo.
  uint8_t who = 0;
  bool answered = mpuWhoAmI(true, &who);
  if (!answered) answered = mpuWhoAmI(false, &who);   // clone that dislikes repeated start
  mpu_who = who;
  if (!answered) { mpu_ok = false; return; }
  // Clones ship a range of WHO_AM_I values; all of these speak the MPU6050
  // register map. An unknown value is reported rather than silently accepted.
  if (who != 0x68 && who != 0x70 && who != 0x71 &&
      who != 0x72 && who != 0x73 && who != 0x75) { mpu_ok = false; return; }

  // PWR_MGMT_1 = 0 : wake from sleep
  Wire.beginTransmission(MPU_ADDR); Wire.write(0x6B); Wire.write(0x00); Wire.endTransmission();
  // CONFIG = 3 : DLPF ~44Hz, plenty for limb motion
  Wire.beginTransmission(MPU_ADDR); Wire.write(0x1A); Wire.write(0x03); Wire.endTransmission();
  // GYRO_CONFIG = 0x08 : +/-500 deg/s
  Wire.beginTransmission(MPU_ADDR); Wire.write(0x1B); Wire.write(0x08); Wire.endTransmission();
  // ACCEL_CONFIG = 0x00 : +/-2g
  Wire.beginTransmission(MPU_ADDR); Wire.write(0x1C); Wire.write(0x00); Wire.endTransmission();

  mpu_ok = true;
}

static int16_t readInt16() {
  uint8_t hi = Wire.read();
  uint8_t lo = Wire.read();
  return (int16_t)((hi << 8) | lo);
}

void mpuReadRaw() {
  if (!mpu_ok) { ax = ay = az = gx = gy = gz = 0; return; }
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);                      // ACCEL_XOUT_H
  if (Wire.endTransmission(false) != 0) return;
  Wire.requestFrom(MPU_ADDR, 14);
  if (Wire.available() < 14) return;
  ax = readInt16();
  ay = readInt16();
  az = readInt16();
  Wire.read(); Wire.read();              // temperature - discarded
  gx = readInt16();
  gy = readInt16();
  gz = readInt16();
}

void mpuRead() {
  mpuReadRaw();
  ax -= cal_ax; ay -= cal_ay; az -= cal_az;
  gx -= cal_gx; gy -= cal_gy; gz -= cal_gz;
}

// Average CAL_SAMPLES resting readings to find the offsets. Accel X/Y and
// gyro are fully zeroed; accel Z keeps the 1g of gravity a flat board reads.
void mpuCalibrate() {
  if (!mpu_ok) {
    cal_ax = cal_ay = cal_az = cal_gx = cal_gy = cal_gz = 0;
    cal_shaky = false;
    return;
  }

  long sum_ax = 0, sum_ay = 0, sum_az = 0, sum_gx = 0, sum_gy = 0, sum_gz = 0;
  int16_t min_ax, max_ax, min_ay, max_ay, min_az, max_az;
  min_ax = max_ax = min_ay = max_ay = min_az = max_az = 0;

  // Discard the first few reads. The DLPF configured in mpuInit() needs a
  // few sample periods to settle, and the very first burst after wake can
  // still carry pre-wake register contents.
  for (int i = 0; i < CAL_DISCARD; i++) { mpuReadRaw(); delay(2); }

  for (int i = 0; i < CAL_SAMPLES; i++) {
    mpuReadRaw();
    sum_ax += ax; sum_ay += ay; sum_az += az;
    sum_gx += gx; sum_gy += gy; sum_gz += gz;
    if (i == 0) {
      min_ax = max_ax = ax; min_ay = max_ay = ay; min_az = max_az = az;
    } else {
      if (ax < min_ax) min_ax = ax;
      if (ax > max_ax) max_ax = ax;
      if (ay < min_ay) min_ay = ay;
      if (ay > max_ay) max_ay = ay;
      if (az < min_az) min_az = az;
      if (az > max_az) max_az = az;
    }
    delay(2);
  }

  cal_shaky = (max_ax - min_ax > CAL_SHAKY_LSB) ||
              (max_ay - min_ay > CAL_SHAKY_LSB) ||
              (max_az - min_az > CAL_SHAKY_LSB);

  cal_ax = (int16_t)(sum_ax / CAL_SAMPLES);
  cal_ay = (int16_t)(sum_ay / CAL_SAMPLES);
  cal_az = (int16_t)(sum_az / CAL_SAMPLES - ACCEL_1G);
  cal_gx = (int16_t)(sum_gx / CAL_SAMPLES);
  cal_gy = (int16_t)(sum_gy / CAL_SAMPLES);
  cal_gz = (int16_t)(sum_gz / CAL_SAMPLES);
}

void setup() {
  Serial.begin(BAUD_RATE);
  // On the S3 the USB serial is native CDC, not a UART bridge: it is not
  // enumerated for a few hundred ms after boot, and anything printed before
  // then is lost. Wait briefly for a host, but never block a battery boot
  // where no host will ever appear.
  {
    unsigned long t0 = millis();
    while (!Serial && millis() - t0 < 2000) delay(10);
  }
  ledBlue();                      // BLUE: booting

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  analogSetPinAttenuation(INPUT_PIN, ADC_11db);

  mpuInit();
  calibrating = true;
  mpuCalibrate();          // still blue: keep the board still while this runs
  calibrating = false;
  // Printed over USB CDC at boot. On battery nobody is watching, but this is
  // the only way to tell a working IMU from a miswired one on the bench.
  Serial.print("MPU6050: WHO_AM_I=0x");
  Serial.print(mpu_who, HEX);
  Serial.println(mpu_ok ? "  OK" : "  NOT ACCEPTED");
  if (!mpu_ok) i2cScan();
  Serial.printf("MPU6050 cal: ax=%d ay=%d az=%d gx=%d gy=%d gz=%d shaky=%d\n",
                cal_ax, cal_ay, cal_az, cal_gx, cal_gy, cal_gz, cal_shaky ? 1 : 0);

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setTxPower(WIFI_POWER_8_5dBm);

  WiFi.begin(WIFI_SSID, WIFI_PASS);

  if (WiFi.waitForConnectResult(WIFI_TIMEOUT_MS) != WL_CONNECTED) {
    // RED: dead end. Blink forever so the failure is unmistakable
    // rather than looking like a hang.
    while (true) { ledRed(); delay(200); ledOff(); delay(200); }
  }

  ledYellow();                    // YELLOW: WiFi up, not yet acknowledged
  udp.begin(HOST_PORT);

  Serial.print("ESP IP: ");     Serial.println(WiFi.localIP());
  Serial.print("Sending to: "); Serial.println(HOST_IP);
}

static void udpSend(const void* buf, int len) {
  udp.beginPacket(HOST_IP, HOST_PORT);
  udp.write((const uint8_t*)buf, len);
  udp.endPacket();
}

// Ship whatever samples are sitting in txbuf and start a new batch. Sends
// nothing when the buffer is empty, but always resets: a failed endPacket
// must not leave the batch behind to overflow the next one.
static void flushBatch() {
  if (txlen > 0) udpSend(txbuf, txlen);
  txlen = 0;
  batch = 0;
}

static void sendCalPayload(const char* keyword) {
  char buf[96];
  int n = snprintf(buf, sizeof(buf), "%s %d,%d,%d,%d,%d,%d,%d,%d\n", keyword,
                    cal_ax, cal_ay, cal_az, cal_gx, cal_gy, cal_gz,
                    mpu_ok ? 1 : 0, cal_shaky ? 1 : 0);
  udpSend(buf, n);
}

void sendHello() {
  sendCalPayload("HELLO");
}

void sendCal() {
  sendCalPayload("CAL");
}

// Poll for a command from the server. Non-blocking - safe to call from the
// sample loop; parsePacket() returns 0 immediately when nothing is waiting.
void pollRx() {
  int sz = udp.parsePacket();
  if (sz > 0) {
    int n = udp.read(rxbuf, sizeof(rxbuf) - 1);
    if (n > 0) {
      rxbuf[n] = '\0';
      if (strncmp(rxbuf, "ACK", 3) == 0) {
        last_ack_ms = millis();
        handshaked = true;
      } else if (strncmp(rxbuf, "RECAL", 5) == 0) {
        calibrating = true;
        ledUpdate();
        flushBatch();
        mpuCalibrate();
        calibrating = false;
        sendCal();
      }
    }
  }
}

void loop() {
  static unsigned long past = 0;
  unsigned long present = micros();
  unsigned long interval = present - past;
  past = present;

  static long timer = 0;
  timer -= interval;

  static unsigned long sample_count = 0;

  pollRx();

  // Re-announce every 2s until acknowledged, so a late-started app.py
  // still gets picked up without a board reset.
  if (!handshaked && millis() - last_hello_ms > 2000) {
    last_hello_ms = millis();
    sendHello();
  }

  // ACK older than 5s means the server went away. Drop to yellow/purple.
  if (handshaked && millis() - last_ack_ms > 5000) {
    handshaked = false;
    ledUpdate();
  }

  if (timer < 0) {
    timer += 1000000UL / SAMPLE_RATE;
    int sensor_value = analogRead(INPUT_PIN);
    int signal = (int)EMGFilter((float)sensor_value);
    int envelop = getEnvelop(abs(signal));

    if (sample_count % 10 == 0) mpuRead();

    int n = snprintf(txbuf + txlen, sizeof(txbuf) - txlen, "%d,%d,%d,%d,%d,%d,%d,%d\n",
                      signal, envelop, ax, ay, az, gx, gy, gz);
    // No truncation check: BATCH_SIZE(20) * 56 worst-case bytes = 1120 < 1300,
    // asserted in test/test_phase5.cpp. The n > 0 test is only there so a
    // hypothetical snprintf error cannot drive txlen negative.
    if (n > 0) txlen += n;
    if (++batch >= BATCH_SIZE) flushBatch();
    
    sample_count++;
    if (sample_count % (SAMPLE_RATE / 2) == 0) {
      ledUpdate();
    }
  }
}

// Envelop detection algorithm
int getEnvelop(int abs_emg){
  sum -= circular_buffer[data_index];
  sum += abs_emg;
  circular_buffer[data_index] = abs_emg;
  data_index = (data_index + 1) % BUFFER_SIZE;
  return (sum/BUFFER_SIZE) * 2;
}

// Band-Pass Butterworth IIR digital filter, generated using filter_gen.py.
// Sampling rate: 500.0 Hz, frequency: [74.5, 149.5] Hz.
// Filter is order 4, implemented as second-order sections (biquads).
float EMGFilter(float input)
{
  float output = input;
  {
    static float z1, z2;
    float x = output - 0.05159732f*z1 - 0.36347401f*z2;
    output = 0.01856301f*x + 0.03712602f*z1 + 0.01856301f*z2;
    z2 = z1;
    z1 = x;
  }
  {
    static float z1, z2;
    float x = output - -0.53945795f*z1 - 0.39764934f*z2;
    output = 1.00000000f*x + -2.00000000f*z1 + 1.00000000f*z2;
    z2 = z1;
    z1 = x;
  }
  {
    static float z1, z2;
    float x = output - 0.47319594f*z1 - 0.70744137f*z2;
    output = 1.00000000f*x + 2.00000000f*z1 + 1.00000000f*z2;
    z2 = z1;
    z1 = x;
  }
  {
    static float z1, z2;
    float x = output - -1.00211112f*z1 - 0.74520226f*z2;
    output = 1.00000000f*x + -2.00000000f*z1 + 1.00000000f*z2;
    z2 = z1;
    z1 = x;
  }
  return output;
}
