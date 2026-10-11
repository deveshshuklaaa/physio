#!/usr/bin/env bash
# APP-T12 -- the APP-0.1 gate.  Owned by test-e2e-agent (docs/19 §10.2).
#
# Written BEFORE APP-T1..T11 exist, per docs/19 §0.1 gate 2: the check comes
# first and is watched failing for the right reason.  A builder turning this
# green must not edit this file (§8 constraint 13).
#
# Run it from inside the clone you are checking:
#     ./scripts/verify_testenv.sh
#
# Optional: PROD_CHECKOUT=/path/to/prod/clone enables the "env files are the
# only difference" check (docs/20 §0).
#
# Exit 0 = every check passed.  Exit 1 = at least one failed.  No framework,
# no dependencies -- bash, git and docker only.

set -uo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)

PASS=0; FAIL=0; SKIP=0
ok()   { printf '  \033[32mPASS\033[0m  %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n'   "$1"; printf '        -> %s\n' "$2"; FAIL=$((FAIL+1)); }
skip() { printf '  \033[33mSKIP\033[0m  %s\n' "$1"; printf '        -> %s\n' "$2"; SKIP=$((SKIP+1)); }

# Read a key out of an env file, tolerating quotes.  Not sourced: these files
# hold secrets and arbitrary shell would run them.
envget() { # envget <file> <key>
  [ -f "$1" ] || return 1
  sed -nE "s/^[[:space:]]*$2=['\"]?([^'\"]*)['\"]?[[:space:]]*$/\1/p" "$1" | tail -1
}
dbname() { # dbname <mongo uri> -> database component
  printf '%s' "$1" | sed -nE 's#^mongodb(\+srv)?://[^/]*/([^?]*).*#\2#p'
}

echo
echo "APP-T12  test-environment gate"
echo "checkout: $ROOT"
echo

# ---------------------------------------------------------------- C1 identity
# Everything else is only meaningful in the test clone, so this gates the rest.
PROJ=$(envget .env COMPOSE_PROJECT_NAME || true)
IS_TEST=0
if [ "${PROJ:-}" = "hemotest" ]; then
  IS_TEST=1
  ok "C1  COMPOSE_PROJECT_NAME=hemotest -- containers, networks and volumes are namespaced"
else
  bad "C1  this is not the test clone (COMPOSE_PROJECT_NAME='${PROJ:-unset}', want 'hemotest')" \
      "APP-T1: clone to ~/final_project_test and set COMPOSE_PROJECT_NAME=hemotest in its .env.
           Without it both stacks share container, network and volume names and can
           stop each other -- which is exactly how the orphaned-network failure happened."
fi

# ------------------------------------------------------- C2 default service set
if command -v docker >/dev/null 2>&1; then
  N=$(docker compose config --services 2>/dev/null | grep -c . || echo 0)
  if [ "$N" = "5" ]; then
    ok "C2  compose default set is 5 services (emg-service and hemo-backend-stage profile-gated)"
  else
    bad "C2  compose default set is $N services, want 5" \
        "APP-010: emg-service and hemo-backend-stage must carry profiles:, so a plain
           'up' leaves them down.  'docker compose config --services' lists the default set."
  fi
else
  skip "C2  default service set" "docker not on PATH"
fi

# ------------------------------------------------------------ C3 test database
URI=$(envget .env MONGO_URI || true)
DB=$(dbname "${URI:-}")
if [ "$DB" = "hemophilia_test" ]; then
  ok "C3  MONGO_URI database is hemophilia_test"
else
  bad "C3  MONGO_URI database is '${DB:-unset}', want hemophilia_test" \
      "APP-T4: create hemophilia_test and point this clone at it.  NOT hemophilia_stage --
           APP-C9 reserves that for the Phase 9 migration dry run and it is already diverged."
fi

# ------------------------------------------- C4 THE HARD GUARD (docs/20 §2.3)
# With CSFLE keys shared between prod and test, this is the only barrier left
# between test code and production data.  Checked, never trusted.
if [ "$IS_TEST" = "1" ]; then
  HITS=$(grep -nE '/(hemophilia|hemophilia_stage)([?"'"'"']|$)' .env .env.secrets 2>/dev/null || true)
  if [ -z "$HITS" ]; then
    ok "C4  no production or stage MONGO_URI anywhere in the test env files"
  else
    bad "C4  a production/stage database URI is present in the test env files" \
        "docs/20 §2.3 / APP-T6: remove it, commented-out lines included.  Keys are shared
           with production, so the crypto layer authorises BOTH databases -- this env var is
           the entire barrier.  Found:
$(printf '%s' "$HITS" | sed 's#://[^@]*@#://***@#g; s/^/             /')"
  fi
else
  skip "C4  production-URI guard" "only meaningful in the test clone (C1 failed)"
fi

# ------------------------------------------------------ C5 CSFLE library + arch
CRYPT=$(envget .env CRYPT_SHARED_DIR || true)
CRYPT=${CRYPT:-mongo_crypt_shared_v1-linux-x86_64-enterprise-amazon2023-8.3.9}
SO="$CRYPT/lib/mongo_crypt_v1.so"
if [ ! -f "$SO" ]; then
  bad "C5  CSFLE shared library missing: $SO" \
      "APP-T3: parameterise the compose volume as \${CRYPT_SHARED_DIR:-<x86_64 dir>} and
           copy the aarch64 library in from the production checkout.  It is NOT in git (§14.11)."
elif command -v file >/dev/null 2>&1; then
  LIBARCH=$(file -b "$SO" | grep -oE 'x86-64|aarch64|ARM aarch64' | head -1)
  HOST=$(uname -m)
  case "$HOST:$LIBARCH" in
    x86_64:x86-64|aarch64:aarch64|aarch64:"ARM aarch64")
      ok "C5  CSFLE library matches host arch ($HOST)" ;;
    *)
      bad "C5  CSFLE library is '$LIBARCH' but the host is '$HOST'" \
          "SECURITY.md 2.4: CSFLE DEGRADES TO CLEARTEXT instead of refusing to start, so a
           library that cannot load gives you a healthy-looking stack writing patient fields
           in plaintext.  Set CRYPT_SHARED_DIR to the matching build (APP-T3)." ;;
  esac
else
  skip "C5  CSFLE library arch" "'file' not on PATH; library exists at $SO"
fi

# ------------------------------------------ C6 CSFLE actually enabled at runtime
# APP-T11.  The one check that outranks the rest: if this has ever said DISABLED
# in production, every encryption claim in this project is unverified.
if command -v docker >/dev/null 2>&1 && docker compose ps --status running -q hemo-backend >/dev/null 2>&1 \
   && [ -n "$(docker compose ps --status running -q hemo-backend 2>/dev/null)" ]; then
  LOG=$(docker compose logs --tail=400 hemo-backend 2>/dev/null | grep -i csfle | tail -3)
  if [ -z "$LOG" ]; then
    bad "C6  hemo-backend log says nothing about CSFLE" \
        "APP-T11: expected an 'CSFLE Enabled' line at boot.  Silence is not a pass --
           docs/oracle-deployment.md's own checklist asks for this line."
  elif printf '%s' "$LOG" | grep -qi 'disabled'; then
    bad "C6  hemo-backend reports CSFLE DISABLED" \
        "STOP.  Patient fields are being written in cleartext.  This outranks every other
           task in docs/19.  Log:
$(printf '%s' "$LOG" | sed 's/^/             /')"
  else
    ok "C6  hemo-backend reports CSFLE enabled"
  fi
else
  skip "C6  CSFLE runtime state (APP-T11)" "hemo-backend is not running in this clone"
fi

# --------------------------------------------------------------- C7 OTP on box
NE=$(envget .env NODE_ENV || true)
if [ "$NE" = "development" ]; then
  ok "C7  NODE_ENV=development -- './dev otp' can recover codes from the log"
else
  bad "C7  NODE_ENV='${NE:-unset}', want development" \
      "docs/20 §2.7: the agreed OTP-retrieval path on a headless box is './dev otp', which
           greps the 'DEV OTP' line.  otpService.js only prints it under NODE_ENV=development."
fi

# ----------------------------------------------------------------- C8 root venv
# §8 constraint 15, and './dev test' calls ../venv/bin/python directly.
if [ -x venv/bin/python ]; then
  MISS=$(venv/bin/python -I -c 'import importlib.util as u; print(" ".join(m for m in ("motor","pymongo") if u.find_spec(m) is None))' 2>/dev/null)
  if [ -z "$MISS" ]; then
    ok "C8  root venv present with motor and pymongo"
  else
    bad "C8  root venv is missing: $MISS" \
        "APP-T9: pip install into THIS venv only (§8 constraint 15 -- never system-wide,
           never a sub-venv).  './dev test' invokes ../venv/bin/python."
  fi
else
  bad "C8  no root venv at $ROOT/venv" \
      "APP-T9: python3 -m venv venv && venv/bin/pip install motor pymongo.
           './dev test' is the single place red and green are decided (docs/20 §2.9)."
fi

# ------------------------------------------- C9 env files are the ONLY difference
if [ -n "${PROD_CHECKOUT:-}" ]; then
  if [ -d "$PROD_CHECKOUT/.git" ]; then
    DIFF=$(cd "$PROD_CHECKOUT" && git rev-parse HEAD 2>/dev/null)
    MINE=$(git rev-parse HEAD 2>/dev/null)
    if [ "$DIFF" = "$MINE" ]; then
      ok "C9  both checkouts are at the same commit ($MINE) -- env files are the only difference"
    else
      skip "C9  checkouts are on different commits" \
           "prod=$DIFF test=$MINE.  Expected while testing a branch ahead of prod (docs/20 §4.1);
           a problem if it is not deliberate."
    fi
  else
    skip "C9  env-files-only check" "PROD_CHECKOUT=$PROD_CHECKOUT is not a git checkout"
  fi
else
  skip "C9  env-files-only check" "set PROD_CHECKOUT=/path/to/prod/clone to enable (docs/20 §0)"
fi

# -------------------------------------------------------------- C10 photo store
PD=$(envget .env PHOTO_DIR || true)
if [ -z "$PD" ]; then
  skip "C10 PHOTO_DIR unset" "deferred to APP-C14 (attach the block volume then, not now)"
elif [ -d "$PD" ]; then
  ok "C10 PHOTO_DIR exists: $PD"
else
  bad "C10 PHOTO_DIR=$PD does not exist" \
      "APP-C14: it must be mounted BEFORE the container starts, or the container writes into
           its own layer and every photo disappears on the next rebuild."
fi

echo
printf 'pass %d   fail %d   skip %d\n' "$PASS" "$FAIL" "$SKIP"
if [ "$FAIL" -gt 0 ]; then
  echo
  echo "APP-0.1 gate: NOT MET.  Fix the FAIL lines above; do not edit this file (§8 constraint 13)."
  exit 1
fi
echo
echo "APP-0.1 gate: met."
