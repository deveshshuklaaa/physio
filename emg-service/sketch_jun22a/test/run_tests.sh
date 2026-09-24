#!/usr/bin/env bash
# Compile and run the firmware tests on the laptop -- no board needed.
#
#   ./run_tests.sh        all phases
#   ./run_tests.sh 3      phase 3 only
#
# Each test binary #includes ../sketch_jun22a.ino with the fakes in
# stubs/ shadowing <WiFi.h>, <WiFiUdp.h> and <Wire.h>.

set -u
cd "$(dirname "$0")"

CXX=${CXX:-g++}
FLAGS="-std=c++17 -Wall -Wextra -Wno-unused-parameter -fexceptions -Istubs -I."
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT

phases=${1:-"1 2 3 4 5 10 11"}
fail=0

for p in $phases; do
  src="test_phase${p}.cpp"
  [ -f "$src" ] || { echo "no such phase: $p"; exit 2; }

  echo "=============================================================="
  if ! $CXX $FLAGS "$src" arduino_shim.cpp -o "$OUT/p$p" 2> "$OUT/p$p.log"; then
    echo "PHASE $p: BUILD FAILED"
    sed 's/^/  /' "$OUT/p$p.log" | head -40
    fail=1
    continue
  fi
  # Warnings are worth seeing but do not fail the run.
  [ -s "$OUT/p$p.log" ] && sed 's/^/  warn: /' "$OUT/p$p.log" | head -20

  "$OUT/p$p" || fail=1
done

echo "=============================================================="
[ $fail -eq 0 ] && echo "ALL GREEN" || echo "FAILURES ABOVE"
exit $fail
