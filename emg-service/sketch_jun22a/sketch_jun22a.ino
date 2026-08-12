// EMG Envelop - ESP32-C3 Super-Mini port
// Original: Muscle BioAmp Candy by Upside Down Labs
// https://github.com/upsidedownlabs/Muscle-BioAmp-Candy
//
// Changes from Arduino Nano version:
// - ADC1 pin GPIO4 (ESP32-C3 only has ADC1_CH0..4 on GPIO0..4)
// - 12-bit ADC (0-4095) via analogReadResolution(12) + ADC_11db attenuation
// - unsigned long literal in timer math (avoid 32-bit overflow)
//
// Filter coefficients unchanged: same algorithm, same 500 Hz sample rate.

// Upside Down Labs invests time and resources providing this open source code,
// please support Upside Down Labs and open-source hardware by purchasing
// products from Upside Down Labs!


// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

#define SAMPLE_RATE 500
#define BAUD_RATE 115200
#define INPUT_PIN 4
#define BUFFER_SIZE 128

int circular_buffer[BUFFER_SIZE];
int data_index, sum;

void setup() {
  // Serial connection begin
  Serial.begin(BAUD_RATE);

  // ESP32 ADC config: 12-bit, 0-3.3V full scale on ADC1
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  analogSetPinAttenuation(INPUT_PIN, ADC_11db);
}

void loop() {
  // Calculate elapsed time
  static unsigned long past = 0;
  unsigned long present = micros();
  unsigned long interval = present - past;
  past = present;

  // Run timer
  static long timer = 0;
  timer -= interval;

  // Sample and get envelop
  if(timer < 0) {
    timer += 1000000UL / SAMPLE_RATE;
    int sensor_value = analogRead(INPUT_PIN);
    int signal = (int)EMGFilter((float)sensor_value);
    int envelop = getEnvelop(abs(signal));
    Serial.print(signal);
    Serial.print(",");
    Serial.println(envelop);
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
// Reference:
// https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.butter.html
// https://courses.ideate.cmu.edu/16-223/f2020/Arduino/FilterDemos/filter_gen.py
float EMGFilter(float input)
{
  float output = input;
  {
    static float z1, z2; // filter section state
    float x = output - 0.05159732f*z1 - 0.36347401f*z2;
    output = 0.01856301f*x + 0.03712602f*z1 + 0.01856301f*z2;
    z2 = z1;
    z1 = x;
  }
  {
    static float z1, z2; // filter section state
    float x = output - -0.53945795f*z1 - 0.39764934f*z2;
    output = 1.00000000f*x + -2.00000000f*z1 + 1.00000000f*z2;
    z2 = z1;
    z1 = x;
  }
  {
    static float z1, z2; // filter section state
    float x = output - 0.47319594f*z1 - 0.70744137f*z2;
    output = 1.00000000f*x + 2.00000000f*z1 + 1.00000000f*z2;
    z2 = z1;
    z1 = x;
  }
  {
    static float z1, z2; // filter section state
    float x = output - -1.00211112f*z1 - 0.74520226f*z2;
    output = 1.00000000f*x + -2.00000000f*z1 + 1.00000000f*z2;
    z2 = z1;
    z1 = x;
  }
  return output;
}
