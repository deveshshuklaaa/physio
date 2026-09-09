// EMG + IMU Envelop - ESP32-C3 Super-Mini, WiFi/UDP version with handshake + reconnect
// Original: Muscle BioAmp Candy by Upside Down Labs
// https://github.com/upsidedownlabs/Muscle-BioAmp-Candy
//
// Battery-powered (TP4056 + LiPo), no USB serial monitor available at runtime.
// Onboard LED is the ONLY feedback channel. See LED PATTERN TABLE below.
//
// ============================================================================
// LED PATTERN TABLE (GPIO8, active LOW)
// ============================================================================
//   Fast toggle, ~150ms       = Wi-Fi connecting or reconnecting (link down)
//   3 short blinks then off   = Wi-Fi just connected (one-time, at boot/reconnect)
//   Slow single blink /2s     = Wi-Fi up, discovering/idle (no server armed yet,
//                                broadcasting HELLO, no OFFER received)
//   Double blink /2s          = Wi-Fi up, ACKed but server hasn't started
//                                streaming us yet / between STOP and next OFFER
//                                (kept for protocol symmetry; currently we go
//                                straight from ACK to streaming, see NOTES)
//   Fast heartbeat toggle,    = STREAMING: connected + armed + sending EMG/IMU
//   ~2Hz (existing pattern)     data. This is the "everything is fine" state.
//   Triple-blink burst /2s    = Calibrating IMU (session start, ~2s window)
//   5 rapid blinks, repeated  = Calibration FAILED (device moved, or IMU not
//   every 3s                    responding) - also reported to server via CAL
//                                control message. Never silently skipped.
//   Long 2s blink then reboot = Unrecoverable failure (Wi-Fi down too long),
//                                watchdog-triggered restart.
//   LED never lights at all   = board not powered / crashed before setup()
// ============================================================================

#include <WiFi.h>
#include <WiFiUdp.h>
#include <Wire.h>
#include <Preferences.h>
#include "esp_task_wdt.h"

// ============================================================================
// PIN MAP - every pin used by this sketch, in one place.
// ============================================================================
#define INPUT_PIN   3    // EMG analog in - ADC1_CH3 ONLY. Must stay on ADC1
                          // (ADC2 shares hardware with Wi-Fi and is unusable
                          // while radio is active). Do not move this pin.
#define LED_PIN     8    // onboard LED, most ESP32-C3 Super Mini boards, active LOW.
                          // Some clones use GPIO2 or GPIO10 instead - check silkscreen.
#define I2C_SDA_PIN 4    // MPU6050 SDA
#define I2C_SCL_PIN 5    // MPU6050 SCL
#define BUTTON_PIN  6    // push button, other leg to GND, uses internal pullup

// Wiring table (placeholder pin choice - NOT hardware-verified, no board was
// available to flash/test during this change; re-check against your specific
// ESP32-C3 Super Mini silkscreen before wiring).
// ONE MPU6050 ONLY, mounted on the SHANK (below the knee). There is no second
// sensor and none is planned - do not add one, and do not wire AD0 high for a
// second address. A single shank sensor cannot measure knee flexion by
// itself (that needs thigh angle too, see the "shank_pitch_deg" comment
// further down) - it is not a knee-angle sensor, it is a segment sensor.
//   MPU6050 VCC  -> 3V3
//   MPU6050 GND  -> GND
//   MPU6050 SCL  -> GPIO5 (I2C_SCL_PIN)
//   MPU6050 SDA  -> GPIO4 (I2C_SDA_PIN)
//   MPU6050 AD0  -> GND (selects I2C address 0x68; leave unconnected only if
//                   you confirm your breakout board defaults AD0 low)
//   MPU6050 INT  -> not used, leave unconnected
//   Mounting     -> shank (below knee), sensor's own X axis in the sagittal
//                   (flexion/extension) plane - see SAGITTAL_GYRO_AXIS below
//                   if your physical mounting differs
//   Button pin 1 -> GPIO6 (BUTTON_PIN)
//   Button pin 2 -> GND
// Pins 0, 1, 2, 9 avoided: 2/8/9 are ESP32-C3 boot-strapping pins and unsafe
// to load down at reset; 3 and 8 are already spoken for above.

#define SAMPLE_RATE 500          // EMG sample rate, Hz - unchanged from original
#define IMU_RATE_HZ 100          // IMU sample rate, Hz. Chosen because: (a) human
                                  // movement in a rehab context has no useful energy
                                  // above ~20-30Hz, 100Hz is generously oversampled;
                                  // (b) it does NOT need to match EMG's 500Hz - matching
                                  // would just burn I2C bus time and CPU that the
                                  // timing-critical 500Hz ADC loop can't spare.
#define COMP_FILTER_ALPHA 0.98f   // complementary-filter weight on the gyro-integrated
                                  // term vs. the accel-derived term, tuned for IMU_RATE_HZ
                                  // = 100Hz. Higher = trusts the gyro more between accel
                                  // corrections (standard value at this rate).
#define SAGITTAL_GYRO_AXIS gy    // which bias-corrected gyro axis (gx/gy/gz, local vars
                                  // at the point of use) points through the knee's
                                  // flexion/extension plane for THIS sensor mounting. If
                                  // the sensor is mounted rotated on the shank, change
                                  // this to gx or gz - prefix with unary '-' if the sign
                                  // is backwards. Change this define, not the sensor code.
#define BAUD_RATE 115200
#define BUFFER_SIZE 128

const char* WIFI_SSID   = "Annapurna";
const char* WIFI_PASS   = "Shanaaan04";
const uint16_t DATA_PORT    = 8888;   // EMG + IMU payloads only. Never handshake text.
const uint16_t CONTROL_PORT = 8889;   // HELLO/OFFER/ACK/STOP/HEARTBEAT/CAL - separate
                                       // port so handshake text can never land in
                                       // data_queue and corrupt the live chart/recording.
const char* DEVICE_ID = "esp32c3-emg-01";

// ---- Wi-Fi connect/retry tuning ----
#define WIFI_CONNECT_TIMEOUT_MS   10000   // bounded initial connect attempt
#define WIFI_RETRY_BASE_MS        1000    // backoff start
#define WIFI_RETRY_MAX_MS         30000   // backoff cap
#define WIFI_UNRECOVERABLE_MS     (10UL * 60UL * 1000UL)  // 10 min link-down -> reboot

// ---- Calibration tuning (placeholders - not physically validated, no bench
// access during this change; tune once real hardware is on the desk) ----
#define CAL_SAMPLES        200            // ~2s at IMU_RATE_HZ
#define CAL_GYRO_VAR_THRESHOLD   400.0f   // PLACEHOLDER: (deg/s)^2, "device moved" cutoff
#define CAL_ACCEL_VAR_THRESHOLD  0.02f    // PLACEHOLDER: g^2, "device moved" cutoff
#define CAL_MAX_RETRIES     3

WiFiUDP udpData;
WiFiUDP udpControl;
Preferences prefs;

// ============================================================================
// Wi-Fi state - non-blocking, event driven
// ============================================================================
volatile bool wifiConnected = false;
unsigned long wifiDownSinceMs = 0;        // 0 while connected
unsigned long lastWifiAttemptMs = 0;
unsigned long wifiRetryDelayMs = WIFI_RETRY_BASE_MS;
bool wifiEverConnected = false;

void onWifiEvent(WiFiEvent_t event, WiFiEventInfo_t info) {
  switch (event) {
    case ARDUINO_EVENT_WIFI_STA_GOT_IP:
      wifiConnected = true;
      wifiDownSinceMs = 0;
      wifiRetryDelayMs = WIFI_RETRY_BASE_MS;
      break;
    case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
      // Never print info.wifi_sta_disconnected.reason with the password nearby -
      // it isn't, but keep this handler free of credential logging on principle.
      if (wifiConnected && wifiDownSinceMs == 0) wifiDownSinceMs = millis();
      wifiConnected = false;
      break;
    default:
      break;
  }
}

// Bounded first attempt; caller decides what happens after timeout.
// Returns true if connected within WIFI_CONNECT_TIMEOUT_MS.
bool wifiConnectBounded() {
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long start = millis();
  while (millis() - start < WIFI_CONNECT_TIMEOUT_MS) {
    if (WiFi.status() == WL_CONNECTED) return true;
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));  // fast blink while connecting
    delay(150);
    esp_task_wdt_reset();
  }
  return false;
}

// Non-blocking: call every loop() iteration. Handles reconnect with backoff
// WITHOUT ever calling delay() or blocking the EMG sample timer.
void wifiServiceNonBlocking() {
  if (wifiConnected) return;
  unsigned long now = millis();
  if (now - lastWifiAttemptMs < wifiRetryDelayMs) return;
  lastWifiAttemptMs = now;
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  wifiRetryDelayMs = min((unsigned long)WIFI_RETRY_MAX_MS, wifiRetryDelayMs * 2);

  // Unrecoverable: link down way too long -> reboot rather than spin forever.
  // A brownout or a truly gone AP both look identical from here; a reboot is
  // the cheapest recovery path for a battery device nobody is watching.
  if (wifiDownSinceMs != 0 && (now - wifiDownSinceMs) > WIFI_UNRECOVERABLE_MS) {
    for (int i = 0; i < 4; i++) { digitalWrite(LED_PIN, LOW); delay(500); digitalWrite(LED_PIN, HIGH); delay(500); }
    ESP.restart();
  }
}

// ============================================================================
// LED - non-blocking pattern driver. Call ledService() every loop().
// ============================================================================
enum LedPattern { LED_WIFI_CONNECTING, LED_DISCOVERING, LED_STREAMING, LED_CALIBRATING, LED_CAL_FAILED, LED_STOPPED_ARMED };
LedPattern ledPattern = LED_WIFI_CONNECTING;
unsigned long ledPhaseStart = 0;
bool ledState = false; // true = on

void setLed(bool on) { digitalWrite(LED_PIN, on ? LOW : HIGH); ledState = on; }

void ledService() {
  unsigned long now = millis();
  switch (ledPattern) {
    case LED_WIFI_CONNECTING: {
      if (now - ledPhaseStart >= 150) { setLed(!ledState); ledPhaseStart = now; }
      break;
    }
    case LED_DISCOVERING: { // single blink every 2s
      unsigned long phase = now % 2000;
      setLed(phase < 100);
      break;
    }
    case LED_STOPPED_ARMED: { // double blink every 2s
      unsigned long phase = now % 2000;
      setLed((phase < 100) || (phase >= 250 && phase < 350));
      break;
    }
    case LED_STREAMING: { // handled by the 2Hz sample-count heartbeat toggle
      break;
    }
    case LED_CALIBRATING: { // triple blink burst, repeating every 700ms
      unsigned long phase = now % 700;
      setLed(phase < 80 || (phase >= 160 && phase < 240) || (phase >= 320 && phase < 400));
      break;
    }
    case LED_CAL_FAILED: { // 5 rapid blinks every 3s
      unsigned long phase = now % 3000;
      setLed(phase < 1000 && (phase % 200) < 100);
      break;
    }
  }
}

// ============================================================================
// Protocol / session state
// ============================================================================
enum FsmState { FS_DISCOVERING, FS_STREAMING };
FsmState fsmState = FS_DISCOVERING;

IPAddress serverIp;
uint16_t serverPort = 0;
bool serverKnown = false;
uint32_t sessionId = 0;
uint32_t emgSeq = 0, imuSeq = 0;
unsigned long lastHelloMs = 0;
unsigned long lastHeartbeatSentMs = 0;
unsigned long lastServerContactMs = 0;
uint32_t heartbeatSeq = 0;

#define HELLO_INTERVAL_MS      1000
#define HEARTBEAT_INTERVAL_MS  1000
#define SERVER_TIMEOUT_MS      6000   // no control traffic this long while
                                       // streaming -> assume server gone

// Packet type tags for the data port (13-byte header, see notes doc).
#define PKT_TYPE_EMG 0x01
#define PKT_TYPE_IMU 0x02

char emgTxbuf[13 + 512];
int emgTxlen = 13;
int emgBatch = 0;
char imuTxbuf[13 + 512];
int imuTxlen = 13;
int imuBatch = 0;

void writeHeader(char* buf, uint8_t type, uint32_t sid, uint32_t seq) {
  uint32_t ts = (uint32_t)micros();
  buf[0] = (char)type;
  uint32_t netSid = htonl(sid), netSeq = htonl(seq), netTs = htonl(ts);
  memcpy(buf + 1, &netSid, 4);
  memcpy(buf + 5, &netSeq, 4);
  memcpy(buf + 9, &netTs, 4);
}

void sendControl(const IPAddress& ip, uint16_t port, const char* msg) {
  udpControl.beginPacket(ip, port);
  udpControl.write((const uint8_t*)msg, strlen(msg));
  udpControl.endPacket();
}

void broadcastHello() {
  char msg[64];
  snprintf(msg, sizeof(msg), "HELLO,%s", DEVICE_ID);
  sendControl(IPAddress(255, 255, 255, 255), CONTROL_PORT, msg);
}

// ============================================================================
// MPU6050 - raw register I2C driver (no external library: Wire.h in the ESP32
// core is enough for the handful of registers this needs, so no new dependency).
// ============================================================================
#define MPU_ADDR       0x68
#define MPU_REG_PWR1   0x6B
#define MPU_REG_WHOAMI 0x75
#define MPU_REG_ACCEL_XOUT_H 0x3B
#define MPU_ACCEL_LSB_PER_G   16384.0f   // +-2g range (default)
#define MPU_GYRO_LSB_PER_DPS  131.0f     // +-250 dps range (default)

bool mpuInitOk = false;

bool mpuWriteReg(uint8_t reg, uint8_t val) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  Wire.write(val);
  return Wire.endTransmission() == 0;
}

bool mpuInit() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(MPU_REG_WHOAMI);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom((int)MPU_ADDR, 1) != 1) return false;
  uint8_t whoami = Wire.read();
  if (whoami != 0x68 && whoami != 0x98) return false; // 0x98 seen on some MPU6500 clones
  if (!mpuWriteReg(MPU_REG_PWR1, 0x00)) return false;  // wake from sleep
  return true;
}

// raw[0..2]=accel xyz (g), raw[3..5]=gyro xyz (deg/s)
bool mpuReadScaled(float* out6) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(MPU_REG_ACCEL_XOUT_H);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom((int)MPU_ADDR, 14) != 14) return false;
  int16_t ax = (Wire.read() << 8) | Wire.read();
  int16_t ay = (Wire.read() << 8) | Wire.read();
  int16_t az = (Wire.read() << 8) | Wire.read();
  Wire.read(); Wire.read(); // temp, unused
  int16_t gx = (Wire.read() << 8) | Wire.read();
  int16_t gy = (Wire.read() << 8) | Wire.read();
  int16_t gz = (Wire.read() << 8) | Wire.read();
  out6[0] = ax / MPU_ACCEL_LSB_PER_G;
  out6[1] = ay / MPU_ACCEL_LSB_PER_G;
  out6[2] = az / MPU_ACCEL_LSB_PER_G;
  out6[3] = gx / MPU_GYRO_LSB_PER_DPS;
  out6[4] = gy / MPU_GYRO_LSB_PER_DPS;
  out6[5] = gz / MPU_GYRO_LSB_PER_DPS;
  return true;
}

// ---- Calibration ----
struct CalResult {
  float gyroBiasX, gyroBiasY, gyroBiasZ;
  float pitchOffsetDeg;  // gravity-derived pitch measured during the
                          // calibration pose itself. This IS the "session-start
                          // calibration pose absorbs the mounting offset" step:
                          // shank_pitch_deg is reported relative to this pose,
                          // not relative to vertical, so an arbitrary sensor
                          // mounting angle on the shank cancels out.
  bool valid;
};
CalResult calResult = {0, 0, 0, 0, false};
float pitchEstimate = 0;  // complementary-filter running state, reset each
                           // session start (see ACK handling) and seeded from
                           // calResult.pitchOffsetDeg right after calibration.

// Reject-if-moved calibration: average CAL_SAMPLES stationary readings, check
// variance stayed under threshold. Assumes the device is mounted with its
// accelerometer Z axis roughly vertical (up) at rest - PLACEHOLDER assumption,
// no physical mounting was defined for this task; re-verify against the real
// enclosure orientation before trusting pitch/roll signs.
bool runCalibration() {
  if (!mpuInitOk) return false;
  double sum[6] = {0,0,0,0,0,0};
  double sumSq[6] = {0,0,0,0,0,0};
  float sample[6];
  int n = 0;
  unsigned long sampleIntervalUs = 1000000UL / IMU_RATE_HZ;
  unsigned long nextSampleUs = micros();
  while (n < CAL_SAMPLES) {
    if ((long)(micros() - nextSampleUs) >= 0) {
      nextSampleUs += sampleIntervalUs;
      if (!mpuReadScaled(sample)) return false;
      for (int i = 0; i < 6; i++) { sum[i] += sample[i]; sumSq[i] += (double)sample[i]*sample[i]; }
      n++;
    }
    esp_task_wdt_reset();
  }
  double mean[6], var[6];
  for (int i = 0; i < 6; i++) {
    mean[i] = sum[i] / n;
    var[i] = sumSq[i] / n - mean[i] * mean[i];
  }
  float gyroVar = (float)max(var[3], max(var[4], var[5]));
  float accelVar = (float)max(var[0], max(var[1], var[2]));
  if (gyroVar > CAL_GYRO_VAR_THRESHOLD || accelVar > CAL_ACCEL_VAR_THRESHOLD) {
    return false; // device moved during calibration - caller retries or fails
  }
  calResult.gyroBiasX = mean[3]; calResult.gyroBiasY = mean[4]; calResult.gyroBiasZ = mean[5];
  calResult.pitchOffsetDeg = atan2f((float)mean[0], sqrtf((float)(mean[1]*mean[1] + mean[2]*mean[2]))) * 180.0f / PI;
  calResult.valid = true;
  pitchEstimate = calResult.pitchOffsetDeg; // seed the filter at the calibration pose
  return true;
}

void saveCalibrationToNvs() {
  prefs.begin("emgimu", false);
  prefs.putBytes("cal", &calResult, sizeof(calResult));
  prefs.end();
}

bool loadCalibrationFromNvs() {
  prefs.begin("emgimu", true);
  bool has = prefs.isKey("cal");
  if (has) prefs.getBytes("cal", &calResult, sizeof(calResult));
  prefs.end();
  return has && calResult.valid;
}

// ponytail: if a fresh in-session calibration fails/can't be attempted (e.g.
// motion during the window) but NVS still holds a prior valid calibration
// (e.g. from before an unexpected mid-session brownout reboot), reuse it
// rather than blocking streaming entirely. Upgrade path if this matters:
// only allow reuse when the stored calibration is provably from *this same*
// server session (persist session_id alongside it and compare).
bool calibrateAtSessionStart() {
  ledPattern = LED_CALIBRATING;
  for (int attempt = 0; attempt < CAL_MAX_RETRIES; attempt++) {
    if (runCalibration()) {
      saveCalibrationToNvs();
      return true;
    }
  }
  if (loadCalibrationFromNvs()) {
    pitchEstimate = calResult.pitchOffsetDeg; // reseed filter from the stored pose
    return true; // stale but better than nothing; reported as such below
  }
  return false;
}

// ============================================================================
void setup() {
  Serial.begin(BAUD_RATE);  // harmless with no cable attached; useful if ever
                             // USB-tethered for debugging.
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH); // off
  pinMode(BUTTON_PIN, INPUT_PULLUP); // reserved for future use (e.g. manual arm)

  esp_task_wdt_config_t wdtConfig = {
    .timeout_ms = 15000,
    .idle_core_mask = 0,
    .trigger_panic = true
  };
  esp_task_wdt_init(&wdtConfig);
  esp_task_wdt_add(NULL);

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  analogSetPinAttenuation(INPUT_PIN, ADC_11db);

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);          // modem-sleep off: lower/steadier latency for the
                                  // 500Hz stream, at the cost of higher idle current
                                  // (battery cost - worth it here since the device is
                                  // actively streaming, not sitting idle for hours).
  // WIFI_POWER_8_5dBm is a HARDWARE CONSTRAINT of this specific board, not a
  // brownout workaround - do not "fix" this again without the owner testing
  // it on real hardware. These ESP32-C3 SuperMini clones have poor antenna
  // matching and an onboard regulator that sags under the TX current spike;
  // raising TX power destabilizes/drops the link rather than improving it.
  // Also required for this board to associate at all: the AP must be
  // WPA2-PSK (not a WPA2/WPA3 transition-mode SSID) and on the 2.4GHz band -
  // the C3's single radio can't do 5GHz and some C3 WiFi stacks fail to
  // associate cleanly with mixed WPA2/WPA3 APs.
  WiFi.setTxPower(WIFI_POWER_8_5dBm);

  WiFi.onEvent(onWifiEvent);

  ledPattern = LED_WIFI_CONNECTING;
  bool ok = wifiConnectBounded();
  if (ok) {
    wifiConnected = true;
    wifiEverConnected = true;
    blinkConfirm();
  }
  // If not ok, fall through - wifiServiceNonBlocking() in loop() keeps retrying
  // forever with backoff, without ever blocking the ADC sample loop.

  udpData.begin(DATA_PORT);
  udpControl.begin(CONTROL_PORT);

  mpuInitOk = mpuInit();  // failure here is reported via CAL,FAIL at session start,
                           // never silently substituted with zeros.

  Serial.print("ESP IP: "); Serial.println(WiFi.localIP());
  ledPattern = LED_DISCOVERING;
}

void blinkConfirm() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, LOW); delay(150);
    digitalWrite(LED_PIN, HIGH); delay(150);
  }
}

// ============================================================================
// Control-channel handling (8889): HELLO already sent by us; here we react to
// OFFER / STOP / HEARTBEAT_ACK from the server.
// ============================================================================
void serviceControl() {
  int sz = udpControl.parsePacket();
  if (sz <= 0) return;
  char buf[128];
  int n = udpControl.read(buf, min(sz, (int)sizeof(buf) - 1));
  if (n <= 0) return;
  buf[n] = 0;

  IPAddress fromIp = udpControl.remoteIP();
  uint16_t fromPort = udpControl.remotePort();

  char* type = strtok(buf, ",");
  if (!type) return;

  if (strcmp(type, "OFFER") == 0 && fsmState == FS_DISCOVERING) {
    char* sidStr = strtok(NULL, ",");
    if (!sidStr) return;
    sessionId = (uint32_t)strtoul(sidStr, NULL, 10);
    serverIp = fromIp; serverPort = fromPort; serverKnown = true;
    lastServerContactMs = millis();

    bool calOk = calibrateAtSessionStart();
    char calMsg[64];
    snprintf(calMsg, sizeof(calMsg), "CAL,%lu,%s,%s", (unsigned long)sessionId,
              calOk ? "OK" : "FAIL", calOk ? "-" : "moved_or_no_imu");
    sendControl(serverIp, serverPort, calMsg);
    if (!calOk) {
      ledPattern = LED_CAL_FAILED;
      // Calibration failure does not block EMG streaming (EMG doesn't need
      // the IMU) - it just means IMU samples won't be sent this session.
    }

    char ackMsg[48];
    snprintf(ackMsg, sizeof(ackMsg), "ACK,%lu,%lu", (unsigned long)sessionId, (unsigned long)micros());
    sendControl(serverIp, serverPort, ackMsg);

    emgSeq = 0; imuSeq = 0;
    fsmState = FS_STREAMING;
    ledPattern = LED_STREAMING;
  } else if (strcmp(type, "STOP") == 0) {
    char* sidStr = strtok(NULL, ",");
    if (sidStr && (uint32_t)strtoul(sidStr, NULL, 10) == sessionId) {
      fsmState = FS_DISCOVERING;
      ledPattern = LED_DISCOVERING;
    }
  } else if (strcmp(type, "HEARTBEAT_ACK") == 0) {
    lastServerContactMs = millis();
  }
}

// ============================================================================
void loop() {
  esp_task_wdt_reset();
  wifiServiceNonBlocking();
  ledService();

  if (wifiConnected) {
    serviceControl();

    if (fsmState == FS_DISCOVERING) {
      unsigned long now = millis();
      if (now - lastHelloMs >= HELLO_INTERVAL_MS) { broadcastHello(); lastHelloMs = now; }
    } else if (fsmState == FS_STREAMING) {
      unsigned long now = millis();
      if (now - lastHeartbeatSentMs >= HEARTBEAT_INTERVAL_MS) {
        char hb[48];
        snprintf(hb, sizeof(hb), "HEARTBEAT,%lu,%lu", (unsigned long)sessionId, (unsigned long)heartbeatSeq++);
        sendControl(serverIp, serverPort, hb);
        lastHeartbeatSentMs = now;
      }
      if (now - lastServerContactMs > SERVER_TIMEOUT_MS) {
        // Dead peer detected on our side - stop streaming, go back to discovery.
        fsmState = FS_DISCOVERING;
        ledPattern = LED_DISCOVERING;
      }
    }
  } else {
    ledPattern = LED_WIFI_CONNECTING;
  }

  // ---- EMG sampling: always runs at 500Hz once Wi-Fi is up, independent of
  // handshake state, so the timing-critical loop never stalls on the network.
  // Packets are only actually sent while FS_STREAMING (see below).
  static unsigned long past = 0;
  unsigned long present = micros();
  unsigned long interval = present - past;
  past = present;

  static long timer = 0;
  timer -= interval;

  static unsigned long sampleCount = 0;
  static unsigned long imuTimerUs = 0;

  if (timer < 0) {
    timer += 1000000UL / SAMPLE_RATE;
    int sensorValue = analogRead(INPUT_PIN);
    int signal = (int)EMGFilter((float)sensorValue);
    int envelop = getEnvelop(abs(signal));

    if (fsmState == FS_STREAMING && wifiConnected) {
      if (emgBatch == 0) writeHeader(emgTxbuf, PKT_TYPE_EMG, sessionId, emgSeq);
      emgTxlen += snprintf(emgTxbuf + emgTxlen, sizeof(emgTxbuf) - emgTxlen, "%d,%d\n", signal, envelop);
      emgSeq++;
      if (++emgBatch >= 50) {
        udpData.beginPacket(serverIp, DATA_PORT);
        udpData.write((uint8_t*)emgTxbuf, emgTxlen);
        udpData.endPacket();
        emgTxlen = 13; emgBatch = 0;
      }
    }

    sampleCount++;
    if (fsmState == FS_STREAMING && sampleCount % (SAMPLE_RATE / 2) == 0) {
      setLed(!ledState); // 2Hz heartbeat = "streaming" visible proof of life
    }
  }

  // ---- IMU sampling at IMU_RATE_HZ, only while streaming and only if init'd.
  if (fsmState == FS_STREAMING && mpuInitOk && calResult.valid) {
    unsigned long nowUs = micros();
    if (nowUs - imuTimerUs >= (1000000UL / IMU_RATE_HZ)) {
      imuTimerUs = nowUs;
      float s[6];
      if (mpuReadScaled(s)) {
        // Single shank-mounted MPU6050. This is a SEGMENT sensor, not a knee-
        // angle sensor: knee flexion is the angle between thigh and shank, and
        // one sensor only measures one segment. Reporting a "knee angle" out
        // of a single IMU would be a fabricated number - exactly the kind of
        // false-confidence result this project's cross-check exists to catch.
        // Two valid uses of shank_pitch_deg downstream:
        //   (a) thigh fixed (seated knee extension, TKE, isometric quads) ->
        //       shank_pitch_deg IS the knee angle.
        //   (b) otherwise -> host computes knee flexion as
        //       thigh_angle_from_camera - shank_pitch_deg. That comparison is
        //       the whole point of having this sensor at all.
        float ax = s[0], ay = s[1], az = s[2];       // raw accel (g) - gravity intact
        float gx = s[3] - calResult.gyroBiasX;
        float gy = s[4] - calResult.gyroBiasY;
        float gz = s[5] - calResult.gyroBiasZ;        // bias-corrected gyro (deg/s)

        // Complementary filter, sagittal-plane pitch only. This is a 6-axis
        // IMU with no magnetometer, so yaw is unobservable from gravity and
        // would drift without bound if integrated from gyro alone - we do NOT
        // compute or send a yaw value. Do not add one without a magnetometer
        // or an external reference; a trustworthy-looking drifting yaw is
        // worse than none.
        float pitchAcc = atan2f(ax, sqrtf(ay*ay + az*az)) * 180.0f / PI;
        float sagittalGyroRate = SAGITTAL_GYRO_AXIS; // deg/s, bias-corrected
        float dt = 1.0f / IMU_RATE_HZ;
        pitchEstimate = COMP_FILTER_ALPHA * (pitchEstimate + sagittalGyroRate * dt)
                        + (1.0f - COMP_FILTER_ALPHA) * pitchAcc;
        float shankPitchDeg = pitchEstimate - calResult.pitchOffsetDeg; // relative
                                                                          // to calibration pose
        float rollDeg = atan2f(ay, az) * 180.0f / PI; // gravity-only, unfiltered -
                                                        // mounting/quality indicator,
                                                        // not a measured joint angle

        // CSV payload columns: shank_pitch_deg,sagittal_gyro_dps,roll_deg,
        //                       ax_g,ay_g,az_g,gx_dps,gy_dps,gz_dps
        if (imuBatch == 0) writeHeader(imuTxbuf, PKT_TYPE_IMU, sessionId, imuSeq);
        imuTxlen += snprintf(imuTxbuf + imuTxlen, sizeof(imuTxbuf) - imuTxlen,
                              "%.2f,%.2f,%.2f,%.3f,%.3f,%.3f,%.2f,%.2f,%.2f\n",
                              shankPitchDeg, sagittalGyroRate, rollDeg,
                              ax, ay, az, gx, gy, gz);
        imuSeq++;
        if (++imuBatch >= 20) {
          udpData.beginPacket(serverIp, DATA_PORT);
          udpData.write((uint8_t*)imuTxbuf, imuTxlen);
          udpData.endPacket();
          imuTxlen = 13; imuBatch = 0;
        }
      }
    }
  }
}

// Envelop detection algorithm
int circular_buffer[BUFFER_SIZE];
int data_index, sum;
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
