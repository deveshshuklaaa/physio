"""D39 — End-to-end acceptance pipeline for the Flutter app integration.

Decisions this encodes: docs/16_app_integration_decisions.md (D1-D39).
Security work it depends on: docs/SECURITY.md (Part 0, Part 1).

Run from backend/ :
    ../venv/bin/python app/test_acceptance_app_integration.py

Or, if pytest is ever installed:
    pytest app/test_acceptance_app_integration.py -v

WHY THIS FILE EXISTS
--------------------
The integration spans two backends, a Flutter client, a new photo store and
four new consent purposes. "It works" is not a sentence anyone can verify by
eye. This file is the single definition of done: 13 numbered steps, in order,
each either passing or skipping with the decision reference that owns it.

Running it prints the CURRENT STATE OF THE INTEGRATION rather than a wall of
failures. As each feature lands, delete its skip. The last skip removed is the
cutover gate.

HOW IT DEGRADES
---------------
The root venv holds only motor and pymongo -- no fastapi, no httpx, no pytest.
Backend tests normally run inside the container. So every dependency is probed,
never imported at module scope: a missing package reports as a skip naming the
package, not an ImportError traceback.

STEP 9 IS THE ONE THAT GETS SKIPPED BY HUMANS
---------------------------------------------
A clean run exercises none of the error detection, photo composition, upload,
encryption, retention or doctor-review path -- which is more than half of what
this integration adds. The form error must be induced DELIBERATELY, every run.
test_09 fails rather than skips if the error path was never triggered, because
a silently clean run is indistinguishable from a broken one.

WHAT THIS FILE CANNOT DO
------------------------
It cannot drive a phone. Steps that are device-side (MediaPipe frame rate,
photo composition time, on-device rep detection) are recorded here as MANUAL
measurements with their thresholds, so the numbers live next to the pipeline
they can invalidate. D39 requires them on the lowest-spec target device, not a
developer handset.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# ---------------------------------------------------------------------------
# Skip bookkeeping
# ---------------------------------------------------------------------------

SKIPPED: list[tuple[str, str]] = []


class Skip(Exception):
    """Raised by a step whose feature does not exist yet."""


def not_built(decision: str, what: str):
    """Mark a step as not yet implemented, naming the decision that owns it."""
    raise Skip(f"{what}  [owner: {decision}]")


def needs(package: str):
    """Probe a dependency. Never imported at module scope -- see docstring."""
    try:
        __import__(package)
    except ImportError:
        raise Skip(
            f"dependency {package!r} not installed in this interpreter "
            f"({sys.executable}). Backend tests run inside the container."
        )


def require_env(name: str):
    value = os.environ.get(name)
    if not value:
        raise Skip(f"environment variable {name} is not set")
    return value


# ---------------------------------------------------------------------------
# Thresholds -- D39. Changing these changes the acceptance bar; do it in the
# doc first, not here.
# ---------------------------------------------------------------------------

MIN_MEDIAPIPE_FPS = 10.0      # below this, rep detection misses fast movements
MAX_PHOTO_COMPOSE_MS = 300.0  # above this it is noticeable mid-session
MAX_VERDICT_LATENCY_S = 3.0   # verdict must beat the next rep -- D13
PHOTO_RETENTION_DAYS = 3      # D4, configurable


# ---------------------------------------------------------------------------
# 1-5  Patient onboarding
# ---------------------------------------------------------------------------

def test_01_register():
    """Patient registers from the app. New Flutter screen -- D26."""
    not_built("D26", "app registration screen")


def test_02_otp_entry():
    """OTP code entry, resend respects the 30s cooldown.

    Their app has never had OTP, so there is nothing to port -- Section 3.
    Policy lives in part2/.../backend/config/otpPolicy.js:
        expiry 185s (3m05s), resend cooldown 30s, max 5 attempts.
    A test that hardcodes those numbers will drift from the policy file; read
    them, do not restate them.
    """
    not_built("Section 3", "app OTP entry + resend screens")


def test_03_consent_all_four_purposes():
    """Four consent purposes recorded, each with its own version -- D22.

    Purposes: data collection, AI processing, video monitoring, error photos.
    Must assert, once SECURITY.md 0.2 lands:
      - each purpose stored as a sub-document, not a bare boolean
      - majorVersion / minorVersion / contentHash / grantedAt / method / locale
      - a MINOR bump does NOT re-prompt
      - a MAJOR bump DOES re-prompt
      - an outdated major version disables ONLY its feature; session still runs
      - terms acceptance is a SEPARATE affirmative action (SECURITY.md 0.1)
    """
    not_built("D22 / SECURITY.md 0.2", "versioned per-purpose consent")


def test_04_profile_setup():
    """Profile stepper. Layout harvestable from their register_screen.dart,
    data model is not -- 13 flat fields vs our encrypted profile (D26)."""
    not_built("D26", "app profile setup")


def test_05_hemophilia_details():
    """Clinical intake: condition, severity, assigned doctor.

    The only from-scratch build in the must-have set (D26). Touches
    clinicalrecords (append-only version chain) and doctorchangerequests, so
    assert the chain is appended to and never overwritten.
    """
    not_built("D26", "hemophilia details screen")


# ---------------------------------------------------------------------------
# 6-7  Scheduling and the reminder
# ---------------------------------------------------------------------------

def test_06_doctor_assigns_session():
    """Doctor assigns a session with a deadline -- D6.

    Reduced scope: deadline + assignment + archive, three states, no recurring
    series. Doctor picks calendar dates; a simple repeat expands to individual
    entries AT SAVE TIME, leaving no pattern in the system.

    Assert: no activation timer exists. Due-ness is computed on read (D6/D9).
    """
    not_built("D6", "session scheduling")


def test_07_push_reminder_arrives():
    """Reminder ladder -- D7, D21.

        T-3 days -> email      T-1 day  -> email
        T-2 hours -> push      T-15 min -> push

    Assert:
      - the two early steps go by email, the two late ones by push
      - the notification record id is DERIVED, so the same reminder written
        twice overwrites instead of double-sending (D7)
      - a resolved session sends nothing
      - doctor reminders are ONE DIGEST per ladder step, not one per patient
      - NO notification body contains a clinical value (SECURITY.md 3.2)
    """
    not_built("D7 / D21", "reminder ladder + FCM")


# ---------------------------------------------------------------------------
# 8-11  The assessment itself
# ---------------------------------------------------------------------------

def test_08_live_assessment_per_rep_bundles():
    """Phone finds reps, server judges, one bundle per rep -- D11, D12.

    Assert:
      - the wire carries NO camera frames, only landmark-derived numbers (D11)
      - one bundle per completed rep, ~2KB, native-rate feature sequence
      - the thinned 5Hz trace is for STORAGE ONLY and never feeds the model
        (D12 -- feeding the model from it degrades accuracy)
      - bundles are acknowledged; a missing ack retries once at 1.5s, then the
        rep is marked unassessed (D13)
      - strict rep ORDER within a session; rep 3 never overtakes rep 2 (D14)
      - an unassessed rep displays greyed out, never as "fine"
    """
    not_built("D11 / D12 / D13 / D14", "per-rep bundle protocol")


def test_09_induced_form_error():
    """DELIBERATELY induce a form error. Do not skip this step.

    This is the step humans leave out, and leaving it out means the run
    exercises none of: error detection, joint localisation, photo composition,
    upload, encryption, retention, or the doctor review path.

    Assert:
      - the error is localised -- it names the JOINTS, not just "bad rep"
        (D17: checks return {code, alert, joints, side, value, threshold})
      - the existing alert SENTENCE is still returned alongside the structure;
        both outputs are kept, neither replaces the other (D17)
      - hysteresis holds: a single jittery frame does NOT fire a photo
        (~5 consecutive frames required)
      - exactly ONE photo per rep; first sustained error wins (D4)

    Deliberately FAILS rather than skips once the feature exists: a clean run
    is indistinguishable from a broken one.
    """
    not_built("D17", "structured error output with joint localisation")


def test_10_error_photo_visible_to_patient():
    """Photo composed ON DEVICE and uploaded -- D16.

    Assert:
      - the photo is COMPOSED from the stored frame, never screen-captured.
        Screen capture returns a BLACK RECTANGLE on many Android devices
        because the camera preview is drawn outside the app's canvas -- it
        works on a dev phone and fails on a patient's (D16)
      - the rolling frame buffer resolves the frame the verdict names
      - a rep judged from a BACKFILLED bundle has no frame left and is marked
        bad WITHOUT a photo -- known accepted hole (D16)
      - the database stores an OPAQUE REFERENCE, never a path. A path is
        guessable, which is exactly how their system fails today (D4)
    """
    not_built("D16", "on-device photo composition + upload")


def test_11_session_ends():
    """Session end is idempotent -- it fires from the End button AND from the
    abrupt-disconnect handler, and both firing is the NORMAL case on mobile."""
    not_built("D13", "app session end")


# ---------------------------------------------------------------------------
# 12-13  Report and doctor review
# ---------------------------------------------------------------------------

def test_12_report_generated():
    """Report generated and fetched by the app.

    KNOWN GAP, recorded in Section 4: our Report.jsx makes NO API call -- it
    renders from router state and builds the PDF in the browser. An app has no
    router state to inherit, so this needs a REAL ENDPOINT. Build item, not a
    port.

    Also assert: consentAI == false suppresses the Gemini call entirely
    (SECURITY.md 1.6). A flag collected and ignored is worse than no flag.
    """
    not_built("D26 / SECURITY.md 1.6", "report endpoint for the app")


def test_13_doctor_sees_session_and_photo():
    """Doctor sees the session AND the error photo on the web -- D4.

    The photo route is the most security-sensitive surface added by this work.
    Assert:
      - unauthenticated  -> 401
      - a DIFFERENT patient's token -> 403
      - owner / assigned doctor / admin -> 200
      - authorisation is by authorize_patient_access, NEVER by filename
      - decryption happens ONLY AFTER the access check passes
        (SECURITY.md 0.3)
      - an expired photo returns a clean "expired", and the rep SURVIVES with
        its number, score, error type and feedback intact (D4)
    """
    not_built("D4 / SECURITY.md 0.3", "access-checked photo route")


# ---------------------------------------------------------------------------
# Retention
# ---------------------------------------------------------------------------

def test_14_photo_retention_sweep():
    """Photos deleted after PHOTO_RETENTION_DAYS, file AND key together.

    A deleted photo whose key material survives is not deleted
    (SECURITY.md 0.3 Step 5). Reuses the existing session-video sweeper
    (backend/app/services/video_retention.py) -- one mechanism, two dials.
    """
    needs("motor")  # available in the root venv; the rest is not
    not_built("D4 / SECURITY.md 0.3", "error-photo retention sweep")


# ---------------------------------------------------------------------------
# Device-side measurements -- cannot be automated from here
# ---------------------------------------------------------------------------

def test_15_device_measurements_recorded():
    """MANUAL, on the lowest-spec target device. D39.

    These are not nice-to-haves: the entire scoring architecture (D11) rests on
    MediaPipe being fast enough on an OLD handset, and a flagship proves
    nothing about that.

        MediaPipe Lite frame rate  >= 10.0 FPS
            below this, rep detection misses the top of fast movements and
            D11 MUST BE REVISITED
        photo composition time     <= 300 ms
        verdict latency            <= 3.0 s  (must beat the next rep -- D13)

    Expected on a ~2018 mid-range handset: Lite 12-20 FPS, Full 6-10 FPS.
    MEASURE, DO NOT ASSUME. This is the cheapest de-risking available.

    Record the device model and the three numbers in
    docs/16_app_integration_decisions.md Section 7, then replace this skip
    with the assertions.
    """
    not_built("D39", "device measurements on the acceptance handset")


# ---------------------------------------------------------------------------
# Runner -- works without pytest, per this project's convention
# ---------------------------------------------------------------------------

def _run():
    steps = [(n, f) for n, f in sorted(globals().items())
             if n.startswith("test_") and callable(f)]
    passed = failed = 0

    print(f"\nD39 acceptance pipeline -- {len(steps)} steps")
    print(f"interpreter: {sys.executable}\n")

    for name, fn in steps:
        label = name.replace("test_", "").replace("_", " ")
        try:
            fn()
            print(f"  PASS  {label}")
            passed += 1
        except Skip as exc:
            print(f"  SKIP  {label}\n          {exc}")
            SKIPPED.append((label, str(exc)))
        except AssertionError as exc:
            print(f"  FAIL  {label}\n          {exc}")
            failed += 1
        except Exception as exc:  # noqa: BLE001 - a broken step must not hide the rest
            print(f"  ERROR {label}\n          {type(exc).__name__}: {exc}")
            failed += 1

    print(f"\n  {passed} passed, {failed} failed, {len(SKIPPED)} not yet built")

    if SKIPPED:
        print("\n  Not yet built -- each skip is a gate on the cutover:")
        for label, reason in SKIPPED:
            print(f"    - {label}: {reason}")

    print("\n  The last skip removed is the cutover gate (docs/16 D27, D36).\n")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(_run())
