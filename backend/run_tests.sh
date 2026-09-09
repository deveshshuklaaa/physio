#!/usr/bin/env bash
# Backend test suite. Run from backend/:  ./run_tests.sh
#
# Same shape as frontend/run_tests.sh, and the same two kinds of check:
#
#   1. app/**/test_*.py   assert-based self-checks, stdlib only, no framework
#   2. tools/             gate harnesses that prove the §7 gate against real
#                         artefacts (a real uvicorn process, a real socket,
#                         real bytes on disk) rather than mocks
#
# There is no pytest in this venv on purpose -- the existing convention is a
# runnable `test_*.py` with asserts and a `__main__` block. Keep it.

set -uo pipefail
cd "$(dirname "$0")"

PY=../venv/bin/python

# Keep test evidence out of the real session-data directory. The WS tests use
# TestClient against the module-level app, which reads SESSION_DATA_DIR at
# import, so without this they write fixture frames into
# backend/app/session_data/ alongside genuine patient sessions. Set in the
# runner rather than in the tests so the approved test files stay untouched.
export SESSION_DATA_DIR="${SESSION_DATA_DIR:-$(mktemp -d -t rehab_test_sessions_XXXXXX)}"

# Imported model packages need isolation too, but PER TEST rather than per
# run: the E admin-route tests import mini_squat, and the E gate asserts
# nothing is loaded before it imports (otherwise it cannot prove its own
# import did anything). Sharing one directory makes the second one fail.
# `run` allocates a fresh TRAINED_MODELS_ROOT for every invocation below.
MODELS_TMP_PARENT="$(mktemp -d -t rehab_test_models_XXXXXX)"

trap 'rm -rf "$SESSION_DATA_DIR" "$MODELS_TMP_PARENT"' EXIT

fail=0
run() {
  local name="$1"; shift
  printf '\n\033[1m== %s ==\033[0m\n' "$name"
  # Fresh model root per test; see the note above.
  export TRAINED_MODELS_ROOT="$MODELS_TMP_PARENT/$(echo "$name" | tr -c 'a-zA-Z0-9' '_')"
  mkdir -p "$TRAINED_MODELS_ROOT"
  if "$@"; then
    printf '\033[32mPASS\033[0m %s\n' "$name"
  else
    printf '\033[31mFAIL\033[0m %s\n' "$name"
    fail=1
  fi
}

# --- 1. self-checks ----------------------------------------------------------
run "events vocabulary"        $PY app/events.py
run "events mirror (py <-> js)" bash -c "cd app && ../$PY test_events_mirror.py"
# logging_setup.py imports `app.events`, so its self-check needs backend/ on
# the path. It was never wired into a runner before, so this had gone unnoticed.
run "logging setup"            env PYTHONPATH=. $PY app/logging_setup.py
run "telemetry"                $PY app/telemetry.py
run "emg client breaker"       bash -c "cd app/services && ../../$PY test_emg_client.py"

# --- 2. Phase H --------------------------------------------------------------
run "H1 session buffer"        $PY app/services/test_session_buffer.py
run "H2/H3/H6 session ws"      $PY app/ws/test_session_ws.py
run "H4/H5 session routes"     $PY app/routes/test_session.py
run "H7 fake client"           $PY tools/test_h7_fake_client.py

# --- 3. Phase E --------------------------------------------------------------
run "E1-E5/E9/E10 model package" $PY ml/test_validate_model_package.py
run "E6-E8/E11 admin routes"     $PY app/routes/test_admin_models.py

# --- 4. the §7 gates ---------------------------------------------------------
run "PHASE H GATE (§7)"        $PY tools/test_h_gate.py
run "PHASE E GATE (§7)"        $PY tools/test_e_gate.py

# --- 5. Phase K (static only) ------------------------------------------------
# K1/K2 are file contracts and need no daemon. The §7 K gate builds images and
# needs Docker, so it stays out of this suite and is run explicitly:
#   sg docker -c "../venv/bin/python tools/test_k_gate.py"
run "K1/K2 compose + emg url" $PY tools/test_k_compose.py

echo
if [ "$fail" -eq 0 ]; then
  printf '\033[32mALL BACKEND CHECKS PASSED\033[0m\n'
else
  printf '\033[31mBACKEND CHECKS FAILED\033[0m\n'
fi
exit "$fail"
