// LED status states.
//
// This enum lives in a header on purpose. The Arduino IDE auto-generates
// function prototypes and injects them near the top of the .ino, ABOVE any
// type declared in the sketch body -- so `LedState ledState();` would be
// hoisted above `enum LedState` and fail with "'LedState' does not name a
// type". Types pulled in by #include are already visible at that point.
// Plain g++ (the host tests in test/) compiles the file as written and never
// sees the problem, so moving this back into the .ino breaks ONLY the real
// board build.

#pragma once

enum LedState {
  LED_CALIBRATING,   // blue, solid
  LED_NO_ACK_OK,     // yellow, solid
  LED_NO_ACK_BAD,    // purple, blink
  LED_OK,            // green, blink
  LED_MPU_BAD        // light blue, blink
};
