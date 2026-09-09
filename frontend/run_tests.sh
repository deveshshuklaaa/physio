#!/usr/bin/env bash
# Phase G — full test suite. Run from frontend/:  ./run_tests.sh
#
# Two kinds of check live here, deliberately:
#
#   1. tests/          unit tests (node:test, stdlib — no framework installed)
#   2. tools/          gate harnesses that prove the §7 Phase G gates with
#                      real artefacts rather than mocks
#
# The tools/ harnesses are slower and some drive a real headless browser, so
# they are separated. Both must pass before Phase G can be called done.

set -uo pipefail
cd "$(dirname "$0")"

fail=0
run() {
  local name="$1"; shift
  printf '\n\033[1m== %s ==\033[0m\n' "$name"
  if "$@"; then
    printf '\033[32mPASS\033[0m %s\n' "$name"
  else
    printf '\033[31mFAIL\033[0m %s\n' "$name"
    fail=1
  fi
}

# --- 1. unit tests -----------------------------------------------------------
run "unit tests (tests/)" node --test "tests/*.test.mjs"

# --- 2. gate harnesses -------------------------------------------------------
# The 6-decimal JS/Python parity gate (§7). Regenerates the Python side first
# so a drift in math_utils.py is caught rather than compared against a stale
# cached JSON.
run "parity: python side" ../venv/bin/python tools/parity_python.py
run "parity: 6-decimal gate" node tools/parity_check.mjs

run "ring buffer self-check" node tools/ring_buffer_selfcheck.mjs
run "pose engine self-check" node tools/pose_engine_selfcheck.mjs
run "skeleton self-check" node tools/skeleton_selfcheck.mjs

# Browser-driven. Slower. G13 is the gate that a pose-worker death still
# leaves a complete, playable video.
run "G5 worker (inFlight + latency)" node tools/g5_worker_test/run_g5_test.mjs
run "G13 recording survives worker death" node tools/g13_test/run_g13_test.mjs

printf '\n'
if [ "$fail" -eq 0 ]; then
  printf '\033[32mALL PHASE G CHECKS PASSED\033[0m\n'
else
  printf '\033[31mSOME CHECKS FAILED\033[0m\n'
fi
exit "$fail"
