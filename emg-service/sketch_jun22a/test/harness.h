// Shared test harness. Each test_phaseN.cpp includes this, which pulls in the
// Arduino fakes and then the sketch itself, so tests call the real firmware
// functions with fake hardware underneath.
//
// One file per phase on purpose: a phase can be compiled and run on its own
// while the later phases do not exist yet.

#pragma once

#include "arduino_shim.h"
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#include "../sketch_jun22a.ino"

static int g_checks = 0, g_failures = 0;
static const char* g_current_test = "";

#define CHECK(cond, msg)                                                     \
  do {                                                                       \
    g_checks++;                                                              \
    if (!(cond)) {                                                           \
      g_failures++;                                                          \
      std::cout << "  FAIL [" << g_current_test << "] " << (msg)             \
                << "\n         at " << __FILE__ << ":" << __LINE__ << "\n";  \
    }                                                                        \
  } while (0)

#define CHECK_EQ(actual, expected, msg)                                      \
  do {                                                                       \
    g_checks++;                                                              \
    auto _a = (actual); auto _e = (expected);                                \
    if (!(_a == _e)) {                                                       \
      g_failures++;                                                          \
      std::cout << "  FAIL [" << g_current_test << "] " << (msg)             \
                << "\n         expected: " << _e                             \
                << "\n         actual:   " << _a                             \
                << "\n         at " << __FILE__ << ":" << __LINE__ << "\n";  \
    }                                                                        \
  } while (0)

// Reset the shim plus the sketch globals that exist in every phase. Statics
// inside loop() and EMGFilter cannot be reached from here, so tests only ever
// move the fake clock forward and treat filter output as opaque.
inline void base_reset() {
  shim_reset();
  txlen = 0;
  batch = 0;
  data_index = 0;
  sum = 0;
  memset(circular_buffer, 0, sizeof(circular_buffer));
}

// Drive `n` sample ticks through loop(), one per 1/SAMPLE_RATE second.
inline void pump_samples(int n) {
  for (int i = 0; i < n; i++) {
    g_micros += 1000000UL / SAMPLE_RATE;
    loop();
  }
}

// Split a datagram into lines. A trailing fragment with no newline is kept so
// tests can detect snprintf truncation.
inline std::vector<std::string> split_lines(const std::string& s) {
  std::vector<std::string> out;
  std::string cur;
  for (char c : s) {
    if (c == '\n') { out.push_back(cur); cur.clear(); }
    else cur += c;
  }
  if (!cur.empty()) out.push_back(cur);
  return out;
}

inline std::vector<std::string> split_fields(const std::string& line) {
  std::vector<std::string> out;
  std::istringstream ss(line);
  std::string f;
  while (std::getline(ss, f, ',')) out.push_back(f);
  return out;
}

inline int report() {
  std::cout << "\n" << (g_checks - g_failures) << "/" << g_checks << " checks passed";
  if (g_failures) std::cout << "  (" << g_failures << " FAILED)";
  std::cout << "\n";
  return g_failures ? 1 : 0;
}
